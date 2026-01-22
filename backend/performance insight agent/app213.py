import os
import json
import uvicorn
import requests
import base64
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse, HTMLResponse

# --- LOGGING SETUP ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler("app.log"), logging.StreamHandler()]
)

load_dotenv()
app = FastAPI()

# --- CONFIG ---
X_CLIENT_ID = os.getenv("XERO_CLIENT_ID")
X_CLIENT_SECRET = os.getenv("XERO_CLIENT_SECRET")
X_REDIRECT = os.getenv("XERO_REDIRECT_URI")
OR_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Microsoft Configuration
MS_ACCESS_TOKEN = "eyJ0eXAiOiJKV1QiLCJub25jZSI6IkNrZnFLdW9iMndKTGN3X3NfU3dsRHRHUVFfd0k3VFlzSHFkX0tiMFE5VEkiLCJhbGciOiJSUzI1NiIsIng1dCI6IlBjWDk4R1g0MjBUMVg2c0JEa3poUW1xZ3dNVSIsImtpZCI6IlBjWDk4R1g0MjBUMVg2c0JEa3poUW1xZ3dNVSJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDAiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC80ZGFiMGZlZi1mMDJkLTQ0MGItOTdjMy03MTJlOTQ4M2JkNjgvIiwiaWF0IjoxNzY3NzcxNjk3LCJuYmYiOjE3Njc3NzE2OTcsImV4cCI6MTc2Nzc3Njg2NCwiYWNjdCI6MCwiYWNyIjoiMSIsImFjcnMiOlsicDEiXSwiYWlvIjoiQVdRQW0vOGFBQUFBRFc2YU1BR3pNRWhYaGJjWTc2cUFaamRoY25mQzBwanoxbkE2dEg3M0FabkxYcU5jYi9IeXVsVGRIR1FIM3k1QnRNR0VlVXFDWk5sV2ZoVFpDUWdMeVBoNTlCZDFsbmlTQW0xVnhsREp0N1hveXV5OXBPazFQVURnaFg0TWdLcXUiLCJhbXIiOlsicHdkIiwibWZhIl0sImFwcF9kaXNwbGF5bmFtZSI6IkNQQSIsImFwcGlkIjoiMzkyODg0YmYtNDVmNC00NTZjLTkzZjgtMzE4OWVjYTQwNmI0IiwiYXBwaWRhY3IiOiIwIiwiZmFtaWx5X25hbWUiOiJBb3NjIiwiZ2l2ZW5fbmFtZSI6IlN1YnNjcmlwdGlvbnMiLCJpZHR5cCI6InVzZXIiLCJpcGFkZHIiOiIyMDIuMTY0LjQ5LjMiLCJuYW1lIjoiU3Vic2NyaXB0aW9ucyBBb3NjIiwib2lkIjoiNmUzMDU4NTgtYzBkOS00MDE4LWFmZDctZGY5YWQ4NTg5NGU2IiwicGxhdGYiOiIzIiwicHVpZCI6IjEwMDMyMDA1MzhEMDZBMzgiLCJyaCI6IjEuQVVJQTd3LXJUUzN3QzBTWHczRXVsSU85YUFNQUFBQUFBQUFBd0FBQUFBQUFBQUJDQUtKQ0FBLiIsInNjcCI6IkJyb3dzZXJTaXRlTGlzdHMuUmVhZC5BbGwgQnJvd3NlclNpdGVMaXN0cy5SZWFkV3JpdGUuQWxsIEZpbGVzLlJlYWQgRmlsZXMuUmVhZFdyaXRlIG9wZW5pZCBwcm9maWxlIFNpdGVzLk1hbmFnZS5BbGwgU2l0ZXMuU2VsZWN0ZWQgVXNlci5SZWFkIFVzZXIuUmVhZEJhc2ljLkFsbCBlbWFpbCIsInNpZCI6IjAwYmFjYzY5LWJhZjgtNDYwMy0xMzJlLWNkYzEwZTVkOTU2NCIsInNpZ25pbl9zdGF0ZSI6WyJrbXNpIl0sInN1YiI6IlczTjFfdW9QYnUycExMSjVscWxRWVZhSFdSTWhNcEVrZGlSYTJudEVSTWMiLCJ0ZW5hbnRfcmVnaW9uX3Njb3BlIjoiT0MiLCJ0aWQiOiI0ZGFiMGZlZi1mMDJkLTQ0MGItOTdjMy03MTJlOTQ4M2JkNjgiLCJ1bmlxdWVfbmFtZSI6InN1YnNjcmlwdGlvbnNAYW9zY2F1c3RyYWxpYS5jb20iLCJ1cG4iOiJzdWJzY3JpcHRpb25zQGFvc2NhdXN0cmFsaWEuY29tIiwidXRpIjoiSkJ0ajdXS1FLMHV0R1h0V0d4Z0JBQSIsInZlciI6IjEuMCIsIndpZHMiOlsiYjc5ZmJmNGQtM2VmOS00Njg5LTgxNDMtNzZiMTk0ZTg1NTA5Il0sInhtc19hY2QiOjE3NjY0NjIxNjUsInhtc19hY3RfZmN0IjoiMyA5IiwieG1zX2Z0ZCI6ImVKeExIRjVXcFRfeTdVWTRCTkRRdzNEZ1h4OUJOcFZoMG5oLW9mVVpHcE1CWVhWemRISmhiR2xoWXkxa2MyMXoiLCJ4bXNfaWRyZWwiOiIxIDI4IiwieG1zX3N0Ijp7InN1YiI6InJKWVdTTGpTak1kdVJwWWNzSUtIUHJfVC1XTU50VHZFOUNVSzh1Yk4xQTAifSwieG1zX3N1Yl9mY3QiOiIzIDIiLCJ4bXNfdGNkdCI6MTY1NzYzMzg2MCwieG1zX3RudF9mY3QiOiIzIDEwIn0.H1uAOvfvB85zGGS5vkvjNpXUPcRg7CHaB2nRG6-8X_8EkBMBgGfHxY2kEpGKujiBnm0yXx5g3m208l_A2gi8VJY7-8deoDXgCry6lJqBAuuPM_FX9IUlzpKYAWOW5uurzIb1mXHOkphyR-201-2qObY5biZf1rZEeiuP6ikhal3o11AcGPyF8CgIjJqLp-UsJ47fxkE5UCR34sLTXw5ybyY8IcmFqT69jaDQtRq8dEmz4ceXFP3yBs0ery1mCvU_gO7T7T6zQwHs2RU4Th47BQNcwim0c7gB8_Jz_wLg5k4n-HSsHl0AeJNQYJe7LOK9UeYNCiRpQlc_6qoEk12rUg"
HOSTNAME = "aoscaustralia.sharepoint.com"
SITE_PATH = "/sites/CPA"
SHAREPOINT_SITE_RELATIVE = f"{HOSTNAME}:{SITE_PATH}"

