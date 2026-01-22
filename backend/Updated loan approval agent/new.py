import os
import json
import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File, Form
from dotenv import load_dotenv

# ──────────────────────────────────────────────
# Environment
# ──────────────────────────────────────────────
try:
    load_dotenv()
except Exception as e:
    print(f"Error loading .env: {str(e)}")
    raise RuntimeError("Failed to load .env")

try:
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY not found in .env")
except Exception as e:
    print(f"Error getting OPENROUTER_API_KEY: {str(e)}")
    raise

try:
    GRAPH_BASE = "https://graph.microsoft.com/v1.0"
except Exception as e:
    print(f"Error setting GRAPH_BASE: {str(e)}")
    raise

try:
    HOSTNAME = "aoscaustralia.sharepoint.com"
except Exception as e:
    print(f"Error setting HOSTNAME: {str(e)}")
    raise

try:
    SITE_PATH = "/sites/CPA"
except Exception as e:
    print(f"Error setting SITE_PATH: {str(e)}")
    raise

try:
    LIST_NAME = "Loan Application"
except Exception as e:
    print(f"Error setting LIST_NAME: {str(e)}")
    raise

try:
    LIBRARY_NAME = "LOAN APPROVALS"
except Exception as e:
    print(f"Error setting LIBRARY_NAME: {str(e)}")
    raise

try:
    DTI_THRESHOLD = 40  # percent
except Exception as e:
    print(f"Error setting DTI_THRESHOLD: {str(e)}")
    raise

# ──────────────────────────────────────────────
# FastAPI App
# ──────────────────────────────────────────────
try:
    app = FastAPI(title="AI Loan Approval Agent")
except Exception as e:
    print(f"Error creating FastAPI app: {str(e)}")
    raise

try:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],  # update for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
except Exception as e:
    print(f"Error adding CORS middleware: {str(e)}")
    raise

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────
def get_auth_headers(request: Request) -> dict:
    try:
        auth = request.headers.get("Authorization")
    except Exception as e:
        print(f"Error getting Authorization header: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

    try:
        if not auth or not auth.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid Bearer token")
    except Exception as e:
        print(f"Error validating Authorization: {str(e)}")
        raise

    try:
        return {
            "Authorization": auth,
            "Content-Type": "application/json"
        }
    except Exception as e:
        print(f"Error creating auth headers: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

try:
    REQUIRED_FIELDS = {
        "Title": "Full Name",
        "Email": "Email",
        "AnnualIncome": "Annual Income",
        "LoanAmount": "Loan Amount",
        "LoanPurpose": "Loan Purpose",
        "PreferredLoanTerm": "Preferred Loan Term",
        "BankAccountDetails": "Bank Account Details",
        "ExistingDebts": "Existing Debts",
        "Debt_x002d_to_x002d_IncomeRatio": "Debt-to-Income Ratio",
        "EmploymentStatus": "Employment Status",
        "CreditScore": "Credit Score",
        "LoanRequestStatus": "Loan Request Status",     # ← added (should be set by now)
    }
except Exception as e:
    print(f"Error setting REQUIRED_FIELDS: {str(e)}")
    raise

try:
    REQUIRED_DOCUMENTS = [
        "Property Details",
        "GST Filings",
        "Personal Tax Returns",
        "Loan Application Form",
        "Driver License",
        "Passport",
        "Proof of Employment"
    ]
except Exception as e:
    print(f"Error setting REQUIRED_DOCUMENTS: {str(e)}")
    raise

def analyze_documents_with_ai(uploaded_doc_names: list[str]) -> dict:
    try:
        prompt = f"""Required documents (all must be present and PDFs):
{', '.join(REQUIRED_DOCUMENTS)}

Uploaded files (check if they match required, are PDFs, and scan for potential fraud like mismatches or anomalies):
{', '.join(uploaded_doc_names) if uploaded_doc_names else "None"}

Return **JSON only** (no explanation, no markdown):
{{
  "missing_documents": ["list of missing required docs"],
  "non_pdf_documents": ["list of non-PDF files"],
  "fraud_risks": ["any suspicious issues, e.g., 'Document X appears altered'", "or empty array"]
}}
"""
    except Exception as e:
        print(f"Error creating prompt for AI document analysis: {str(e)}")
        raise HTTPException(500, "AI document analysis failed")

    try:
        res = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "openai/gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 300
            },
            timeout=45
        )
    except Exception as e:
        print(f"Error making AI request for document analysis: {str(e)}")
        raise HTTPException(500, f"AI document analysis failed: {str(e)}")

    try:
        res.raise_for_status()
    except Exception as e:
        print(f"Error in AI response status: {str(e)}")
        raise HTTPException(500, f"AI document analysis failed: {str(e)}")

    try:
        content = res.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Error parsing AI response: {str(e)}")
        raise HTTPException(500, f"AI document analysis failed: {str(e)}")

    try:
        content = content.strip().removeprefix("```json").removesuffix("```").strip()
    except Exception as e:
        print(f"Error stripping AI content: {str(e)}")
        raise HTTPException(500, f"AI document analysis failed: {str(e)}")

    try:
        return json.loads(content)
    except Exception as e:
        print(f"Error loading JSON from AI content: {str(e)}")
        raise HTTPException(500, f"AI document analysis failed: {str(e)}")


