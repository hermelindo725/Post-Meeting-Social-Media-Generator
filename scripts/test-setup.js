#!/usr/bin/env node

// Test script to verify the application setup

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'LINKEDIN_CLIENT_ID',
  'LINKEDIN_CLIENT_SECRET',
  'FACEBOOK_CLIENT_ID',
  'FACEBOOK_CLIENT_SECRET',
  'RECALL_API_KEY',
  'OPENAI_API_KEY'
];

console.log('🧪 Testing application setup...\n');

// Check environment variables
console.log('📋 Checking environment variables:');
let allEnvVarsSet = true;

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    allEnvVarsSet = false;
  }
});

if (!allEnvVarsSet) {
  console.log('\n❌ Some environment variables are missing. Please check your .env.local file.');
  process.exit(1);
}

console.log('\n✅ All environment variables are set!');

// Test database connection
console.log('\n🗄️ Testing database connection...');
try {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  prisma.$connect()
    .then(() => {
      console.log('✅ Database connection successful');
      return prisma.$disconnect();
    })
    .then(() => {
      console.log('\n🎉 Setup test completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Run: npm run dev');
      console.log('2. Open: http://localhost:3000');
      console.log('3. Sign in with Google');
      console.log('4. Configure your social media accounts');
      console.log('5. Set up automations');
    })
    .catch((error) => {
      console.log('❌ Database connection failed:', error.message);
      console.log('\n💡 Make sure your database is running and DATABASE_URL is correct.');
      process.exit(1);
    });
} catch (error) {
  console.log('❌ Failed to test database connection:', error.message);
  console.log('\n💡 Make sure you have run: npm install && npx prisma generate');
  process.exit(1);
}
