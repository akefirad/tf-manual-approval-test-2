#!/usr/bin/env -S uv run --script

# /// script
# dependencies = [
#   "pexpect",
# ]
# ///

import pexpect
import sys
import os

_env = os.environ.copy()
_env['TF_LOG'] = 'trace'
_env['TERM'] = 'xterm-256color'

child = pexpect.spawn(
    'terraform apply',
    encoding='utf-8',
    echo=False,
    env=_env
)

child.logfile = sys.stdout

try:
    child.expect('Do you want to perform these actions.*\\?')
    child.sendline('yes')

    child.expect(pexpect.EOF)
except pexpect.exceptions.TIMEOUT:
    print("Timeout waiting for Terraform prompt.")
    child.terminate()
    sys.exit(1)
except pexpect.exceptions.EOF:
    print("Process ended unexpectedly")
    child.terminate()
    sys.exit(1)
