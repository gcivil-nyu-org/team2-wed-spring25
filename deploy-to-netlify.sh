#!/bin/bash

# Debugging: Print current directory
echo "Current directory: $(pwd)"

# Debugging: Print environment variables
echo "TRAVIS_BRANCH: $TRAVIS_BRANCH"
echo "NETLIFY_SITE_ID: $NETLIFY_SITE_ID"
echo "NETLIFY_AUTH_TOKEN: $NETLIFY_AUTH_TOKEN"

# Set Netlify site ID and auth token based on the environment
if [ "$1" == "main" ]; then
  NETLIFY_SITE_ID=$NETLIFY_PRODUCTION_SITE_ID
  NETLIFY_AUTH_TOKEN=$NETLIFY_PRODUCTION_AUTH_TOKEN
elif [ "$1" == "develop" ]; then
  NETLIFY_SITE_ID=$NETLIFY_DEVELOP_SITE_ID
  NETLIFY_AUTH_TOKEN=$NETLIFY_DEVELOP_AUTH_TOKEN
else
  echo "Invalid environment. Usage: ./deploy-to-netlify.sh [production|develop]"
  exit 1
fi

# Store the current directory
ORIGINAL_DIR=$(pwd)

# Change to the frontend directory
echo "Changing to frontend directory..."
cd frontend || { echo "Failed to change to frontend directory"; exit 1; }

# Debugging: Print current directory after changing
echo "Current directory after changing: $(pwd)"

# Deploy to Netlify
echo "Deploying to Netlify ($1)..."
npx netlify-cli deploy --build --prod --site=$NETLIFY_SITE_ID --auth=$NETLIFY_AUTH_TOKEN

# Check if the deployment was successful
if [ $? -eq 0 ]; then
  echo "Deployment to Netlify ($1) triggered successfully!"
else
  echo "Failed to trigger deployment to Netlify ($1)."
  cd "$ORIGINAL_DIR" # Restore the original directory before exiting
  exit 1
fi

# Restore the original directory
cd "$ORIGINAL_DIR"
echo "Restored to original directory: $(pwd)"

# netlify.toml
# [[plugins]]
# package = "@netlify/plugin-nextjs"

# [build]
#   command = "npm run build" # or "yarn build"
#   publish = ".next" # This is the default output directory for Next.js builds