# Session Store (In-memory for demo)
db = {
    "xero_access_token": None,
    "xero_tenant_id": None,
    "xero_org_name": None
}

# --- SHAREPOINT HELPERS ---

def resolve_sharepoint_site():
    """Resolves the SharePoint Site string to a unique Site ID."""
    url = f"https://graph.microsoft.com/v1.0/sites/{SHAREPOINT_SITE_RELATIVE}"
    headers = {"Authorization": f"Bearer {MS_ACCESS_TOKEN}"}
    res = requests.get(url, headers=headers)
    if not res.ok:
        logging.error(f"Site resolve failed: {res.status_code} {res.text}")
        return None
    return res.json()["id"]

def get_document_drive(site_id):
    """Fetches the default Document Library (Drive) ID for the site."""
    url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives"
    headers = {"Authorization": f"Bearer {MS_ACCESS_TOKEN}"}
    res = requests.get(url, headers=headers)
    if not res.ok:
        logging.error(f"Failed to fetch drives: {res.text}")
        return None
    
    drives = res.json().get("value", [])
    # Usually named 'Documents' in SharePoint
    for d in drives:
        if d.get("name") == "Documents" or d.get("driveType") == "documentLibrary":
            return d.get("id")
    return drives[0].get("id") if drives else None

def ensure_folder_exists(drive_id, folder_name):
    """Ensures a folder exists in the specific Drive."""
    url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root/children"
    headers = {"Authorization": f"Bearer {MS_ACCESS_TOKEN}"}
    try:
        res = requests.get(url, headers=headers)
        items = res.json().get("value", [])
        if any(item["name"] == folder_name and "folder" in item for item in items):
            logging.info(f"Folder '{folder_name}' exists")
            return True

        # Create folder if it doesn't exist
        create_res = requests.post(
            url,
            headers={**headers, "Content-Type": "application/json"},
            json={"name": folder_name, "folder": {}, "@microsoft.graph.conflictBehavior": "fail"}
        )
        return create_res.status_code in [200, 201]
    except Exception as e:
        logging.error(f"Folder error: {str(e)}")
        return False

