@echo off
REM Setup script for Mega AI project (Windows)

echo 🚀 Setting up Mega AI - Real-Time Face Detection...
echo.

REM Backend setup
echo 📦 Setting up backend...
cd backend

REM Create venv
echo   Creating virtual environment...
python -m venv venv

REM Activate venv
call venv\Scripts\activate.bat

REM Install dependencies
echo   Installing Python dependencies...
pip install -r requirements.txt -q

echo   ✓ Backend setup complete
cd ..

echo.

REM Frontend setup
echo 📦 Setting up frontend...
cd frontend

echo   Installing Node dependencies...
call npm install -q

echo   ✓ Frontend setup complete
cd ..

echo.
echo ✅ Setup complete!
echo.
echo 📝 Next steps:
echo.
echo 1. Start the backend server:
echo    cd backend
echo    venv\Scripts\activate
echo    python run.py
echo.
echo 2. In a new terminal, start the frontend:
echo    cd frontend
echo    npm start
echo.
echo 3. Open http://localhost:3000 in your browser
echo.
pause
