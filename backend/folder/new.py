# import requests
# from flask import Flask, jsonify, request
# from flask_cors import CORS  # <--- NEW IMPORT

# app = Flask(__name__)
# CORS(app)  # <--- THIS ENABLES THE CONNECTION

# GRAPH_BASE = "https://graph.microsoft.com/v1.0"

# HOSTNAME = "aoscaustralia.sharepoint.com"
# SITE_PATH = "/sites/CPA"

# # --------------------------------------------------
# # Helper: Get Delegated User Token
# # --------------------------------------------------
# def get_headers():
#     auth = request.headers.get("Authorization")
#     if not auth or not auth.startswith("Bearer "):
#         return None

#     return {
#         "Authorization": auth,
#         "Content-Type": "application/json"
#     }

# # --------------------------------------------------
# # STEP 1: Resolve SharePoint Site
# # --------------------------------------------------
# @app.route("/sharepoint/site", methods=["GET"])
# def get_site():
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/sites/{HOSTNAME}:{SITE_PATH}"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     site = res.json()
#     return jsonify({
#         "site_id": site["id"],
#         "displayName": site["displayName"],
#         "webUrl": site["webUrl"]
#     })

# # --------------------------------------------------
# # STEP 2: Get Lists
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/lists", methods=["GET"])
# def get_lists(site_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/sites/{site_id}/lists"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     lists = [{
#         "list_id": lst["id"],
#         "displayName": lst.get("displayName"),
#         "template": lst.get("list", {}).get("template")
#     } for lst in res.json().get("value", [])]

#     return jsonify(lists)

# # --------------------------------------------------
# # STEP 3: Get List Items
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/lists/<list_id>/items", methods=["GET"])
# def get_list_items(site_id, list_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items?expand=fields"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     return jsonify(res.json().get("value", []))

# # --------------------------------------------------
# # STEP 4: UPSERT ITEM (With "Prefer" Header Fix)
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/lists/<list_id>/items", methods=["POST"])
# def upsert_list_item(site_id, list_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     body = request.get_json()
#     if not body or "fields" not in body:
#         return jsonify({"error": "fields object required"}), 400

#     fields = body["fields"]
#     email = fields.get("EmailAddress")
    
#     if not email:
#         return jsonify({"error": "EmailAddress is required to check for existing profile"}), 400

#     # ✅ THE FIX: Add this special header to allow searching by Email
#     search_headers = headers.copy()
#     search_headers["Prefer"] = "HonorNonIndexedQueriesWarningMayFailRandomly"

#     # Search for existing user by Email
#     search_url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items?expand=fields&$filter=fields/EmailAddress eq '{email}'"
    
#     # Note: We use 'search_headers' here instead of just 'headers'
#     search_res = requests.get(search_url, headers=search_headers)
    
#     if not search_res.ok:
#         return jsonify({"error": "Failed to search list", "details": search_res.text}), 500

#     search_data = search_res.json()
#     existing_items = search_data.get("value", [])

#     # Cleanup system fields
#     for f in ["PercentComplete", "LastUpdated", "Created", "Modified", "ID", "Author", "Editor"]:
#         fields.pop(f, None)

#     if len(existing_items) > 0:
#         # --- UPDATE (PATCH) ---
#         item_id = existing_items[0]["id"]
#         print(f"🔄 Found existing profile (ID: {item_id}). Updating...")
#         update_url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items/{item_id}/fields"
#         update_res = requests.patch(update_url, headers=headers, json=fields)
#         if not update_res.ok:
#             return jsonify({"error": "Failed to update item", "details": update_res.text}), 500
#         return jsonify({"status": "Updated", "id": item_id, "fields": fields}), 200

#     else:
#         # --- CREATE (POST) ---
#         print("🆕 No profile found. Creating new...")
#         create_url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items"
#         create_res = requests.post(create_url, headers=headers, json={"fields": fields})
#         if not create_res.ok:
#             return jsonify({"error": "Failed to create item", "details": create_res.text}), 500
#         return jsonify(create_res.json()), 201
    