# --- AI ANALYSIS ---
def analyze_with_ai(data):
    headers = {"Authorization": f"Bearer {OR_API_KEY}", "Content-Type": "application/json"}
    prompt = f"Professional CPA Analysis of this P&L: {json.dumps(data)[:3000]}"
    payload = {
        # "model": "google/gemini-2.0-flash-exp:free", 
        "model": "xiaomi/mimo-v2-flash:free", 
        "messages": [{"role": "user", "content": prompt}]
    }
    res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
    if res.status_code != 200:
        return "AI Analysis Unavailable"
    try:
        return res.json()['choices'][0]['message']['content']
    except:
        return "AI Analysis Failed"

# --- ROUTES ---

@app.get("/")
def home():
    xero_status = "Connected" if db["xero_access_token"] else "Not Connected"
    buttons = ""
    if not db["xero_access_token"]:
        buttons += '<p><a href="/login"><button>Connect to Xero</button></a></p>'
    else:
        buttons += '<p><a href="/process-insight"><button style="padding:10px 20px; cursor:pointer;">Generate & Upload Report</button></a></p>'

    return HTMLResponse(f"""
    <div style="font-family: sans-serif; padding: 40px;">
        <h1>CPA Performance Agent</h1>
        <p><strong>Xero:</strong> {xero_status}</p>
        <p><strong>SharePoint:</strong> Site Ready</p>
        {buttons}
    </div>
    """)

@app.get("/login")
def xero_login():
    from urllib.parse import quote
    scope = quote("offline_access accounting.transactions.read accounting.reports.read openid profile email")
    url = f"https://login.xero.com/identity/connect/authorize?response_type=code&client_id={X_CLIENT_ID}&redirect_uri={quote(X_REDIRECT)}&scope={scope}&state=123"
    return RedirectResponse(url)

@app.get("/callback")
async def xero_callback(request: Request):
    code = request.query_params.get("code")
    auth = base64.b64encode(f"{X_CLIENT_ID}:{X_CLIENT_SECRET}".encode()).decode()
    token_res = requests.post("https://identity.xero.com/connect/token",
                              headers={"Authorization": f"Basic {auth}"},
                              data={"grant_type": "authorization_code", "code": code, "redirect_uri": X_REDIRECT})
    
    token_data = token_res.json()
    db["xero_access_token"] = token_data.get("access_token")
    
    conn_res = requests.get("https://api.xero.com/connections",
                            headers={"Authorization": f"Bearer {db['xero_access_token']}"})
    conn = conn_res.json()
    db["xero_tenant_id"] = conn[0]["tenantId"]
    db["xero_org_name"] = conn[0]["tenantName"]
    return RedirectResponse(url="/")

@app.get("/process-insight")
async def process_insight():
    if not db["xero_access_token"]:
        return RedirectResponse("/login")

    # 1. Resolve SharePoint Identity
    site_id = resolve_sharepoint_site()
    if not site_id:
        return HTMLResponse("<h2>Error</h2><p>Could not resolve SharePoint Site. Check token/permissions.</p>")
    
    drive_id = get_document_drive(site_id)
    if not drive_id:
        return HTMLResponse("<h2>Error</h2><p>Could not find Document Library in Site.</p>")

    # 2. Fetch Xero P&L
    to_date = datetime.now().strftime('%Y-%m-%d')
    from_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
    params = {'fromDate': from_date, 'toDate': to_date, 'periods': 11, 'timeframe': 'MONTH'}
    headers = {
        "Authorization": f"Bearer {db['xero_access_token']}",
        "xero-tenant-id": db["xero_tenant_id"],
        "Accept": "application/json"
    }
    pnl_res = requests.get("https://api.xero.com/api.xro/2.0/Reports/ProfitAndLoss", headers=headers, params=params)
    pnl = pnl_res.json()

    # 3. AI Analysis
    insight = analyze_with_ai(pnl)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    report_data = {"analysis": insight, "data": pnl}

    # 4. Upload to SharePoint Document Library
    saved_to = "Local"
    sp_headers = {"Authorization": f"Bearer {MS_ACCESS_TOKEN}", "Content-Type": "application/json"}
    
    if ensure_folder_exists(drive_id, "Xero_Data") and ensure_folder_exists(drive_id, "CPA_Reports"):
        # Uploading to /drives/{drive_id}/root:/{path}:/content
        raw_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/Xero_Data/Raw_PNL_{timestamp}.json:/content"
        report_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/CPA_Reports/Report_{timestamp}.json:/content"
        
        up1 = requests.put(raw_url, headers=sp_headers, data=json.dumps(pnl))
        up2 = requests.put(report_url, headers=sp_headers, data=json.dumps(report_data))
        
        if up1.ok and up2.ok:
            saved_to = "SharePoint Document Library"
        else:
            logging.error(f"Upload failed: {up1.text} {up2.text}")

    return HTMLResponse(f"""
    <div style="font-family: sans-serif; max-width: 800px; margin: auto; padding: 40px;">
        <h1 style="color: #2c3e50;">Analysis Complete</h1>
        <p><strong>Client:</strong> {db['xero_org_name']}</p>
        <p><strong>Saved to:</strong> {saved_to}</p>
        <hr>
        <h2>CPA Insights</h2>
        <div style="background: #f4f7f6; padding: 20px; border-left: 5px solid #16a085; white-space: pre-wrap;">{insight}</div>
        <br>
        <a href="/">← Back to Home</a>
    </div>
    """)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)















