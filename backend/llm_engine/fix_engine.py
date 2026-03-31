import os
import json
import logging
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = logging.getLogger(__name__)

def generate_fix(vuln):
    prompt = f"""
You are a security expert. Provide a concise fix for the vulnerability below.

Vulnerability details:
- Type: {vuln.get('type', 'Unknown')}
- File: {vuln.get('file', 'Unknown')}
- Severity: {vuln.get('severity', 'Unknown')}
- Code: {vuln.get('code', 'No code provided')}

Return only valid JSON with these fields:
{{
  "type": "...",
  "severity": "...",
  "fix": "...",
  "fixed_code": "...",
  "explanation": "...",
  "confidence": "..."
}}

Use short and accurate output (max 150 words explanation)."""

    logger.info("generate_fix for %s", vuln.get('type'))

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.2
        )

        content = response.choices[0].message.content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        result = json.loads(content)

        # Enforce keys and safe defaults
        return {
            "type": result.get("type", vuln.get("type", "Unknown")),
            "severity": result.get("severity", vuln.get("severity", "Medium")),
            "fix": result.get("fix", "No fix statement returned"),
            "fixed_code": result.get("fixed_code", "N/A"),
            "explanation": result.get("explanation", "No explanation returned"),
            "confidence": result.get("confidence", "50%")
        }
    except Exception as e:
        logger.exception("LLM generation failed")
        return {
            "type": vuln.get("type", "Unknown"),
            "severity": vuln.get("severity", "Medium"),
            "fix": "LLM response unavailable; please review manually",
            "fixed_code": "N/A",
            "explanation": f"LLM fallback: {str(e)}",
            "confidence": "0%",
            "error": str(e)
        }


def process_vulnerabilities(vulns):
    return [generate_fix(v) for v in vulns]