# # --------------------------------------------------
# # STEP 5: Get Document Libraries
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/libraries", methods=["GET"])
# def get_libraries(site_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/sites/{site_id}/drives"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     libraries = [
#         d for d in res.json().get("value", [])
#         if d.get("driveType") == "documentLibrary"
#     ]

#     return jsonify(libraries)

# # --------------------------------------------------
# # STEP 6: Get Documents
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/libraries/<drive_id>/documents", methods=["GET"])
# def get_documents(site_id, drive_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/drives/{drive_id}/root/children"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     return jsonify(res.json().get("value", []))

# # --------------------------------------------------
# # STEP 7: Upload Document
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/libraries/<drive_id>/upload", methods=["POST"])
# def upload_document(site_id, drive_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     if "file" not in request.files:
#         return jsonify({"error": "No file provided"}), 400

#     file = request.files["file"]

#     upload_url = f"{GRAPH_BASE}/drives/{drive_id}/root:/{file.filename}:/content"

#     upload_headers = {
#         "Authorization": headers["Authorization"],
#         "Content-Type": file.content_type or "application/octet-stream"
#     }

#     res = requests.put(upload_url, headers=upload_headers, data=file.read())

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     return jsonify(res.json())

# # --------------------------------------------------
# # STEP 8: Get Users (People Picker)
# # --------------------------------------------------
# @app.route("/graph/users", methods=["GET"])
# def graph_get_users():
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/users?$select=displayName,mail,userPrincipalName"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     users = []
#     for u in res.json().get("value", []):
#         email = u.get("mail") or u.get("userPrincipalName")
#         if not email:
#             continue

#         users.append({
#             "displayName": u["displayName"],
#             "email": email,
#             "claims": f"i:0#.f|membership|{email}"
#         })

#     return jsonify(users)

# # --------------------------------------------------
# # HEALTH
# # --------------------------------------------------
# @app.route("/health", methods=["GET"])
# def health():
#     return jsonify({"status": "Delegated SharePoint API running"})


# # --------------------------------------------------
# # VALIDATE DOCUMENT (Regulatory Agent Integration)
# # --------------------------------------------------
# @app.route("/analyze-document", methods=["POST"])
# def analyze_document():
#     # CASE 1: File uploaded from UI
#     if "file" in request.files:
#         file = request.files["file"]

#         files = {
#             "file": (file.filename, file.stream, file.mimetype)
#         }

#         res = requests.post(
#             "http://127.0.0.1:9002/analyze-document",
#             files=files
#         )

#         return jsonify(res.json()), res.status_code

#     # CASE 2: Existing SharePoint document
#     data = request.json
#     document_id = data.get("documentId")
#     access_token = data.get("accessToken")

#     if not document_id or not access_token:
#         return jsonify({"error": "documentId and accessToken required"}), 400

#     # Download document from SharePoint
#     download_url = f"{GRAPH_BASE}/drives/{{DRIVE_ID}}/items/{document_id}/content"

#     file_res = requests.get(
#         download_url,
#         headers={"Authorization": f"Bearer {access_token}"}
#     )

#     if not file_res.ok:
#         return jsonify({"error": "Failed to download document"}), 500

#     # Send file to regulatory agent
#     files = {
#         "file": ("document.docx", file_res.content)
#     }

#     agent_res = requests.post(
#         "http://127.0.0.1:9002/analyze-document",
#         files=files
#     )

#     return jsonify(agent_res.json()), agent_res.status_code


# # --------------------------------------------------
# # RUN
# # --------------------------------------------------
# if __name__ == "__main__":
#     print("🚀 Backend running on http://localhost:5050")
#     app.run(host="127.0.0.1", port=5050, debug=False)








# --------------new----------------------#

# import requests
# from flask import Flask, jsonify, request

# app = Flask(__name__)

# GRAPH_BASE = "https://graph.microsoft.com/v1.0"

