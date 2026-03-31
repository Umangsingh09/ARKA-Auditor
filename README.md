# ARKA-Auditor

AI-powered Security Code Auditor that analyzes GitHub repositories for vulnerabilities and automatically creates pull requests with fixes.

## Features

- 🔐 **Firebase Authentication** with GitHub OAuth
- 🔍 **Repository Analysis** - Scans GitHub repos for security vulnerabilities
- 🤖 **AI-Powered Fixes** - Generates automated security fixes using LLM
- 🚀 **Auto PR Creation** - Creates pull requests with security fixes
- 🌐 **Website Scanning** - Basic website security scanning
- 📊 **Dashboard UI** - Clean React interface with Tailwind CSS

## Tech Stack

- **Frontend**: React + Vite, Tailwind CSS, Firebase Auth
- **Backend**: Flask (Python), GitHub API integration
- **AI**: Local LLM engine for security analysis
- **Deployment**: Ready for Vercel/Netlify + Railway/Render

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+
- GitHub account with OAuth app
- Firebase project

### 1. Clone and Setup

```bash
git clone <repository-url>
cd ARKA-Auditor
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend will start on `http://127.0.0.1:5000`

### 3. Frontend Setup

#### Firebase Configuration

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication and select GitHub as a sign-in provider
3. Create a GitHub OAuth App:
   - Go to https://github.com/settings/applications/new
   - Set Authorization callback URL to: `https://your-project.firebaseapp.com/__/auth/handler`
4. In Firebase Console > Authentication > Sign-in method > GitHub:
   - Add your GitHub Client ID and Client Secret
5. Get your Firebase config from Project Settings > General > Your apps
6. Copy `.env.example` to `.env` in the frontend directory and fill in:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   ```

#### Install and Run

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Usage

1. **Login**: Click "Login with GitHub" to authenticate
2. **Select Repository**: Choose from your GitHub repositories
3. **Analyze**: Click "Analyze Repository" to scan for vulnerabilities
4. **Generate Fix**: Select a vulnerability and generate an AI fix
5. **Create PR**: Create a pull request with the security fix

## API Endpoints

### Backend API (`http://127.0.0.1:5000`)

- `POST /analyze` - Analyze repository for vulnerabilities
- `POST /generate-fix` - Generate AI fix for vulnerability
- `POST /create-pr` - Create pull request with fix

### Request/Response Examples

#### Analyze Repository
```bash
curl -X POST http://127.0.0.1:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/user/repo", "token": "github_token"}'
```

#### Generate Fix
```bash
curl -X POST http://127.0.0.1:5000/generate-fix \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/user/repo", "vulnerability": "SQL injection"}'
```

#### Create PR
```bash
curl -X POST http://127.0.0.1:5000/create-pr \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/user/repo", "token": "github_token", "fix": "security fix code"}'
```

## Development

### Testing

Run the API test script:
```bash
cd backend
python test_api.py
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build

# Backend (Flask app ready for deployment)
cd backend
# Deploy to Railway/Render/Heroku
```

## Error Handling

The application includes comprehensive error handling for:
- Network connectivity issues
- Invalid GitHub tokens/repositories
- API failures
- Authentication errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```
