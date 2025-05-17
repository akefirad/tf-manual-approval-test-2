#!/bin/bash

# Create a named pipe (FIFO)
PIPE_FILE="/tmp/terraform_pipe"
rm -f "$PIPE_FILE"  # Remove if exists
mkfifo "$PIPE_FILE"

# Start terraform apply in background and redirect its stdin from the pipe
terraform apply < "$PIPE_FILE" &
TF_PID=$!

# Wait a moment to ensure terraform has started
sleep 2

# Send "yes" to the pipe
echo "no" > "$PIPE_FILE"

# Wait for terraform to complete
wait $TF_PID

# Clean up
rm -f "$PIPE_FILE"