# import os
# import json
# import base64
# import requests
# import logging
# from datetime import datetime, timedelta
# from dotenv import load_dotenv
# from fastapi import FastAPI, Request, HTTPException

# # ---------------- SETUP ----------------
# logging.basicConfig(level=logging.INFO)
# load_dotenv()

# app = FastAPI()

# GRAPH_BASE = "https://graph.microsoft.com/v1.0"
# HOSTNAME = "aoscaustralia.sharepoint.com"
# SITE_PATH = "/sites/CPA"

# # ---------------- XERO CONFIG ----------------
# X_CLIENT_ID = os.getenv("XERO_CLIENT_ID")
# X_CLIENT_SECRET = os.getenv("XERO_CLIENT_SECRET")
# X_REDIRECT = os.getenv("XERO_REDIRECT_URI")
# OR_API_KEY = os.getenv("OPENROUTER_API_KEY")

# # ---------------- IN-MEMORY SESSION ----------------
# db = {
#     "xero_access_token": None,
#     "xero_tenant_id": None,
#     "xero_org_name": None,
# }

# # ==================================================
# # 🔐 MICROSOFT GRAPH (DELEGATED TOKEN)
# # ==================================================
# def get_graph_headers(request: Request):
#     auth = request.headers.get("authorization")
#     if not auth or not auth.lower().startswith("bearer "):
#         raise HTTPException(status_code=401, detail="Missing Microsoft access token")

#     return {
#         "Authorization": auth,
#         "Content-Type": "application/json"
#     }

# # ==================================================
# # 📁 SHAREPOINT HELPERS
# # ==================================================
# def resolve_sharepoint_site(request: Request):
#     headers = get_graph_headers(request)
#     url = f"{GRAPH_BASE}/sites/{HOSTNAME}:{SITE_PATH}"

#     res = requests.get(url, headers=headers)
#     if not res.ok:
#         raise HTTPException(res.status_code, res.text)

#     return res.json()["id"]

# def get_document_library(site_id: str, request: Request):
#     headers = get_graph_headers(request)
#     url = f"{GRAPH_BASE}/sites/{site_id}/drives"

#     res = requests.get(url, headers=headers)
#     if not res.ok:
#         raise HTTPException(res.status_code, res.text)

#     for d in res.json().get("value", []):
#         if d.get("driveType") == "documentLibrary":
#             return d["id"]

#     raise HTTPException(404, "Document library not found")

# def ensure_folder(drive_id: str, folder: str, request: Request):
#     headers = get_graph_headers(request)
#     url = f"{GRAPH_BASE}/drives/{drive_id}/root/children"

#     res = requests.get(url, headers=headers)
#     items = res.json().get("value", [])

#     if any(i["name"] == folder for i in items):
#         return True

#     requests.post(
#         url,
#         headers=headers,
#         json={"name": folder, "folder": {}}
#     )
#     return True

# # ==================================================
# # 🤖 AI ANALYSIS
# # ==================================================
# def analyze_with_ai(pnl_data: dict):
#     payload = {
#         "model": "xiaomi/mimo-v2-flash:free",
#         "messages": [{
#             "role": "user",
#             "content": f"Professional CPA analysis of this Profit & Loss data:\n{json.dumps(pnl_data)[:3000]}"
#         }]
#     }

