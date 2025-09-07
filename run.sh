#!/bin/bash

echo "🚀 Starting Post-Meeting Social Media Generator..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cp env.example .env.local
    echo
    echo "📝 Please edit .env.local with your API keys and database URL"
    echo
    read -p "Press Enter to continue after editing .env.local..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

# Check database connection
echo "🔍 Checking database connection..."
npx prisma db push --preview-feature
if [ $? -ne 0 ]; then
    echo "❌ Database connection failed. Please check your DATABASE_URL in .env.local"
    echo
    echo "💡 Quick database setup options:"
    echo "   1. Use Neon (free): https://neon.tech"
    echo "   2. Use Supabase (free): https://supabase.com"
    echo "   3. Install PostgreSQL locally"
    echo
    exit 1
fi

# Start the application
echo "🚀 Starting the application..."
echo
echo "✅ Application will be available at: http://localhost:3000"
echo "✅ Press Ctrl+C to stop the application"
echo
npm run dev
