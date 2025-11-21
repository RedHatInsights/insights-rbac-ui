#!/bin/bash

# Script to parse .env secrets file and set environment variables
# Expected .env structure: KEY=VALUE (one per line)
# Lines starting with # are treated as comments and ignored
# Empty lines are ignored

SECRETS_FILE="/run/secrets/build-container-additional-secret/secrets"

if [ ! -f "$SECRETS_FILE" ]; then
    echo "Error: Secrets file not found at $SECRETS_FILE"
    exit 0
fi

# Parse .env file and export environment variables
while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip empty lines and comments
    if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Check if line contains = and split into key=value
    if [[ "$line" =~ ^[^=]+= ]]; then
        # Extract key and value
        key="${line%%=*}"
        value="${line#*=}"
        
        # Remove any leading/trailing whitespace from key
        key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        
        if [[ -n "$key" ]]; then
            export "$key"="$value"
            echo "Set environment variable: $key"
        fi
    fi
done < "$SECRETS_FILE"

# Execute the command passed as arguments
exec "$@"
