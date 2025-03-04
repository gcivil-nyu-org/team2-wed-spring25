#!/bin/bash

# Debugging: Print environment variables
echo "TRAVIS_BRANCH: $TRAVIS_BRANCH"

# Deploy based on the branch
if [ "$TRAVIS_BRANCH" == "main" ]; then
  echo "Deploying to production..."
  ./deploy-to-production.sh
elif [ "$TRAVIS_BRANCH" == "develop" ]; then
  echo "Deploying to develop..."
  ./deploy-to-develop.sh
else
  echo "Skipping deployment for branch $TRAVIS_BRANCH."
  exit 0
fi