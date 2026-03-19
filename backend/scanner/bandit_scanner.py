import subprocess
import json
import tempfile
import os

def run_bandit_scan(repo_path):
    try:
        result = subprocess.run(
            ["bandit", "-r", repo_path, "-f", "json"],
            capture_output=True,
            text=True
        )

        output = json.loads(result.stdout)

        vulnerabilities = []

        for issue in output.get("results", []):
            vulnerabilities.append({
                "file": issue.get("filename"),
                "line": issue.get("line_number"),
                "issue": issue.get("issue_text"),
                "severity": issue.get("issue_severity"),
                "confidence": issue.get("issue_confidence"),
                "fix": "Review and sanitize input / follow secure coding practices"
            })

        return vulnerabilities

    except Exception as e:
        return {"error": str(e)}