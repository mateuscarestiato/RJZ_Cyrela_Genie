import os
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, Header, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path
import msal

# Local imports
from core.clients import GenieApiClient, AzureDevOpsClient, format_sql
from core.tools import generate_dbt_jinja, lint_sql, map_legacy_columns, convert_crm_xml, generate_dbt_docs
from auth import verify_login, get_user_tokens, update_user_tokens, generate_otp, verify_otp, user_exists, create_user

load_dotenv(Path(__file__).parent.parent / ".env")

# Microsoft Entra ID Configuration (optional - for corporate SSO)
MS_CLIENT_ID = os.getenv("MS_CLIENT_ID", "")
MS_CLIENT_SECRET = os.getenv("MS_CLIENT_SECRET", "")
MS_TENANT_ID = os.getenv("MS_TENANT_ID", "")
MS_AUTHORITY = f"https://login.microsoftonline.com/{MS_TENANT_ID}"
MS_REDIRECT_URI = os.getenv("MS_REDIRECT_URI", "http://localhost:8000/api/auth/microsoft/callback")
MS_SCOPES = ["User.Read"]
MS_ENABLED = bool(MS_CLIENT_ID and MS_CLIENT_SECRET and MS_TENANT_ID)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5174")

app = FastAPI(title="Genie RJZ Cyrela API")

# Configurações fixas
FIXED_WAREHOUSE_ID = "ab0de84dfac97072"

# CORS configuration for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _build_msal_app():
    return msal.ConfidentialClientApplication(
        MS_CLIENT_ID,
        authority=MS_AUTHORITY,
        client_credential=MS_CLIENT_SECRET,
    )

# Models
class LoginRequest(BaseModel):
    email: str
    password: str

class OTPRequest(BaseModel):
    email: str
    code: str

class ConfigUpdate(BaseModel):
    host: str
    token: str
    space_id: str
    ado_org: str
    ado_project: str
    ado_repo: str
    ado_pat: str

class SpaceCreate(BaseModel):
    title: str
    description: Optional[str] = ""

class SpaceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class ChatRequest(BaseModel):
    content: str
    conversation_id: Optional[str] = None

class PRRequest(BaseModel):
    source_branch: str
    target_branch: str
    title: str
    description: str
    sql_path: str
    sql_content: str
    yml_path: str
    yml_content: str
    comment: str

class ToolRequest(BaseModel):
    sql: str
    alias: Optional[str] = "digite_o_alias_aqui"

class MapperRequest(BaseModel):
    columns: List[str]
    target_table: Optional[str] = ""

class XMLRequest(BaseModel):
    xml: str

class DocRequest(BaseModel):
    sql: str
    alias: str

