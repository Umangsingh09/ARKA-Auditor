from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.llm_engine.fix_engine import generate_fix, process_vulnerabilities
from backend.scanner.bandit_scanner import run_bandit_scan
from backend.scanner.zap_scanner import run_zap_scan

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
def home():
    return {"message": "ARKA Auditor Backend Running"}

@app.post("/fix")
def fix(data: dict = Body(...)):
    if "vulnerabilities" not in data or not isinstance(data["vulnerabilities"], list):
        raise HTTPException(status_code=400, detail="Invalid input: 'vulnerabilities' must be a list")
    
    vulns = data["vulnerabilities"]
    if not vulns:
        return {"results": []}
    
    results = process_vulnerabilities(vulns)
    return {"results": results}

def run_scanner(repo_path=None, target_url=None):
    print("[*] Scan started")
    vulnerabilities = []
    
    if repo_path:
        print(f"[*] Running Bandit on {repo_path}")
        bandit_results = run_bandit_scan(repo_path)
        if isinstance(bandit_results, list):
            for vuln in bandit_results:
                vulnerabilities.append({
                    "type": vuln.get("issue", "Security Issue")[:20],
                    "file": vuln.get("file", "unknown"),
                    "severity": vuln.get("severity", "MEDIUM"),
                    "code": "No code provided"
                })
        else:
            print(f"[!] Bandit error: {bandit_results}")
    
    if target_url:
        print(f"[*] Running ZAP on {target_url}")
        zap_results = run_zap_scan(target_url)
        if isinstance(zap_results, list):
            for vuln in zap_results:
                vulnerabilities.append({
                    "type": vuln.get("alert", "Web Vulnerability")[:20],
                    "file": vuln.get("url", "unknown"),
                    "severity": vuln.get("risk", "MEDIUM"),
                    "code": "No code provided"
                })
        else:
            print(f"[!] ZAP error: {zap_results}")
    
    repo = repo_path or target_url or "unknown"
    print(f"[*] Scan completed, found {len(vulnerabilities)} vulnerabilities")
    return {"repo": repo, "vulnerabilities": vulnerabilities}

@app.post("/scan/start")
def scan_start(data: dict = Body(...)):
    repo_path = data.get("repo_path")
    target_url = data.get("target_url")
    
    if not repo_path and not target_url:
        raise HTTPException(status_code=400, detail="Provide repo_path or target_url")
    
    try:
        scanner_output = run_scanner(repo_path, target_url)
    except Exception as e:
        print(f"[!] Scanner failed: {e}")
        raise HTTPException(status_code=500, detail="Scanner failed")
    
    if "vulnerabilities" not in scanner_output or not isinstance(scanner_output["vulnerabilities"], list):
        raise HTTPException(status_code=500, detail="Invalid scanner output")
    
    vulns = scanner_output["vulnerabilities"]
    results = []
    
    for i, vuln in enumerate(vulns):
        print(f"[*] Processing vulnerability {i+1}/{len(vulns)}: {vuln['type']}")
        try:
            fix_result = generate_fix(vuln)
            if "error" in fix_result:
                print(f"[!] LLM failed for {vuln['type']}: {fix_result['error']}")
                fix_result = {
                    "type": vuln["type"],
                    "severity": vuln["severity"],
                    "fix": "Manual review required",
                    "fixed_code": "N/A",
                    "explanation": "LLM failed to generate fix",
                    "confidence": "0%"
                }
            results.append(fix_result)
        except Exception as e:
            print(f"[!] Error processing {vuln['type']}: {e}")
            results.append({
                "type": vuln["type"],
                "severity": vuln["severity"],
                "fix": "Error occurred",
                "fixed_code": "N/A",
                "explanation": str(e),
                "confidence": "0%"
            })
    
    print("[*] Processing completed")
    return {
        "repo": scanner_output["repo"],
        "results": results
    }

@app.get("/pr/mock")
def pr_mock():
    return {
        "status": "completed",
        "prs": [
            {
                "title": "Fix SQL Injection vulnerability",
                "url": "https://github.com/demo/pr/1"
            },
            {
                "title": "Fix XSS vulnerability",
                "url": "https://github.com/demo/pr/2"
            }
        ]
    }