@app.post("/create-loan")
async def create_loan(request: Request):
    headers = get_auth_headers(request)

    try:
        payload = await request.json()
    except Exception as e:
        print(f"Error parsing request JSON: {str(e)}")
        raise HTTPException(400, "Invalid JSON payload")

    try:
        print("Incoming payload:", payload)
    except Exception as e:
        print(f"Error printing payload: {str(e)}")

    try:
        fields = {
            "Title": str(payload.get("Title", "")).strip(),
            "Email": payload.get("Email", ""),
            "AnnualIncome": float(payload.get("AnnualIncome", 0)),
            "LoanAmount": float(payload.get("LoanAmount", 0)),
            "LoanPurpose": payload.get("LoanPurpose", ""),
            "PreferredLoanTerm": payload.get("PreferredLoanTerm", ""),
            "BankAccountDetails": float(payload.get("BankAccountDetails", 0)),
            "ExistingDebts": float(payload.get("ExistingDebts", 0)),
            "Debt_x002d_to_x002d_IncomeRatio": "0",  # default - will be updated later
            "EmploymentStatus": payload.get("EmploymentStatus", ""),
            "CreditScore": str(payload.get("CreditScore", "")),
        }
    except Exception as e:
        print(f"Error creating fields dict: {str(e)}")
        raise HTTPException(400, "Invalid field values")

    try:
        if not fields["Title"]:
            raise HTTPException(400, "Title is required")
    except Exception as e:
        print(f"Error checking Title: {str(e)}")
        raise

    try:
        site_res = requests.get(f"{GRAPH_BASE}/sites/{HOSTNAME}:{SITE_PATH}", headers=headers)
    except Exception as e:
        print(f"Error getting site: {str(e)}")
        raise HTTPException(500, "Failed to resolve site")

    try:
        site_res.raise_for_status()
    except Exception as e:
        print(f"Error in site response: {str(e)}")
        raise HTTPException(site_res.status_code, site_res.text)

    try:
        site_id = site_res.json()["id"]
    except Exception as e:
        print(f"Error parsing site ID: {str(e)}")
        raise HTTPException(500, "Failed to parse site ID")

    try:
        lists_res = requests.get(f"{GRAPH_BASE}/sites/{site_id}/lists", headers=headers)
    except Exception as e:
        print(f"Error getting lists: {str(e)}")
        raise HTTPException(500, "Failed to get lists")

    try:
        lists_res.raise_for_status()
    except Exception as e:
        print(f"Error in lists response: {str(e)}")
        raise HTTPException(lists_res.status_code, lists_res.text)

    try:
        loan_list = next(
            (l for l in lists_res.json()["value"] if l["displayName"].lower() == LIST_NAME.lower()),
            None
        )
    except Exception as e:
        print(f"Error finding loan list: {str(e)}")
        raise HTTPException(500, "Failed to find loan list")

    try:
        if not loan_list:
            raise HTTPException(404, "Loan Application list not found")
    except Exception as e:
        print(f"Error checking loan list: {str(e)}")
        raise

    try:
        list_id = loan_list["id"]
    except Exception as e:
        print(f"Error getting list_id: {str(e)}")
        raise HTTPException(500, "Failed to get list ID")

    try:
        item_res = requests.post(
            f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items",
            headers=headers,
            json={"fields": fields}
        )
    except Exception as e:
        print(f"Error creating item: {str(e)}")
        raise HTTPException(500, "Failed to create item")

    try:
        print("Create item response:", item_res.text)
    except Exception as e:
        print(f"Error printing item response: {str(e)}")

    try:
        item_res.raise_for_status()
    except Exception as e:
        print(f"Error in item creation response: {str(e)}")
        raise HTTPException(item_res.status_code, item_res.text)

    try:
        item_id = item_res.json()["id"]
    except Exception as e:
        print(f"Error parsing item ID: {str(e)}")
        raise HTTPException(500, "Failed to parse item ID")

    try:
        drives_res = requests.get(f"{GRAPH_BASE}/sites/{site_id}/drives", headers=headers)
    except Exception as e:
        print(f"Error getting drives: {str(e)}")
        raise HTTPException(500, "Failed to get drives")

    try:
        drives_res.raise_for_status()
    except Exception as e:
        print(f"Error in drives response: {str(e)}")
        raise HTTPException(drives_res.status_code, drives_res.text)

    try:
        drive = next(
            (d for d in drives_res.json()["value"] if d["name"].lower() == LIBRARY_NAME.lower()),
            None
        )
    except Exception as e:
        print(f"Error finding drive: {str(e)}")
        raise HTTPException(500, "Failed to find drive")

    try:
        if not drive:
            raise HTTPException(404, f"Library '{LIBRARY_NAME}' not found")
    except Exception as e:
        print(f"Error checking drive: {str(e)}")
        raise

    try:
        drive_id = drive["id"]
    except Exception as e:
        print(f"Error getting drive ID: {str(e)}")
        raise HTTPException(500, "Failed to get drive ID")

    # Create main folder named with item_id
    try:
        main_folder_path = f"{item_id}"
        print(f"Creating main folder at path: {main_folder_path}")
    except Exception as e:
        print(f"Error setting main folder path: {str(e)}")
        raise HTTPException(500, "Failed to set main folder path")

    try:
        folder_res = requests.put(
            f"{GRAPH_BASE}/drives/{drive_id}/root:/{main_folder_path}:",
            headers=headers,
            json={"folder": {}, "@microsoft.graph.conflictBehavior": "replace"}
        )
    except Exception as e:
        print(f"Error creating main folder: {str(e)}")
        raise HTTPException(500, "Failed to create main folder")

    try:
        folder_res.raise_for_status()
    except Exception as e:
        print(f"Error in main folder creation response: {str(e)}")
        raise HTTPException(folder_res.status_code, folder_res.text)

    print(f"Main folder created successfully at: {main_folder_path}")

    # Create subfolders for each required document type inside the main folder
    for doc_name in REQUIRED_DOCUMENTS:
        try:
            subfolder_path = f"{main_folder_path}/{doc_name.replace(' ', '%20') if ' ' in doc_name else doc_name}"
            print(f"Creating subfolder at path: {subfolder_path}")
        except Exception as e:
            print(f"Error setting subfolder path for {doc_name}: {str(e)}")
            continue

        try:
            sub_res = requests.put(
                f"{GRAPH_BASE}/drives/{drive_id}/root:/{subfolder_path}:",
                headers=headers,
                json={"folder": {}, "@microsoft.graph.conflictBehavior": "replace"}
            )
        except Exception as e:
            print(f"Error creating subfolder {doc_name}: {str(e)}")
            continue

        try:
            sub_res.raise_for_status()
        except Exception as e:
            print(f"Error in subfolder creation response for {doc_name}: {str(e)}")
            continue

        print(f"Subfolder created successfully at: {subfolder_path}")

    try:
        return {
            "status": "created",
            "itemId": item_id,
            "uploadPath": main_folder_path
        }
    except Exception as e:
        print(f"Error returning create response: {str(e)}")
        raise HTTPException(500, "Failed to return response")


