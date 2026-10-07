# End-to-end verification of sign-up, onboarding, sign-in and sign-out.
#
# Drives the actions the way a browser without JavaScript would: a multipart POST
# carrying React's own $ACTION_* fields alongside the real inputs. That reaches
# the action wiring, the cookie write, the redirect and the database writes, none
# of which a GET can touch.
#
# Run `npx supabase db reset` first: the seed decides the identity sequences, and
# this asserts ids that depend on them.
#
# Usage:
#   .\scripts\verify-auth.ps1
#
# Leaves the database exactly as it found it. Every row created here is removed
# again at the end, so the seed's own assertions still hold after a run.
param()

$base = "http://localhost:3000"
$tmp = Join-Path $env:TEMP "kolab-session"
$container = "supabase_db_projeklomba_umkm"
$BOUNDARY = "----kolabverify7f3a"
$stamp = (Get-Date -Format "HHmmss") + (Get-Random -Maximum 100)
$umkmEmail = "uji-umkm-$stamp@kolab.test"
$creatorEmail = "uji-kreator-$stamp@kolab.test"
$dupEmail = "uji-duplikat-$stamp@kolab.test"
$validEmail = "uji-validasi-$stamp@kolab.test"
$Password = "kolabtest123"

if (-not (Test-Path $tmp)) { New-Item -ItemType Directory -Path $tmp | Out-Null }

# ---------------------------------------------------------------- helpers ---

function Invoke-Psql([string]$sql) {
  $out = $sql | docker.exe exec -i $container psql -U postgres -d postgres -t -A -F "|"
  return (($out | Where-Object { $_.Trim() -ne '' }) -join "`n").Trim()
}

function Invoke-Sqlite([string]$sql) {
  # Through scripts/sqlite-query.mjs with the SQL in a file: node -e from
  # PowerShell loses the inner quotes of every string literal, and a `?`
  # placeholder means nothing to it.
  $sqlFile = Join-Path $tmp "q.sql"
  [IO.File]::WriteAllText($sqlFile, $sql, (New-Object System.Text.UTF8Encoding($false)))
  $out = (& node scripts/sqlite-query.mjs $sqlFile 2>&1 | Out-String).Trim()
  # A helper that cannot reach SQLite must not answer with an empty string: the
  # row-count assertions compare two empties, match, and report a clean pass.
  # Renaming this script once already produced exactly that false green.
  if ($LASTEXITCODE -ne 0) {
    throw "sqlite-query.mjs failed (exit $LASTEXITCODE) for: $sql`n$out"
  }
  return $out
}

# One scalar out of the first column of the first row.
function Invoke-SqliteValue([string]$sql) {
  $rows = Invoke-Sqlite $sql | ConvertFrom-Json
  if (-not $rows -or $rows.Count -eq 0) { return '' }
  return ($rows[0].PSObject.Properties | Select-Object -First 1).Value
}

# One '|'-joined row, which is how Postgres output is shaped too, so the two
# stores can be compared field by field.
function Invoke-SqliteRow([string]$select, [string]$from, [string]$where) {
  $value = Invoke-SqliteValue "select $select as r from $from where $where"
  return [string]$value
}

function Decode-Entities([string]$s) {
  return $s -replace '&quot;', '"' -replace '&#x27;', "'" -replace '&amp;', '&' -replace '&lt;', '<' -replace '&gt;', '>'
}

