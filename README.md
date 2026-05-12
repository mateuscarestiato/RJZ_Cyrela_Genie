# 🚀 Genie RJZ Cyrela — Portal do Desenvolvedor Databricks

Plataforma interativa para consulta de dados, análise de esquemas e otimização de queries SQL, conectada ao Databricks Genie.

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=white)](https://reactjs.org)
[![Databricks](https://img.shields.io/badge/Databricks-Genie_API-FF3621?logo=databricks&logoColor=white)](https://www.databricks.com)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Como Executar](#-como-executar)

---

## 🎯 Visão Geral

O **Genie RJZ Cyrela** é um portal de desenvolvimento moderno que centraliza ferramentas essenciais para o time de Engenharia de Dados. Ele se conecta diretamente ao **Databricks Genie** via API REST e oferece uma interface web premium construída com **React** e **FastAPI**.

---

## 🏗 Arquitetura

```text
📦 RJZ_Cyrela_Genie/
├── 📁 backend/                # API FastAPI
│   ├── 📄 main.py             # Entrypoint da API
│   ├── 📄 auth.py             # Lógica de autenticação (Supabase/MS)
│   └── 📁 core/               # Clientes API (Genie, DevOps)
├── 📁 frontend/               # Single Page Application (React + Vite)
│   ├── 📁 src/                # Código fonte (Componentes, Hooks, etc)
│   └── 📄 vite.config.ts      # Configuração do Vite
├── 📄 .env                    # Variáveis de ambiente (Segredo!)
├── 📄 requirements.txt        # Dependências Python
└── 📁 assets/                 # Imagens e assets globais
```

---

## 🔧 Instalação

### Backend
```bash
# 1. Crie e ative um ambiente virtual
python -m venv .venv
source .venv/bin/activate # No Windows: .\.venv\Scripts\activate

# 2. Instale as dependências
pip install -r requirements.txt
pip install msal
```

### Frontend
```bash
cd frontend
npm install
```

---

## ⚙️ Configuração

Edite o arquivo `.env` com suas credenciais:

```env
DATABRICKS_HOST=https://adb-xxx.azuredatabricks.net
DATABRICKS_TOKEN=seu_token
GENIE_SPACE_ID=uuid-do-espaco

SUPABASE_URL=sua_url_supabase
SUPABASE_KEY=sua_chave_supabase
ENCRYPTION_KEY=sua_chave_fernet
```

---

## ▶️ Como Executar

### 1. Iniciar o Backend
```bash
# Na raiz do projeto
python backend/main.py
```
A API estará disponível em `http://localhost:8000`.

### 2. Iniciar o Frontend
```bash
cd frontend
npm run dev
```
O app abrirá em `http://localhost:5174` (ou conforme configurado no `.env`).

---

**Desenvolvido pelo time de Engenharia de Dados — RJZ Cyrela**

