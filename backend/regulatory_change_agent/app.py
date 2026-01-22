from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from openai import OpenAI
import pdfplumber
import docx
import json
import re
import os
import tempfile
import time
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Regulatory Document Compliance Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ASSISTANT_ID = "asst_31W6bGXBFBNJIPXcfozfS0X9"
VECTOR_STORE_ID = "vs_695779887af08191b6a10e2fee131298"


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

def extract_text_from_pdf(path):
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            if page.extract_text():
                text += page.extract_text() + "\n"
    return text.strip()

def extract_text_from_docx(path):
    doc = docx.Document(path)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

def extract_text(path):
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(path)
    elif ext == ".docx":
        return extract_text_from_docx(path)
    else:
        raise ValueError("Only PDF and DOCX supported")

# -------------------------------
# AGENT CALL WITH ALIGNMENT LOGIC
# -------------------------------

def run_agent(document_text, strict=False):
    instruction = (
        "Return ONLY valid JSON. No markdown. No text outside JSON."
        if not strict else
        "Return ONLY valid JSON. Ensure all arrays and objects are correctly closed."
    )

    full_prompt = f"""
DOCUMENT TO ANALYSE:
{document_text}

{instruction}

TASK:
1. Identify applicable ATO rules.
2. For EACH applicable rule, check alignment with the document.
3. Mark rule status as:
   - ALIGNED (1.0)
   - PARTIALLY_ALIGNED (0.5)
   - NOT_ALIGNED (0.0)
4. Calculate alignment_score_percent as:
   (sum of rule scores / total rules) * 100
5. Round to nearest whole number.
6. Derive confidence level:
   - 85–100 → HIGH
   - 60–84 → MEDIUM
   - <60 → LOW

JSON FORMAT:
{{
  "document_type": "",
  "applicable_ato_rules": [],
  "rule_alignment": [
    {{
      "rule": "",
      "status": "ALIGNED | PARTIALLY_ALIGNED | NOT_ALIGNED",
      "reason": ""
    }}
  ],
  "alignment_score_percent": 0,
  "compliance_summary": "",
  "issues_or_gaps": [],
  "recommended_actions": [],
  "confidence_level": "HIGH | MEDIUM | LOW"
}}
"""

    thread = client.beta.threads.create(
        tool_resources={
            "file_search": {
                "vector_store_ids": [VECTOR_STORE_ID]
            }
        }
    )

    message = client.beta.threads.messages.create(
        thread_id=thread.id,
        role="user",
        content=full_prompt
    )

    run = client.beta.threads.runs.create(
        thread_id=thread.id,
        assistant_id=ASSISTANT_ID,
        tools=[{"type": "file_search"}]
    )

    while run.status in ['queued', 'in_progress']:
        run = client.beta.threads.runs.retrieve(
            thread_id=thread.id,
            run_id=run.id
        )
        time.sleep(1)

    if run.status == 'completed':
        messages = client.beta.threads.messages.list(thread_id=thread.id)
        response_text = messages.data[0].content[0].text.value
    else:
        raise ValueError(f"Run failed with status: {run.status}")

    match = re.search(r"\{.*\}", response_text, re.DOTALL)
    if not match:
        raise ValueError("No JSON returned")

    return json.loads(match.group())

# -------------------------------
# API ENDPOINT
# -------------------------------

@app.post("/analyze-document")
async def analyze_document(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1].lower()

    if suffix not in [".pdf", ".docx"]:
        return {"error": "Only PDF and DOCX files are supported"}

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        text = extract_text(tmp_path)

        try:
            result = run_agent(text)
        except:
            result = run_agent(text, strict=True)

        score = result.get("alignment_score_percent", 0)

        decision = (
            "COMPLIANT" if score >= 85
            else "REVIEW_REQUIRED" if score >= 60
            else "ESCALATE"
        )

        return {
            "alignment_score_percent": score,
            "confidence_level": result["confidence_level"],
            "decision": decision,
            "analysis": result
        }
    
    except ValueError as ve:
        return {"error": f"File processing error: {str(ve)}"}  # E.g., invalid file type or JSON parse
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}

    finally:
        os.remove(tmp_path)