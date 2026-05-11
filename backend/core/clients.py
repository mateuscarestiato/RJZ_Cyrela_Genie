import os
import json
import time
import requests
import re
import subprocess
import shutil
import tempfile
import sqlparse
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

TERMINAL_STATUSES = {"COMPLETED", "FAILED", "CANCELLED", "QUERY_RESULT_EXPIRED"}
SQL_TERMINAL_STATUSES = {"SUCCEEDED", "FAILED", "CANCELED", "CLOSED"}

class GenieApiClient:
    def __init__(self, host: str, token: str, space_id: Optional[str] = None) -> None:
        self.host = host.rstrip("/")
        self.space_id = space_id
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
        )

    def _request(
        self,
        method: str,
        path: str,
        *,
        payload: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        url = f"{self.host}{path}"
        response = self.session.request(
            method,
            url,
            json=payload,
            params=params,
            timeout=90,
        )

        if response.status_code >= 400:
            body_preview = response.text[:3000]
            raise RuntimeError(
                f"{method} {path} failed with status {response.status_code}: {body_preview}"
            )

        if not response.text:
            return {}

        return response.json()

    def list_spaces(self) -> List[Dict[str, Any]]:
        res = self._request("GET", "/api/2.0/genie/spaces")
        return res.get("spaces", [])

    def get_space(self, space_id: str) -> Dict[str, Any]:
        return self._request("GET", f"/api/2.0/genie/spaces/{space_id}")

    def create_space(self, title: str, warehouse_id: str, description: str = "") -> Dict[str, Any]:
        payload = {
            "title": title,
            "warehouse_id": warehouse_id,
            "description": description
        }
        return self._request("POST", "/api/2.0/genie/spaces", payload=payload)

    def update_space(self, space_id: str, title: Optional[str] = None, warehouse_id: Optional[str] = None, description: Optional[str] = None) -> Dict[str, Any]:
        payload = {}
        if title: payload["title"] = title
        if warehouse_id: payload["warehouse_id"] = warehouse_id
        if description: payload["description"] = description
        return self._request("PATCH", f"/api/2.0/genie/spaces/{space_id}", payload=payload)

    def start_conversation(self, content: str) -> Dict[str, Any]:
        return self._request(
            "POST",
            f"/api/2.0/genie/spaces/{self.space_id}/start-conversation",
            payload={"content": content},
        )

    def create_message(self, conversation_id: str, content: str) -> Dict[str, Any]:
        return self._request(
            "POST",
            f"/api/2.0/genie/spaces/{self.space_id}/conversations/{conversation_id}/messages",
            payload={"content": content},
        )

    def get_message(self, conversation_id: str, message_id: str) -> Dict[str, Any]:
        return self._request(
            "GET",
            f"/api/2.0/genie/spaces/{self.space_id}/conversations/{conversation_id}/messages/{message_id}",
        )

    def get_attachment_query_result(
        self, conversation_id: str, message_id: str, attachment_id: str
    ) -> Dict[str, Any]:
        return self._request(
            "GET",
            f"/api/2.0/genie/spaces/{self.space_id}/conversations/{conversation_id}/messages/{message_id}/attachments/{attachment_id}/query-result",
        )

    def wait_for_message(self, conversation_id: str, message_id: str, poll_seconds: float = 2.0, timeout: int = 600) -> Dict[str, Any]:
        deadline = time.time() + timeout
        while time.time() < deadline:
            msg = self.get_message(conversation_id, message_id)
            if msg.get("status") in TERMINAL_STATUSES:
                return msg
            time.sleep(poll_seconds)
        raise TimeoutError("Timeout waiting for Genie response.")

def format_sql(sql: str) -> str:
    try:
        return sqlparse.format(sql, reindent=True, keyword_case='upper')
    except Exception:
        return sql

class AzureDevOpsClient:
    def __init__(self, organization: str, project: str, repository: str, pat: str):
        self.organization = organization
        self.project = project
        self.repository = repository
        self.pat = pat
        self.rest_url = f"https://dev.azure.com/{organization}/{project}/_apis/git/repositories/{repository}"
        self.auth = ("", pat)

    def create_pull_request(self, source_branch: str, target_branch: str, title: str, description: str) -> Dict[str, Any]:
        url = f"{self.rest_url}/pullrequests?api-version=7.1"
        payload = {
            "sourceRefName": f"refs/heads/{source_branch}",
            "targetRefName": f"refs/heads/{target_branch}",
            "title": title,
            "description": description
        }
        response = requests.post(url, auth=("", self.pat), json=payload)
        if response.status_code not in [200, 201]:
            raise RuntimeError(f"Falha ao abrir PR: {response.text}")
        
        pr_data = response.json()
        # Get the web link
        pr_id = pr_data.get("pullRequestId")
        link = f"https://dev.azure.com/{self.organization}/{self.project}/_git/{self.repository}/pullrequest/{pr_id}"
        pr_data["web_link"] = link
        return pr_data

    def push_changes_git_cli(self, branch_name: str, base_branch: str, sql_path: str, sql_content: str, yml_path: str, yml_content: str, comment: str):
        # Implementation from genie_web_app.py
        temp_dir = Path(tempfile.gettempdir()) / f"genie_git_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        if temp_dir.exists(): shutil.rmtree(temp_dir)
        temp_dir.mkdir(parents=True)
        try:
            encoded_pat = requests.utils.quote(self.pat)
            repo_url = f"https://{encoded_pat}@dev.azure.com/{self.organization}/{requests.utils.quote(self.project)}/_git/{self.repository}"
            def run_git(args, cwd=temp_dir):
                result = subprocess.run(["git"] + args, cwd=cwd, capture_output=True, text=True, env={**os.environ, "GIT_TERMINAL_PROMPT": "0"})
                if result.returncode != 0: raise RuntimeError(f"Erro no Git ({args[0]}): {result.stderr}")
                return result.stdout
            run_git(["clone", "--single-branch", "--branch", base_branch, repo_url, "."])
            run_git(["config", "user.email", "genie-bot@cyrela.com.br"])
            run_git(["config", "user.name", "Genie Bot"])
            run_git(["checkout", "-b", branch_name])
            
            f_sql = temp_dir / sql_path
            f_sql.parent.mkdir(parents=True, exist_ok=True)
            with f_sql.open("w", encoding="utf-8") as f: f.write(sql_content)
            
            if yml_content.strip():
                f_yml = temp_dir / yml_path
                f_yml.parent.mkdir(parents=True, exist_ok=True)
                with f_yml.open("w", encoding="utf-8") as f: f.write(yml_content)
                
            run_git(["add", "--all"])
            run_git(["commit", "-m", comment])
            run_git(["push", "origin", branch_name, "--force"])
            return True
        finally:
            if temp_dir.exists(): shutil.rmtree(temp_dir, ignore_errors=True)