# HOSTNAME = "aoscaustralia.sharepoint.com"
# SITE_PATH = "/sites/CPA"

# # --------------------------------------------------
# # Helper: Get Delegated User Token
# # --------------------------------------------------
# def get_headers():
#     auth = request.headers.get("Authorization")
#     if not auth or not auth.startswith("Bearer "):
#         return None

#     return {
#         "Authorization": auth,
#         "Content-Type": "application/json"
#     }

# # --------------------------------------------------
# # STEP 1: Resolve SharePoint Site
# # --------------------------------------------------
# @app.route("/sharepoint/site", methods=["GET"])
# def get_site():
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/sites/{HOSTNAME}:{SITE_PATH}"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     site = res.json()
#     return jsonify({
#         "site_id": site["id"],
#         "displayName": site["displayName"],
#         "webUrl": site["webUrl"]
#     })

# # --------------------------------------------------
# # STEP 2: Get Lists
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/lists", methods=["GET"])
# def get_lists(site_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/sites/{site_id}/lists"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     lists = [{
#         "list_id": lst["id"],
#         "displayName": lst.get("displayName"),
#         "template": lst.get("list", {}).get("template")
#     } for lst in res.json().get("value", [])]

#     return jsonify(lists)

# # --------------------------------------------------
# # STEP 3: Get List Items
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/lists/<list_id>/items", methods=["GET"])
# def get_list_items(site_id, list_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items?expand=fields"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     return jsonify(res.json().get("value", []))

# # --------------------------------------------------
# # STEP 3.5: Get List Columns
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/lists/<list_id>/columns", methods=["GET"])
# def get_list_columns(site_id, list_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/columns"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({
#             "error": "Graph API error",
#             "details": res.text
#         }), res.status_code

#     return jsonify(res.json())

# # --------------------------------------------------
# # STEP 4: Create List Item (POST)
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/lists/<list_id>/items", methods=["POST"])
# def create_list_item(site_id, list_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     body = request.get_json()
#     if not body or "fields" not in body:
#         return jsonify({"error": "fields object required"}), 400

#     fields = body["fields"]

#     # Remove ONLY true read-only system fields (PercentComplete is writable!)
#     system_fields = ["LastUpdated", "Created", "Modified", "Author", "Editor"]
#     for f in system_fields:
#         fields.pop(f, None)

#     # Validate AssignedStaff format
#     if "AssignedStaff" in fields:
#         staff = fields["AssignedStaff"]
#         if not isinstance(staff, dict) or "claims" not in staff:
#             return jsonify({
#                 "error": "AssignedStaff must be a single claims object: {claims: 'i:0#.f|membership|email@domain.com'}"
#             }), 400

#     print("POSTING FIELDS TO GRAPH:", fields)

#     url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items"
#     res = requests.post(url, headers=headers, json={"fields": fields})

#     if not res.ok:
#         return jsonify({
#             "error": "Graph API error",
#             "details": res.text
#         }), res.status_code

#     return jsonify(res.json()), 201

# # --------------------------------------------------
# # STEP 4.5: Update List Item (PATCH)
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/lists/<list_id>/items/<item_id>", methods=["PATCH"])
# def update_list_item(site_id, list_id, item_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     body = request.get_json()
#     if not body or "fields" not in body:
#         return jupytext({"error": "fields object required"}), 400

#     fields = body["fields"]

#     # Remove ONLY true read-only system fields (PercentComplete is writable!)
#     system_fields = ["LastUpdated", "Created", "Modified", "Author", "Editor"]
#     for f in system_fields:
#         fields.pop(f, None)

#     # Validate AssignedStaff format
#     if "AssignedStaff" in fields:
#         staff = fields["AssignedStaff"]
#         if not isinstance(staff, dict) or "claims" not in staff:
#             return jsonify({
#                 "error": "AssignedStaff must be a single claims object"
#             }), 400

#     print("PATCHING FIELDS TO GRAPH:", fields)

#     url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items/{item_id}/fields"
#     res = requests.patch(url, headers=headers, json=fields)

