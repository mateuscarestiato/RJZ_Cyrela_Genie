import re
from typing import Dict, Any, List
import sqlparse
from core.clients import GenieApiClient

def generate_dbt_jinja(sql: str, alias: str = "digite_o_alias_aqui") -> str:
    """
    Converts raw SQL into dbt-ready Jinja SQL with Cyrela specific rules.
    - semantic.* -> {{ ref('table') }}
    - clean.* -> {{ source('schema', 'table') }}
    """
    
    def replace_lineage(match):
        full_match = match.group(0)
        parts = full_match.split('.')
        
        table_name = parts[-1]
        schema_name = parts[-2] if len(parts) >= 2 else ""
        
        if 'semantic' in schema_name.lower() or 'semantic' in full_match.lower():
            return f"{{{{ ref('{table_name}') }}}}"
        elif 'clean' in schema_name.lower() or 'clean' in full_match.lower():
            # If it has 3 parts: catalog.clean.table -> source('clean', 'table')
            # If it has 2 parts: clean.table -> source('clean', 'table')
            return f"{{{{ source('{schema_name}', '{table_name}') }}}}"
            
        return full_match

    # Pattern for semantic/clean lineage (2 or 3 parts)
    # Matches: catalog.semantic.table, clean.table, etc.
    lineage_pattern = r'\b([a-zA-Z_][a-zA-Z0-9_]*\.(?:[a-zA-Z_][a-zA-Z0-9_]*\.)?(?:semantic|clean)\.[a-zA-Z_][a-zA-Z0-9_]*)\b'
    # Simplified regex that looks for .semantic. or .clean.
    # We use a more robust one that captures the context
    
    # Let's use a simpler but safer approach:
    # 1. Match anything that looks like a table reference (at least one dot)
    # 2. Check if it contains 'semantic' or 'clean'
    
    def smart_replace(match):
        text = match.group(0)
        parts = text.split('.')
        
        # Avoid aliases like v.id (usually short prefixes)
        if len(parts[0]) <= 2 and len(parts) == 2:
            return text
            
        is_semantic = 'semantic' in text.lower()
        is_clean = 'clean' in text.lower()
        
        table_name = parts[-1]
        
        if is_semantic:
            return f"{{{{ ref('{table_name}') }}}}"
        elif is_clean:
            schema = parts[-2]
            return f"{{{{ source('{schema}', '{table_name}') }}}}"
        
        return text

    # General pattern for identifiers with dots, avoiding strings/comments
    table_pattern = r'\b([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?)\b'
    
    result = re.sub(table_pattern, smart_replace, sql)
    
    # Custom Cyrela Config Block
    config_block = f"""{{{{ config(
    schema='iops_rj',
    alias='{alias}',
    materialized='table',
    on_table_exists='replace',
) }}}}

"""
    return config_block + result

def lint_sql(sql: str) -> Dict[str, Any]:
    """
    Formats SQL and checks for basic issues.
    """
    formatted = sqlparse.format(
        sql,
        reindent=True,
        indent_width=4,
        keyword_case='upper',
        strip_comments=False,
        use_space_around_operators=True
    )
    
    # Basic linting checks
    issues = []
    if "SELECT *" in formatted.upper():
        issues.append({
            "level": "warning",
            "message": "Evite o uso de 'SELECT *'. Especifique as colunas para melhor performance e manutenção.",
            "line": 1
        })
    
    if "JOIN" in formatted.upper() and "ON" not in formatted.upper():
        # This is a very crude check, but serves as an example
        pass

    return {
        "formatted": formatted,
        "issues": issues
    }

def map_legacy_columns(columns: List[str], target_table: str, genie_client: GenieApiClient) -> List[Dict[str, Any]]:
    """
    Uses Genie to suggest mappings for legacy columns.
    This is a simplified version that would ideally call Genie's metadata or 
    perform a semantic search. For now, we'll simulate the mapping logic
    or use a specific prompt if a conversation is started.
    """
    mappings = []
    for col in columns:
        # Mock logic: in a real scenario, we'd query the catalog or use LLM
        clean_col = col.lower().strip()
        mapping = {
            "legacy": col,
            "suggested": f"target_{clean_col}",
            "confidence": 0.85,
            "reason": "Mapeamento automático baseado em similaridade fonética"
        }
        mappings.append(mapping)
    return mappings

def convert_crm_xml(xml_content: str) -> str:
    """
    Converts CRM Advanced Find XML to SQL.
    Parses <entity>, <attribute>, <filter> tags.
    """
    import xml.etree.ElementTree as ET
    try:
        root = ET.fromstring(xml_content)
        entity_node = root.find(".//entity")
        if entity_node is None:
            return "-- Erro: Entidade não encontrada no XML"
        
        entity_name = entity_node.get("name")
        attributes = [attr.get("name") for attr in entity_node.findall("attribute")]
        
        if not attributes:
            attributes = ["*"]
            
        sql = f"SELECT\n  {',\n  '.join(attributes)}\nFROM {entity_name}"
        
        # Simple filter parsing
        filter_node = entity_node.find("filter")
        if filter_node is not None:
            conditions = []
            for cond in filter_node.findall("condition"):
                attr = cond.get("attribute")
                op = cond.get("operator")
                val = cond.get("value")
                
                sql_op = "="
                if op == "eq": sql_op = "="
                elif op == "ne": sql_op = "!="
                elif op == "gt": sql_op = ">"
                elif op == "lt": sql_op = "<"
                
                conditions.append(f"{attr} {sql_op} '{val}'")
            
            if conditions:
                sql += f"\nWHERE\n  {' AND '.join(conditions)}"
                
        return sql
    except Exception as e:
        return f"-- Erro ao processar XML: {str(e)}"

def generate_dbt_docs(sql_content: str, alias: str, genie_client: GenieApiClient) -> str:
    """
    Uses Genie to generate dbt schema.yml documentation from SQL/Jinja code.
    """
    prompt = f"""Analise este código SQL/Jinja de um modelo dbt:

{sql_content}

Gere um arquivo schema.yml do dbt para este modelo, usando o nome '{alias}'.
Liste as colunas resultantes, proponha descrições baseadas na lógica do SQL e inclua testes básicos (not_null, unique).
Retorne APENAS o bloco YAML."""
    
    res = genie_client.start_conversation(prompt)
    conv_id = res.get("id")
    msg_id = res.get("message_id") or res.get("id")
    
    final_msg = genie_client.wait_for_message(conv_id, msg_id)
    
    # Extract YAML
    text = final_msg.get("text", {}).get("plain_text", "")
    if "```yaml" in text:
        return text.split("```yaml")[1].split("```")[0].strip()
    elif "```" in text:
        return text.split("```")[1].split("```")[0].strip()
    return text.strip()
