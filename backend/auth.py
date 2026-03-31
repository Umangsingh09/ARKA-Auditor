from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
import requests, os, secrets
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
state_store = {}
session_store = {}

# Firebase optional
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    FIREBASE_ENABLED = True
except Exception:
    FIREBASE_ENABLED = False
    db = None

@router.get("/github")
def github_login():
    state = secrets.token_hex(16)
    state_store[state] = True

    client_id = os.getenv("GITHUB_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="GITHUB_CLIENT_ID not configured")

    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={client_id}"
        f"&scope=repo,user"
        f"&state={state}"
    )
    return RedirectResponse(url)

@router.get("/callback")
def github_callback(code: str, state: str):
    if state not in state_store:
        raise HTTPException(status_code=400, detail="Invalid state")
    del state_store[state]

    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")

    token_resp = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code
        }
    )
    
    if token_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code")

    token_json = token_resp.json()
    access_token = token_json.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token")

    user_resp = requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    if user_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch user")

    user_json = user_resp.json()
    username = user_json.get("login")
    avatar_url = user_json.get("avatar_url")
    user_id = str(user_json.get("id"))

    session_store[access_token] = {
        "username": username,
        "avatar_url": avatar_url,
        "user_id": user_id
    }

    if FIREBASE_ENABLED and db is not None:
        try:
            db.collection("users").document(user_id).set({
                "github_token": access_token,
                "username": username,
                "avatar_url": avatar_url,
                "created_at": firestore.SERVER_TIMESTAMP
            })
        except Exception:
            pass

    redirect_url = (
        f"http://localhost:5173/?token={access_token}"
        f"&username={username}"
        f"&avatar_url={avatar_url}"
        f"&user_id={user_id}"
    )
    return RedirectResponse(redirect_url)

@router.get("/user")
def get_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")

    token = auth_header.split(" ")[1]
    stored = session_store.get(token)
    if not stored:
        raise HTTPException(status_code=401, detail="Invalid token")

    return {
        "username": stored.get("username"),
        "avatar_url": stored.get("avatar_url"),
        "user_id": stored.get("user_id")
    }