# React's progressive-enhancement fields for ONE form. `$marker` identifies which
# form to take: a page renders several, each with its own numbered set of
# $ACTION_* fields, and posting two sets at once makes Next pick the wrong action
# or none at all - a 500 reading "Failed to find Server Action". /login alone
# renders four forms.
#
# Several forms may match the marker when they are the same action: the navbar
# and the sidebar each render their own sign-out button. That is harmless, so the
# ids are compared rather than the count.
function Get-ActionFields([string]$url, [string]$cookie, [string]$marker) {
  $html = if ($cookie) { curl.exe -s -b $cookie $url } else { curl.exe -s $url }
  $matches = @([regex]::Matches($html, '(?s)<form.*?</form>') | Where-Object { $_.Value -like "*$marker*" })
  if ($matches.Count -eq 0) { throw "no form containing '$marker' on $url" }

  $ids = @{}
  foreach ($m in $matches) {
    # Decoded first: React renders the action descriptor with &quot;, so the
    # literal quotes a regex would want are not in the HTML.
    $decoded = Decode-Entities $m.Value
    foreach ($id in [regex]::Matches($decoded, 'name="\$ACTION_ID_([0-9a-f]+)"')) { $ids[$id.Groups[1].Value] = $true }
    foreach ($id in [regex]::Matches($decoded, '"id":"([0-9a-f]+)"')) { $ids[$id.Groups[1].Value] = $true }
  }
  if ($ids.Count -ne 1) {
    throw "$($matches.Count) forms on $url match '$marker' but name $($ids.Count) different actions ($($ids.Keys -join ', ')); the marker is not specific enough"
  }

  $fields = @{}
  foreach ($m in [regex]::Matches($matches[0].Value, '<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?/>')) {
    # Assigned first: PowerShell rejects a function call inside an index.
    $n = Decode-Entities $m.Groups[1].Value
    $fields[$n] = Decode-Entities $m.Groups[2].Value
  }
  return $fields
}

# Built by hand rather than with curl -F: a field name starting with `$` and a
# value full of JSON quotes both get mangled crossing the PowerShell/native
# argument boundary.
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
  $headerText = [IO.File]::ReadAllText($headers)
  return @{
    code     = ($result -split '\|')[0]
    redirect = ($result -split '\|', 2)[1]
    # The cookie payload is a chunked base64 blob; the name alone is enough to
    # prove a session was issued.
    cookie   = ([regex]::Match($headerText, '(?im)^set-cookie:\s*(sb-127-auth-token=base64-[^;]+)')).Groups[1].Value
    clears   = [bool]([regex]::Match($headerText, '(?im)^set-cookie:\s*sb-127-auth-token=;')).Success
    body     = [IO.File]::ReadAllText((Join-Path $tmp 'resp.html'))
  }
}

function Get-Message([string]$body) {
  if ($body -match '(?s)<p[^>]*role="alert"[^>]*>(.*?)</p>') {
    return "error: " + (($Matches[1] -replace '<[^>]+>', '') -replace '\s+', ' ').Trim()
  }
  if ($body -match '(?s)<p[^>]*role="status"[^>]*>(.*?)</p>') {
    return "notice: " + (($Matches[1] -replace '<[^>]+>', '') -replace '\s+', ' ').Trim()
  }
  return ''
}

function Show([string]$label, $r) {
  $red = ($r.redirect -replace '^https?://[^/]+', '')
  $flag = if ($r.clears) { 'cookie cleared' } elseif ($r.cookie) { 'cookie issued' } else { '' }
  Write-Output ("  {0,-32} {1}  {2,-22} {3} {4}" -f $label, $r.code, $red, $flag, (Get-Message $r.body)).TrimEnd()
}

function Probe([string]$cookie, [string[]]$paths) {
  foreach ($p in $paths) {
    $res = curl.exe -s -o NUL -w '%{http_code}|%{redirect_url}' -b $cookie "$base$p"
    Write-Output ("  {0,-26} {1}  {2}" -f $p, ($res -split '\|')[0], ((($res -split '\|', 2)[1]) -replace '^https?://[^/]+', ''))
  }
}

function Check([string]$label, [bool]$ok, [string]$detail) {
  Write-Output ("  [{0}] {1,-46} {2}" -f $(if ($ok) { 'ok' } else { 'FAIL' }), $label, $detail)
  if (-not $ok) { $script:failures++ }
}

# ------------------------------------------------------------------ setup ---
$script:failures = 0

