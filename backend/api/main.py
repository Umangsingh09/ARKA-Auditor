from fastapi import FastAPI, Body
from backend.llm_engine.test_llm import process_vulnerabilities

app = FastAPI()

@app.get("/")
def home():
    return {"message": "ARKA Auditor Backend Running"}

@app.post("/fix")
def fix(vulns: list = Body(...)):
    return process_vulnerabilities(vulns)