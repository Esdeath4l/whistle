# Deployment Troubleshooting Guide

## Issue: Reports Not Showing After Deployment

### Root Cause
The application was originally using **in-memory storage** which gets wiped every time the server restarts. Cloud platforms like Render restart containers frequently, causing all data to be lost.

### Solutions Implemented

#### 1. File-Based Persistent Storage
- Added file storage system that saves reports to disk
- Uses `/tmp/whistle-data` in production for better compatibility
- Automatically creates data directory if it doesn't exist

#### 2. Storage Adapter Pattern
- Created flexible storage system (`server/lib/storage.ts`)
- Can switch between file storage and environment variable storage
- Easy to extend for database integration later

### Deployment Options

#### Option A: Deploy on Render (Recommended for production)
1. **Use the included `render.yaml` configuration**
2. **Set environment variables in Render dashboard:**
   - `NODE_ENV=production`
   - Optionally: `WHISTLE_USE_ENV_STORAGE=true` (for environment variable fallback)

3. **Deploy commands:**
   - Build Command: `npm run build`
   - Start Command: `npm start`

#### Option B: Continue with Netlify
The current setup has Netlify Functions configuration. If you want to keep using Netlify:
1. Use the existing `netlify.toml` configuration
2. Deploy via Netlify CLI or GitHub integration
3. Note: Netlify Functions have limitations with file persistence

### Testing the Fix

#### 1. Debug Endpoint
Visit `/api/debug` to check:
- Environment settings
- Data directory paths  
- File existence status

#### 2. Check Server Logs
Look for these log messages:
- `Initialized with X reports`
- `Loading reports from: [path]`
- `Saved X reports to: [path]`

#### 3. Test Admin Dashboard
1. Go to `/admin`
2. Login with: `ritika` / `satoru 2624`
3. Check if reports are displayed
4. Submit a test report and verify it appears

### Common Issues & Solutions

#### Issue: "No reports found" in admin dashboard
**Causes:**
- Server restarted and file storage was reset
- Wrong storage path in production
- Permission issues with data directory

**Solutions:**
1. Check `/api/debug` endpoint for storage info
2. Verify server logs for storage errors
3. Submit a test report to see if new reports work

#### Issue: Reports disappear after deployment
**Causes:**
- Using ephemeral file system
- Container restarts clearing `/tmp`

**Solutions:**
1. Use a database (PostgreSQL, MongoDB, etc.)
2. Use external storage (AWS S3, Google Cloud Storage)
3. Use environment variables as temporary fallback

### Recommended Production Setup

For a production application, implement proper database storage:

1. **Add PostgreSQL database:**
   ```bash
   npm install pg @types/pg
   ```

2. **Set up database connection:**
   ```typescript
   // server/lib/database.ts
   import { Pool } from 'pg';
   
   export const db = new Pool({
     connectionString: process.env.DATABASE_URL,
   });
   ```

3. **Create reports table:**
   ```sql
   CREATE TABLE reports (
     id VARCHAR PRIMARY KEY,
     message TEXT,
     category VARCHAR,
     severity VARCHAR,
     photo_url TEXT,
     created_at TIMESTAMP,
     status VARCHAR,
     admin_response TEXT,
     admin_response_at TIMESTAMP,
     admin_responses JSONB,
     encrypted_data JSONB,
     is_encrypted BOOLEAN
   );
   ```

### Environment Variables

Set these in your Render dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Sets production environment |
| `PORT` | (auto-set by Render) | Server port |
| `WHISTLE_USE_ENV_STORAGE` | `true` | Use env vars as storage fallback |
| `DATABASE_URL` | (if using database) | Database connection string |

### Monitoring

- Check `/api/ping` for server health
- Check `/api/debug` for storage diagnostics
- Monitor server logs for storage errors
- Test admin dashboard regularly

### Next Steps

1. **Immediate**: Deploy with current file storage fix
2. **Short-term**: Monitor file persistence on your hosting platform
3. **Long-term**: Migrate to proper database storage for production reliability
