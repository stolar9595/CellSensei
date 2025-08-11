#!/bin/bash

# Production build script for deployment
echo "Building application for production deployment..."

# Build frontend and backend
npm run build

# Ensure static files are in the correct location for production server
echo "Copying static files to server directory..."
mkdir -p server/public
cp -r dist/public/* server/public/

echo "Production build complete!"
echo "Frontend assets: dist/public/"
echo "Backend bundle: dist/index.js"
echo "Static files copied to: server/public/"
echo ""
echo "Ready for deployment with: npm run start"