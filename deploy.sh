#!/bin/bash

# Debugging: Print environment variables
echo "TRAVIS_BRANCH: $TRAVIS_BRANCH"

# Function to handle deployment errors
handle_error() {
  echo "Error: $1 failed to deploy."
  exit 1
}

# Deploy based on the branch
if [ "$TRAVIS_BRANCH" == "main" ]; then
  echo "Deploying to main..."
  ./deploy-to-production.sh || handle_error "Backend (Production)"
  ./deploy-to-netlify.sh main || handle_error "Frontend (Production)"
elif [ "$TRAVIS_BRANCH" == "develop" ]; then
  echo "Deploying to staging..."
  ./deploy-to-develop.sh || handle_error "Backend (Staging)"
  ./deploy-to-netlify.sh develop || handle_error "Frontend (Staging)"
else
  echo "Skipping deployment for branch $TRAVIS_BRANCH."
  exit 0
fi

echo "Deployment completed successfully!!"