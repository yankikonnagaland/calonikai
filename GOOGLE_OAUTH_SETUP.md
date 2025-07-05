# Google OAuth Setup Guide for Calonik

## Current Issue
Google OAuth is failing because the callback URL is not registered in your Google Cloud Console OAuth app.

**Current callback URL:** `https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api/auth/google/callback`

## Fix Steps

### 1. Access Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. Select your project (or create one if needed)
3. Navigate to "APIs & Services" > "Credentials"

### 2. Configure OAuth 2.0 Client
1. Find your OAuth 2.0 Client ID (the one matching your GOOGLE_CLIENT_ID)
2. Click "Edit" (pencil icon)
3. In "Authorized redirect URIs" section, add:
   ```
   https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api/auth/google/callback
   ```
4. Click "Save"

### 3. Test the Fix
1. Wait 5-10 minutes for changes to propagate
2. Try logging in again through Google OAuth
3. You should now be redirected properly

## For Production (calonik.ai)
When deploying to calonik.ai, also add:
```
https://calonik.ai/api/auth/google/callback
```

## Alternative: Create New OAuth App
If you don't have access to the existing OAuth app:

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Application type: "Web application"
4. Name: "Calonik Development"
5. Authorized redirect URIs:
   ```
   https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api/auth/google/callback
   https://calonik.ai/api/auth/google/callback
   ```
6. Copy the new Client ID and Client Secret
7. Update your Replit secrets:
   - GOOGLE_CLIENT_ID: [new client id]
   - GOOGLE_CLIENT_SECRET: [new client secret]

## Environment Variables Check
Ensure these secrets are set in Replit:
- ✓ GOOGLE_CLIENT_ID (confirmed present)
- ✓ GOOGLE_CLIENT_SECRET (confirmed present)

## Testing OAuth Flow
1. Visit: `https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api/auth/google`
2. Should redirect to Google login
3. After login, should redirect back to your app successfully

## Common Issues
- **"redirect_uri_mismatch"**: URI not registered in Google Console
- **"invalid_client"**: Wrong Client ID/Secret
- **"access_denied"**: User canceled or app not verified

The most likely issue is the redirect URI not being registered. Follow steps 1-2 above to fix this.