@app.post("/upload-loan-document/{item_id}")
async def upload_loan_document(item_id: str, request: Request, file: UploadFile = File(...), documentName: str = Form(...)):
    headers = get_auth_headers(request)
    try:
        headers.pop("Content-Type", None)
    except Exception as e:
        print(f"Error popping Content-Type from headers: {str(e)}")

    try:
        site_res = requests.get(f"{GRAPH_BASE}/sites/{HOSTNAME}:{SITE_PATH}", headers=headers)
    except Exception as e:
        print(f"Error getting site in upload: {str(e)}")
        raise HTTPException(500, "Failed to resolve site")

    try:
        site_res.raise_for_status()
    except Exception as e:
        print(f"Error in site response in upload: {str(e)}")
        raise HTTPException(site_res.status_code, site_res.text)

    try:
        site_id = site_res.json()["id"]
    except Exception as e:
        print(f"Error parsing site ID in upload: {str(e)}")
        raise HTTPException(500, "Failed to parse site ID")

    try:
        drives_res = requests.get(f"{GRAPH_BASE}/sites/{site_id}/drives", headers=headers)
    except Exception as e:
        print(f"Error getting drives in upload: {str(e)}")
        raise HTTPException(500, "Failed to get drives")

    try:
        drives_res.raise_for_status()
    except Exception as e:
        print(f"Error in drives response in upload: {str(e)}")
        raise HTTPException(drives_res.status_code, drives_res.text)

    try:
        drive = next((d for d in drives_res.json()["value"] if d["name"].lower() == LIBRARY_NAME.lower()), None)
    except Exception as e:
        print(f"Error finding drive in upload: {str(e)}")
        raise HTTPException(500, "Failed to find drive")

    try:
        if not drive:
            raise HTTPException(404, f"Library '{LIBRARY_NAME}' not found")
    except Exception as e:
        print(f"Error checking drive in upload: {str(e)}")
        raise

    try:
        drive_id = drive["id"]
    except Exception as e:
        print(f"Error getting drive ID in upload: {str(e)}")
        raise HTTPException(500, "Failed to get drive ID")

    try:
        file_bytes = await file.read()
    except Exception as e:
        print(f"Error reading file bytes: {str(e)}")
        raise HTTPException(500, "Failed to read file")

    try:
        if not file_bytes:
            raise HTTPException(400, "Empty file")
    except Exception as e:
        print(f"Error checking file bytes: {str(e)}")
        raise

    # Ensure documentName matches one of REQUIRED_DOCUMENTS (case-sensitive or normalize?)
    # For simplicity, assume frontend sends exact match, but to be safe, we can normalize spaces etc.
    try:
        documentName = documentName.strip().replace(" ", "%20") if " " in documentName else documentName  # Encode spaces if needed, but Graph handles spaces
    except Exception as e:
        print(f"Error normalizing documentName: {str(e)}")

    try:
        encoded_required = [d.replace(" ", "%20") if " " in d else d for d in REQUIRED_DOCUMENTS]
        if documentName not in encoded_required:
            print(f"Warning: documentName '{documentName}' does not match required documents")
            # Continue anyway, or raise? For now, continue but log
    except Exception as e:
        print(f"Error checking documentName against required: {str(e)}")

    try:
        upload_path = f"{item_id}/{documentName}/{file.filename.replace(' ', '%20') if ' ' in file.filename else file.filename}"
        print(f"Uploading document to path: {upload_path}")
    except Exception as e:
        print(f"Error setting upload path: {str(e)}")
        raise HTTPException(500, "Failed to set upload path")

    try:
        upload_url = f"{GRAPH_BASE}/drives/{drive_id}/root:/{upload_path}:/content"
        print(f"Upload URL: {upload_url}")
    except Exception as e:
        print(f"Error setting upload URL: {str(e)}")
        raise HTTPException(500, "Failed to set upload URL")

    try:
        upload_headers = {
            "Authorization": headers["Authorization"],
            "Content-Type": file.content_type or "application/octet-stream"
        }
    except Exception as e:
        print(f"Error creating upload headers: {str(e)}")
        raise HTTPException(500, "Failed to create upload headers")

    try:
        upload_res = requests.put(upload_url, headers=upload_headers, data=file_bytes)
    except Exception as e:
        print(f"Error uploading file: {str(e)}")
        raise HTTPException(500, "Failed to upload file")

    try:
        if not upload_res.ok:
            print(f"Upload failed with status: {upload_res.status_code}, text: {upload_res.text}")
            raise HTTPException(upload_res.status_code, upload_res.text)
    except Exception as e:
        print(f"Error checking upload response: {str(e)}")
        raise

    print(f"Document uploaded successfully to: {upload_path}")

    try:
        return {"status": "uploaded", "fileName": file.filename, "path": upload_path}
    except Exception as e:
        print(f"Error returning upload response: {str(e)}")
        raise HTTPException(500, "Failed to return response")












