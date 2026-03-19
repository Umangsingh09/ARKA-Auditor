def generate_fix(vuln):
    fix = ""

    if vuln["type"] == "SQL Injection":
        fix = f"""
Use parameterized queries instead of raw SQL.

Example Fix:
cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
"""

    elif vuln["type"] == "XSS":
        fix = f"""
Sanitize user input before rendering.

Example Fix:
Use frameworks like React (auto-escaping) or libraries like DOMPurify.
"""

    else:
        fix = "Apply general security best practices."

    return {
        "vulnerability": vuln["type"],
        "file": vuln["file"],
        "severity": vuln["severity"],
        "fix": fix,
        "explanation": f"{vuln['type']} is dangerous and can be exploited by attackers."
    }

def process_vulnerabilities(vulns):
    results = []
    for v in vulns:
        results.append(generate_fix(v))
    return results