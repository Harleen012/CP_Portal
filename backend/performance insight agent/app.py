# import os, json, base64, requests, uvicorn
# from datetime import datetime, timedelta
# from fastapi import FastAPI, HTTPException
# from fastapi.responses import RedirectResponse
# from fastapi.middleware.cors import CORSMiddleware
# from urllib.parse import quote
# from dotenv import load_dotenv

# load_dotenv()

# app = FastAPI(title="CPA Insight API", version="2.4")

# # ---------------- CORS ----------------
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ---------------- CONFIG ----------------
# X_CLIENT_ID = os.getenv("XERO_CLIENT_ID")
# X_CLIENT_SECRET = os.getenv("XERO_CLIENT_SECRET")
# X_REDIRECT_URI = os.getenv("XERO_REDIRECT_URI")
# TOKEN_FILE = "xero_token.json"

# # ---------------- AUTH STEP 1 ----------------
# @app.get("/auth/url")
# def auth_url():
#     scope = quote("offline_access accounting.reports.read")
#     redirect = quote(X_REDIRECT_URI, safe="")
#     return {
#         "auth_url": (
#             "https://login.xero.com/identity/connect/authorize"
#             f"?response_type=code"
#             f"&client_id={X_CLIENT_ID}"
#             f"&redirect_uri={redirect}"
#             f"&scope={scope}"
#         )
#     }

# # ---------------- AUTH STEP 2 ----------------
# @app.get("/callback")
# def callback(code: str):
#     auth = base64.b64encode(
#         f"{X_CLIENT_ID}:{X_CLIENT_SECRET}".encode()
#     ).decode()

#     res = requests.post(
#         "https://identity.xero.com/connect/token",
#         headers={
#             "Authorization": f"Basic {auth}",
#             "Content-Type": "application/x-www-form-urlencoded",
#         },
#         data={
#             "grant_type": "authorization_code",
#             "code": code,
#             "redirect_uri": X_REDIRECT_URI,
#         },
#     )

#     if not res.ok:
#         raise HTTPException(401, res.text)

#     with open(TOKEN_FILE, "w") as f:
#         json.dump(res.json(), f, indent=2)

#     # 🔥 Redirect back to frontend
#     return RedirectResponse("http://localhost:3000/performance?xero=connected")

# # ---------------- TOKEN LOADER ----------------
# def load_xero_token():
#     if not os.path.exists(TOKEN_FILE):
#         raise HTTPException(401, "Xero not authenticated")

#     token = json.load(open(TOKEN_FILE))
#     return token["access_token"]

# # ---------------- RUN REPORT ----------------
# @app.post("/run-report")
# def run_report():
#     xero_token = load_xero_token()

#     # 1️⃣ Get connection
#     conn_res = requests.get(
#         "https://api.xero.com/connections",
#         headers={"Authorization": f"Bearer {xero_token}"},
#     )

#     if not conn_res.ok:
#         raise HTTPException(401, f"Xero connection failed: {conn_res.text}")

#     conn = conn_res.json()[0]
#     tenant_id = conn["tenantId"]
#     org_name = conn["tenantName"]

#     # 2️⃣ Fetch Profit & Loss
#     pnl_res = requests.get(
#         "https://api.xero.com/api.xro/2.0/Reports/ProfitAndLoss",
#         headers={
#             "Authorization": f"Bearer {xero_token}",
#             "xero-tenant-id": tenant_id,
#             "Accept": "application/json",
#         },
#         params={
#             "fromDate": (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d"),
#             "toDate": datetime.now().strftime("%Y-%m-%d"),
#         },
#     )

#     if not pnl_res.ok:
#         raise HTTPException(
#             pnl_res.status_code,
#             f"Xero P&L failed: {pnl_res.text}"
#         )

#     pnl_data = pnl_res.json()

#     return {
#         "status": "SUCCESS",
#         "organisation": org_name,
#         "generated_at": datetime.now().isoformat(),
#         "profit_and_loss": pnl_data,
#     }

# # ---------------- RUN ----------------
# if __name__ == "__main__":
#     uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)




import os
import json
import uvicorn
import requests
import base64
import time
import re
from urllib.parse import quote
from datetime import date, datetime
from dateutil.relativedelta import relativedelta
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables
load_dotenv()

app = FastAPI()