# ===== Supabase Auth Endpoints =====
@app.post("/api/auth/login")
async def login(req: LoginRequest):
    email = req.email.strip().lower()
    try:
        res = verify_login(email, req.password)
        if res["success"]:
            tokens = get_user_tokens(email)
            return {"status": "success", "user": {"email": email}, "tokens": tokens}
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro no login para {email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno no servidor: {str(e)}")

@app.post("/api/auth/signup")
async def signup(req: LoginRequest):
    email = req.email.strip().lower()
    try:
        if user_exists(email):
            raise HTTPException(status_code=400, detail="E-mail já cadastrado")
        create_user(email, req.password)
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro no cadastro para {email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno no servidor: {str(e)}")

@app.get("/api/auth/ms-enabled")
async def ms_status():
    """Returns whether Microsoft SSO is configured."""
    return {"enabled": MS_ENABLED}

# ===== Microsoft Auth Endpoints (only work when configured) =====
@app.get("/api/auth/microsoft/login")
async def microsoft_login():
    if not MS_ENABLED:
        raise HTTPException(status_code=503, detail="Microsoft SSO não configurado")
    cca = _build_msal_app()
    auth_url = cca.get_authorization_request_url(
        scopes=MS_SCOPES,
        redirect_uri=MS_REDIRECT_URI,
    )
    return RedirectResponse(auth_url)

@app.get("/api/auth/microsoft/callback")
async def microsoft_callback(code: str = None, error: str = None):
    if error:
        return RedirectResponse(f"{FRONTEND_URL}/login?error={error}")
    if not code:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=no_code")
    
    cca = _build_msal_app()
    result = cca.acquire_token_by_authorization_code(
        code, scopes=MS_SCOPES, redirect_uri=MS_REDIRECT_URI,
    )
    
    if "error" in result:
        return RedirectResponse(f"{FRONTEND_URL}/login?error={result['error']}")
    
    user_claims = result.get("id_token_claims", {})
    email = user_claims.get("preferred_username") or user_claims.get("email") or ""
    name = user_claims.get("name", "")
    
    if not email:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=no_email")
    
    if not user_exists(email):
        create_user(email, "microsoft_sso_user")
    
    import urllib.parse
    params = urllib.parse.urlencode({"email": email, "name": name, "auth": "microsoft"})
    return RedirectResponse(f"{FRONTEND_URL}/login/callback?{params}")

@app.get("/api/auth/me")
async def get_me(email: str):
    if not user_exists(email):
        raise HTTPException(status_code=404, detail="User not found")
    tokens = get_user_tokens(email)
    return {"user": {"email": email}, "tokens": tokens}

@app.get("/api/user/config")
async def get_config(email: str):
    return get_user_tokens(email)

@app.post("/api/user/config")
async def update_config(email: str, config: ConfigUpdate):
    update_user_tokens(
        email, config.host, config.token, config.space_id,
        config.ado_org, config.ado_project, config.ado_repo, config.ado_pat
    )
    return {"status": "success"}

@app.get("/api/genie/spaces")
async def list_spaces(email: str):
    tokens = get_user_tokens(email)
    client = GenieApiClient(tokens["host"], tokens["token"])
    try:
        res = client.list_spaces()
        if isinstance(res, list):
            return res
        return res.get("spaces", [])
    except Exception as e:
        print(f"DEBUG: Error listing spaces for {email}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/genie/spaces")
async def create_space(email: str, req: SpaceCreate):
    tokens = get_user_tokens(email)
    client = GenieApiClient(tokens["host"], tokens["token"])
    return client.create_space(req.title, FIXED_WAREHOUSE_ID, req.description)

@app.patch("/api/genie/spaces/{space_id}")
async def update_space(email: str, space_id: str, req: SpaceUpdate):
    tokens = get_user_tokens(email)
    client = GenieApiClient(tokens["host"], tokens["token"])
    return client.update_space(space_id, req.title, FIXED_WAREHOUSE_ID, req.description)

@app.post("/api/genie/chat")
async def chat(email: str, req: ChatRequest):
    tokens = get_user_tokens(email)
    client = GenieApiClient(tokens["host"], tokens["token"], tokens["space_id"])
    
    # Format SQL if requested (implied by user request for indentation)
    # We'll do this on the response side
    
    if req.conversation_id:
        res = client.create_message(req.conversation_id, req.content)
    else:
        res = client.start_conversation(req.content)
    
    msg_id = res.get("message_id") or res.get("id")
    conv_id = res.get("conversation_id") or res.get("id")
    
    final_msg = client.wait_for_message(conv_id, msg_id)
    
    # Process final message to indent SQL
    if "text" in final_msg:
        txt = final_msg["text"]
        if isinstance(txt, dict):
            # Try to find SQL in plain_text and format it
            plain = txt.get("plain_text", "")
            # Simple regex to find SQL blocks or just apply format_sql to anything that looks like SQL
            # But the user asked for "a query retornada". Usually Genie returns it in attachments too.
            pass
            
    return {"conversation_id": conv_id, "message": final_message_processor(final_msg)}

def final_message_processor(msg: Dict[str, Any]) -> Dict[str, Any]:
    # Extract and format SQL in attachments
    attachments = msg.get("attachments", [])
    for att in attachments:
        if "query" in att:
            query_obj = att["query"]
            if "query" in query_obj:
                query_obj["query"] = format_sql(query_obj["query"])
        
        # Also try to find SQL in text content (markdown blocks)
        if "text" in att:
            text_obj = att["text"]
            if "content" in text_obj:
                # We don't want to mess up the whole markdown, but we could 
                # potentially format code blocks here if we wanted to be fancy.
                # For now, focus on the query object which is what the user usually wants.
                pass
    return msg

@app.post("/api/devops/pr")
async def create_pr(email: str, req: PRRequest):
    tokens = get_user_tokens(email)
    devops = AzureDevOpsClient(tokens["ado_org"], tokens["ado_project"], tokens["ado_repo"], tokens["ado_pat"])
    
    # 1. Push changes
    devops.push_changes_git_cli(
        req.source_branch, req.target_branch, 
        req.sql_path, req.sql_content, 
        req.yml_path, req.yml_content, 
        req.comment
    )
    
    # 2. Create PR
    pr = devops.create_pull_request(req.source_branch, req.target_branch, req.title, req.description)
    
    return {"status": "success", "pr_link": pr.get("web_link"), "pr_id": pr.get("pullRequestId")}

# ===== Developer Tools Endpoints =====
@app.post("/api/tools/dbt-gen")
async def dbt_gen(req: ToolRequest):
    try:
        return {"result": generate_dbt_jinja(req.sql, req.alias)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tools/lint")
async def lint(req: ToolRequest):
    try:
        return lint_sql(req.sql)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tools/mapper")
async def mapper(email: str, req: MapperRequest):
    try:
        tokens = get_user_tokens(email)
        client = GenieApiClient(tokens["host"], tokens["token"], tokens["space_id"])
        return map_legacy_columns(req.columns, req.target_table, client)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tools/crm-convert")
async def crm_convert(email: str, req: XMLRequest):
    try:
        tokens = get_user_tokens(email)
        client = GenieApiClient(tokens["host"], tokens["token"], tokens["space_id"])
        
        # Use Genie to translate XML to the current catalog context
        prompt = f"""Converta este FetchXML do CRM para uma consulta SQL válida no Databricks, 
usando as tabelas e colunas disponíveis no nosso catálogo:

{req.xml}

Retorne APENAS o código SQL formatado."""
        
        # Start a conversation for this translation
        res = client.start_conversation(prompt)
        conv_id = res.get("id")
        msg_id = res.get("message_id") or res.get("id")
        
        # Wait for the result
        final_msg = client.wait_for_message(conv_id, msg_id)
        
        # Extract SQL from the response
        sql = ""
        attachments = final_msg.get("attachments", [])
        sql_att = next((a for a in attachments if "query" in a), None)
        if sql_att:
            sql = sql_att["query"]["query"]
        else:
            # Fallback to text content if no query attachment
            sql = final_msg.get("text", {}).get("plain_text", "")
            
        return {"sql": format_sql(sql)}
    except Exception as e:
        print(f"Erro no crm_convert: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tools/docs-gen")
async def docs_gen(email: str, req: DocRequest):
    try:
        tokens = get_user_tokens(email)
        client = GenieApiClient(tokens["host"], tokens["token"], tokens["space_id"])
        return {"yaml": generate_dbt_docs(req.sql, req.alias, client)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Static files
STATIC_PATH = Path(__file__).parent / "static"
ASSETS_PATH = Path(__file__).parent.parent / "assets"

if ASSETS_PATH.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_PATH)), name="assets")

if STATIC_PATH.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_PATH), html=True), name="static")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    index_file = STATIC_PATH / "index.html"
    if index_file.exists():
        from fastapi.responses import FileResponse
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Not Found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