#     res = requests.post(
#         "https://openrouter.ai/api/v1/chat/completions",
#         headers={
#             "Authorization": f"Bearer {OR_API_KEY}",
#             "Content-Type": "application/json"
#         },
#         json=payload
#     )

#     if not res.ok:
#         raise HTTPException(500, "AI analysis failed")

#     return res.json()["choices"][0]["message"]["content"]

# # ==================================================
# # 🔑 XERO AUTH
# # ==================================================
# @app.get("/login")
# def xero_login():
#     from urllib.parse import quote
#     scope = quote("offline_access accounting.transactions.read accounting.reports.read")
#     return {
#         "auth_url": (
#             "https://login.xero.com/identity/connect/authorize"
#             f"?response_type=code&client_id={X_CLIENT_ID}"
#             f"&redirect_uri={quote(X_REDIRECT)}&scope={scope}"
#         )
#     }

# @app.get("/callback")
# def xero_callback(code: str):
#     auth = base64.b64encode(f"{X_CLIENT_ID}:{X_CLIENT_SECRET}".encode()).decode()

#     token_res = requests.post(
#         "https://identity.xero.com/connect/token",
#         headers={"Authorization": f"Basic {auth}"},
#         data={
#             "grant_type": "authorization_code",
#             "code": code,
#             "redirect_uri": X_REDIRECT
#         }
#     )

#     token = token_res.json()["access_token"]
#     db["xero_access_token"] = token

#     conn = requests.get(
#         "https://api.xero.com/connections",
#         headers={"Authorization": f"Bearer {token}"}
#     ).json()[0]

#     db["xero_tenant_id"] = conn["tenantId"]
#     db["xero_org_name"] = conn["tenantName"]

#     return {"status": "connected", "org": db["xero_org_name"]}

# # ==================================================
# # 🚀 MAIN API (USED BY FRONTEND)
# # ==================================================
# @app.get("/process-insight")
# def process_insight(request: Request):
#     if not db["xero_access_token"]:
#         raise HTTPException(401, "Xero not connected")

#     # SharePoint
#     site_id = resolve_sharepoint_site(request)
#     drive_id = get_document_library(site_id, request)
#     ensure_folder(drive_id, "CPA_Reports", request)

#     # Xero P&L
#     pnl = requests.get(
#         "https://api.xero.com/api.xro/2.0/Reports/ProfitAndLoss",
#         headers={
#             "Authorization": f"Bearer {db['xero_access_token']}",
#             "xero-tenant-id": db["xero_tenant_id"]
#         },
#         params={
#             "fromDate": (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d"),
#             "toDate": datetime.now().strftime("%Y-%m-%d")
#         }
#     ).json()

#     analysis_text = analyze_with_ai(pnl)

#     return {
#         "meta": {
#             "client": db["xero_org_name"],
#             "generatedAt": datetime.utcnow().isoformat(),
#             "savedTo": "SharePoint Document Library"
#         },
#         "analysis": analysis_text,
#         "financialData": pnl
#     }

# # ==================================================
# # ▶ RUN
# # ==================================================
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="127.0.0.1", port=8000)















# import os
# import json
# import base64
# import requests
# import logging
# from datetime import datetime, timedelta
# from dotenv import load_dotenv
# from fastapi import FastAPI, Request, HTTPException

# # ---------------- SETUP ----------------
# logging.basicConfig(level=logging.INFO)
# load_dotenv()

# app = FastAPI()

# GRAPH_BASE = "https://graph.microsoft.com/v1.0"
# HOSTNAME = "aoscaustralia.sharepoint.com"
# SITE_PATH = "/sites/CPA"

# # ---------------- XERO CONFIG ----------------
# X_CLIENT_ID = os.getenv("XERO_CLIENT_ID")
# X_CLIENT_SECRET = os.getenv("XERO_CLIENT_SECRET")
# X_REDIRECT = os.getenv("XERO_REDIRECT_URI")
# OR_API_KEY = os.getenv("OPENROUTER_API_KEY")

# # ---------------- IN-MEMORY SESSION ----------------
# db = {
#     "xero_access_token": None,
#     "xero_tenant_id": None,
#     "xero_org_name": None,
# }

# # ==================================================
# # 🔐 MICROSOFT GRAPH (DELEGATED TOKEN)
# # ==================================================
# def get_graph_headers(request: Request):
#     auth = request.headers.get("authorization")
#     if not auth or not auth.lower().startswith("bearer "):
#         raise HTTPException(401, "Missing Microsoft access token")

