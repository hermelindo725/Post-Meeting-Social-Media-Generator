@echo off
echo 🚀 Starting Post-Meeting Social Media Generator...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if .env.local exists
if not exist .env.local (
    echo ⚠️  .env.local not found. Creating from template...
    copy env.example .env.local
    echo.
    echo 📝 Please edit .env.local with your API keys and database URL
    echo.
    pause
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Generate Prisma client
echo 🗄️  Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

REM Check database connection
echo 🔍 Checking database connection...
call npx prisma db push --preview-feature
if %errorlevel% neq 0 (
    echo ❌ Database connection failed. Please check your DATABASE_URL in .env.local
    echo.
    echo 💡 Quick database setup options:
    echo    1. Use Neon (free): https://neon.tech
    echo    2. Use Supabase (free): https://supabase.com
    echo    3. Install PostgreSQL locally
    echo.
    pause
    exit /b 1
)

REM Start the application
echo 🚀 Starting the application...
echo.
echo ✅ Application will be available at: http://localhost:3000
echo ✅ Press Ctrl+C to stop the application
echo.
call npm run dev
