from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.llm_engine.fix_engine import process_vulnerabilities

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