# End-to-end proof of the resolution-offers ladder (ARCHITECTURE §2.6 steps 3-5).
#
# Drives real bookings through the Server Actions - submit, accept, pay, deliver -
# and then settles them over HTTP: an extra revision, a discount, a partial-refund
# cancellation, and a full-refund cancellation. Every write goes through the app's
# own forms carrying React's $ACTION_* fields, so this reaches the actions, the
# RPCs and the database, not just the SQL.
#
# It also asks PostgREST for the offers as a party and as a stranger, which is the
# one claim the page cannot make for itself: a party reads its offers, a non-party
# reads none.
#
# Run `npx supabase db reset` first and keep the dev server on :3000. Leaves the
# database as it found it: every booking created here is deleted again at the end.
#
# Usage:
#   .\scripts\verify-offers.ps1
param()

$base = "http://localhost:3000"
$rest = "http://127.0.0.1:54321/rest/v1"
$auth = "http://127.0.0.1:54321/auth/v1"
$anon = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
$container = "supabase_db_projeklomba_umkm"
$tmp = Join-Path $env:TEMP "kolab-offers"
$BOUNDARY = "----kolaboffers9c2e"
if (-not (Test-Path $tmp)) { New-Item -ItemType Directory -Path $tmp | Out-Null }

$script:failures = 0
$created = New-Object System.Collections.ArrayList

# ---------------------------------------------------------------- helpers ---

function Invoke-Psql([string]$sql) {
  $out = $sql | docker.exe exec -i $container psql -U postgres -d postgres -t -A -F "|"
  return (($out | Where-Object { $_.Trim() -ne '' }) -join "`n").Trim()
}

function Check([string]$label, [bool]$ok, [string]$detail) {
  Write-Output ("  [{0}] {1,-58} {2}" -f $(if ($ok) { 'ok' } else { 'FAIL' }), $label, $detail)
  if (-not $ok) { $script:failures++ }
}

function Get-Token([string]$email) {
  $file = Join-Path $tmp "offers-login.json"
  [IO.File]::WriteAllText($file, (@{ email = $email; password = "kolab12345" } | ConvertTo-Json -Compress), (New-Object System.Text.UTF8Encoding($false)))
  $out = curl.exe -s -X POST "$auth/token?grant_type=password" -H "apikey: $anon" -H "Content-Type: application/json" --data-binary "@$file"
  return ($out | ConvertFrom-Json).access_token
}

# Row count in a table as the given identity. No token means anonymous.
function Count-Rows([string]$table, [string]$token, [string]$query = "") {
  $url = "$rest/$table`?select=*"
  if ($query) { $url += "&$query" }
  $args = @('-s', '-w', '|%{http_code}', '-H', "apikey: $anon", '-H', 'Accept: application/json')
  if ($token) { $args += @('-H', "Authorization: Bearer $token") }
  $args += $url
  $raw = & curl.exe @args
  # PowerShell captures native stdout line by line, so join it back into one
  # document before stripping curl's `-w` marker and parsing.
  $text = ($raw | Out-String).Trim()
  $code = ($text -split '\|')[-1]
  if ($code -ne '200') { return '' }
  return @((($text -replace '\|200$', '') | ConvertFrom-Json) | Where-Object { $_ }).Count
}

function Decode-Entities([string]$s) {
  return $s -replace '&quot;', '"' -replace '&#x27;', "'" -replace '&amp;', '&' -replace '&lt;', '<' -replace '&gt;', '>'
}

