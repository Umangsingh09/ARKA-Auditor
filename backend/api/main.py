from fastapi import FastAPI, Body
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
def fix(vulns: list = Body(...)):
    return process_vulnerabilities(vulns)