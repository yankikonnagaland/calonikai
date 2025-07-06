# Google OAuth Debug Guide - Calonik

## Current Status
Based on the logs, Google OAuth is failing after the authentication flow starts. Here are the steps to diagnose and fix the issue:

## Step 1: Check Current Configuration
The system is configured with callback URL:
```
https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api/auth/google/callback
```

## Step 2: Google Cloud Console Fix
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "APIs & Services" > "Credentials"
3. Find your OAuth 2.0 Client ID
4. Click "Edit" (pencil icon)
5. In "Authorized redirect URIs", ensure this exact URL is added:
   ```
   https://951c9b0b-a7e6-4243-ad92-b80de619ea52-00-2w9g548p0tyi.worf.replit.dev/api/auth/google/callback
   ```
6. Click "Save"
7. Wait 5-10 minutes for changes to propagate

## Step 3: Test the Flow
1. Open the authentication modal
2. Click "Continue with Google"
3. Check browser console for detailed logs
4. Check server logs for OAuth callback details

## Step 4: Common Issues & Solutions

### Issue: "redirect_uri_mismatch"
**Fix:** Add the exact callback URL to Google Console (Step 2)

### Issue: "invalid_client"
**Fix:** Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Replit secrets

### Issue: User created but session not saved
**Fix:** Database/session store issue - check PostgreSQL connection

### Issue: Popup blocked
**Fix:** Allow popups in browser settings

## Step 5: Enhanced Debugging
I've added detailed logging to help identify the issue:
- OAuth profile data logging
- Callback parameter logging
- User creation/update logging
- Error message improvements

## Step 6: Alternative Solutions
If OAuth continues failing:

1. **Reset OAuth App:**
   - Create new OAuth 2.0 Client ID in Google Console
   - Update Replit secrets with new credentials

2. **Manual Testing:**
   - Test direct OAuth URL: `/api/auth/google`
   - Check if Google authentication page loads

3. **Fallback Authentication:**
   - Use email/password registration temporarily
   - Enable Google OAuth after fixing configuration

## Expected Success Flow
1. User clicks "Continue with Google"
2. Popup opens to Google OAuth page
3. User authenticates with Google
4. Google redirects to callback URL
5. Server processes profile and creates/updates user
6. User is logged in and popup closes
7. Main page refreshes with authenticated state

## Next Steps
Try the Google Console fix first (Steps 1-2), then test the authentication flow. The enhanced logging will show exactly where the process is failing.