# ---------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------
X_CLIENT_ID = os.getenv("XERO_CLIENT_ID")
X_CLIENT_SECRET = os.getenv("XERO_CLIENT_SECRET")
X_REDIRECT = os.getenv("XERO_REDIRECT_URI")
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")

# Allow Frontend (Next.js) to access this Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODEL CONFIGURATION ---
REPORT_MODEL_PRIMARY = "xiaomi/mimo-v2-flash"
REPORT_MODEL_FALLBACK = "deepseek/deepseek-r1:free"
CHAT_MODEL = "meta-llama/llama-3-8b-instruct:free"

# In-memory database (for prototype only)
db = {
    "access_token": None,
    "tenant_id": None,
    "org_name": None,
    "tenants": [],
    "last_analysis": "",
    "financial_context": {}
}

class ChatQuery(BaseModel):
    question: str

# ---------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------
def safe_float(val):
    if not val: return 0.0
    val = str(val).strip()
    if val in ['-', '', '0']: return 0.0
    val = val.replace(',', '')
    if val.startswith('(') and val.endswith(')'):
        val = '-' + val[1:-1]
    try:
        return float(val)
    except:
        return 0.0

def format_currency(amount):
    return "${:,.2f}".format(float(amount))

def clean_ai_output(text):
    if not text: return ""
    cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    cleaned = cleaned.replace("```html", "").replace("```", "").strip()
    return cleaned

# ---------------------------------------------------
# 1. CORE DOMAIN SERVICES
# ---------------------------------------------------
def fetch_xero(url, headers, params=None):
    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            return response.json()
        print(f"Xero API Error [{url}]: {response.status_code}")
        return {"error": response.status_code}
    except Exception as e:
        return {"error": str(e)}

def recursive_row_search(rows, target_map):
    for row in rows:
        if row.get('RowType') == 'Section':
            recursive_row_search(row.get('Rows', []), target_map)
        elif row.get('RowType') == 'Row' and row.get('Cells'):
            label = row['Cells'][0]['Value']
            value = 0.0
            for cell in row['Cells'][1:]:
                v_str = cell.get('Value', '')
                if v_str:
                    v_float = safe_float(v_str)
                    if v_float != 0:
                        value = v_float
                        break
            
            target_map[label] = value
            match = re.match(r"^(\d+)", label)
            if match: target_map[match.group(1)] = value
            if " - " in label: target_map[label.split(" - ", 1)[1]] = value

def get_financial_context():
    headers = {
        "Authorization": f"Bearer {db['access_token']}",
        "Xero-tenant-id": db["tenant_id"],
        "Accept": "application/json"
    }
    today = date.today()
    one_year_ago = today - relativedelta(months=12)

    accounts_res = fetch_xero("https://api.xero.com/api.xro/2.0/Accounts", headers)
    tb_res = fetch_xero("https://api.xero.com/api.xro/2.0/Reports/TrialBalance", headers, params={"date": today})
    pnl_res = fetch_xero("https://api.xero.com/api.xro/2.0/Reports/ProfitAndLoss", headers, params={"fromDate": one_year_ago, "toDate": today})
    bs_res = fetch_xero("https://api.xero.com/api.xro/2.0/Reports/BalanceSheet", headers, params={"date": today})
    bank_res = fetch_xero("https://api.xero.com/api.xro/2.0/BankTransactions", headers, params={"page": 1, "where": "Status==\"AUTHORISED\""})

    return {
        "meta": {"start": one_year_ago.strftime("%b %d, %Y"), "end": today.strftime("%b %d, %Y")},
        "accounts": accounts_res,
        "trial_balance": tb_res,
        "pnl": pnl_res,
        "bs": bs_res,
        "bank_tx": bank_res
    }

# ---------------------------------------------------
# 2. AI SERVICES
# ---------------------------------------------------
def call_llm(prompt, task_type="chat", retrying=False):
    if task_type == "chat":
        model = CHAT_MODEL
        timeout = 30
    else:
        if not retrying:
            model = REPORT_MODEL_PRIMARY
            timeout = 45
        else:
            model = REPORT_MODEL_FALLBACK
            timeout = 90
            
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000"
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
                "max_tokens": 2500
            },
            timeout=timeout
        )
        if response.status_code != 200:
            if task_type == "report" and not retrying:
                return call_llm(prompt, task_type="report", retrying=True)
            return f"<b>AI Error:</b> Provider returned status {response.status_code}"

        res_json = response.json()
        return clean_ai_output(res_json["choices"][0]["message"]["content"])
    except Exception as e:
        if task_type == "report" and not retrying:
            return call_llm(prompt, task_type="report", retrying=True)
        return f"<b>System Error:</b> {str(e)}"

