from fastapi import APIRouter, BackgroundTasks, HTTPException
from uuid import uuid4
import asyncio

router = APIRouter()
scan_store = {}

@router.post("/start")
def start_scan(body: dict, background_tasks: BackgroundTasks):
    repo_url = body.get("repo_url")
    target_url = body.get("target_url")
    github_token = body.get("github_token")

    scan_id = str(uuid4())
    scan_store[scan_id] = {
        "status": "starting",
        "progress": 0,
        "results": [],
        "repo_name": "",
        "error": None
    }

    background_tasks.add_task(run_full_scan, scan_id, repo_url, target_url, github_token)
    return {"scan_id": scan_id}

async def run_full_scan(scan_id, repo_url, target_url, github_token):
    try:
        scan_store[scan_id]["status"] = "cloning"
        scan_store[scan_id]["progress"] = 10

        from github_integration import clone_repo
        repo_path = clone_repo(repo_url, github_token)
        repo_name = repo_url.rstrip("/").split("/")[-1].replace(".git", "")
        scan_store[scan_id]["repo_name"] = repo_name

        scan_store[scan_id]["status"] = "static_scan"
        scan_store[scan_id]["progress"] = 25

        from scanner.bandit_scanner import run_bandit_scan
        bandit_results = run_bandit_scan(repo_path)
        if not isinstance(bandit_results, list):
            print(f"Bandit returned non-list result: {bandit_results}")
            bandit_results = []

        scan_store[scan_id]["status"] = "live_scan"
        scan_store[scan_id]["progress"] = 45

        try:
            from scanner.zap_scanner import run_zap_scan
            zap_results = run_zap_scan(target_url)
            if not isinstance(zap_results, list):
                print(f"ZAP returned non-list result: {zap_results}")
                zap_results = []
        except Exception as e:
            print(f"ZAP failed: {e} — continuing without live scan")
            zap_results = []

        scan_store[scan_id]["status"] = "ai_analysis"
        scan_store[scan_id]["progress"] = 65

        from llm_engine.fix_engine import process_vulnerabilities
        all_vulns = bandit_results + zap_results

        # Normalize raw scan data before AI enrichment
        normalized_vulns = []
        for i, v in enumerate(all_vulns):
            normalized_vuln = {
                "type": v.get("issue") or v.get("alert") or "Unknown",
                "filename": v.get("file") or v.get("url") or "unknown",
                "line_number": v.get("line") or v.get("line_number", 0),
                "severity": (v.get("severity") or v.get("risk") or "Medium").capitalize(),
                "description": v.get("description") or v.get("issue_text", "No description"),
                "fix_suggestion": v.get("fix") or v.get("solution") or "Review manually",
                "source": "bandit" if "issue" in v else "zap",
                "code": v.get("code", ""),
            }
            normalized_vuln["id"] = f"vuln_{i+1:03d}"
            normalized_vulns.append(normalized_vuln)

        enriched = process_vulnerabilities(normalized_vulns)

        scan_store[scan_id]["status"] = "generating_fixes"
        scan_store[scan_id]["progress"] = 85

        from fix_generator import generate_fix
        for vuln in enriched:
            try:
                fix = generate_fix(vuln)
                vuln["fix_code"] = fix.get("fixed_code", "")
                vuln["fix_explanation"] = fix.get("explanation", "")
            except Exception:
                vuln["fix_code"] = ""

        scan_store[scan_id]["status"] = "complete"
        scan_store[scan_id]["progress"] = 100
        scan_store[scan_id]["results"] = enriched

    except Exception as e:
        scan_store[scan_id]["status"] = "error"
        scan_store[scan_id]["error"] = str(e)
        scan_store[scan_id]["progress"] = 0

@router.get("/status/{scan_id}")
def scan_status(scan_id: str):
    if scan_id not in scan_store:
        raise HTTPException(status_code=404, detail="Scan not found")
    s = scan_store[scan_id]
    return {
        "scan_id": scan_id,
        "status": s.get("status"),
        "progress": s.get("progress", 0),
        "error": s.get("error")
    }

@router.get("/results/{scan_id}")
def scan_results(scan_id: str):
    if scan_id not in scan_store:
        raise HTTPException(status_code=404, detail="Scan not found")
    s = scan_store[scan_id]

    if s.get("status") != "complete":
        return {"message": "Scan in progress"}, 202

    results = s.get("results", [])
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for v in results:
        sev = v.get("severity", "Medium").capitalize()
        if sev == "Critical": counts["critical"] += 1
        elif sev == "High": counts["high"] += 1
        elif sev == "Medium": counts["medium"] += 1
        elif sev == "Low": counts["low"] += 1

    return {
        "scan_id": scan_id,
        "repo_name": s.get("repo_name", ""),
        "total": len(results),
        "critical": counts["critical"],
        "high": counts["high"],
        "medium": counts["medium"],
        "low": counts["low"],
        "vulnerabilities": results
    }