#     if not res.ok:
#         return jsonify({
#             "error": "Graph API error",
#             "details": res.text
#         }), res.status_code

#     return jsonify(res.json())

# # --------------------------------------------------
# # STEP 5: Get Document Libraries
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/libraries", methods=["GET"])
# def get_libraries(site_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/sites/{site_id}/drives"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     libraries = [
#         d for d in res.json().get("value", [])
#         if d.get("driveType") == "documentLibrary"
#     ]

#     return jsonify(libraries)

# # --------------------------------------------------
# # STEP 6: Get Documents
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/libraries/<drive_id>/documents", methods=["GET"])
# def get_documents(site_id, drive_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/drives/{drive_id}/root/children"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     return jsonify(res.json().get("value", []))

# # --------------------------------------------------
# # STEP 7: Upload Document
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/libraries/<drive_id>/upload", methods=["POST"])
# def upload_document(site_id, drive_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     if "file" not in request.files:
#         return jsonify({"error": "No file provided"}), 400

#     file = request.files["file"]

#     upload_url = f"{GRAPH_BASE}/drives/{drive_id}/root:/{file.filename}:/content"

#     upload_headers = {
#         "Authorization": headers["Authorization"],
#         "Content-Type": file.content_type or "application/octet-stream"
#     }

#     res = requests.put(upload_url, headers=upload_headers, data=file.read())

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     return jsonify(res.json())

# # --------------------------------------------------
# # STEP 8: Get Users (People Picker)
# # --------------------------------------------------
# @app.route("/graph/users", methods=["GET"])
# def graph_get_users():
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/users?$select=displayName,mail,userPrincipalName"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     users = []
#     for u in res.json().get("value", []):
#         email = u.get("mail") or u.get("userPrincipalName")
#         if not email:
#             continue

#         users.append({
#             "displayName": u["displayName"],
#             "email": email,
#             "claims": f"i:0#.f|membership|{email}"
#         })

#     return jsonify(users)

# # --------------------------------------------------
# # HEALTH
# # --------------------------------------------------
# @app.route("/health", methods=["GET"])
# def health():
#     return jsonify({"status": "Delegated SharePoint API running"})

# # --------------------------------------------------
# # NEW ENDPOINT: Get Loan Application by Item ID
# # --------------------------------------------------
# @app.route("/loan/<item_id>", methods=["GET"])
# def get_loan_application(item_id):
#     """
#     Fetch a specific loan application by item ID from SharePoint.
#     """
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     try:
#         # Resolve site
#         site_url = f"{GRAPH_BASE}/sites/{HOSTNAME}:{SITE_PATH}"
#         site_res = requests.get(site_url, headers=headers)
#         if not site_res.ok:
#             return jsonify({"error": "Failed to resolve site", "details": site_res.text}), site_res.status_code
#         site_id = site_res.json()["id"]

#         # Resolve list
#         lists_url = f"{GRAPH_BASE}/sites/{site_id}/lists"
#         lists_res = requests.get(lists_url, headers=headers)
#         if not lists_res.ok:
#             return jsonify({"error": "Failed to get lists", "details": lists_res.text}), lists_res.status_code
#         loan_list = next(
#             (l for l in lists_res.json()["value"] if l["displayName"].lower() == "loan application".lower()),
#             None,
#         )
#         if not loan_list:
#             return jsonify({"error": "List 'Loan Application' not found"}), 404
#         list_id = loan_list["id"]

#         # Fetch loan application
#         item_url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items/{item_id}?expand=fields"
#         item_res = requests.get(item_url, headers=headers)
#         if not item_res.ok:
#             return jsonify({"error": "Failed to fetch loan item", "details": item_res.text}), item_res.status_code

#         return jsonify(item_res.json()["fields"])

#     except Exception as e:
#         return jsonify({"error": f"Failed to fetch loan: {str(e)}"}), 500