def generate_ai_report(data, metrics):
    # We still generate HTML for the text report because it renders nicely in React's dangerousHTML
    gl_snippet = [f"{a['Code']} - {a['Name']} ({a['Type']})" for a in data['accounts'].get("Accounts", [])[:60]]
    metrics_text = f"""
    CALCULATED METRICS:
    - Total Revenue: {format_currency(metrics['Revenue'])}
    - Total Expenses: {format_currency(metrics['Expense'])}
    - Net Profit: {format_currency(metrics['Profit'])}
    """
    try: pnl_summary = json.dumps(data['pnl']["Reports"][0]["Rows"])[:2500] 
    except: pnl_summary = "Unavailable"
    try: bs_summary = json.dumps(data['bs']["Reports"][0]["Rows"])[:2000]
    except: bs_summary = "Unavailable"

    prompt = f"""
    You are a professional CPA Agent. Analyze this financial data.
    {metrics_text}
    DATA SOURCE:
    - GL Structure: {json.dumps(gl_snippet)}
    - P&L Data: {pnl_summary}
    - Balance Sheet: {bs_summary}
    
    TASK:
    Write an 'Annual Financial Performance Report' in HTML format (use <h3>, <p>, <ul>).
    1. Executive Summary: Synthesize overall health. Quote the Net Profit.
    2. Profitability Analysis: Analyze margins and top expenses.
    3. Operational Efficiency: Comment on expense ratios.
    4. Financial Position: Analyze assets vs liabilities.
    5. Recommendations: One strategic action item.
    """
    return call_llm(prompt, task_type="report")

# ---------------------------------------------------
# 3. ROUTES
# ---------------------------------------------------
@app.get("/")
def home():
    if not db["access_token"]:
        return RedirectResponse("/login")
    return RedirectResponse("http://localhost:3000") # Redirect to Frontend if logged in

@app.get("/login")
def login():
    scope = quote("offline_access accounting.reports.read accounting.settings.read accounting.transactions.read openid profile email")
    base_url = "https://login.xero.com/identity/connect/authorize"
    params = f"?response_type=code&client_id={X_CLIENT_ID}&redirect_uri={X_REDIRECT}&scope={scope}"
    return RedirectResponse(base_url + params)

@app.get("/callback")
def callback(code: str):
    auth_str = f"{X_CLIENT_ID}:{X_CLIENT_SECRET}"
    auth_b64 = base64.b64encode(auth_str.encode()).decode()
    token_res = requests.post(
        "https://identity.xero.com/connect/token",
        headers={"Authorization": f"Basic {auth_b64}", "Content-Type": "application/x-www-form-urlencoded"},
        data={"grant_type": "authorization_code", "code": code, "redirect_uri": X_REDIRECT}
    ).json()
    db["access_token"] = token_res.get("access_token")
    
    # Fetch tenants immediately
    connections = requests.get("https://api.xero.com/connections", headers={"Authorization": f"Bearer {db['access_token']}"}).json()
    db["tenants"] = connections
    
    # Redirect to Frontend for org selection or dashboard
    # Note: In a real app, you'd pass a token to the frontend. 
    # Here we rely on the backend session for simplicity.
    return RedirectResponse("http://localhost:3000/select-org") 

@app.get("/api/tenants")
def get_tenants():
    """Return available tenants for the frontend dropdown"""
    return JSONResponse(db["tenants"])

@app.post("/api/set-org")
async def set_org(request: Request):
    """Set the active organization"""
    body = await request.json()
    db["tenant_id"] = body.get("tenantId")
    for t in db["tenants"]:
        if t["tenantId"] == db["tenant_id"]: db["org_name"] = t["tenantName"]
    return JSONResponse({"status": "success", "org_name": db["org_name"]})

@app.post("/api/chat")
async def chat_endpoint(query: ChatQuery):
    if not db["financial_context"]: return JSONResponse({"answer": "Error: Financial data not loaded."})
    
    prompt = f"""
    You are an intelligent CPA Assistant.
    USER QUESTION: "{query.question}"
    CONTEXT:
    - Organization: {db['org_name']}
    - Recent Analysis Summary: {db['last_analysis'][:1500]}
    Answer the user directly and professionally.
    """
    answer = call_llm(prompt, task_type="chat")
    return JSONResponse({"answer": answer})

