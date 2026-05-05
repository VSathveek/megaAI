#!/bin/bash
# Setup script for Mega AI project

echo "🚀 Setting up Mega AI - Real-Time Face Detection..."
echo ""

# Backend setup
echo "📦 Setting up backend..."
cd backend

# Create venv
echo "  Creating virtual environment..."
python -m venv venv

# Activate venv
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install dependencies
echo "  Installing Python dependencies..."
pip install -r requirements.txt -q

echo "  ✓ Backend setup complete"
cd ..

echo ""

# Frontend setup
echo "📦 Setting up frontend..."
cd frontend

echo "  Installing Node dependencies..."
npm install -q

echo "  ✓ Frontend setup complete"
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Start the backend server:"
echo "   cd backend"
echo "   source venv/Scripts/activate  # Windows"
echo "   # or"
echo "   source venv/bin/activate     # macOS/Linux"
echo "   python run.py"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