$baseline = @{
  pgAuth     = Invoke-Psql "select count(*) from auth.users"
  pgProfiles = Invoke-Psql "select count(*) from public.profiles"
  pgUmkm     = Invoke-Psql "select count(*) from public.umkms"
  pgInf      = Invoke-Psql "select count(*) from public.influencers"
  pgBooking  = Invoke-Psql "select count(*) from public.bookings"
  pgReview   = Invoke-Psql "select count(*) from public.reviews"
  liteUmkm   = Invoke-SqliteValue "select count(*) c from umkms"
  liteInf    = Invoke-SqliteValue "select count(*) c from influencers"
  liteBooking = Invoke-SqliteValue "select count(*) c from bookings"
  liteReview = Invoke-SqliteValue "select count(*) c from reviews"
}
$liteMaxUmkm = Invoke-SqliteValue "select coalesce(max(id),0) m from umkms"
$liteMaxInf = Invoke-SqliteValue "select coalesce(max(id),0) m from influencers"
$seqUmkm = Invoke-Psql "select last_value from pg_sequences where sequencename='umkms_id_seq'"
$seqInf = Invoke-Psql "select last_value from pg_sequences where sequencename='influencers_id_seq'"

Write-Output "baseline"
Write-Output ("  postgres   auth={0} profiles={1} umkms={2} influencers={3} bookings={4} reviews={5}" -f $baseline.pgAuth, $baseline.pgProfiles, $baseline.pgUmkm, $baseline.pgInf, $baseline.pgBooking, $baseline.pgReview)
Write-Output ("  sqlite     umkms={0} influencers={1} bookings={2} reviews={3}" -f $baseline.liteUmkm, $baseline.liteInf, $baseline.liteBooking, $baseline.liteReview)
Write-Output ("  sequences  umkms={0} influencers={1}" -f $seqUmkm, $seqInf)
Check 'the umkm sequence starts above the sqlite maximum' ([int]$seqUmkm -ge [int]$liteMaxUmkm) "pg last_value=$seqUmkm, sqlite max=$liteMaxUmkm"
Check 'the influencer sequence starts above the sqlite maximum' ([int]$seqInf -ge [int]$liteMaxInf) "pg last_value=$seqInf, sqlite max=$liteMaxInf"
Write-Output ""