@app.get("/api/dashboard")
def dashboard_api():
    if not db["access_token"] or not db["tenant_id"]:
        return JSONResponse({"error": "Unauthorized or No Tenant Selected"}, status_code=401)

    # 1. Fetch Data
    data = get_financial_context()
    db["financial_context"] = data

    # 2. METRICS CALCULATION (Restored completely)
    metrics = {"Revenue": 0.0, "Expense": 0.0, "Profit": 0.0}
    
    try:
        report_sections = data['pnl']['Reports'][0]['Rows']
        found_main_income = False
        
        # REVENUE
        for section in report_sections:
            if section.get('RowType') == 'Section':
                title = section.get('Title', '').lower()
                if 'income' in title or 'revenue' in title:
                    for row in section.get('Rows', []):
                        if row.get('Cells'):
                            label = row['Cells'][0]['Value'].lower().strip()
                            if label == 'total income' or label == 'total sales':
                                metrics['Revenue'] = safe_float(row['Cells'][1]['Value'])
                                found_main_income = True
                                break 
            if found_main_income: break
        
        # Fallback Revenue Search
        if not found_main_income:
             for section in report_sections:
                if section.get('RowType') == 'Section':
                    title = section.get('Title', '').lower()
                    if 'income' in title or 'revenue' in title:
                        for row in section.get('Rows', []):
                             if row.get('Cells'):
                                 label = row['Cells'][0]['Value'].lower()
                                 if 'total' in label and 'non-operating' not in label:
                                     val = safe_float(row['Cells'][1]['Value'])
                                     if val > metrics['Revenue']: metrics['Revenue'] = val

        # EXPENSES
        for section in report_sections:
            if section.get('RowType') == 'Section':
                title = section.get('Title', '').lower()
                if 'expense' in title:
                    for row in section.get('Rows', []):
                         if row.get('Cells'):
                             label = row['Cells'][0]['Value'].lower()
                             if 'total' in label:
                                 metrics['Expense'] = safe_float(row['Cells'][1]['Value'])

        # PROFIT
        for section in report_sections:
             if section.get('RowType') == 'Row': 
                  label = section['Cells'][0]['Value'].lower()
                  if 'net profit' in label or 'total profit' in label:
                       metrics['Profit'] = safe_float(section['Cells'][1]['Value'])
        
        if metrics['Profit'] == 0:
            metrics['Profit'] = metrics['Revenue'] - metrics['Expense']

    except Exception as e:
        print(f"P&L Parse Error: {e}")

    # 3. GENERATE REPORT
    report_html = generate_ai_report(data, metrics)
    db["last_analysis"] = report_html

    # 4. PREPARE GL WITH YTD BALANCES
    ytd_map = {}
    if 'trial_balance' in data and data['trial_balance'].get('Reports'):
        recursive_row_search(data['trial_balance']['Reports'][0]['Rows'], ytd_map)
    if 'bs' in data and data['bs'].get('Reports'):
        recursive_row_search(data['bs']['Reports'][0]['Rows'], ytd_map)
    if 'pnl' in data and data['pnl'].get('Reports'):
        recursive_row_search(data['pnl']['Reports'][0]['Rows'], ytd_map)
    
    formatted_gl = []
    for acc in data['accounts'].get('Accounts', []):
        balance = 0.0
        if acc['Code'] in ytd_map: balance = ytd_map[acc['Code']]
        elif acc['Name'] in ytd_map: balance = ytd_map[acc['Name']]
        
        formatted_gl.append({
            "Code": acc['Code'],
            "Name": acc['Name'],
            "Type": acc['Type'],
            "TaxType": acc.get('TaxType', ''),
            "Description": acc.get('Description', ''),
            "Balance": balance,
            "BalanceFmt": format_currency(balance)
        })

    # 5. RETURN CLEAN JSON
    return JSONResponse({
        "org_name": db["org_name"],
        "metrics": metrics,
        "report_html": report_html,
        "meta": data['meta'],
        "gl": formatted_gl,
        "pnl_rows": data['pnl'].get('Reports', [{}])[0].get('Rows', []),
        "bs_rows": data['bs'].get('Reports', [{}])[0].get('Rows', []),
        "transactions": data['bank_tx'].get('BankTransactions', [])
    })

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)