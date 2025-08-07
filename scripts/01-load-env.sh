#!/bin/bash

# Load environment variables from .env file
# Usage: source ./load-env.sh

ENV_FILE="/Users/yarlis/Downloads/rapidtriageME/.env"

if [ -f "$ENV_FILE" ]; then
    echo "Loading environment variables from $ENV_FILE"
    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
else
    echo "❌ .env file not found at $ENV_FILE"
fi