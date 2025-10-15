#!/bin/bash

# Script to parse .env secrets file and set environment variables
# Expected .env structure: KEY=VALUE (one per line)
# Lines starting with # are treated as comments and ignored
# Empty lines are ignored

SECRETS_FILE="/run/secrets/build-container-additional-secret/secrets"

echo "parse-secrets.sh: Checking for secrets file at $SECRETS_FILE"

if [ ! -f "$SECRETS_FILE" ]; then
    echo "parse-secrets.sh: Secrets file not found at $SECRETS_FILE"
    exit 0
fi

echo "parse-secrets.sh: Secrets file found, checking readability..."

if [ ! -r "$SECRETS_FILE" ]; then
    echo "Warning: Cannot read secrets file at $SECRETS_FILE (permission denied)"
    echo "Current file permissions: $(ls -la "$SECRETS_FILE" 2>/dev/null || echo 'unable to check')"
    
    # Try to fix permissions if possible (might fail in restricted environments)
    echo "Attempting to fix file permissions..."
    if chmod +r "$SECRETS_FILE" 2>/dev/null; then
        echo "Successfully made file readable, continuing with parsing..."
    else
        echo "Cannot change file permissions, continuing without parsing secrets..."
        # Execute any arguments passed to the script, or just exit if none
        if [ $# -gt 0 ]; then
            exec "$@"
        else
            exit 0
        fi
    fi
fi

# Parse .env file and export environment variables
echo "parse-secrets.sh: Starting to parse secrets file..."
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
            echo "parse-secrets.sh: Set environment variable: $key"
        fi
    fi
done < "$SECRETS_FILE"

echo "parse-secrets.sh: Finished parsing secrets file successfully"

# Execute the command passed as arguments (if any)
if [ $# -gt 0 ]; then
    exec "$@"
fi
