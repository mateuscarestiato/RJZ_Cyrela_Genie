import os
import hashlib
import random
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from supabase import create_client, Client
from cryptography.fernet import Fernet

def get_supabase() -> Client:
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_KEY", "")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL or SUPABASE_KEY not configured.")
    return create_client(url, key)

def get_cipher() -> Fernet:
    key = os.environ.get("ENCRYPTION_KEY")
    if not key:
        # Fallback for dev - NOT recommended for prod
        key = Fernet.generate_key().decode('utf-8')
        os.environ["ENCRYPTION_KEY"] = key
    return Fernet(key.encode('utf-8'))

def encrypt_token(token: str) -> str:
    if not token: return ""
    return get_cipher().encrypt(token.encode('utf-8')).decode('utf-8')

def decrypt_token(encrypted_token: str) -> str:
    if not encrypted_token: return ""
    try:
        return get_cipher().decrypt(encrypted_token.encode('utf-8')).decode('utf-8')
    except Exception:
        return ""

def hash_password(password: str) -> str:
    salt = "cyrela_sec_"
    return hashlib.sha256((salt + password).encode()).hexdigest()

def check_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def user_exists(email: str) -> bool:
    try:
        supabase = get_supabase()
        response = supabase.table("users").select("email").eq("email", email).execute()
        return len(response.data) > 0
    except Exception:
        return False

def verify_login(email: str, password: str) -> dict:
    try:
        email = email.strip().lower()
        supabase = get_supabase()
        response = supabase.table("users").select("password_hash, is_admin").eq("email", email).execute()
        if response.data:
            user = response.data[0]
            if check_password(password, user["password_hash"]):
                return {"success": True, "is_admin": bool(user["is_admin"])}
    except Exception as e:
        print(f"Erro verify_login: {e}")
    return {"success": False}

def get_user_tokens(email: str) -> dict:
    try:
        supabase = get_supabase()
        response = supabase.table("users").select(
            "databricks_host, databricks_token, genie_space_id, ado_org, ado_project, ado_repo, ado_pat"
        ).eq("email", email).execute()
        
        if response.data:
            res = response.data[0]
            # Fallback to .env values if empty
            host = res.get("databricks_host") or os.getenv("DATABRICKS_HOST", "")
            token = decrypt_token(res.get("databricks_token") or "") or os.getenv("DATABRICKS_TOKEN", "")
            space_id = res.get("genie_space_id") or os.getenv("GENIE_SPACE_ID", "")
            
            return {
                "host": host, 
                "token": token, 
                "space_id": space_id,
                "ado_org": res.get("ado_org") or "cyrela-data-analytics", 
                "ado_project": res.get("ado_project") or "Data Analytics", 
                "ado_repo": res.get("ado_repo") or "lakehouse", 
                "ado_pat": decrypt_token(res.get("ado_pat") or "")
            }
    except Exception as e:
        print(f"Error in get_user_tokens: {e}")
    
    # Global fallback if user not found or error
    return {
        "host": os.getenv("DATABRICKS_HOST", ""), 
        "token": os.getenv("DATABRICKS_TOKEN", ""), 
        "space_id": os.getenv("GENIE_SPACE_ID", ""),
        "ado_org": "cyrela-data-analytics", 
        "ado_project": "Data Analytics", 
        "ado_repo": "lakehouse", 
        "ado_pat": ""
    }

def update_user_tokens(email: str, host: str, token: str, space_id: str, ado_org: str, ado_proj: str, ado_repo: str, ado_pat: str):
    supabase = get_supabase()
    supabase.table("users").update({
        "databricks_host": host,
        "databricks_token": encrypt_token(token),
        "genie_space_id": space_id,
        "ado_org": ado_org,
        "ado_project": ado_proj,
        "ado_repo": ado_repo,
        "ado_pat": encrypt_token(ado_pat)
    }).eq("email", email).execute()

def create_user(email: str, password: str, is_admin: int = 0):
    supabase = get_supabase()
    supabase.table("users").insert({
        "email": email,
        "password_hash": hash_password(password),
        "is_admin": is_admin,
        "databricks_host": "",
        "databricks_token": encrypt_token(""),
        "genie_space_id": "",
        "ado_org": "cyrela-data-analytics",
        "ado_project": "Data Analytics",
        "ado_repo": "lakehouse",
        "ado_pat": encrypt_token("")
    }).execute()

def generate_otp(email: str, otp_type: str = "login") -> str:
    code = str(random.randint(100000, 999999))
    expires = (datetime.now() + timedelta(minutes=10)).isoformat()
    supabase = get_supabase()
    supabase.table("otp_codes").delete().eq("email", email).eq("type", otp_type).execute()
    supabase.table("otp_codes").insert({"email": email, "code": code, "expires_at": expires, "type": otp_type}).execute()
    return code

def verify_otp(email: str, code: str, otp_type: str = "login") -> bool:
    try:
        supabase = get_supabase()
        response = supabase.table("otp_codes").select("expires_at").eq("email", email).eq("code", code).eq("type", otp_type).execute()
        if response.data:
            expires_at = datetime.fromisoformat(response.data[0]["expires_at"])
            if datetime.now() <= expires_at:
                supabase.table("otp_codes").delete().eq("email", email).eq("type", otp_type).execute()
                return True
    except Exception:
        pass
    return False