#     return {
#         "Authorization": auth,
#         "Content-Type": "application/json",
#     }

# # ==================================================
# # 📁 SHAREPOINT HELPERS
# # ==================================================
# def resolve_sharepoint_site(request: Request):
#     headers = get_graph_headers(request)
#     url = f"{GRAPH_BASE}/sites/{HOSTNAME}:{SITE_PATH}"

#     res = requests.get(url, headers=headers)
#     if not res.ok:
#         raise HTTPException(res.status_code, f"Site resolve failed: {res.text}")

#     return res.json()["id"]

# def get_document_library(site_id: str, request: Request):
#     headers = get_graph_headers(request)
#     url = f"{GRAPH_BASE}/sites/{site_id}/drives"

#     res = requests.get(url, headers=headers)
#     if not res.ok:
#         raise HTTPException(res.status_code, f"Drive fetch failed: {res.text}")

#     for d in res.json().get("value", []):
#         if d.get("driveType") == "documentLibrary":
#             return d["id"]

#     raise HTTPException(404, "Document library not found")

# def ensure_folder(drive_id: str, folder: str, request: Request):
#     headers = get_graph_headers(request)
#     url = f"{GRAPH_BASE}/drives/{drive_id}/root/children"

#     res = requests.get(url, headers=headers)
#     if not res.ok:
#         raise HTTPException(res.status_code, res.text)

#     items = res.json().get("value", [])
#     if any(i["name"] == folder for i in items):
#         return

#     create = requests.post(
#         url,
#         headers=headers,
#         json={"name": folder, "folder": {}},
#     )

#     if not create.ok:
#         raise HTTPException(create.status_code, create.text)

# # ==================================================
# # 🤖 AI ANALYSIS
# # ==================================================
# def analyze_with_ai(pnl_data: dict):
#     payload = {
#         "model": "xiaomi/mimo-v2-flash:free",
#         "messages": [{
#             "role": "user",
#             "content": f"Professional CPA analysis of this Profit & Loss data:\n{json.dumps(pnl_data)[:3000]}"
#         }]
#     }

#     res = requests.post(
#         "https://openrouter.ai/api/v1/chat/completions",
#         headers={
#             "Authorization": f"Bearer {OR_API_KEY}",
#             "Content-Type": "application/json",
#         },
#         json=payload,
#     )

#     if not res.ok:
#         raise HTTPException(500, f"AI analysis failed: {res.text}")

#     return res.json()["choices"][0]["message"]["content"]

# # ==================================================
# # 🔑 XERO AUTH
# # ==================================================
# @app.get("/login")
# def xero_login():
#     from urllib.parse import quote
#     scope = quote("offline_access accounting.transactions.read accounting.reports.read")
#     return {
#         "auth_url": (
#             "https://login.xero.com/identity/connect/authorize"
#             f"?response_type=code&client_id={X_CLIENT_ID}"
#             f"&redirect_uri={quote(X_REDIRECT)}&scope={scope}"
#         )
#     }

# @app.get("/callback")
# def xero_callback(code: str):
#     auth = base64.b64encode(f"{X_CLIENT_ID}:{X_CLIENT_SECRET}".encode()).decode()

#     token_res = requests.post(
#         "https://identity.xero.com/connect/token",
#         headers={"Authorization": f"Basic {auth}"},
#         data={
#             "grant_type": "authorization_code",
#             "code": code,
#             "redirect_uri": X_REDIRECT,
#         },
#     )

#     if not token_res.ok:
#         raise HTTPException(400, f"Xero token error: {token_res.text}")

#     token_data = token_res.json()
#     db["xero_access_token"] = token_data["access_token"]

#     conn_res = requests.get(
#         "https://api.xero.com/connections",
#         headers={"Authorization": f"Bearer {db['xero_access_token']}"},
#     )

#     if not conn_res.ok:
#         raise HTTPException(400, "Failed to fetch Xero tenant")

#     conn = conn_res.json()[0]
#     db["xero_tenant_id"] = conn["tenantId"]
#     db["xero_org_name"] = conn["tenantName"]

#     return {"status": "connected", "org": db["xero_org_name"]}

# # ==================================================
# # 🚀 MAIN API (USED BY FRONTEND)
# # ==================================================
# @app.get("/process-insight")
# def process_insight(request: Request):
#     if not db["xero_access_token"]:
#         raise HTTPException(401, "Xero not connected")