# # --------------------------------------------------
# # RUN
# # --------------------------------------------------
# if __name__ == "__main__":
#     print("🚀 Backend running on http://localhost:5050")
#     app.run(host="127.0.0.1", port=5050, debug=False)




    




# import requests
# from flask import Flask, jsonify, request
# # from flask_cors import CORS  # <--- NEW IMPORT
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware


# # app = Flask(__name__)
# # CORS(app)  # <--- THIS ENABLES THE CONNECTION

# app = FastAPI()

# # Very permissive — good for local dev only!
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:3000",
#         "http://127.0.0.1:3000",
#         "http://localhost:5050",     # sometimes Next.js dev server
#         "*"                          # ← temporary nuclear option
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],             # allow POST, OPTIONS, etc.
#     allow_headers=["*"],
# )

# GRAPH_BASE = "https://graph.microsoft.com/v1.0"

# HOSTNAME = "aoscaustralia.sharepoint.com"
# SITE_PATH = "/sites/CPA"

# # --------------------------------------------------
# # Helper: Get Delegated User Token
# # --------------------------------------------------
# def get_headers():
#     auth = request.headers.get("Authorization")
#     if not auth or not auth.startswith("Bearer "):
#         return None

#     return {
#         "Authorization": auth,
#         "Content-Type": "application/json"
#     }

# # --------------------------------------------------
# # STEP 1: Resolve SharePoint Site
# # --------------------------------------------------
# @app.route("/sharepoint/site", methods=["GET"])
# def get_site():
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/sites/{HOSTNAME}:{SITE_PATH}"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     site = res.json()
#     return jsonify({
#         "site_id": site["id"],
#         "displayName": site["displayName"],
#         "webUrl": site["webUrl"]
#     })

# # --------------------------------------------------
# # STEP 2: Get Lists
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/lists", methods=["GET"])
# def get_lists(site_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/sites/{site_id}/lists"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     lists = [{
#         "list_id": lst["id"],
#         "displayName": lst.get("displayName"),
#         "template": lst.get("list", {}).get("template")
#     } for lst in res.json().get("value", [])]

#     return jsonify(lists)

# # --------------------------------------------------
# # STEP 3: Get List Items
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/lists/<list_id>/items", methods=["GET"])
# def get_list_items(site_id, list_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items?expand=fields"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     return jsonify(res.json().get("value", []))

# # --------------------------------------------------
# # STEP 3.5: Get List Columns
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/lists/<list_id>/columns", methods=["GET"])
# def get_list_columns(site_id, list_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/columns"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({
#             "error": "Graph API error",
#             "details": res.text
#         }), res.status_code

#     return jsonify(res.json())

# # --------------------------------------------------
# # STEP 4: Create List Item (POST)
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/lists/<list_id>/items", methods=["POST"])
# def create_list_item(site_id, list_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     body = request.get_json()
#     if not body or "fields" not in body:
#         return jsonify({"error": "fields object required"}), 400

#     fields = body["fields"]

#     # Remove ONLY true read-only system fields (PercentComplete is writable!)
#     system_fields = ["LastUpdated", "Created", "Modified", "Author", "Editor"]
#     for f in system_fields:
#         fields.pop(f, None)

#     # Validate AssignedStaff format
#     if "AssignedStaff" in fields:
#         staff = fields["AssignedStaff"]
#         if not isinstance(staff, dict) or "claims" not in staff:
#             return jsonify({
#                 "error": "AssignedStaff must be a single claims object: {claims: 'i:0#.f|membership|email@domain.com'}"
#             }), 400

#     print("POSTING FIELDS TO GRAPH:", fields)

#     url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items"
#     res = requests.post(url, headers=headers, json={"fields": fields})

#     if not res.ok:
#         return jsonify({
#             "error": "Graph API error",
#             "details": res.text
#         }), res.status_code

#     return jsonify(res.json()), 201

