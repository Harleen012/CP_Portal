from dotenv import load_dotenv
from openai import OpenAI
import pdfplumber
import docx
import json
import re
import os

ASSISTANT_ID = "asst_31W6bGXBFBNJIPXcfozfS0X9"
VECTOR_STORE_ID = "vs_695779887af08191b6a10e2fee131298"

FILE_PATH = r"C:\Users\acer\Downloads\Regulatory agent\Not_Aligned_Compliance_Document.docx"
load_dotenv(dotenv_path=".env", override=True)

OR_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OR_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY not found in environment")

client = OpenAI(
    api_key=OR_API_KEY
)

# -------------------------------
# TEXT EXTRACTION
# -------------------------------

def extract_text_from_pdf(file_path):
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()

def extract_text_from_docx(file_path):
    doc = docx.Document(file_path)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

def extract_text(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    else:
        raise ValueError("Only PDF and DOCX are supported")

document_text = extract_text(FILE_PATH)

# -------------------------------
# AGENT CALL (WITH RETRY)
# -------------------------------

def call_agent(strict=False):
    instruction = "Return ONLY valid JSON. No markdown. No text outside JSON."
    if strict:
        instruction += " Ensure all arrays and objects are correctly closed."

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=f"""
DOCUMENT TO ANALYSE:
{document_text}

{instruction}

JSON FORMAT:
{{
  "document_type": "",
  "applicable_ato_rules": [],
  "compliance_summary": "",
  "issues_or_gaps": [],
  "recommended_actions": [],
  "confidence_level": "HIGH | MEDIUM | LOW"
}}
""",
        tools=[{
            "type": "file_search",
            "vector_store_ids": [VECTOR_STORE_ID]
        }],
        metadata={"assistant_id": ASSISTANT_ID}
    )

    raw = response.output_text
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError("No JSON found")

    return json.loads(match.group())

# -------------------------------
# TRY PARSING
# -------------------------------

try:
    result = call_agent(strict=False)
except Exception:
    print("⚠️ Invalid JSON returned. Retrying with stricter rules...\n")
    result = call_agent(strict=True)

# -------------------------------
# OUTPUT + DECISION
# -------------------------------

print("\n=== DOCUMENT COMPLIANCE RESULT ===\n")
print(json.dumps(result, indent=2))

print("\n=== AGENT DECISION ===\n")

confidence = result["confidence_level"]

if confidence == "HIGH":
    print("✅ Document accepted automatically.")
elif confidence == "MEDIUM":
    print("⚠️ Document requires human review.")
else:
    print("❌ High risk document. Escalate.")