#     # ---- SharePoint ----
#     site_id = resolve_sharepoint_site(request)
#     drive_id = get_document_library(site_id, request)
#     ensure_folder(drive_id, "CPA_Reports", request)

#     # ---- Xero P&L (FIXED) ----
#     pnl_res = requests.get(
#         "https://api.xero.com/api.xro/2.0/Reports/ProfitAndLoss",
#         headers={
#             "Authorization": f"Bearer {db['xero_access_token']}",
#             "xero-tenant-id": db["xero_tenant_id"],
#             "Accept": "application/json",
#         },
#         params={
#             "fromDate": (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d"),
#             "toDate": datetime.now().strftime("%Y-%m-%d"),
#             "periods": 11,        # ✅ XERO LIMIT (1–11 ONLY)
#             "timeframe": "MONTH",
#         },
#     )

#     if not pnl_res.ok:
#         raise HTTPException(
#             pnl_res.status_code,
#             f"Xero P&L failed: {pnl_res.text}",
#         )

#     pnl = pnl_res.json()

#     # ---- AI ----
#     analysis_text = analyze_with_ai(pnl)

#     return {
#         "meta": {
#             "client": db["xero_org_name"],
#             "generatedAt": datetime.utcnow().isoformat(),
#             "savedTo": "SharePoint Document Library",
#         },
#         "analysis": analysis_text,
#         "financialData": pnl,
#     }

# # ==================================================
# # ▶ RUN
# # ==================================================
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="127.0.0.1", port=8000)




























#  es ton thalle mai code change krke run karayeya hai, to get the json format in the postman


# import os
# import json
# import base64
# import requests
# import logging
# from datetime import datetime, timedelta
# from dotenv import load_dotenv
# from fastapi import FastAPI, Request, HTTPException
# from fastapi.responses import RedirectResponse

# # ---------------- SETUP ----------------
# logging.basicConfig(level=logging.INFO)
# load_dotenv()

# app = FastAPI()

# # ---------------- ENV ----------------
# X_CLIENT_ID = os.getenv("XERO_CLIENT_ID")
# X_CLIENT_SECRET = os.getenv("XERO_CLIENT_SECRET")
# X_REDIRECT = os.getenv("XERO_REDIRECT_URI")
# OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# MS_CLIENT_ID = os.getenv("MS_CLIENT_ID")
# MS_CLIENT_SECRET = os.getenv("MS_CLIENT_SECRET")
# MS_TENANT_ID = os.getenv("MS_TENANT_ID")
# SHAREPOINT_SITE_URL = os.getenv("SHAREPOINT_SITE_ID")

# GRAPH_BASE = "https://graph.microsoft.com/v1.0"

# # ---------------- IN-MEMORY SESSION ----------------
# db = {
#     "xero_access_token": None,
#     "xero_tenant_id": None,
#     "xero_org_name": None,
# }

# ms_token_cache = {
#     "access_token": None,
#     "expires_at": None
# }

# # ==================================================
# # 🔐 MICROSOFT TOKEN (DYNAMIC)
# # ==================================================
# def get_ms_access_token():
#     if ms_token_cache["access_token"] and ms_token_cache["expires_at"] > datetime.utcnow():
#         return ms_token_cache["access_token"]

#     url = f"https://login.microsoftonline.com/{MS_TENANT_ID}/oauth2/v2.0/token"
#     data = {
#         "client_id": MS_CLIENT_ID,
#         "client_secret": MS_CLIENT_SECRET,
#         "scope": "https://graph.microsoft.com/.default",
#         "grant_type": "client_credentials"
#     }

#     res = requests.post(url, data=data)
#     if not res.ok:
#         raise HTTPException(500, "Failed to obtain Microsoft token")

#     token_data = res.json()
#     ms_token_cache["access_token"] = token_data["access_token"]
#     ms_token_cache["expires_at"] = datetime.utcnow() + timedelta(seconds=token_data["expires_in"] - 60)

#     return ms_token_cache["access_token"]

# def graph_headers():
#     return {
#         "Authorization": f"Bearer {get_ms_access_token()}",
#         "Content-Type": "application/json"
#     }

# # ==================================================
# # 📁 SHAREPOINT HELPERS
# # ==================================================
# def resolve_sharepoint_site():
#     url = f"{GRAPH_BASE}/sites/{SHAREPOINT_SITE_URL.replace('https://', '')}"
#     res = requests.get(url, headers=graph_headers())
#     if not res.ok:
#         raise HTTPException(res.status_code, res.text)
#     return res.json()["id"]

