from openai import OpenAI
import json
import re

# ----------------------------------------
# CONFIGURATION
# ----------------------------------------

ASSISTANT_ID = "asst_31W6bGXBFBNJIPXcfozfS0X9"
VECTOR_STORE_ID = "vs_695779887af08191b6a10e2fee131298"

DOCUMENT_TEXT = """
This document shows an income statement issued to an employee for the
2024–25 financial year. The income is reported through Single Touch
Payroll and is available to the employee via myGov. No payment summary
has been issued.
"""

client = OpenAI(
    api_key="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"
)

# ----------------------------------------
# CALL AGENT
# ----------------------------------------

response = client.responses.create(
    model="gpt-4.1-mini",
    input=f"""
DOCUMENT TO ANALYSE:
{DOCUMENT_TEXT}

STRICT RULES:
- Return ONLY valid JSON
- No extra text
- No markdown

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
    tools=[
        {
            "type": "file_search",
            "vector_store_ids": [VECTOR_STORE_ID]
        }
    ],
    metadata={
        "assistant_id": ASSISTANT_ID
    }
)

# ----------------------------------------
# EXTRACT JSON
# ----------------------------------------

raw = response.output_text
match = re.search(r"\{.*\}", raw, re.DOTALL)

if not match:
    raise Exception("No JSON returned by agent")

result = json.loads(match.group())

# ----------------------------------------
# PRINT RESULT
# ----------------------------------------

print("\n=== DOCUMENT ANALYSIS RESULT ===\n")
print(json.dumps(result, indent=2))

# ----------------------------------------
# CONFIDENCE-BASED ROUTING (AGENT LOGIC)
# ----------------------------------------

confidence = result["confidence_level"]

print("\n=== AGENT DECISION ===\n")

if confidence == "HIGH":
    print("✅ Document accepted automatically.")
    print("➡️ Status: COMPLIANT")





