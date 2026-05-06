#!/usr/bin/env bash
# Runs once when LocalStack reports ready. Mirrors the real R2 bucket layout.
set -euo pipefail

awslocal s3api create-bucket --bucket beauty-diary-media || true
awslocal s3api put-bucket-cors --bucket beauty-diary-media --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "http://localhost:23000"],
      "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

echo "[localstack] bucket beauty-diary-media ready"