# # --------------------------------------------------
# # STEP 4.5: Update List Item (PATCH)
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/lists/<list_id>/items/<item_id>", methods=["PATCH"])
# def update_list_item(site_id, list_id, item_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     body = request.get_json()
#     if not body or "fields" not in body:
#         return jsonify({"error": "fields object required"}), 400

#     fields = body["fields"]

#     # Remove ONLY true read-only system fields (PercentComplete is writable!)
#     system_fields = ["LastUpdated", "Created", "Modified", "Author", "Editor"]
#     for f in system_fields:
#         fields.pop(f, None)

#     # Validate AssignedStaff format
#     if "AssignedStaff" in fields:
#         staff = fields["AssignedStaff"]
#         if not isinstance(staff, dict) or "claims" not in staff:
#             return jsonify({
#                 "error": "AssignedStaff must be a single claims object"
#             }), 400

#     print("PATCHING FIELDS TO GRAPH:", fields)

#     url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items/{item_id}/fields"
#     res = requests.patch(url, headers=headers, json=fields)

#     if not res.ok:
#         return jsonify({
#             "error": "Graph API error",
#             "details": res.text
#         }), res.status_code

#     return jsonify(res.json())

# # --------------------------------------------------
# # STEP 5: Get Document Libraries
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/libraries", methods=["GET"])
# def get_libraries(site_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/sites/{site_id}/drives"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     libraries = [
#         d for d in res.json().get("value", [])
#         if d.get("driveType") == "documentLibrary"
#     ]

#     return jsonify(libraries)

# # --------------------------------------------------
# # STEP 6: Get Documents
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/libraries/<drive_id>/documents", methods=["GET"])
# def get_documents(site_id, drive_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/drives/{drive_id}/root/children"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     return jsonify(res.json().get("value", []))

# # --------------------------------------------------
# # STEP 7: Upload Document
# # --------------------------------------------------
# @app.route("/sharepoint/<site_id>/libraries/<drive_id>/upload", methods=["POST"])
# def upload_document(site_id, drive_id):
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     if "file" not in request.files:
#         return jsonify({"error": "No file provided"}), 400

#     file = request.files["file"]

#     upload_url = f"{GRAPH_BASE}/drives/{drive_id}/root:/{file.filename}:/content"

#     upload_headers = {
#         "Authorization": headers["Authorization"],
#         "Content-Type": file.content_type or "application/octet-stream"
#     }

#     res = requests.put(upload_url, headers=upload_headers, data=file.read())

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     return jsonify(res.json())

# # --------------------------------------------------
# # STEP 8: Get Users (People Picker)
# # --------------------------------------------------
# @app.route("/graph/users", methods=["GET"])
# def graph_get_users():
#     headers = get_headers()
#     if not headers:
#         return jsonify({"error": "Missing Authorization header"}), 401

#     url = f"{GRAPH_BASE}/users?$select=displayName,mail,userPrincipalName"
#     res = requests.get(url, headers=headers)

#     if not res.ok:
#         return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

#     users = []
#     for u in res.json().get("value", []):
#         email = u.get("mail") or u.get("userPrincipalName")
#         if not email:
#             continue

#         users.append({
#             "displayName": u["displayName"],
#             "email": email,
#             "claims": f"i:0#.f|membership|{email}"
#         })

#     return jsonify(users)

# # --------------------------------------------------
# # HEALTH
# # --------------------------------------------------
# @app.route("/health", methods=["GET"])
# def health():
#     return jsonify({"status": "Delegated SharePoint API running"})

# # --------------------------------------------------
# # RUN
# # --------------------------------------------------
# if __name__ == "__main__":
#     print("🚀 Backend running on http://localhost:5050")
#     app.run(host="127.0.0.1", port=5050, debug=False)











