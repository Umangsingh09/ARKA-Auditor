#!/bin/bash
echo "Starting ARKA Auditor..."
echo "1. Starting backend..."
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000 &
echo "2. Starting frontend..."
cd ../frontend && npm run dev &
echo "3. Checking DVWA..."
docker start $(docker ps -aq --filter ancestor=vulnerables/web-dvwa) 2>/dev/null \
  || docker run -d -p 80:80 vulnerables/web-dvwa
echo ""
echo "✔ Backend:  http://localhost:8000"
echo "✔ Frontend: http://localhost:5173"
echo "✔ DVWA:     http://localhost:80"
echo "✔ API docs: http://localhost:8000/docs"