#!/usr/bin/env sh

# This plugin always finds one static "refactoring instance" per commit.

# Write to stderr to output some logs.
echo "Some logging output" 1>&2

# Output a JSON array to stdout.
echo '[
  {
    "type": "Extract Method",
    "description": "Extracted method m1() from m2(String)",
    "extractMethod": {
      "sourceMethodLines": 10,
      "extractedLines": 5,
      "sourceMethodsCount": 2
    }
  }
]'
