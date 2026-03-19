import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_fix(vuln):
    prompt = f"""
You are a security expert. Analyze this vulnerability and provide a fix.

Vulnerability details:
- Type: {vuln.get('type', 'Unknown')}
- File: {vuln.get('file', 'Unknown')}
- Severity: {vuln.get('severity', 'Unknown')}
- Code: {vuln.get('code', 'No code provided')}

Generate a JSON response with exactly these fields:
{{
  "type": "{vuln.get('type', 'Unknown')}",
  "severity": "{vuln.get('severity', 'Unknown')}",
  "fix": "Brief description of the fix",
  "fixed_code": "The corrected code snippet",
  "explanation": "Why this fix works",
  "confidence": "90%"
}}

Ensure the response is valid JSON only.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.2
        )
        content = response.choices[0].message.content.strip()
        # Remove markdown if present
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        result = json.loads(content)
        return result
    except Exception as e:
        return {
            "error": f"LLM failed: {str(e)}"
        }

def process_vulnerabilities(vulns):
    results = []
    for v in vulns:
        results.append(generate_fix(v))
    return results