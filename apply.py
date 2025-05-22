#!/usr/bin/env -S uv run --script

# /// script
# dependencies = [
# ]
# ///

import os
import pty
import sys
import select
import termios
import tty
import struct
import fcntl

_env = os.environ.copy()
_env['TF_LOG'] = 'trace'

def set_winsize(fd, row, col, xpix=0, ypix=0):
    winsize = struct.pack("HHHH", row, col, xpix, ypix)
    fcntl.ioctl(fd, termios.TIOCSWINSZ, winsize)

# Create a pseudo-terminal
master, slave = pty.openpty()
set_winsize(master, 24, 80)  # Set a reasonable terminal size

# Set up the slave terminal
tty.setraw(slave)
termios.tcsetattr(slave, termios.TCSANOW, termios.tcgetattr(slave))

# Start terraform in the pseudo-terminal
pid = os.fork()
if pid == 0:  # Child process
    os.close(master)
    os.setsid()  # Create new session
    os.dup2(slave, 0)  # stdin
    os.dup2(slave, 1)  # stdout
    os.dup2(slave, 2)  # stderr
    os.close(slave)
    
    # Make this the controlling terminal
    try:
        fcntl.ioctl(0, termios.TIOCSCTTY, 0)
    except OSError:
        pass  # Ignore if it fails
        
    os.execvpe('terraform', ['terraform', 'apply'], _env)

# Parent process
os.close(slave)

# Set up non-blocking mode
fcntl.fcntl(master, fcntl.F_SETFL, os.O_NONBLOCK)

# Read and write loop
buffer = ""
while True:
    try:
        r, w, e = select.select([master], [], [], 0.1)
        if master in r:
            data = os.read(master, 1024).decode('utf-8')
            if not data:
                break
            sys.stdout.write(data)
            sys.stdout.flush()
            buffer += data
            
            if "Do you want to perform these actions?" in buffer:
                os.write(master, b'yes\n')
                buffer = ""
    except (OSError, IOError):
        break

# Clean up
os.close(master)
os.waitpid(pid, 0)
