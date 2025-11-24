# 🚀 Deployment Guide

This guide will help you deploy your backend application to various hosting platforms.

## 📋 Pre-Deployment Checklist

- [ ] All environment variables are set in your hosting platform
- [ ] Database is set up and migrations are run
- [ ] `NODE_ENV` is set to `production`
- [ ] Strong JWT secrets are generated
- [ ] CORS is configured for your frontend domain
- [ ] File uploads directory is configured (if using persistent storage)

## 🔧 Environment Variables Setup

### Required Variables

These variables **MUST** be set in your hosting platform:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-strong-secret-key-here
JWT_REFRESH_SECRET=your-strong-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RESEND_API_KEY=re_your-resend-api-key
MAIL_FROM_EMAIL=noreply@yourdomain.com
MAIL_FROM_NAME=Your App Name
ADMIN_EMAIL=admin@yourdomain.com
FRONTEND_URL=https://your-frontend-domain.com
```

### Optional Variables

```env
# Server Configuration
# Most platforms provide PORT automatically - you don't need to set it
# SERVER_HOST can be omitted - server will listen on all interfaces (0.0.0.0)
PORT=3000  # Usually provided by platform
SERVER_HOST=0.0.0.0  # Optional - defaults to all interfaces

# OAuth (if using)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Payments (if using)
PAYMONGO_PUBLIC_KEY=your-paymongo-public-key
PAYMONGO_SECRET_KEY=your-paymongo-secret-key
```

## 🌐 Server Host & Port Configuration

### ✅ **You DON'T need to set SERVER_HOST for deployment!**

The server is configured to:

- **Automatically listen on all network interfaces (0.0.0.0)** when `SERVER_HOST` is not set
- **Use PORT environment variable** (provided by most platforms) or fall back to `SERVER_PORT`
- This works perfectly with Railway, Render, Heroku, Vercel, and most other platforms

### How It Works

1. **PORT Variable**: Most deployment platforms (Railway, Render, Heroku) automatically provide a `PORT` environment variable. The server will use this automatically.

2. **SERVER_HOST**:

   - **For deployment**: Leave it unset or set to `0.0.0.0` (listens on all interfaces)
   - **For local development**: Set to `localhost` if you want to restrict access

3. **No Manual Forking Needed**: Deployment platforms handle process management automatically. You don't need PM2 or manual forking.

## 📦 Deployment Platforms

### Railway

1. **Connect Repository**: Link your GitHub repository to Railway
2. **Add PostgreSQL**: Add a PostgreSQL service in Railway
3. **Set Environment Variables**: Add all required environment variables
4. **Deploy**: Railway will automatically detect Node.js and deploy

**Railway automatically provides:**

- `PORT` environment variable
- `DATABASE_URL` (if you add PostgreSQL service)

**No need to set:**

- `SERVER_HOST` (leave unset)
- `PORT` (Railway provides it)

### Render

1. **Create Web Service**: Connect your GitHub repository
2. **Build Command**: `pnpm install` (or `npm install`)
3. **Start Command**: `pnpm start` (or `npm start`)
4. **Add PostgreSQL**: Add PostgreSQL database service
5. **Set Environment Variables**: Add all required variables

**Render automatically provides:**

- `PORT` environment variable
- `DATABASE_URL` (if you add PostgreSQL service)

**No need to set:**

- `SERVER_HOST` (leave unset)
- `PORT` (Render provides it)

### Heroku

1. **Create App**: `heroku create your-app-name`
2. **Add PostgreSQL**: `heroku addons:create heroku-postgresql:hobby-dev`
3. **Set Environment Variables**: `heroku config:set KEY=value`
4. **Deploy**: `git push heroku main`

**Heroku automatically provides:**

- `PORT` environment variable
- `DATABASE_URL` (if you add PostgreSQL)

**No need to set:**

- `SERVER_HOST` (leave unset)
- `PORT` (Heroku provides it)

### Vercel

1. **Install Vercel CLI**: `npm i -g vercel`
2. **Deploy**: `vercel`
3. **Set Environment Variables**: In Vercel dashboard or via CLI

**Note**: Vercel is serverless. You may need to adjust for file uploads (use external storage like S3).

### DigitalOcean App Platform

1. **Create App**: Connect your GitHub repository
2. **Add Database**: Add PostgreSQL database
3. **Set Environment Variables**: In the dashboard
4. **Deploy**: Automatic on git push

**DigitalOcean automatically provides:**

- `PORT` environment variable
- `DATABASE_URL` (if you add PostgreSQL)

## 🗄️ Database Setup

### Running Migrations

Before deploying, ensure your database migrations are run:

```bash
# Using pnpm
pnpm drizzle-kit migrate

