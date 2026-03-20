from fastapi import APIRouter
from backend.scanner.bandit_scanner import run_bandit_scan
from backend.scanner.zap_scanner import run_zap_scan

router = APIRouter()

@router.post("/scan")
def scan_project(data: dict):
    repo_path = data.get("repo_path")
    target_url = data.get("target_url")

    results = {
        "bandit": [],
        "zap": []
    }

    # 🔍 Run Bandit (static scan)
    if repo_path:
        print("[*] Running Bandit...")
        results["bandit"] = run_bandit_scan(repo_path)

    # 🌐 Run ZAP (live scan)
    if target_url:
        print("[*] Running ZAP...")
        results["zap"] = run_zap_scan(target_url)

    return {
        "status": "success",
        "results": results
    }