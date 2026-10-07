# Sign in as an arbitrary seeded account and replay a session cookie.
#
# The SSR session cookie is `base64-` plus base64 of the JSON GoTrue returns, so
# it can be built from a token response directly. That is what makes it possible
# to be *any* account here - including one that owns nothing, which is the case
# most worth asserting against.
#
# Usage:
#   .\scripts\sign-in-as.ps1 -Email siti@kolab.id -Paths '/dashboard,/admin'
param(
  [Parameter(Mandatory = $true)][string]$Email,
  [string]$Password = "kolab12345",
  # Comma-separated rather than an array: `powershell -File` passes arguments as
  # bare strings and an array does not survive the boundary.
  [string]$Paths = "/dashboard,/dashboard/influencer,/admin,/login,/onboarding",
  [string]$Label = ""
)

$pathList = $Paths.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

$base = "http://localhost:3000"
$supabase = "http://127.0.0.1:54321"
$key = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"

$tmp = Join-Path $env:TEMP "kolab-session"
if (-not (Test-Path $tmp)) { New-Item -ItemType Directory -Path $tmp | Out-Null }

# --- sign in against GoTrue -------------------------------------------------
$credFile = Join-Path $tmp "cred.json"
$respFile = Join-Path $tmp "resp.json"
[IO.File]::WriteAllText(
  $credFile,
  (@{ email = $Email; password = $Password } | ConvertTo-Json -Compress),
  (New-Object System.Text.UTF8Encoding($false))
)

# Delete the previous response first. curl only truncates the output file when it
# actually gets to write one, so if the request fails outright the previous
# response survives and gets parsed as if it were fresh. That failure is silent
# and it lies twice: it reports another account's name, and it replays a token
# that has since expired, which shows up as a 307 that looks like a routing bug.
Remove-Item $respFile -ErrorAction SilentlyContinue

curl.exe -s -o $respFile -X POST "$supabase/auth/v1/token?grant_type=password" `
  -H "apikey: $key" -H "Content-Type: application/json" --data-binary "@$credFile" | Out-Null

if (-not (Test-Path $respFile)) {
  Write-Output "SIGN-IN FAILED for ${Email}: no response written (GoTrue unreachable at $supabase?)"
  exit 1
}

$raw = [IO.File]::ReadAllText($respFile)
$token = $raw | ConvertFrom-Json
if (-not $token.access_token) {
  Write-Output "SIGN-IN FAILED for ${Email}:"
  Write-Output $raw
  exit 1
}

# The identity has to be the one that was asked for, and it has to be usable now.
# Both assertions are cheap and both catch a stale response that still parses.
if ($token.user.email -ne $Email) {
  Write-Output "SIGN-IN MISMATCH: asked for ${Email}, GoTrue returned $($token.user.email)"
  exit 1
}
if ([int64]$token.expires_at -lt [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()) {
  Write-Output "TOKEN ALREADY EXPIRED for ${Email} (expires_at=$($token.expires_at))"
  exit 1
}

# Ordered so the payload is byte-for-byte reproducible; supabase-js only parses
# it, but a stable shape makes a diff between two runs meaningful.
$session = [ordered]@{
  access_token  = $token.access_token
  token_type    = $token.token_type
  expires_in    = $token.expires_in
  expires_at    = $token.expires_at
  refresh_token = $token.refresh_token
  user          = $token.user
} | ConvertTo-Json -Compress -Depth 10

$cookie = "base64-" + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($session))

$name = $token.user.user_metadata.full_name
Write-Output ("--- {0} ({1}) {2}" -f $(if ($Label) { $Label } else { $Email }), $Email, $name)

# --- probe ----------------------------------------------------------------
foreach ($path in $pathList) {
  $outFile = Join-Path $tmp "body.html"
  $result = curl.exe -s -o $outFile -w "%{http_code}|%{redirect_url}" -b "sb-127-auth-token=$cookie" "$base$path"
  $code, $redirect = $result -split '\|', 2

  $note = ""
  if ($code -eq "200" -and $name) {
    $body = [IO.File]::ReadAllText($outFile)
    $note = if ($body -like "*$name*") { "renders as '$name'" } else { "200 but no '$name'" }
  }
  if ($redirect) {
    # Show the path only: the origin is always this one and adds nothing.
    $redirect = $redirect -replace '^https?://[^/]+', ''
  }

  Write-Output ("  {0,-30} {1}  {2,-34} {3}" -f $path, $code, $redirect, $note)
}