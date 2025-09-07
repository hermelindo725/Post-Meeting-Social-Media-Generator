# Deployment Guide

This guide will help you deploy the Post-Meeting Social Media Content Generator application.

## Quick Deploy to Vercel (Recommended)

### 1. Prepare Your Repository

1. Push your code to GitHub
2. Make sure all environment variables are documented in `env.example`

### 2. Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables in Vercel dashboard:
   ```
   DATABASE_URL=your_postgresql_connection_string
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   LINKEDIN_CLIENT_ID=your-linkedin-client-id
   LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
   FACEBOOK_CLIENT_ID=your-facebook-client-id
   FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
   RECALL_API_KEY=your-recall-api-key
   OPENAI_API_KEY=your-openai-api-key
   ```
4. Deploy!

### 3. Set Up Database

1. Create a PostgreSQL database (recommended: [Neon](https://neon.tech) or [Supabase](https://supabase.com))
2. Update `DATABASE_URL` in Vercel with your database connection string
3. Run database migrations:
   ```bash
   npx prisma db push
   ```

## Alternative Deployment Options

### Railway

1. Connect your GitHub repository to [Railway](https://railway.app)
2. Add environment variables
3. Railway will automatically detect Next.js and deploy

### Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables

### DigitalOcean App Platform

1. Create a new app on [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Connect your GitHub repository
3. Configure build settings:
   - Build command: `npm run build`
   - Run command: `npm start`
4. Add environment variables

## OAuth Setup for Production

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Update OAuth 2.0 credentials:
   - Add production redirect URI: `https://your-domain.com/api/auth/callback/google`
   - Add `webshookeng@gmail.com` as a test user
3. Enable Google Calendar API

### LinkedIn OAuth

1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Update OAuth 2.0 settings:
   - Add production redirect URI: `https://your-domain.com/api/social/callback/linkedin`
3. Request access to required scopes

### Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Update OAuth redirect URIs:
   - Add production URI: `https://your-domain.com/api/social/callback/facebook`
3. Request required permissions

## Database Setup

### Using Neon (Recommended)

1. Create account at [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Update `DATABASE_URL` in your deployment platform

### Using Supabase

1. Create account at [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Update `DATABASE_URL` in your deployment platform

### Using Railway PostgreSQL

1. Add PostgreSQL service to your Railway project
2. Copy the connection string from the service
3. Update `DATABASE_URL` in your deployment platform

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | Your app's URL (e.g., https://your-app.vercel.app) | Yes |
| `NEXTAUTH_SECRET` | Random secret for NextAuth.js | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth client ID | Yes |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth client secret | Yes |
| `FACEBOOK_CLIENT_ID` | Facebook OAuth client ID | Yes |
| `FACEBOOK_CLIENT_SECRET` | Facebook OAuth client secret | Yes |
| `RECALL_API_KEY` | Recall.ai API key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] OAuth applications configured with production URLs
- [ ] Environment variables set correctly
- [ ] Test user `webshookeng@gmail.com` added to Google OAuth
- [ ] Application accessible via HTTPS
- [ ] All API endpoints responding correctly
- [ ] Social media connections working
- [ ] Calendar integration functional

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check if database allows external connections
   - Ensure database exists and is accessible

2. **OAuth Errors**
   - Verify redirect URIs match exactly
   - Check if OAuth apps are in production mode
   - Ensure required scopes are granted

3. **Build Errors**
   - Check if all dependencies are in `package.json`
   - Verify TypeScript compilation
   - Check for missing environment variables

4. **API Errors**
   - Verify all API keys are valid
   - Check rate limits on external APIs
   - Ensure proper error handling

### Getting Help

If you encounter issues:

1. Check the application logs in your deployment platform
2. Verify all environment variables are set
3. Test API endpoints individually
4. Check browser console for client-side errors

## Security Considerations

- Use HTTPS in production
- Keep API keys secure and never commit them to version control
- Regularly rotate secrets and API keys
- Monitor usage and set up alerts for unusual activity
- Use environment-specific OAuth applications

## Monitoring and Maintenance

- Set up monitoring for your application
- Monitor API usage and costs
- Regularly update dependencies
- Backup your database regularly
- Monitor error rates and performance