@app.post("/upload-loan-document/{item_id}")
async def upload_loan_document(item_id: str, request: Request, file: UploadFile = File(...), documentName: str = Form(...)):
    headers = get_auth_headers(request)
    
    # Get SharePoint site details
    site_res = requests.get(f"{GRAPH_BASE}/sites/{HOSTNAME}:{SITE_PATH}", headers=headers)
    if site_res.status_code != 200:
        raise HTTPException(status_code=site_res.status_code, detail="Failed to resolve SharePoint site")
    
    site_id = site_res.json()["id"]
    
    # Get drives (libraries) for SharePoint site
    drives_res = requests.get(f"{GRAPH_BASE}/sites/{site_id}/drives", headers=headers)
    if drives_res.status_code != 200:
        raise HTTPException(status_code=drives_res.status_code, detail="Failed to get drives")

    drive = next((d for d in drives_res.json()["value"] if d["name"].lower() == LIBRARY_NAME.lower()), None)
    if not drive:
        raise HTTPException(404, detail=f"Library '{LIBRARY_NAME}' not found")
    
    drive_id = drive["id"]
    
    # Prepare the upload URL
    upload_path = f"{item_id}/{documentName}/{file.filename.replace(' ', '%20') if ' ' in file.filename else file.filename}"
    upload_url = f"{GRAPH_BASE}/drives/{drive_id}/root:/{upload_path}:/content"
    
    # Upload file to SharePoint
    try:
        upload_res = requests.put(upload_url, headers={"Authorization": headers["Authorization"], "Content-Type": file.content_type or "application/octet-stream"}, data=await file.read())
        if upload_res.status_code != 200:
            raise HTTPException(status_code=upload_res.status_code, detail=f"Upload failed: {upload_res.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")
    
    return {"status": "uploaded", "fileName": file.filename, "path": upload_path}
















