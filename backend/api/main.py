import os
import logging
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.llm_engine.fix_engine import generate_fix, process_vulnerabilities
from backend.scanner.bandit_scanner import run_bandit_scan
from backend.scanner.zap_scanner import run_zap_scan
from backend.api.scan import router as scan_router

app = FastAPI()

# Add CORS middleware for local frontend/demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Structured logging for demo visibility
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(asctime)s %(message)s')
logger = logging.getLogger(__name__)

@app.get("/")
def home():
    return {"message": "ARKA Auditor Backend Running"}

@app.post("/fix")
def fix(data: dict = Body(...)):
    if "vulnerabilities" not in data or not isinstance(data["vulnerabilities"], list):
        raise HTTPException(status_code=400, detail="Invalid input: 'vulnerabilities' must be a list")

    results = process_vulnerabilities(data["vulnerabilities"])
    return {"results": results}

# Keep the scan router for /scan endpoint
app.include_router(scan_router)

@app.get("/scan/status")
def scan_status():
    return {"status": "ready", "detail": "Scanner ready", "timestamp": int(os.times().elapsed)}

def format_vulnerability(raw_vuln, source):
    # normalizes Bandit/ZAP raw findings to common schema
    return {
        "type": raw_vuln.get("issue") or raw_vuln.get("alert") or raw_vuln.get("type") or "Unknown",
        "file": raw_vuln.get("filename") or raw_vuln.get("url") or raw_vuln.get("file") or "unknown",
        "severity": raw_vuln.get("issue_severity") or raw_vuln.get("risk") or raw_vuln.get("severity") or "MEDIUM",
        "code": raw_vuln.get("code") or raw_vuln.get("code_snippet") or raw_vuln.get("request") or "No code provided",
        "source": source,
        "line": raw_vuln.get("line") or raw_vuln.get("line_number") or None,
        "confidence": raw_vuln.get("confidence") or raw_vuln.get("issue_confidence") or "Low",
    }

@app.post("/scan/start")
def scan_start(data: dict = Body(...)):
    repo_path = data.get("repo_path")
    target_url = data.get("target_url")

    logger.info("/scan/start request received with repo_path=%s target_url=%s", repo_path, target_url)

    if not repo_path and not target_url:
        raise HTTPException(status_code=400, detail="Provide repo_path or target_url")

    try:
        scanner_data = {
            "bandit": [],
            "zap": []
        }

        if repo_path:
            logger.info("Running Bandit on %s", repo_path)
            bandit_results = run_bandit_scan(repo_path)
            if isinstance(bandit_results, list):
                scanner_data["bandit"] = [format_vulnerability(v, "bandit") for v in bandit_results]
            else:
                logger.error("Bandit scan failed: %s", bandit_results)

        if target_url:
            logger.info("Running ZAP on %s", target_url)
            zap_results = run_zap_scan(target_url)
            if isinstance(zap_results, list):
                scanner_data["zap"] = [format_vulnerability(v, "zap") for v in zap_results]
            else:
                logger.error("ZAP scan failed: %s", zap_results)

        vulnerabilities = scanner_data["bandit"] + scanner_data["zap"]

        # fallback to demo vulnerabilities for hackathon if none found
        if not vulnerabilities:
            logger.warning("No vulnerabilities found from scanners. Using fallback demo vulns")
            vulnerabilities = [
                {
                    "type": "SQL Injection",
                    "file": "app/db.py",
                    "severity": "Critical",
                    "code": "unsafe_query = f\"SELECT * FROM users WHERE id={user_id}\"",
                    "source": "fallback",
                    "line": 42,
                    "confidence": "High"
                },
                {
                    "type": "Cross-Site Scripting (XSS)",
                    "file": "app/templates/profile.html",
                    "severity": "High",
                    "code": "<div>{{ user_input }}</div>",
                    "source": "fallback",
                    "line": 27,
                    "confidence": "High"
                },
                {
                    "type": "Hardcoded Secret",
                    "file": "app/config.py",
                    "severity": "Medium",
                    "code": "API_KEY = \"1234-SECRET\"",
                    "source": "fallback",
                    "line": 8,
                    "confidence": "Medium"
                }
            ]

        enriched_results = []
        for idx, vuln in enumerate(vulnerabilities):
            logger.info("Processing vulnerability %d/%d: %s", idx + 1, len(vulnerabilities), vuln["type"])
            try:
                fix_result = generate_fix(vuln)
                if not isinstance(fix_result, dict) or "fixed_code" not in fix_result:
                    raise ValueError("Invalid fix result")

                enriched = {
                    "type": fix_result.get("type", vuln.get("type")),
                    "severity": fix_result.get("severity", vuln.get("severity", "Medium")),
                    "fix": fix_result.get("fix", "No fix provided"),
                    "fixed_code": fix_result.get("fixed_code", "N/A"),
                    "explanation": fix_result.get("explanation", "No explanation provided."),
                    "confidence": fix_result.get("confidence", "0%"),
                    "source": vuln.get("source", "scanner"),
                    "file": vuln.get("file", "unknown"),
                    "line": vuln.get("line"),
                    "scanner_confidence": vuln.get("confidence", "Low")
                }
                enriched_results.append(enriched)

            except Exception as e:
                logger.warning("LLM processing failed for %s: %s", vuln.get("type"), e)
                enriched_results.append({
                    "type": vuln.get("type", "unknown"),
                    "severity": vuln.get("severity", "Medium"),
                    "fix": "Fallback required: please review manually",
                    "fixed_code": "N/A",
                    "explanation": f"LLM generation failed: {str(e)}",
                    "confidence": "0%",
                    "source": vuln.get("source", "scanner"),
                    "file": vuln.get("file", "unknown"),
                    "line": vuln.get("line")
                })

        response_payload = {
            "repo": repo_path or target_url,
            "status": "success",
            "vulnerabilities": enriched_results,
            "summary": {
                "total": len(enriched_results),
                "critical": sum(1 for v in enriched_results if v.get("severity", "").lower() == "critical"),
                "high": sum(1 for v in enriched_results if v.get("severity", "").lower() == "high"),
                "medium": sum(1 for v in enriched_results if v.get("severity", "").lower() == "medium"),
            }
        }

        logger.info("scan/start completed with %d vulnerabilities", len(enriched_results))
        return response_payload

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("scan/start fatal error")
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")