try {
  # ------------------------------------------------------- 1. sign up (umkm) --
  Write-Output "=== 1. sign up a brand-new UMKM account ==="
  $signupHtml = curl.exe -s "$base/signup"
  # 2.4: the role is not chosen here. A role input on this page would let a
  # stranger claim a role before any profile exists.
  Check 'the sign-up page offers no role choice' (($signupHtml -notmatch 'name="role"') -and ($signupHtml -notmatch 'admin')) 'no role input, no admin text'
  $fields = Get-ActionFields "$base/signup" $null 'id="fullName"'
  $post = @{ 'fullName' = 'Uji UMKM'; 'email' = $umkmEmail; 'password' = $Password }
  foreach ($k in $fields.Keys) { $post[$k] = $fields[$k] }
  $r = Invoke-FormPost "$base/signup" $post $null
  Show 'signUp (new address)' $r
  Check 'signUp issues a session' ([bool]$r.cookie) $umkmEmail
  Check 'signUp lands on onboarding' ($r.redirect -like '*/onboarding') "redirect=$($r.redirect)"
  $session = $r.cookie

  Write-Output ""
  Write-Output "=== 2. a session with no profile can only reach /onboarding ==="
  Probe $session @('/dashboard', '/dashboard/influencer', '/admin', '/login', '/signup', '/onboarding')

  # ------------------------------------------------------------ 3. onboard ---
  Write-Output ""
  Write-Output "=== 3. onboard as an UMKM ==="
  # Harvested now, while the account can still see the form: once it has a
  # profile /onboarding redirects away and the fields are gone.
  $onbFields = Get-ActionFields "$base/onboarding" $session 'name="role"'
  $post = @{
    'role' = 'umkm'; 'fullName' = 'Uji UMKM'
    'businessName' = 'Kafe Uji Coba'; 'categoryId' = '1'; 'city' = 'Surabaya'
  }
  foreach ($k in $onbFields.Keys) { $post[$k] = $onbFields[$k] }
  $r = Invoke-FormPost "$base/onboarding" $post $session
  Show 'onboard (umkm)' $r
  Check 'onboarding lands on the dashboard' ($r.redirect -like '*/dashboard') "redirect=$($r.redirect)"

  Write-Output ""
  Write-Output "=== 4. the business row is written to postgres, and only there ==="
  # Postgres is the only store now. The old SQLite mirror is no longer written by
  # the app, so the checks below assert the row lands in Postgres and that the
  # mirror stays empty - which is what "retired" has to mean to be worth testing.
  $pgRow = Invoke-Psql "select u.id, u.name, u.owner, c.slug, u.city from public.umkms u join public.categories c on c.id=u.category_id where u.name='Kafe Uji Coba'"
  $liteRow = Invoke-SqliteRow "id||'|'||name||'|'||owner||'|'||category||'|'||city" "umkms" "name='Kafe Uji Coba'"
  $pgProfile = Invoke-Psql "select p.role, p.umkm_id, p.influencer_id from public.profiles p join auth.users u on u.id=p.user_id where u.email='$umkmEmail'"
  Write-Output ("  postgres  umkms : {0}" -f ($pgRow -replace "`n", ' / '))
  Write-Output ("  sqlite    umkms : {0}" -f $liteRow)
  Write-Output ("  postgres profile : {0}" -f ($pgProfile -replace "`n", ' / '))

  $pgId = ($pgRow -split '\|')[0]
  Check 'the business was written to postgres' ($pgId -ne '') "pg=$pgId"
  Check 'postgres links the profile to the umkm' ($pgProfile -eq "umkm|$pgId|") $pgProfile
  $pgCat = ($pgRow -split '\|')[3]
  Check 'the category is stored as its slug' ($pgCat -eq 'food-beverage') "pg slug='$pgCat'"
  Check 'owner and city survive onboarding' ((($pgRow -split '\|')[2] -eq 'Uji UMKM') -and (($pgRow -split '\|')[4] -eq 'Surabaya')) 'owner and city'
  Check 'the retired sqlite mirror is not written' ($liteRow -eq '') 'sqlite has no row: nothing mirrors anymore'

  Write-Output ""
  Write-Output "=== 5. the account reaches its own pages, and nobody else's ==="
  Probe $session @('/dashboard', '/dashboard/profile', '/dashboard/riwayat', '/admin', '/dashboard/influencer', '/onboarding', '/login')
  $dash = curl.exe -s -b $session "$base/dashboard"
  Check 'the dashboard greets its owner' ($dash -like '*Uji UMKM*') 'profile name on /dashboard'
  $prof = curl.exe -s -b $session "$base/dashboard/profile"
  Check 'the business name comes back from postgres' ($prof -like '*Kafe Uji Coba*') 'postgres row is readable through /dashboard/profile'

  Write-Output ""
  Write-Output "=== 6. a second onboarding is refused ==="
  $post = @{
    'role' = 'umkm'; 'fullName' = 'Uji UMKM'
    'businessName' = 'Kafe Kedua'; 'categoryId' = '1'; 'city' = 'Malang'
  }
  foreach ($k in $onbFields.Keys) { $post[$k] = $onbFields[$k] }
  $r = Invoke-FormPost "$base/onboarding" $post $session
  Show 'onboard a second time' $r
  $still = Invoke-Psql "select count(*) from public.umkms where name in ('Kafe Uji Coba','Kafe Kedua')"
  Check 'no second business was created' ($still -eq '1') "rows=$still"

  # ------------------------------------------------- 7. influencer onboarding --
  Write-Output ""
  Write-Output "=== 7. onboard a creator ==="
  $fields = Get-ActionFields "$base/signup" $null 'id="fullName"'
  $post = @{ 'fullName' = 'Uji Kreator'; 'email' = $creatorEmail; 'password' = $Password }
  foreach ($k in $fields.Keys) { $post[$k] = $fields[$k] }
  $r = Invoke-FormPost "$base/signup" $post $null
  Show 'signUp (creator)' $r
  $creatorSession = $r.cookie

  $onbFields = Get-ActionFields "$base/onboarding" $creatorSession 'name="role"'
  $post = @{
    'role' = 'influencer'; 'fullName' = 'Uji Kreator'; 'handle' = 'ujikreator'
    'categoryId' = '2'; 'city' = 'Bandung'; 'startingPrice' = '450000'; 'bio' = 'Profil uji.'
  }
  foreach ($k in $onbFields.Keys) { $post[$k] = $onbFields[$k] }
  $r = Invoke-FormPost "$base/onboarding" $post $creatorSession
  Show 'onboard (influencer)' $r
  Check 'creator onboarding lands on its dashboard' ($r.redirect -like '*/dashboard/influencer') "redirect=$($r.redirect)"

  $pgInf = Invoke-Psql "select i.id, i.name, i.handle, i.starting_price, c.slug from public.influencers i join public.categories c on c.id=i.category_id where i.handle='@ujikreator'"
  $liteInf = Invoke-SqliteRow "id||'|'||name||'|'||handle||'|'||niche||'|'||base_price" "influencers" "handle='@ujikreator'"
  $pgInfProfile = Invoke-Psql "select p.role, p.umkm_id, p.influencer_id from public.profiles p join auth.users u on u.id=p.user_id where u.email='$creatorEmail'"
  Write-Output ("  postgres  influencer : {0}" -f ($pgInf -replace "`n", ' / '))
  Write-Output ("  sqlite    influencer : {0}" -f $liteInf)
  Write-Output ("  postgres profile     : {0}" -f $pgInfProfile)
  $pgInfId = ($pgInf -split '\|')[0]
  Check 'the creator was written to postgres' ($pgInfId -ne '') "id=$pgInfId"
  Check 'the typed handle is stored with its @' ($pgInf -match '\|@ujikreator\|') '@ujikreator'
  Check 'the creator price is stored' (($pgInf -split '\|')[3] -eq '450000') '450000'
  Check 'a creator profile links the influencer, not the umkm' ($pgInfProfile -eq "influencer||$pgInfId") $pgInfProfile
  Check 'the new creator appears in the public catalog' ((curl.exe -s "$base/influencers") -like '*@ujikreator*') 'served from postgres by /influencers'
  Check 'the retired sqlite mirror is not written' ($liteInf -eq '') 'sqlite has no row: nothing mirrors anymore'

  Write-Output ""
  Write-Output "=== 8. a taken handle is refused, and writes nothing ==="
  $fields = Get-ActionFields "$base/signup" $null 'id="fullName"'
  $post = @{ 'fullName' = 'Uji Duplikat'; 'email' = $dupEmail; 'password' = $Password }
  foreach ($k in $fields.Keys) { $post[$k] = $fields[$k] }
  $r = Invoke-FormPost "$base/signup" $post $null
  $dupSession = $r.cookie
  $onbFields = Get-ActionFields "$base/onboarding" $dupSession 'name="role"'
  $post = @{
    'role' = 'influencer'; 'fullName' = 'Uji Duplikat'; 'handle' = '@RaraNadia'
    'categoryId' = '2'; 'city' = 'Jakarta'; 'startingPrice' = '450000'
  }
  foreach ($k in $onbFields.Keys) { $post[$k] = $onbFields[$k] }
  $r = Invoke-FormPost "$base/onboarding" $post $dupSession
  Show 'onboard with a taken handle' $r
  Check 'the message names the reason' ($r.body -match 'sudah dipakai kreator lain') '23505 reported as a duplicate handle'
  Check 'no second row was written' ((Invoke-Psql "select count(*) from public.influencers where handle='@raranadia'") -eq '1') 'still one @raranadia'
  Check 'the rejected account still has no profile' ((Invoke-Psql "select count(*) from public.profiles p join auth.users u on u.id=p.user_id where u.email='$dupEmail'") -eq '0') 'profiles row absent'

  # ------------------------------------------- 8b. validation happens first --
  # One account, many bad submissions. A rejected submission creates no profile,
  # so the same session is free to try again - which is exactly why "wrote no
  # row" is checkable here: if any of these leaked a record, the ones after it
  # would start failing for the wrong reason.
  Write-Output ""
  Write-Output "=== 8b. every rejection is reported and writes nothing ==="
  $fields = Get-ActionFields "$base/signup" $null 'id="fullName"'
  $post = @{ 'fullName' = 'Uji Validasi'; 'email' = $validEmail; 'password' = $Password }
  foreach ($k in $fields.Keys) { $post[$k] = $fields[$k] }
  $r = Invoke-FormPost "$base/signup" $post $null
  $validSession = $r.cookie
  $onbFields = Get-ActionFields "$base/onboarding" $validSession 'name="role"'

  # Each case: label, form fields, the message it must produce.
  $cases = @(
    @{ l = 'no role at all';            f = @{ 'role' = '' };                     m = 'Pilih peran terlebih dahulu' },
    @{ l = 'role=admin is refused';    f = @{ 'role' = 'admin'; 'fullName' = 'Uji Validasi'; 'businessName' = 'Kafe Admin'; 'categoryId' = '1'; 'city' = 'Surabaya' }; m = 'Pilih peran terlebih dahulu' },
    @{ l = 'no full name';             f = @{ 'role' = 'umkm'; 'fullName' = ''; 'businessName' = 'Kafe Kosong'; 'categoryId' = '1'; 'city' = 'Surabaya' }; m = 'Isi namamu lengkap' },
    @{ l = 'no city';                  f = @{ 'role' = 'umkm'; 'fullName' = 'Uji Validasi'; 'businessName' = 'Kafe Kota'; 'categoryId' = '1'; 'city' = '' }; m = 'Isi kota kamu' },
    @{ l = 'no category';              f = @{ 'role' = 'umkm'; 'fullName' = 'Uji Validasi'; 'businessName' = 'Kafe Kategori'; 'categoryId' = ''; 'city' = 'Surabaya' }; m = 'Pilih kategori' },
    @{ l = 'a category that does not exist'; f = @{ 'role' = 'umkm'; 'fullName' = 'Uji Validasi'; 'businessName' = 'Kafe Hantu'; 'categoryId' = '999'; 'city' = 'Surabaya' }; m = 'Kategori tidak dikenal' },
    @{ l = 'no business name';         f = @{ 'role' = 'umkm'; 'fullName' = 'Uji Validasi'; 'businessName' = ''; 'categoryId' = '1'; 'city' = 'Surabaya' }; m = 'Isi nama usaha' },
    @{ l = 'a handle that is too short'; f = @{ 'role' = 'influencer'; 'fullName' = 'Uji Validasi'; 'handle' = 'ab'; 'categoryId' = '1'; 'city' = 'Bandung'; 'startingPrice' = '450000' }; m = 'Handle minimal 3 karakter' },
    @{ l = 'a handle with illegal characters'; f = @{ 'role' = 'influencer'; 'fullName' = 'Uji Validasi'; 'handle' = 'dua kata'; 'categoryId' = '1'; 'city' = 'Bandung'; 'startingPrice' = '450000' }; m = 'Handle minimal 3 karakter' },
    @{ l = 'a price that is not a number'; f = @{ 'role' = 'influencer'; 'fullName' = 'Uji Validasi'; 'handle' = 'ujivalidasi'; 'categoryId' = '1'; 'city' = 'Bandung'; 'startingPrice' = 'gratis' }; m = 'Isi harga mulai dengan angka' }
  )
  foreach ($c in $cases) {
    $body = @{ 'city' = 'Surabaya'; 'categoryId' = '1'; 'fullName' = 'Uji Validasi' }
    foreach ($k in $c.f.Keys) { $body[$k] = $c.f[$k] }
    foreach ($k in $onbFields.Keys) { $body[$k] = $onbFields[$k] }
    $r = Invoke-FormPost "$base/onboarding" $body $validSession
    Check ("refuses " + $c.l) ($r.code -eq '200' -and $r.body -match [regex]::Escape($c.m)) (Get-Message $r.body)
  }
  $pgLeak = Invoke-Psql "select count(*) from public.umkms where owner='Uji Validasi'"
  $infLeak = Invoke-Psql "select count(*) from public.influencers where name='Uji Validasi'"
  $profLeak = Invoke-Psql "select count(*) from public.profiles p join auth.users u on u.id=p.user_id where u.email='$validEmail'"
  Check 'no rejected submission wrote a business' ($pgLeak -eq '0') "umkms rows=$pgLeak"
  Check 'no rejected submission wrote a creator' ($infLeak -eq '0') "influencers rows=$infLeak"
  Check 'no rejected submission wrote a profile' ($profLeak -eq '0') "profiles rows=$profLeak"

  # ------------------------------------ 8c. a forced profile failure unwinds --
  Write-Output ""
  Write-Output "=== 8c. when the profile insert fails, nothing is left behind ==="
  # The compensating delete is the claim under test, so the failure has to be
  # real: a CHECK constraint that rejects exactly this full_name makes step 1
  # succeed and step 2 fail, which is the only path that reaches the unwind.
  Invoke-Psql "alter table public.profiles add constraint tmp_reject_probe check (full_name <> 'Uji Gagal')" | Out-Null
  try {
    $body = @{ 'role' = 'umkm'; 'fullName' = 'Uji Gagal'; 'businessName' = 'Kafe Gagal'; 'categoryId' = '1'; 'city' = 'Surabaya' }
    foreach ($k in $onbFields.Keys) { $body[$k] = $onbFields[$k] }
    $r = Invoke-FormPost "$base/onboarding" $body $validSession
    Show 'onboard with the profile insert blocked' $r
    Check 'the failure is reported' ($r.code -eq '200' -and $r.body -match 'Gagal menautkan profil') (Get-Message $r.body)
    $orphanPg = Invoke-Psql "select count(*) from public.umkms where name='Kafe Gagal'"
    $orphanLite = Invoke-SqliteValue "select count(*) c from umkms where name='Kafe Gagal'"
    Check 'no orphan business in postgres' ($orphanPg -eq '0') "umkms rows=$orphanPg"
    Check 'no orphan business in sqlite' ($orphanLite -eq '0') "umkms rows=$orphanLite"
  } finally {
    Invoke-Psql "alter table public.profiles drop constraint if exists tmp_reject_probe" | Out-Null
  }
  Write-Output ""
  Write-Output "=== 9. sign-in edge cases ==="
  $fields = Get-ActionFields "$base/login" $null 'id="password"'
  $post = @{ 'email' = $umkmEmail; 'password' = 'sandi-salah' }
  foreach ($k in $fields.Keys) { $post[$k] = $fields[$k] }
  $r = Invoke-FormPost "$base/login" $post $null
  Show 'signIn (wrong password)' $r
  Check 'a wrong password is reported, not thrown' ($r.code -eq '200' -and $r.body -match 'tidak cocok') '200 with an alert, no session'
  Check 'no session is issued on failure' (-not [bool]$r.cookie) 'no cookie'

  $fields = Get-ActionFields "$base/login" $null 'id="password"'
  $post = @{ 'email' = 'budi@kolab.id'; 'password' = 'kolab12345'; 'next' = '/admin' }
  foreach ($k in $fields.Keys) { $post[$k] = $fields[$k] }
  $r = Invoke-FormPost "$base/login" $post $null
  Show 'signIn honours an in-app next' $r
  Check 'next is honoured' ($r.redirect -like '*/admin') "redirect=$($r.redirect)"

  $fields = Get-ActionFields "$base/login" $null 'id="password"'
  $post = @{ 'email' = 'budi@kolab.id'; 'password' = 'kolab12345'; 'next' = '//evil.example/steal' }
  foreach ($k in $fields.Keys) { $post[$k] = $fields[$k] }
  $r = Invoke-FormPost "$base/login" $post $null
  Show 'signIn refuses //evil.example' $r
  Check 'no protocol-relative redirect' (-not ($r.redirect -match 'evil\.example')) "redirect=$($r.redirect)"
  Check 'it falls back to the role dashboard' ($r.redirect -like '*/dashboard') "redirect=$($r.redirect)"

  $fields = Get-ActionFields "$base/login" $null 'id="password"'
  $post = @{ 'email' = $umkmEmail; 'password' = $Password }
  foreach ($k in $fields.Keys) { $post[$k] = $fields[$k] }
  $r = Invoke-FormPost "$base/login" $post $null
  Show 'signIn (the account just created)' $r
  Check 'a new account can sign back in' ($r.code -eq '303') "redirect=$($r.redirect)"

  $fields = Get-ActionFields "$base/signup" $null 'id="fullName"'
  $post = @{ 'fullName' = 'Uji Ganda'; 'email' = $umkmEmail; 'password' = $Password }
  foreach ($k in $fields.Keys) { $post[$k] = $fields[$k] }
  $r = Invoke-FormPost "$base/signup" $post $null
  Show 'signUp (address already taken)' $r
  Check 'a taken address is reported, not thrown' ($r.code -eq '200' -and $r.body -match 'sudah punya akun') '200 with an alert'

  # ------------------------------------------------------------ 10. sign out --
  Write-Output ""
  Write-Output "=== 10. sign out ==="
  $fields = Get-ActionFields "$base/dashboard" $session '$ACTION_ID_'
  $r = Invoke-FormPost "$base/dashboard" $fields $session
  Show 'signOut' $r
  Check 'the cookie is cleared' ($r.clears) 'Set-Cookie expires the session'
  Check 'it lands on the public home page' ($r.redirect -match '/$') "redirect=$($r.redirect)"
  Probe $session @('/dashboard', '/admin')
} finally {
  # ------------------------------------------------------------- cleanup ---
  Write-Output ""
  Write-Output "=== cleanup ==="
  Invoke-Psql "delete from public.profiles where user_id in (select id from auth.users where email like 'uji-%@kolab.test')" | Out-Null
  foreach ($e in @($umkmEmail, $creatorEmail, $dupEmail, $validEmail)) {
    Invoke-Psql "delete from auth.users where email = '$e'" | Out-Null
  }
  Invoke-Psql "delete from public.umkms where name in ('Kafe Uji Coba','Kafe Kedua','Kafe Gagal') or owner like 'Uji %'" | Out-Null
  Invoke-Psql "delete from public.influencers where handle = '@ujikreator' or name like 'Uji %'" | Out-Null
  Invoke-Sqlite "delete from umkms where name in ('Kafe Uji Coba','Kafe Kedua','Kafe Gagal') or owner like 'Uji %'" | Out-Null
  Invoke-Sqlite "delete from influencers where handle = '@ujikreator' or name like 'Uji %'" | Out-Null

  # Semicolons, not newlines: inside @( ) a newline does not end the statement.
  $pgNow = @(
    (Invoke-Psql "select count(*) from auth.users");
    (Invoke-Psql "select count(*) from public.profiles");
    (Invoke-Psql "select count(*) from public.umkms");
    (Invoke-Psql "select count(*) from public.influencers");
    (Invoke-Psql "select count(*) from public.bookings");
    (Invoke-Psql "select count(*) from public.reviews")
  )
  $liteNow = @(
    (Invoke-SqliteValue "select count(*) c from umkms"),
    (Invoke-SqliteValue "select count(*) c from influencers"),
    (Invoke-SqliteValue "select count(*) c from bookings"),
    (Invoke-SqliteValue "select count(*) c from reviews")
  )
  Write-Output ("  postgres  auth={0} profiles={1} umkms={2} influencers={3} bookings={4} reviews={5}" -f $pgNow)
  Write-Output ("  sqlite    umkms={0} influencers={1} bookings={2} reviews={3}" -f $liteNow)
  $pgExpected = @($baseline.pgAuth, $baseline.pgProfiles, $baseline.pgUmkm, $baseline.pgInf, $baseline.pgBooking, $baseline.pgReview)
  $liteExpected = @($baseline.liteUmkm, $baseline.liteInf, $baseline.liteBooking, $baseline.liteReview)
  # Guard the guard: an empty reading is a broken query, not a satisfied baseline,
  # and '' -eq '' would otherwise report a pass.
  if (($liteExpected | Where-Object { $_ -eq '' }).Count -gt 0 -or ($liteNow | Where-Object { $_ -eq '' }).Count -gt 0) {
    Check 'every sqlite count is back to its baseline' $false ('a count came back empty, so the query itself failed')
  }
  Check 'every postgres count is back to its baseline' (($pgNow -join ',') -eq ($pgExpected -join ',')) ("expected " + ($pgExpected -join '/') + ", got " + ($pgNow -join '/'))
  Check 'every sqlite count is back to its baseline' (($liteNow -join ',') -eq ($liteExpected -join ',')) ("expected " + ($liteExpected -join '/') + ", got " + ($liteNow -join '/'))
}

Write-Output ""
if ($script:failures -eq 0) { Write-Output "ALL CHECKS PASSED" } else { Write-Output "$($script:failures) CHECK(S) FAILED" }
