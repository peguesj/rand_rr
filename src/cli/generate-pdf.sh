#!/bin/bash

set -e  # Exit on error

# Default paths
JOB_DESC_PATH=${1:-"job-description.txt"}
RESUME_PATH=${2:-"resume.json"}
OUTPUT_PDF=${3:-"enhanced-resume.pdf"}
TMP_DIR=".tmp"

# Ensure temp directory exists
mkdir -p $TMP_DIR

# Print step info
echo "🔄 Processing job description..."
npm run process-job -- -i "$JOB_DESC_PATH" -o "$TMP_DIR/processed-job.json"

echo "🔄 Finessing resume..."
npm run finesse-resume -- -r "$RESUME_PATH" -j "$TMP_DIR/processed-job.json" -o "$TMP_DIR/enhanced-resume.json"

echo "🔄 Generating PDF..."
# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "Starting server..."
    npm start &
    sleep 5  # Wait for server to start
fi

# Wrap the JSON data in the correct format
echo "{ \"resumeData\": $(cat "$TMP_DIR/enhanced-resume.json") }" > "$TMP_DIR/pdf-request.json"

# Generate PDF using properly formatted JSON
curl -X POST http://localhost:3000/generate-pdf \
  -H "Content-Type: application/json" \
  -d @"$TMP_DIR/pdf-request.json" \
  --output "$OUTPUT_PDF"

# Cleanup
rm -rf $TMP_DIR

echo "✅ Done! Generated PDF: $OUTPUT_PDF"
