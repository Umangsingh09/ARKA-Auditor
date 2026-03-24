from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from scan import router as scan_router
from github_integration import router as github_router
import uvicorn

app = FastAPI(title="ARKA Auditor API")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:5173"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(auth_router,   prefix="/auth")
app.include_router(scan_router,   prefix="/scan")
app.include_router(github_router, prefix="/github")

@app.get("/health")
def health():
  return {"status": "ok", "service": "ARKA Auditor"}

if __name__ == "__main__":
  uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)