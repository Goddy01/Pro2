#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage (choose one input method):
  ./encode-ga-private-key-gitbash.sh --key "<private_key_string>"
  ./encode-ga-private-key-gitbash.sh --key-file "<path/to/key.txt>"
  ./encode-ga-private-key-gitbash.sh < "<path/to/key.txt>"

Input must be the GA service account JSON 'private_key' value.
The script also supports keys where newlines are represented as literal '\n' sequences;
it converts those to real newlines before base64 encoding.

Output:
  Prints base64 string for GOOGLE_PRIVATE_KEY_BASE64
EOF
}

key=""
key_file=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --key)
      key="${2:-}"
      shift 2
      ;;
    --key-file)
      key_file="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -n "$key_file" ]]; then
  if [[ ! -f "$key_file" ]]; then
    echo "Key file not found: $key_file" >&2
    exit 1
  fi
  key="$(cat "$key_file")"
elif [[ -z "$key" ]]; then
  # Read entire stdin.
  key="$(cat)"
fi

if [[ -z "$key" ]]; then
  echo "No private key input provided." >&2
  usage >&2
  exit 1
fi

# If your key contains literal backslash-n sequences, convert them to real newlines.
# This makes the result compatible with libraries expecting PEM newlines.
key="${key//\\n/$'\n'}"
# Normalize Windows CRLF just in case.
key="${key//$'\r'/$''}"

# Base64 encode without altering bytes.
printf "%s" "$key" | base64 | tr -d '\n'