# Using npm
npm run drizzle-kit migrate
```

**For deployment platforms**, you can:

1. Run migrations manually after deployment
2. Add a build script to run migrations automatically
3. Use a one-off command/script provided by your platform

### Example: Adding Migration to Build Process

Add to `package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "migrate": "drizzle-kit migrate",
    "postinstall": "pnpm migrate"
  }
}
```

⚠️ **Warning**: Running migrations on every install might cause issues. Consider running migrations manually or using platform-specific deployment scripts.

## 📁 File Uploads

### Important Considerations

Your application stores uploaded files in the `uploads/` directory. This has implications:

1. **Ephemeral Storage**: Most platforms have ephemeral file systems. Files will be lost on restart/redeploy.

2. **Solutions**:
   - **Use Cloud Storage**: AWS S3, Cloudinary, or similar
   - **Persistent Volumes**: Some platforms (Railway, DigitalOcean) support persistent volumes
   - **Database Storage**: Store files as base64 in database (not recommended for large files)

### Recommended: Use Cloud Storage

Consider migrating to cloud storage for production:

- AWS S3
- Cloudinary
- Google Cloud Storage
- Azure Blob Storage

## 🔒 Security Checklist

- [ ] `NODE_ENV=production` is set
- [ ] Strong JWT secrets (32+ characters, random)
- [ ] Database credentials are secure
- [ ] CORS is configured for your frontend domain only
- [ ] Rate limiting is enabled (currently commented out - consider enabling)
- [ ] HTTPS is enabled (most platforms do this automatically)
- [ ] Environment variables are not committed to git

## 🧪 Testing After Deployment

1. **Health Check**: Visit `https://your-domain.com/`

   - Should return: `{"message": "Backend Authentication Server is running!", "status": "healthy", ...}`

2. **API Endpoints**: Test your API endpoints

   - Authentication endpoints
   - Product endpoints
   - User endpoints

3. **CORS**: Verify CORS works with your frontend

4. **File Uploads**: Test file upload functionality (if applicable)

## 🐛 Troubleshooting

### Server Won't Start

- Check environment variables are set correctly
- Verify `DATABASE_URL` is correct
- Check logs for specific error messages
- Ensure `NODE_ENV` is set

### Port Already in Use

- Most platforms handle this automatically
- If you see this error, check if you're setting `PORT` manually (you shouldn't need to)

### Database Connection Errors

- Verify `DATABASE_URL` is correct
- Check database is accessible from your hosting platform
- Ensure database migrations are run
- Check firewall/network settings

### CORS Errors

- Update `FRONTEND_URL` in environment variables
- Check `config/cors.js` - ensure your frontend URL is allowed
- Verify CORS headers in response

### File Upload Issues

- Check if platform supports persistent storage
- Consider migrating to cloud storage
- Verify file size limits

## 📝 Quick Reference

### Environment Variables Summary

| Variable             | Required | Default   | Notes                                    |
| -------------------- | -------- | --------- | ---------------------------------------- |
| `NODE_ENV`           | ✅       | -         | Set to `production`                      |
| `PORT`               | ❌       | 3000      | Usually provided by platform             |
| `SERVER_HOST`        | ❌       | undefined | Omit for deployment (listens on 0.0.0.0) |
| `DATABASE_URL`       | ✅       | -         | PostgreSQL connection string             |
| `JWT_SECRET`         | ✅       | -         | Strong secret key                        |
| `JWT_REFRESH_SECRET` | ✅       | -         | Strong secret key                        |
| `FRONTEND_URL`       | ✅       | -         | Your frontend domain                     |
| `RESEND_API_KEY`     | ✅       | -         | Resend API key for email service         |
| `MAIL_FROM_EMAIL`    | ✅       | -         | Email address to send from               |
| `MAIL_FROM_NAME`     | ❌       | -         | Display name for sender (optional)       |
| `ADMIN_EMAIL`        | ✅       | -         | Admin email for contact form submissions |

### Common Commands

```bash
# Local development
pnpm dev

# Production (local)
NODE_ENV=production pnpm start

# Run migrations
pnpm drizzle-kit migrate

# Generate migrations
pnpm drizzle-kit generate
```

## ✅ Summary

**For Deployment, You Need:**

1. ✅ Set all required environment variables in your platform
2. ✅ Set `NODE_ENV=production`
3. ✅ Run database migrations
4. ❌ **DON'T set SERVER_HOST** (leave it unset - server handles it)
5. ❌ **DON'T set PORT** (platform provides it automatically)
6. ❌ **DON'T manually fork** (platform handles process management)

The server is now configured to work seamlessly with modern deployment platforms! 🎉