# React's progressive-enhancement fields for the one form containing $marker.
function Get-ActionFields([string]$url, [string]$cookie, [string]$marker) {
  $html = if ($cookie) { curl.exe -s -b $cookie $url } else { curl.exe -s $url }
  $matches = @([regex]::Matches($html, '(?s)<form.*?</form>') | Where-Object { $_.Value -like "*$marker*" })
  if ($matches.Count -eq 0) { throw "no form containing '$marker' on $url" }

  $ids = @{}
  foreach ($m in $matches) {
    $decoded = Decode-Entities $m.Value
    foreach ($id in [regex]::Matches($decoded, 'name="\$ACTION_ID_([0-9a-f]+)"')) { $ids[$id.Groups[1].Value] = $true }
    foreach ($id in [regex]::Matches($decoded, '"id":"([0-9a-f]+)"')) { $ids[$id.Groups[1].Value] = $true }
  }
  if ($ids.Count -ne 1) {
    throw "$($matches.Count) forms on $url match '$marker' but name $($ids.Count) different actions ($($ids.Keys -join ', '))"
  }

  $fields = @{}
  foreach ($m in [regex]::Matches($matches[0].Value, '<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?/>')) {
    $n = Decode-Entities $m.Groups[1].Value
    $fields[$n] = Decode-Entities $m.Groups[2].Value
  }
  return $fields
}

