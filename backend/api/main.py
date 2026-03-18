from fastapi import FastAPI, Body
from backend.api.scan import router as scan_router

app = FastAPI()

# include routes
app.include_router(scan_router)


@app.get("/")
def home():
    return {"message": "ARKA Auditor Backend Running"}


@app.post("/fix")
def fix(vulns: list = Body(...)):
    return vulns  # temporary (LLM later)