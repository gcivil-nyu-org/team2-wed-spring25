#!/bin/bash

# Deploy to Render
# Replace with your Render service ID and API key
RENDER_SERVICE_ID="srv-curvftrv2p9s73aq6k30"
RENDER_API_KEY=$RENDER_API_KEY

# Trigger a deployment on Render
curl -s -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys" \
  -d '{
        "clearCache": "clear"
      }'

echo "Deployment to Render triggered!"