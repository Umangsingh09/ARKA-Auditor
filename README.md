# ARKA-Auditor

AI-powered security auditing tool for code repositories.

## Setup

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- OpenAI API Key

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   npm install
   ```

### Environment Variables

Create a `.env` file in the backend directory with:
```
OPENAI_API_KEY=your_openai_api_key
```

### Running the Application

1. Start the backend:
   ```bash
   cd backend
   npm start
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Or run both simultaneously:
   ```bash
   npm start
   ```

## Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js (Express) + Python (FastAPI)
- **Security Scanners**: Bandit, OWASP ZAP
- **AI Engine**: OpenAI GPT for fix generation