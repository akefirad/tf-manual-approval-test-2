#!/bin/bash

# Check if expect is installed
if ! command -v expect &> /dev/null; then
    echo "expect is not installed, installing..."
    sudo apt-get update
    sudo apt-get install -y expect
fi

# Create a named pipe (FIFO)
PIPE_FILE="/tmp/terraform_pipe"
rm -f "$PIPE_FILE"  # Remove if exists
mkfifo "$PIPE_FILE"

# Start the expect script in background
./terraform-apply.exp & EXPECT_PID=$!
echo "The expect script started with PID: $EXPECT_PID"

# Wait a moment to ensure terraform has started
sleep 10

# Send "no" to the pipe
echo "yes" > "$PIPE_FILE" &

# Wait for expect to complete
wait $EXPECT_PID

# Clean up
rm -f "$PIPE_FILE"
