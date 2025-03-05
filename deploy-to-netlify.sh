#!/bin/bash

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

# Deploy to Netlify
echo "Deploying to Netlify ($1)..."
npx netlify deploy --prod --dir=frontend/.next --site=$NETLIFY_SITE_ID --auth=$NETLIFY_AUTH_TOKEN

# Check if the deployment was successful
if [ $? -eq 0 ]; then
  echo "Deployment to Netlify ($1) triggered successfully!"
else
  echo "Failed to trigger deployment to Netlify ($1)."
  exit 1
fi


# netlify.toml
# [[plugins]]
# package = "@netlify/plugin-nextjs"

# [build]
#   command = "npm run build" # or "yarn build"
#   publish = ".next" # This is the default output directory for Next.js builds