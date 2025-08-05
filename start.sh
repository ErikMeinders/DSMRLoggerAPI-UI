#!/bin/bash

sudo nginx -c `pwd`/ngnix.conf    

# Start Swagger UI container
echo "📦 Starting Swagger UI Docker container on port 8080..."
docker run --rm \
  -p 8080:8080 \
  -e SWAGGER_JSON=/data/openapi.yaml \
  -v "$PWD:/data" \
  swaggerapi/swagger-ui &

# Instructie
echo ""
echo "✅ Swagger UI is now available at: http://localhost:8080"
echo "🧩 API calls are routed through: http://localhost:8090/api → http://192.168.2.234/api"
echo ""
echo "🛑 Press CTRL+C to stop everything."
wait