function Invoke-FormPost([string]$url, [hashtable]$fields, [string]$cookie) {
  $sb = New-Object System.Text.StringBuilder
  foreach ($k in $fields.Keys) {
    [void]$sb.Append("--$BOUNDARY`r`nContent-Disposition: form-data; name=`"$k`"`r`n`r`n$($fields[$k])`r`n")
  }
  [void]$sb.Append("--$BOUNDARY--`r`n")

  $bodyFile = Join-Path $tmp "multipart.bin"
  [IO.File]::WriteAllText($bodyFile, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))

  $headers = Join-Path $tmp "headers.txt"
  $args = @(
    '-s', '-o', (Join-Path $tmp 'resp.html'), '-D', $headers,
    '-w', '%{http_code}|%{redirect_url}',
    '-X', 'POST', $url,
    '-H', "Content-Type: multipart/form-data; boundary=$BOUNDARY"
  )
  if ($cookie) { $args += @('-b', $cookie) }
  $args += @('--data-binary', "@$bodyFile")

  $result = & curl.exe @args
  return @{
    code     = ($result -split '\|')[0]
    redirect = ($result -split '\|', 2)[1]
  }
}

# Sign in through the real action and hand back the SSR session cookie.
function Connect-Session([string]$email) {
  $fields = Get-ActionFields "$base/login" $null 'id="password"'
  $post = @{ 'email' = $email; 'password' = 'kolab12345' }
  foreach ($k in $fields.Keys) { $post[$k] = $fields[$k] }
  $r = Invoke-FormPost "$base/login" $post $null
  $cookie = ([regex]::Match([IO.File]::ReadAllText((Join-Path $tmp 'headers.txt')), '(?im)^set-cookie:\s*(sb-127-auth-token=base64-[^;]+)')).Groups[1].Value
  if (-not $cookie) { throw "sign-in for $email issued no cookie (http $($r.code), redirect $($r.redirect))" }
  return $cookie
}

function Detail-Url([string]$id, [string]$side) {
  if ($side -eq 'umkm') { return "$base/dashboard/riwayat/$id" }
  return "$base/dashboard/influencer/riwayat/$id"
}

# --------------------------------------------------------------- scenario ---

# One booking, driven to SUBMITTED exactly as a user would: the business proposes,
# the creator accepts, the business pays, the creator delivers.
function New-SubmittedBooking([string]$umkmCookie, [string]$creatorCookie, [string]$packageId) {
  $fields = Get-ActionFields "$base/booking/1" $umkmCookie 'name="packageId"'
  $post = @{
    'influencerId' = '1'
    'packageId'    = $packageId
    'message'      = 'Brief otomatis untuk verifikasi tawaran penyelesaian di Kolab.id.'
  }
  foreach ($k in $fields.Keys) { $post[$k] = $fields[$k] }
  $r = Invoke-FormPost "$base/booking/1" $post $umkmCookie
  if ($r.code -ne '303') { throw "submitBooking did not redirect (http $($r.code))" }

  $id = Invoke-Psql "select max(id) from public.bookings"
  [void]$created.Add($id)

  $accept = Get-ActionFields (Detail-Url $id 'influencer') $creatorCookie 'Terima'
  $r = Invoke-FormPost (Detail-Url $id 'influencer') $accept $creatorCookie
  if ($r.code -ne '303') { throw "accept did not redirect (http $($r.code)) on $id" }

  $pay = Get-ActionFields (Detail-Url $id 'umkm') $umkmCookie 'Bayar'
  $r = Invoke-FormPost (Detail-Url $id 'umkm') $pay $umkmCookie
  if ($r.code -ne '303') { throw "pay did not redirect (http $($r.code)) on $id" }

  $deliver = Get-ActionFields (Detail-Url $id 'influencer') $creatorCookie 'contentUrl'
  $deliver['contentUrl'] = 'https://example.com/konten-verifikasi'
  $r = Invoke-FormPost (Detail-Url $id 'influencer') $deliver $creatorCookie
  if ($r.code -ne '303') { throw "deliver did not redirect (http $($r.code)) on $id" }

  $status = Invoke-Psql "select status from public.bookings where id=$id"
  if ($status -ne 'SUBMITTED') { throw "booking $id is '$status', expected SUBMITTED" }
  return $id
}

# Create one offer as $side and return the offer form fields (also the offer id).
function New-Offer([string]$id, [string]$side, [string]$cookie, [string]$marker, [int]$value, [string]$note) {
  $url = Detail-Url $id $side
  $fields = Get-ActionFields $url $cookie $marker
  $fields['value'] = [string]$value
  if ($note) { $fields['note'] = $note }
  $r = Invoke-FormPost $url $fields $cookie
  if ($r.code -ne '303') { throw "create offer '$marker' did not redirect (http $($r.code)) on $id" }
  if ($r.redirect -notlike '*ok=tawaran*') { throw "create offer '$marker' refused: $($r.redirect)" }
  return (Invoke-Psql "select id from public.resolution_offers where booking_id=$id and status='PENDING' order by id desc limit 1")
}

# The counterparty's decide form, harvested once and reusable.
function Get-RespondFields([string]$id, [string]$side, [string]$cookie) {
  return (Get-ActionFields (Detail-Url $id $side) $cookie 'name="accept"')
}

function Respond-Offer([string]$id, [string]$cookie, [hashtable]$fields, [string]$offerId, [bool]$accept) {
  $post = @{}
  foreach ($k in $fields.Keys) { $post[$k] = $fields[$k] }
  $post['offerId'] = $offerId
  $post['accept'] = if ($accept) { '1' } else { '0' }
  return (Invoke-FormPost (Detail-Url $id 'umkm') $post $cookie)
}

# ------------------------------------------------------------------- run ---

Write-Output "=== prepare ==="
$budiSession = Connect-Session 'budi@kolab.id'
$raraSession = Connect-Session 'rara@kolab.id'
$packageId = Invoke-Psql "select id from public.packages where influencer_id=1 and is_active order by id limit 1"
Check 'a seeded active package exists for the creator' ($packageId -ne '') "package=$packageId"
$baselineBookings = Invoke-Psql "select count(*) from public.bookings"
$baselineOffers = Invoke-Psql "select count(*) from public.resolution_offers"
Write-Output "  seed bookings=$baselineBookings, offers=$baselineOffers, package=$packageId"

try {
  Write-Output ""
  Write-Output "=== drive three bookings to SUBMITTED over HTTP ==="
  $a = New-SubmittedBooking $budiSession $raraSession $packageId
  $b = New-SubmittedBooking $budiSession $raraSession $packageId
  $c = New-SubmittedBooking $budiSession $raraSession $packageId
  Check 'three bookings reached SUBMITTED' (($a -ne '') -and ($b -ne '') -and ($c -ne '')) "a=$a b=$b c=$c"
  Check 'each carries a HELD payment' ((Invoke-Psql "select count(*) from public.payments where booking_id in ($a,$b,$c) and status='HELD'") -eq '3') 'three HELD'

  # ------------------------------------------------ extra revision -------
  Write-Output ""
  Write-Output "=== 1. extra revision: proves the offerer/counterparty split ==="
  $quotaBefore = [int](Invoke-Psql "select revision_quota from public.bookings where id=$a")
  $offer = New-Offer $a 'influencer' $raraSession 'value="EXTRA_REVISION"' 2 'Tolong tambah dua ronde revisi.'
  Check 'the creator created an extra-revision offer' ($offer -ne '') "offer=$offer"
  Check 'the offer starts PENDING' ((Invoke-Psql "select status from public.resolution_offers where id=$offer") -eq 'PENDING') ''
  Check 'the offer records fee = 0' ((Invoke-Psql "select fee from public.resolution_offers where id=$offer") -eq '0') 'free extra revisions only'

  $respond = Get-RespondFields $a 'umkm' $budiSession
  $r = Respond-Offer $a $raraSession $respond $offer $true
  Check 'the offerer cannot decide their own offer' ($r.redirect -like '*gagal=aturan*') "redirect=$($r.redirect)"
  Check 'the refused decision left the offer PENDING' ((Invoke-Psql "select status from public.resolution_offers where id=$offer") -eq 'PENDING') ''
  Check 'the refused decision left the quota alone' (([int](Invoke-Psql "select revision_quota from public.bookings where id=$a")) -eq $quotaBefore) "quota=$quotaBefore"

  $r = Respond-Offer $a $budiSession $respond $offer $true
  Check 'the counterparty accepts the offer' ($r.redirect -like '*ok=tawaran-diterima*') "redirect=$($r.redirect)"
  Check 'an extra revision raises the quota by the offered count' (([int](Invoke-Psql "select revision_quota from public.bookings where id=$a")) -eq ($quotaBefore + 2)) "quota $quotaBefore -> $($quotaBefore + 2)"
  Check 'an extra revision does not move the booking' ((Invoke-Psql "select status from public.bookings where id=$a") -eq 'SUBMITTED') ''

  # ------------------------------------------------ lazy expiry ----------
  Write-Output ""
  Write-Output "=== 2. an overdue offer is refused and recorded EXPIRED ==="
  $stale = New-Offer $a 'influencer' $raraSession 'value="DISCOUNT"' 100000 'Tawaran kedaluwarsa.'
  $staleRespond = Get-RespondFields $a 'umkm' $budiSession
  Invoke-Psql "update public.resolution_offers set expires_at = now() - interval '1 hour' where id=$stale" | Out-Null
  $r = Respond-Offer $a $budiSession $staleRespond $stale $true
  Check 'an overdue offer is reported as expired' ($r.redirect -like '*gagal=kedaluwarsa*') "redirect=$($r.redirect)"
  Check 'the overdue offer is stored EXPIRED' ((Invoke-Psql "select status from public.resolution_offers where id=$stale") -eq 'EXPIRED') ''

  # ------------------------------------------------ discount -------------
  Write-Output ""
  Write-Output "=== 3. discount: completes as SPLIT with both shares ==="
  $amountA = [int](Invoke-Psql "select amount from public.bookings where id=$a")
  $discount = $amountA - 100000
  $offer = New-Offer $a 'influencer' $raraSession 'value="DISCOUNT"' $discount 'Saya terima dengan harga lebih rendah.'
  $respond = Get-RespondFields $a 'umkm' $budiSession
  $r = Respond-Offer $a $budiSession $respond $offer $true
  Check 'the discount is accepted' ($r.redirect -like '*ok=tawaran-diterima*') "redirect=$($r.redirect)"
  Check 'a discount completes the booking' ((Invoke-Psql "select status from public.bookings where id=$a") -eq 'COMPLETED') ''
  Check 'a discount settles the payment as SPLIT with both shares' ((Invoke-Psql "select status||'|'||creator_amount||'|'||umkm_refund_amount from public.payments where booking_id=$a") -eq "SPLIT|$discount|100000") "SPLIT|$discount|100000"

  # ------------------------------------------------ cancellation ---------
  Write-Output ""
  Write-Output "=== 4. cancellation: the business offers, the creator accepts ==="
  $amountB = [int](Invoke-Psql "select amount from public.bookings where id=$b")
  $refundB = 500000
  $offer = New-Offer $b 'umkm' $budiSession 'value="CANCELLATION"' $refundB 'Batal, sebagian dikembalikan.'
  Check 'the business created a cancellation offer' ($offer -ne '') "offer=$offer"
  $respond = Get-RespondFields $b 'influencer' $raraSession
  $r = Respond-Offer $b $raraSession $respond $offer $true
  Check 'the creator accepts the cancellation' ($r.redirect -like '*ok=tawaran-diterima*') "redirect=$($r.redirect)"
  Check 'a partial cancellation ends CANCELLED' ((Invoke-Psql "select status from public.bookings where id=$b") -eq 'CANCELLED') ''
  Check 'a partial cancellation splits the payment' ((Invoke-Psql "select status||'|'||creator_amount||'|'||umkm_refund_amount from public.payments where booking_id=$b") -eq "SPLIT|$($amountB - $refundB)|$refundB") "SPLIT|$($amountB - $refundB)|$refundB"

  $amountC = [int](Invoke-Psql "select amount from public.bookings where id=$c")
  $offer = New-Offer $c 'umkm' $budiSession 'value="CANCELLATION"' $amountC 'Batal penuh, dana dikembalikan.'
  $respond = Get-RespondFields $c 'influencer' $raraSession
  $r = Respond-Offer $c $raraSession $respond $offer $true
  Check 'a full-refund cancellation is accepted' ($r.redirect -like '*ok=tawaran-diterima*') "redirect=$($r.redirect)"
  Check 'a full cancellation ends CANCELLED' ((Invoke-Psql "select status from public.bookings where id=$c") -eq 'CANCELLED') ''
  Check 'a full cancellation refunds the whole amount' ((Invoke-Psql "select status||'|'||creator_amount||'|'||umkm_refund_amount from public.payments where booking_id=$c") -eq "REFUNDED|0|$amountC") "REFUNDED|0|$amountC"

  # ------------------------------------------------ policy ---------------
  Write-Output ""
  Write-Output "=== 5. the read policy: a party sees its offers, a stranger none ==="
  $budiToken = Get-Token 'budi@kolab.id'
  $raraToken = Get-Token 'rara@kolab.id'
  $sitiToken = Get-Token 'siti@kolab.id'
  Check 'the business reads every offer on its bookings' ([int](Count-Rows 'resolution_offers' $budiToken) -ge 5) "budi sees $(Count-Rows 'resolution_offers' $budiToken)"
  Check 'the creator reads every offer on its bookings' ([int](Count-Rows 'resolution_offers' $raraToken) -ge 5) "rara sees $(Count-Rows 'resolution_offers' $raraToken)"
  Check 'a stranger reads no offers' ((Count-Rows 'resolution_offers' $sitiToken) -eq '0') "siti sees $(Count-Rows 'resolution_offers' $sitiToken)"
  Check 'an anonymous reader sees no offers' ((Count-Rows 'resolution_offers' $null) -eq '0') "anon sees $(Count-Rows 'resolution_offers' $null)"
} finally {
  Write-Output ""
  Write-Output "=== cleanup ==="
  foreach ($id in $created) {
    Invoke-Psql "delete from public.bookings where id=$id" | Out-Null
  }
  $afterBookings = Invoke-Psql "select count(*) from public.bookings"
  $afterOffers = Invoke-Psql "select count(*) from public.resolution_offers"
  Check 'the created bookings are gone' ($afterBookings -eq $baselineBookings) "bookings=$afterBookings"
  Check 'the offers return to their baseline' ($afterOffers -eq $baselineOffers) "offers=$afterOffers"
}

Write-Output ""
if ($script:failures -eq 0) { Write-Output "ALL CHECKS PASSED" } else { Write-Output "$($script:failures) CHECK(S) FAILED" }