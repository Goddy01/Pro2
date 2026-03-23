param(
  [Parameter(Mandatory=$true)]
  [string]$JsonPath
)

if (-not (Test-Path $JsonPath)) {
  Write-Error "File not found: $JsonPath"
  exit 1
}

$jsonRaw = Get-Content $JsonPath -Raw
$json = $jsonRaw | ConvertFrom-Json

if (-not $json.private_key) {
  Write-Error "No 'private_key' field found in JSON."
  exit 1
}

$bytes = [System.Text.Encoding]::UTF8.GetBytes($json.private_key)
$base64 = [Convert]::ToBase64String($bytes)

# Print for copy/paste into GOOGLE_PRIVATE_KEY_BASE64
$base64