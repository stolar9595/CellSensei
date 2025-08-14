#!/bin/bash

echo "=== Deployment Verification Script ==="
echo ""

# Check 1: Production build exists
echo "✓ Checking production build..."
if [ -f "dist/index.js" ] && [ -d "dist/public" ]; then
    echo "  ✅ Production build exists"
else
    echo "  ❌ Production build missing - run 'npm run build'"
    exit 1
fi

# Check 2: Static assets exist
echo "✓ Checking static assets..."
if [ -f "dist/public/index.html" ] && [ -d "dist/public/assets" ]; then
    echo "  ✅ Static assets present"
else
    echo "  ❌ Static assets missing"
    exit 1
fi

# Check 3: Test production server
echo "✓ Testing production server..."
NODE_ENV=production timeout 3s node dist/index.js > /dev/null 2>&1
if [ $? -eq 124 ]; then
    echo "  ✅ Server starts successfully"
else
    echo "  ❌ Server failed to start"
    exit 1
fi

echo ""
echo "=== All deployment checks passed ✅ ==="
echo ""
echo "Deployment Configuration Required:"
echo "1. Add to .replit file:"
echo "   [deployment]"
echo "   run = [\"npm\", \"run\", \"start\"]"
echo "   deploymentTarget = \"cloudrun\""
echo ""
echo "2. Set deployment type to 'Autoscale/Cloud Run' in Deployments pane"
echo "3. Click Deploy button"