import requests
import uvicorn
from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Permissive CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or restrict to ["http://localhost:3000", "http://127.0.0.1:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GRAPH_BASE = "https://graph.microsoft.com/v1.0"
HOSTNAME = "aoscaustralia.sharepoint.com"
SITE_PATH = "/sites/CPA"

# --------------------------------------------------
# Helper: Get Delegated User Token
# --------------------------------------------------
def get_graph_headers(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    return {
        "Authorization": auth,
        "Content-Type": "application/json"
    }

# --------------------------------------------------
# STEP 1: Resolve SharePoint Site
# --------------------------------------------------
@app.get("/sharepoint/site")
async def get_site(request: Request):
    headers = get_graph_headers(request)
    url = f"{GRAPH_BASE}/sites/{HOSTNAME}:{SITE_PATH}"
    res = requests.get(url, headers=headers)

    if not res.ok:
        raise HTTPException(status_code=res.status_code, detail={"error": "Graph API error", "details": res.text})

    site = res.json()
    return {
        "site_id": site["id"],
        "displayName": site["displayName"],
        "webUrl": site["webUrl"]
    }

# --------------------------------------------------
# STEP 2: Get Lists
# --------------------------------------------------
@app.get("/sharepoint/{site_id}/lists")
async def get_lists(site_id: str, request: Request):
    headers = get_graph_headers(request)
    url = f"{GRAPH_BASE}/sites/{site_id}/lists"
    res = requests.get(url, headers=headers)

    if not res.ok:
        raise HTTPException(status_code=res.status_code, detail={"error": "Graph API error", "details": res.text})

    lists = [
        {
            "list_id": lst["id"],
            "displayName": lst.get("displayName"),
            "template": lst.get("list", {}).get("template")
        }
        for lst in res.json().get("value", [])
    ]
    return lists

# --------------------------------------------------
# STEP 3: Get List Items
# --------------------------------------------------
@app.get("/sharepoint/{site_id}/lists/{list_id}/items")
async def get_list_items(site_id: str, list_id: str, request: Request):
    headers = get_graph_headers(request)
    url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items?expand=fields"
    res = requests.get(url, headers=headers)

    if not res.ok:
        raise HTTPException(status_code=res.status_code, detail={"error": "Graph API error", "details": res.text})

    return res.json().get("value", [])

# --------------------------------------------------
# STEP 3.5: Get List Columns
# --------------------------------------------------
@app.get("/sharepoint/{site_id}/lists/{list_id}/columns")
async def get_list_columns(site_id: str, list_id: str, request: Request):
    headers = get_graph_headers(request)
    url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/columns"
    res = requests.get(url, headers=headers)

    if not res.ok:
        raise HTTPException(status_code=res.status_code, detail={"error": "Graph API error", "details": res.text})

    return res.json().get("value", [])

# --------------------------------------------------
# STEP 4: Create List Item (POST)
# --------------------------------------------------
@app.post("/sharepoint/{site_id}/lists/{list_id}/items")
async def create_list_item(site_id: str, list_id: str, request: Request):
    headers = get_graph_headers(request)
    body = await request.json()

    if not body or "fields" not in body:
        raise HTTPException(status_code=400, detail="fields object required")

    fields = body["fields"]

    # Remove read-only system fields
    system_fields = ["LastUpdated", "Created", "Modified", "Author", "Editor"]
    for f in system_fields:
        fields.pop(f, None)

    # Validate AssignedStaff (single user claims)
    if "AssignedStaff" in fields:
        staff = fields["AssignedStaff"]
        if not isinstance(staff, dict) or "claims" not in staff:
            raise HTTPException(status_code=400, detail="AssignedStaff must be a single claims object: {'claims': 'i:0#.f|membership|email@domain.com'}")

    print("POSTING FIELDS TO GRAPH:", fields)

    url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items"
    res = requests.post(url, headers=headers, json={"fields": fields})

    if not res.ok:
        raise HTTPException(status_code=res.status_code, detail={"error": "Graph API error", "details": res.text})

    return res.json()

# --------------------------------------------------
# STEP 4.5: Update List Item (PATCH)
# --------------------------------------------------
@app.patch("/sharepoint/{site_id}/lists/{list_id}/items/{item_id}")
async def update_list_item(site_id: str, list_id: str, item_id: str, request: Request):
    headers = get_graph_headers(request)
    fields = await request.json()  # Graph expects the fields object directly on PATCH /fields

    # Remove read-only system fields
    system_fields = ["LastUpdated", "Created", "Modified", "Author", "Editor"]
    for f in system_fields:
        fields.pop(f, None)

    if "AssignedStaff" in fields:
        staff = fields["AssignedStaff"]
        if not isinstance(staff, dict) or "claims" not in staff:
            raise HTTPException(status_code=400, detail="AssignedStaff must be a single claims object")

    print("PATCHING FIELDS TO GRAPH:", fields)

    url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items/{item_id}/fields"
    res = requests.patch(url, headers=headers, json=fields)

    if not res.ok:
        raise HTTPException(status_code=res.status_code, detail={"error": "Graph API error", "details": res.text})

    return {"message": "Updated successfully"}

# --------------------------------------------------
# # STEP 5: Get Document Libraries
# # --------------------------------------------------
@app.route("/sharepoint/<site_id>/libraries", methods=["GET"])
def get_libraries(site_id):
    headers = get_headers()
    if not headers:
        return jsonify({"error": "Missing Authorization header"}), 401

    url = f"{GRAPH_BASE}/sites/{site_id}/drives"
    res = requests.get(url, headers=headers)

    if not res.ok:
        return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

    libraries = [
        d for d in res.json().get("value", [])
        if d.get("driveType") == "documentLibrary"
    ]

    return jsonify(libraries)

# # --------------------------------------------------
# # STEP 6: Get Documents
# --------------------------------------------------
@app.route("/sharepoint/<site_id>/libraries/<drive_id>/documents", methods=["GET"])
def get_documents(site_id, drive_id):
    headers = get_headers()
    if not headers:
        return jsonify({"error": "Missing Authorization header"}), 401

    url = f"{GRAPH_BASE}/drives/{drive_id}/root/children"
    res = requests.get(url, headers=headers)

    if not res.ok:
        return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

    return jsonify(res.json().get("value", []))

# # --------------------------------------------------
# # STEP 7: Upload Document
# # --------------------------------------------------
@app.route("/sharepoint/<site_id>/libraries/<drive_id>/upload", methods=["POST"])
def upload_document(site_id, drive_id):
    headers = get_headers()
    if not headers:
        return jsonify({"error": "Missing Authorization header"}), 401

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]

    upload_url = f"{GRAPH_BASE}/drives/{drive_id}/root:/{file.filename}:/content"

    upload_headers = {
        "Authorization": headers["Authorization"],
        "Content-Type": file.content_type or "application/octet-stream"
    }

    res = requests.put(upload_url, headers=upload_headers, data=file.read())

    if not res.ok:
        return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

    return jsonify(res.json())

# # --------------------------------------------------
# # STEP 8: Get Users (People Picker)
# # --------------------------------------------------
@app.route("/graph/users", methods=["GET"])
def graph_get_users():
    headers = get_headers()
    if not headers:
        return jsonify({"error": "Missing Authorization header"}), 401

    url = f"{GRAPH_BASE}/users?$select=displayName,mail,userPrincipalName"
    res = requests.get(url, headers=headers)

    if not res.ok:
        return jsonify({"error": "Graph API error", "details": res.text}), res.status_code

    users = []
    for u in res.json().get("value", []):
        email = u.get("mail") or u.get("userPrincipalName")
        if not email:
            continue

        users.append({
            "displayName": u["displayName"],
            "email": email,
            "claims": f"i:0#.f|membership|{email}"
        })

    return jsonify(users)


# --------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "Delegated SharePoint API running"})

# --------------------------------------------------
# RUN
# --------------------------------------------------
if __name__ == "__main__":
    print("🚀 Backend running on http://localhost:5050")
    app.run(host="127.0.0.1", port=5050, debug=False)

# if __name__ == "__main__":
#     uvicorn.run("your_filename:app", host="127.0.0.1", port=5050, reload=True)  # replace your_filename with the actual .py file name