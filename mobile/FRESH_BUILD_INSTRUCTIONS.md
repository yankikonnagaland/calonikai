# Fresh EAS Build Instructions for Calonik.ai

## Problem
The EAS project is trying to use the "calonik-team" account instead of your personal account.

## Solution Steps

### 1. Clear all cached data
```bash
cd mobile
rm -rf node_modules package-lock.json .expo
```

### 2. Install fresh dependencies
```bash
npm install expo@~51.0.8 expo-status-bar@~1.12.1 react@18.2.0 react-native@0.74.5 @babel/core@^7.20.0
```

### 3. Check your EAS login
```bash
eas whoami
```
Make sure this shows YOUR personal account, not "calonik-team"

### 4. Initialize fresh project (Alternative method)
If `eas project:init` still fails, try this bypass method:

```bash
npx create-expo-app --template blank-typescript temp-app
cd temp-app
eas project:init
```

This creates a temporary project to generate a fresh EAS project ID. Then copy the generated project configuration back to your main app.

### 5. Direct build attempt
Sometimes you can skip project:init and go directly to build:

```bash
eas build --platform ios --profile production --non-interactive
```

### 6. Manual project configuration
If all else fails, manually create the project:

1. Go to https://expo.dev/accounts/[your-username]/projects
2. Click "Create Project"
3. Enter project name: "calonik-ai-tracker"
4. Copy the project ID and add it to your app.json:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-new-project-id"
      }
    }
  }
}
```

## Expected Result
After completing these steps, you should be able to run:
```bash
eas build --platform ios --profile production
```

And receive a successful build that generates an .ipa file for App Store submission.