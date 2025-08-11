# SaskNet Deployment Instructions

## Manual Configuration Required

Since the `.replit` file cannot be edited programmatically, you need to manually configure the deployment section through the Replit interface:

### Step 1: Configure .replit File
Add the following deployment configuration to your `.replit` file:

```toml
[deployment]
run = ["npm", "run", "start"]
deploymentTarget = "cloudrun"
```

### Step 2: Deploy Your Application
1. Click the "Deploy" button in your Replit workspace
2. Select "Cloud Run" as the deployment target
3. The system will use the configuration from your `.replit` file

## Deployment Fixes Applied ✅

The following fixes have been successfully implemented:

### ✅ Production Start Script
- **Status**: Already configured in `package.json`
- **Command**: `npm run start` runs `NODE_ENV=production node dist/index.js`
- **Verification**: Tested and working

### ✅ Production Server Entry Point  
- **Status**: Configured and tested
- **Location**: `server/index.ts` with production static serving
- **Features**: 
  - Listens on `0.0.0.0:5000` (required for Cloud Run)
  - Serves built assets from `dist/public/`
  - Proper error handling and environment detection

### ✅ TypeScript Configuration
- **Status**: Updated for production builds
- **Changes**: Added `ts-node` ESM configuration
- **Verification**: Build process works correctly

### ✅ Build Process Verification
- **Frontend Build**: Creates optimized assets in `dist/public/`
- **Backend Build**: Bundles server to `dist/index.js`
- **Build Command**: `npm run build` (Vite + ESBuild)
- **Output Structure**: 
  ```
  dist/
  ├── index.js          (bundled server)
  └── public/           (static assets)
      ├── index.html
      └── assets/
  ```

## Next Steps

1. **Add the deployment section to `.replit` file** (manual step required)
2. **Click Deploy in Replit interface** to initiate Cloud Run deployment
3. **Monitor deployment logs** for any environment-specific issues

## Troubleshooting

If deployment fails after adding the `.replit` configuration:

1. **Check Environment Variables**: Ensure `DATABASE_URL` is available in production
2. **Verify Build Assets**: Confirm `dist/` directory contains both `index.js` and `public/`
3. **Test Locally**: Run `npm run build && npm run start` to verify production build
4. **Check Port Configuration**: Server should listen on `process.env.PORT` or default to 5000

The application is now fully configured for Cloud Run deployment. All code-level fixes have been applied successfully.