@app.post("/validate-loan/{item_id}")
async def validate_loan(request: Request, item_id: str):
    headers = get_auth_headers(request)
    steps = []

    def add_step(name: str, status: str, detail: str = ""):
        try:
            steps.append({"name": name, "status": status, "detail": detail})
        except Exception as e:
            print(f"Error adding step: {str(e)}")

    try:
        # 1. Resolve site
        add_step("Resolve site", "running")
        site_res = requests.get(f"{GRAPH_BASE}/sites/{HOSTNAME}:{SITE_PATH}", headers=headers)
    except Exception as e:
        add_step("Resolve site", "fail", str(e))
        print(f"Error resolving site: {str(e)}")
        raise HTTPException(500, "Failed to resolve site")

    try:
        site_res.raise_for_status()
    except Exception as e:
        add_step("Resolve site", "fail", str(e))
        print(f"Error in site response: {str(e)}")
        raise HTTPException(site_res.status_code, site_res.text)

    try:
        site_id = site_res.json()["id"]
    except Exception as e:
        add_step("Resolve site", "fail", str(e))
        print(f"Error parsing site ID: {str(e)}")
        raise HTTPException(500, "Failed to parse site ID")

    add_step("Resolve site", "done")

    # 2. Find list
    try:
        lists_res = requests.get(f"{GRAPH_BASE}/sites/{site_id}/lists", headers=headers).json()["value"]
    except Exception as e:
        add_step("Find list", "fail", str(e))
        print(f"Error getting lists: {str(e)}")
        raise HTTPException(500, "Failed to get lists")

    try:
        loan_list = next((l for l in lists_res if l["displayName"].lower() == LIST_NAME.lower()), None)
    except Exception as e:
        add_step("Find list", "fail", str(e))
        print(f"Error finding loan list: {str(e)}")
        raise HTTPException(500, "Failed to find loan list")

    try:
        if not loan_list:
            raise ValueError("Loan list not found")
    except Exception as e:
        add_step("Find list", "fail", str(e))
        print(f"Error checking loan list: {str(e)}")
        raise HTTPException(404, "Loan list not found")

    try:
        list_id = loan_list["id"]
    except Exception as e:
        add_step("Find list", "fail", str(e))
        print(f"Error getting list ID: {str(e)}")
        raise HTTPException(500, "Failed to get list ID")

    # 3. Find drive
    try:
        drives_res = requests.get(f"{GRAPH_BASE}/sites/{site_id}/drives", headers=headers).json()["value"]
    except Exception as e:
        add_step("Find drive", "fail", str(e))
        print(f"Error getting drives: {str(e)}")
        raise HTTPException(500, "Failed to get drives")

    try:
        drive = next((d for d in drives_res if d["name"].lower() == LIBRARY_NAME.lower()), None)
    except Exception as e:
        add_step("Find drive", "fail", str(e))
        print(f"Error finding drive: {str(e)}")
        raise HTTPException(500, "Failed to find drive")

    try:
        if not drive:
            raise ValueError(f"Drive/Library '{LIBRARY_NAME}' not found")
    except Exception as e:
        add_step("Find drive", "fail", str(e))
        print(f"Error checking drive: {str(e)}")
        raise HTTPException(404, f"Drive/Library '{LIBRARY_NAME}' not found")

    try:
        drive_id = drive["id"]
    except Exception as e:
        add_step("Find drive", "fail", str(e))
        print(f"Error getting drive ID: {str(e)}")
        raise HTTPException(500, "Failed to get drive ID")

    # 4. Fetch initial loan application
    try:
        add_step("Fetch loan application", "running")
        item_res = requests.get(
            f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items/{item_id}?expand=fields",
            headers=headers
        )
    except Exception as e:
        add_step("Fetch loan application", "fail", str(e))
        print(f"Error fetching item: {str(e)}")
        raise HTTPException(500, "Failed to fetch loan application")

    try:
        item_res.raise_for_status()
    except Exception as e:
        add_step("Fetch loan application", "fail", str(e))
        print(f"Error in item response: {str(e)}")
        raise HTTPException(item_res.status_code, item_res.text)

    try:
        fields = item_res.json()["fields"]
    except Exception as e:
        add_step("Fetch loan application", "fail", str(e))
        print(f"Error parsing fields: {str(e)}")
        raise HTTPException(500, "Failed to parse fields")

    add_step("Fetch loan application", "done")

    # 5. Fetch documents (from subfolders)
    try:
        add_step("Fetch documents", "running")
        doc_names = []  # List of PDF names
        non_pdf = []
        main_folder = f"{item_id}"
    except Exception as e:
        add_step("Fetch documents", "fail", str(e))
        print(f"Error setting up document fetch: {str(e)}")
        raise HTTPException(500, "Failed to set up document fetch")

    for doc_name in REQUIRED_DOCUMENTS:
        try:
            subfolder_path = f"{main_folder}/{doc_name.replace(' ', '%20') if ' ' in doc_name else doc_name}"
            print(f"Fetching documents from subfolder: {subfolder_path}")
        except Exception as e:
            print(f"Error setting subfolder path for fetch {doc_name}: {str(e)}")
            continue

        try:
            docs_res = requests.get(
                f"{GRAPH_BASE}/drives/{drive_id}/root:/{subfolder_path}:/children",
                headers=headers
            )
        except Exception as e:
            print(f"Error getting children for {subfolder_path}: {str(e)}")
            add_step("Fetch documents", "fail", f"Failed for {doc_name}: {str(e)}")
            continue

        try:
            if docs_res.status_code == 404:
                add_step("Fetch documents", "fail", f"Subfolder {doc_name} not found")
                print(f"Subfolder not found: {subfolder_path}")
                continue
        except Exception as e:
            print(f"Error checking status for {subfolder_path}: {str(e)}")
            continue

        try:
            docs_res.raise_for_status()
        except Exception as e:
            print(f"Error in docs response for {subfolder_path}: {str(e)}")
            continue

        try:
            docs = docs_res.json().get("value", [])
        except Exception as e:
            print(f"Error parsing docs for {subfolder_path}: {str(e)}")
            continue

        for d in docs:
            try:
                if d.get("file", {}).get("mimeType") == "application/pdf":
                    doc_names.append(d["name"])
                else:
                    non_pdf.append(d["name"])
            except Exception as e:
                print(f"Error checking file type for {d.get('name')}: {str(e)}")

    try:
        add_step("Fetch documents", "done", f"{len(doc_names)} PDF files found")
    except Exception as e:
        print(f"Error adding fetch documents step: {str(e)}")

    # 6. AI document analysis
    try:
        ai_result = analyze_documents_with_ai(doc_names)
    except Exception as e:
        add_step("AI document analysis", "fail", str(e))
        print(f"Error in AI document analysis: {str(e)}")
        raise HTTPException(500, "AI document analysis failed")

    # 7. AI loan decision
    try:
        add_step("AI loan decision", "running")
        ai_prompt = f"""You are an underwriting validator. Follow the rules strictly.

Decision must be only: "Approved" or "Not Approved"

Rules:
- DTI = (ExistingDebts / AnnualIncome) * 100   (if AnnualIncome=0 → DTI=0 and Not Approved)
- If DTI > {DTI_THRESHOLD} → Not Approved
- All required documents must be present → else Not Approved
- Any fraud risk → Not Approved

Input data:
AnnualIncome: {fields.get("AnnualIncome", 0)}
ExistingDebts: {fields.get("ExistingDebts", 0)}
MissingRequiredFields: {', '.join([v for k,v in REQUIRED_FIELDS.items() if not fields.get(k)]) or "None"}
Uploaded PDFs: {', '.join(doc_names) or "None"}
Non-PDF files: {', '.join(non_pdf) or "None"}
AI Missing Docs: {', '.join(ai_result.get("missing_documents", [])) or "None"}
AI Fraud Risks: {', '.join(ai_result.get("fraud_risks", [])) or "None"}

Return JSON only:
{{
  "decision": "Approved" or "Not Approved",
  "reason_of_status": "multi-line text explanation",
  "calculated_dti": number
}}
"""
    except Exception as e:
        add_step("AI loan decision", "fail", str(e))
        print(f"Error creating AI prompt: {str(e)}")
        raise HTTPException(500, "Failed to create AI prompt")

    try:
        ai_res = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "openai/gpt-4o-mini",
                "messages": [{"role": "user", "content": ai_prompt}],
                "temperature": 0.1,
                "max_tokens": 450
            },
            timeout=45
        )
    except Exception as e:
        add_step("AI loan decision", "fail", str(e))
        print(f"Error making AI request: {str(e)}")
        raise HTTPException(500, "AI loan decision failed")

    try:
        ai_res.raise_for_status()
    except Exception as e:
        add_step("AI loan decision", "fail", str(e))
        print(f"Error in AI response: {str(e)}")
        raise HTTPException(ai_res.status_code, ai_res.text)

    try:
        content = ai_res.json()["choices"][0]["message"]["content"].strip().removeprefix("```json").removesuffix("```").strip()
    except Exception as e:
        add_step("AI loan decision", "fail", str(e))
        print(f"Error parsing AI content: {str(e)}")
        raise HTTPException(500, "Failed to parse AI content")

    try:
        ai_json = json.loads(content)
    except Exception as e:
        add_step("AI loan decision", "fail", str(e))
        print(f"Error loading AI JSON: {str(e)}")
        raise HTTPException(500, "Failed to load AI JSON")

    try:
        decision = ai_json.get("decision", "Not Approved")
    except Exception as e:
        print(f"Error getting decision: {str(e)}")
        decision = "Not Approved"

    try:
        reason_of_status = ai_json.get("reason_of_status", "Review\nNo reason provided by AI.").strip()
    except Exception as e:
        print(f"Error getting reason_of_status: {str(e)}")
        reason_of_status = "Review\nNo reason provided by AI."

    try:
        dti = float(ai_json.get("calculated_dti", 0.0))
    except Exception as e:
        print(f"Error getting dti: {str(e)}")
        dti = 0.0

    try:
        if decision not in ["Approved", "Not Approved"]:
            decision = "Not Approved"
    except Exception as e:
        print(f"Error validating decision: {str(e)}")

    try:
        if decision == "Not Approved" and not reason_of_status.lower().startswith("review"):
            reason_of_status = "Review\n" + reason_of_status
    except Exception as e:
        print(f"Error updating reason_of_status: {str(e)}")

    try:
        add_step("AI loan decision", "done", f"{decision} | DTI: {dti}%")
    except Exception as e:
        print(f"Error adding AI decision step: {str(e)}")

    # 8. Update SharePoint
    try:
        patch_res = requests.patch(
            f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items/{item_id}/fields",
            headers=headers,
            json={
                "LoanRequestStatus": decision,
                "ReasonofStatus": reason_of_status,
                "Debt_x002d_to_x002d_IncomeRatio": str(dti)   # save as string (column is text)
            }
        )
    except Exception as e:
        add_step("Update status in SharePoint", "fail", str(e))
        print(f"Error patching item: {str(e)}")
        raise HTTPException(500, "Failed to update SharePoint")

    try:
        patch_res.raise_for_status()
    except Exception as e:
        add_step("Update status in SharePoint", "fail", str(e))
        print(f"Error in patch response: {str(e)}")
        raise HTTPException(patch_res.status_code, patch_res.text)

    add_step("Update status in SharePoint", "done")

    # ── IMPORTANT: Re-fetch the item to get updated fields ──
    try:
        add_step("Re-fetch updated application", "running")
        updated_item_res = requests.get(
            f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items/{item_id}?expand=fields",
            headers=headers
        )
    except Exception as e:
        add_step("Re-fetch updated application", "fail", str(e))
        print(f"Error re-fetching item: {str(e)}")
        raise HTTPException(500, "Failed to re-fetch updated application")

    try:
        updated_item_res.raise_for_status()
    except Exception as e:
        add_step("Re-fetch updated application", "fail", str(e))
        print(f"Error in updated item response: {str(e)}")
        raise HTTPException(updated_item_res.status_code, updated_item_res.text)

    try:
        updated_fields = updated_item_res.json()["fields"]
    except Exception as e:
        add_step("Re-fetch updated application", "fail", str(e))
        print(f"Error parsing updated fields: {str(e)}")
        raise HTTPException(500, "Failed to parse updated fields")

    add_step("Re-fetch updated application", "done")

    # 9. NOW perform required fields check (after everything is done)
    try:
        add_step("Required fields check (final)", "running")
        missing_fields = [
            label 
            for key, label in REQUIRED_FIELDS.items() 
            if not updated_fields.get(key)
        ]
    except Exception as e:
        add_step("Required fields check (final)", "fail", str(e))
        print(f"Error checking missing fields: {str(e)}")
        raise HTTPException(500, "Failed required fields check")

    try:
        if missing_fields:
            add_step("Required fields check (final)", "fail", f"Missing: {', '.join(missing_fields)}")
        else:
            add_step("Required fields check (final)", "done", "All required fields present")
    except Exception as e:
        print(f"Error adding required fields step: {str(e)}")

    # Return result
    try:
        return {
            "loan_decision": decision,
            "reason_of_status": reason_of_status,
            "steps": steps,
            "missing_fields": missing_fields,
            "missing_documents": ai_result.get("missing_documents", []),
            "fraud_risks": ai_result.get("fraud_risks", []),
            "non_pdf_documents": non_pdf,
            "documents_found": doc_names,
            "dti_value": dti,
            "dti_threshold": DTI_THRESHOLD
        }
    except Exception as e:
        print(f"Error returning validate response: {str(e)}")
        raise HTTPException(500, "Failed to return response")


@app.get("/health")
async def health():
    try:
        return {"status": "AI Loan Approval Agent is running"}
    except Exception as e:
        print(f"Error in health check: {str(e)}")
        raise HTTPException(500, "Health check failed")