# def get_document_library(site_id):
#     url = f"{GRAPH_BASE}/sites/{site_id}/drives"
#     res = requests.get(url, headers=graph_headers())
#     for d in res.json().get("value", []):
#         if d.get("driveType") == "documentLibrary":
#             return d["id"]
#     raise HTTPException(404, "Document library not found")

# def ensure_folder(drive_id, folder):
#     url = f"{GRAPH_BASE}/drives/{drive_id}/root/children"
#     res = requests.get(url, headers=graph_headers())
#     if any(i["name"] == folder for i in res.json().get("value", [])):
#         return

#     requests.post(
#         url,
#         headers=graph_headers(),
#         json={"name": folder, "folder": {}}
#     )

# # ==================================================
# # 🤖 AI ANALYSIS
# # ==================================================
# def analyze_with_ai(pnl):
#     payload = {
#         "model": "xiaomi/mimo-v2-flash:free",
#         "messages": [{
#             "role": "user",
#             "content": f"Professional CPA analysis of this Profit & Loss data:\n{json.dumps(pnl)[:3000]}"
#         }]
#     }

#     res = requests.post(
#         "https://openrouter.ai/api/v1/chat/completions",
#         headers={
#             "Authorization": f"Bearer {OPENROUTER_API_KEY}",
#             "Content-Type": "application/json"
#         },
#         json=payload
#     )

#     if not res.ok:
#         raise HTTPException(500, "AI analysis failed")

#     return res.json()["choices"][0]["message"]["content"]

# # ==================================================
# # 🔑 XERO AUTH
# # ==================================================
# @app.get("/login")
# def login():
#     from urllib.parse import quote
#     scope = quote("offline_access accounting.transactions.read accounting.reports.read")
#     return RedirectResponse(
#         f"https://login.xero.com/identity/connect/authorize"
#         f"?response_type=code&client_id={X_CLIENT_ID}"
#         f"&redirect_uri={quote(X_REDIRECT)}&scope={scope}"
#     )

# @app.get("/callback")
# def callback(code: str):
#     auth = base64.b64encode(f"{X_CLIENT_ID}:{X_CLIENT_SECRET}".encode()).decode()

#     token_res = requests.post(
#         "https://identity.xero.com/connect/token",
#         headers={"Authorization": f"Basic {auth}"},
#         data={"grant_type": "authorization_code", "code": code, "redirect_uri": X_REDIRECT}
#     )

#     token = token_res.json()["access_token"]
#     db["xero_access_token"] = token

#     conn = requests.get(
#         "https://api.xero.com/connections",
#         headers={"Authorization": f"Bearer {token}"}
#     ).json()[0]

#     db["xero_tenant_id"] = conn["tenantId"]
#     db["xero_org_name"] = conn["tenantName"]

#     return {"status": "connected", "org": db["xero_org_name"]}

# # ==================================================
# # 🚀 MAIN API (JSON RESPONSE)
# # ==================================================
# @app.get("/process-insight")
# def process_insight():
#     if not db["xero_access_token"]:
#         raise HTTPException(401, "Xero not connected")

#     site_id = resolve_sharepoint_site()
#     drive_id = get_document_library(site_id)

#     ensure_folder(drive_id, "Xero_Data")
#     ensure_folder(drive_id, "CPA_Reports")

#     pnl_res = requests.get(
#         "https://api.xero.com/api.xro/2.0/Reports/ProfitAndLoss",
#         headers={
#             "Authorization": f"Bearer {db['xero_access_token']}",
#             "xero-tenant-id": db["xero_tenant_id"]
#         },
#         params={
#             "fromDate": (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d"),
#             "toDate": datetime.now().strftime("%Y-%m-%d"),
#             "periods": 12,
#             "timeframe": "MONTH"
#         }
#     )

#     if not pnl_res.ok:
#         raise HTTPException(500, f"Xero P&L failed: {pnl_res.text}")

#     pnl = pnl_res.json()
#     analysis = analyze_with_ai(pnl)

#     return {
#         "success": True,
#         "meta": {
#             "client": db["xero_org_name"],
#             "generatedAt": datetime.utcnow().isoformat(),
#             "savedTo": "SharePoint Document Library"
#         },
#         "analysis": analysis,
#         "financialData": pnl
#     }

# # ==================================================
# # ▶ RUN
# # ==================================================
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="127.0.0.1", port=8000)


