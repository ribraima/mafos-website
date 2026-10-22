<#
  Adds a design project to the website from a folder of original files.

  Easiest: drag the folder onto add-project.cmd. Or run:
    powershell -ExecutionPolicy Bypass -File scripts\add-project.ps1 "D:\Work\Hotel Durres"

  The originals stay where they are and are never uploaded. Every image (JPG, PNG, TIFF,
  PSD, HEIC, WebP, AVIF) and every page of every PDF becomes small web copies
  (WebP, 800 / 1600 / 2400 px wide) in images/projects/<slug>/, and the project is added
  at the top of content/content.js. Any value not given as a parameter is asked for.
#>
param(
  [Parameter(Position = 0)] [string] $Source,
  [string] $TitleEn,
  [string] $TitleSq,
  [string] $Category,
  [int] $Year,
  [string] $Client,
  [string] $SummaryEn,
  [string] $SummarySq,
  [string] $Video,
  [string] $SiteRoot = (Split-Path -Parent $PSScriptRoot),
  [switch] $NoPrompt,
  [switch] $NoPreview
)

$ErrorActionPreference = 'Stop'
try {
  [Console]::InputEncoding = [Text.Encoding]::UTF8
  [Console]::OutputEncoding = [Text.Encoding]::UTF8
} catch { }

$Widths = 800, 1600, 2400
$Quality = 80
$ImageTypes = '.jpg', '.jpeg', '.png', '.tif', '.tiff', '.psd', '.heic', '.heif', '.webp', '.avif', '.bmp', '.gif'
$Utf8 = New-Object System.Text.UTF8Encoding($false)

function Fail($message) {
  Write-Host ""
  Write-Host $message -ForegroundColor Red
  exit 1
}

function Find-Tool($name, [string[]] $fallbacks) {
  $command = Get-Command $name -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }
  foreach ($pattern in $fallbacks) {
    $found = Get-ChildItem $pattern -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1
    if ($found) { return $found.FullName }
  }
  return $null
}

function Ask($question, $default = '', [switch] $Required) {
  if ($NoPrompt) {
    if ($Required -and -not $default) { Fail "Missing value: $question" }
    return $default
  }
  while ($true) {
    $suffix = if ($default) { " [$default]" } else { '' }
    $answer = Read-Host "$question$suffix"
    if ([string]::IsNullOrWhiteSpace($answer)) { $answer = $default }
    if ($answer -or -not $Required) { return "$answer".Trim() }
  }
}

function ConvertTo-Slug([string] $text) {
  $plain = New-Object System.Text.StringBuilder
  foreach ($ch in $text.Normalize([Text.NormalizationForm]::FormD).ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($ch) -ne 'NonSpacingMark') { [void]$plain.Append($ch) }
  }
  return ($plain.ToString().ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-')
}

function Get-NaturalKey($name) {
  return [regex]::Replace($name.ToLowerInvariant(), '\d+', { param($m) $m.Value.PadLeft(10, '0') })
}

function ConvertTo-JsonString([string] $value) {
  $escaped = $value -replace '\\', '\\' -replace '"', '\"' -replace "`r", '' -replace "`n", '\n' -replace "`t", '\t'
  return '"' + $escaped + '"'
}

function ConvertTo-JsonText($value) {
  if ($value.sq) { return '{ "en": ' + (ConvertTo-JsonString $value.en) + ', "sq": ' + (ConvertTo-JsonString $value.sq) + ' }' }
  return ConvertTo-JsonString $value.en
}

function Read-SiteContent($path) {
  $text = [IO.File]::ReadAllText($path, $Utf8)
  $start = $text.IndexOf('{', $text.IndexOf('window.SITE_CONTENT'))
  $end = $text.LastIndexOf('}')
  return @{ Text = $text; Data = ($text.Substring($start, $end - $start + 1) | ConvertFrom-Json) }
}

# ---------- Tools ----------
$magick = Find-Tool 'magick' @("$env:ProgramFiles\ImageMagick-*\magick.exe")
if (-not $magick) { Fail "ImageMagick is not installed. Install it with:  winget install ImageMagick.ImageMagick" }
$pdftoppm = Find-Tool 'pdftoppm' @(
  "$env:LOCALAPPDATA\Microsoft\WinGet\Links\pdftoppm.exe",
  "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\oschwartz10612.Poppler*\poppler-*\Library\bin\pdftoppm.exe"
)

# ---------- Site ----------
$contentPath = Join-Path $SiteRoot 'content\content.js'
if (-not (Test-Path $contentPath)) { Fail "Could not find content\content.js in $SiteRoot." }
$site = Read-SiteContent $contentPath
$categories = @($site.Data.categories)
$takenSlugs = @($site.Data.projects | ForEach-Object { $_.slug })

Write-Host ""
Write-Host "Add a project to the Mafos website" -ForegroundColor Yellow
Write-Host "The original files stay where they are; only small web copies are added to the site."
Write-Host ""

# ---------- Source files ----------
if (-not $Source) { $Source = Ask 'Folder with the project files' -Required }
$Source = $Source.Trim().Trim('"')
if (-not (Test-Path $Source -PathType Container)) { Fail "Folder not found: $Source" }

$files = @(Get-ChildItem -LiteralPath $Source -File | Where-Object { ($ImageTypes + '.pdf') -contains $_.Extension.ToLowerInvariant() } |
  Sort-Object { if ($_.BaseName -ieq 'cover') { '' } else { Get-NaturalKey $_.Name } })
if ($files.Count -eq 0) { Fail "No images or PDFs in $Source. Supported: JPG, PNG, TIFF, PSD, HEIC, WebP, AVIF, PDF." }
$originalBytes = ($files | Measure-Object Length -Sum).Sum
Write-Host ("Found {0} file(s), {1:N1} MB in total:" -f $files.Count, ($originalBytes / 1MB))
$files | ForEach-Object { Write-Host ("  {0}  ({1:N1} MB)" -f $_.Name, ($_.Length / 1MB)) }
Write-Host ""

# ---------- Questions ----------
$TitleEn = Ask 'Title in English' $TitleEn -Required
$TitleSq = Ask 'Title in Albanian (Enter to skip)' $TitleSq

if (-not $Category -and -not $NoPrompt) {
  Write-Host "Categories:"
  for ($i = 0; $i -lt $categories.Count; $i++) { Write-Host ("  {0}. {1}" -f ($i + 1), $categories[$i].label.en) }
}
$categoryAnswer = Ask 'Category (number or name)' $Category -Required
$picked = $null
if ($categoryAnswer -match '^\d+$' -and [int]$categoryAnswer -ge 1 -and [int]$categoryAnswer -le $categories.Count) { $picked = $categories[[int]$categoryAnswer - 1] }
if (-not $picked) { $picked = $categories | Where-Object { $_.slug -ieq $categoryAnswer -or $_.label.en -ieq $categoryAnswer -or $_.label.sq -ieq $categoryAnswer } | Select-Object -First 1 }
if (-not $picked) { Fail "Unknown category: $categoryAnswer. Choose one of: $(($categories | ForEach-Object { $_.slug }) -join ', ')" }

$defaultYear = if ($Year) { "$Year" } else { "$((Get-Date).Year)" }
$yearAnswer = Ask 'Year' $defaultYear -Required
if ($yearAnswer -notmatch '^\d{4}$') { Fail "The year should look like 2026." }
$Client = Ask 'Client name to show (Enter to skip)' $Client
$SummaryEn = Ask 'One-sentence description in English (Enter to skip)' $SummaryEn
$SummarySq = if ($SummaryEn) { Ask 'Description in Albanian (Enter to skip)' $SummarySq } else { '' }
$Video = Ask 'YouTube or Vimeo link (Enter to skip)' $Video
if ($Video -and $Video -notmatch '^https://((www|m)\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)/') { Fail "The video link must start with https://youtube.com, https://youtu.be or https://vimeo.com." }

$baseSlug = ConvertTo-Slug $TitleEn
if (-not $baseSlug) { $baseSlug = 'project' }
$slug = $baseSlug
$n = 2
while ($takenSlugs -contains $slug -or (Test-Path (Join-Path $SiteRoot "images\projects\$slug"))) { $slug = "$baseSlug-$n"; $n++ }

# ---------- Web copies ----------
$outDir = Join-Path $SiteRoot "images\projects\$slug"
$work = Join-Path ([IO.Path]::GetTempPath()) ("mafos-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force $outDir, $work | Out-Null

try {
  # PDFs become one image per page.
  $sources = New-Object System.Collections.Generic.List[string]
  $pdfIndex = 0
  foreach ($file in $files) {
    if ($file.Extension -ieq '.pdf') {
      if (-not $pdftoppm) { Fail "To use PDFs, install Poppler:  winget install oschwartz10612.Poppler" }
      $pdfIndex++
      Write-Host "Reading the pages of $($file.Name)..."
      & $pdftoppm -r 200 -png $file.FullName (Join-Path $work "pdf$pdfIndex")
      if ($LASTEXITCODE -ne 0) { Fail "Could not read $($file.Name). Is it a valid PDF without a password?" }
      Get-ChildItem (Join-Path $work "pdf$pdfIndex-*.png") | Sort-Object { Get-NaturalKey $_.Name } | ForEach-Object { $sources.Add($_.FullName) }
    } else {
      $sources.Add($file.FullName)
    }
  }

  $pictures = New-Object System.Collections.Generic.List[string]
  $webBytes = 0
  $number = 0
  foreach ($sourcePath in $sources) {
    $number++
    $name = '{0:D2}' -f $number
    Write-Host ("Making web copies {0}/{1}: {2}" -f $number, $sources.Count, (Split-Path $sourcePath -Leaf))

    # One cleaned master per image: upright, sRGB, no metadata (camera, GPS), at most 2400 px wide.
    $master = Join-Path $work "$name.miff"
    & $magick "$sourcePath[0]" -auto-orient -colorspace sRGB -strip -resize '2400x>' $master
    if ($LASTEXITCODE -ne 0) { Fail "ImageMagick could not read $(Split-Path $sourcePath -Leaf)." }
    $size = (& $magick identify -format '%w %h' $master).Split(' ')
    $width = [int]$size[0]
    $height = [int]$size[1]

    # Standard widths below the image's own, skipping any within 15% of it (a near-duplicate).
    $targets = @($Widths | Where-Object { $_ * 1.15 -lt $width }) + $width
    $srcset = New-Object System.Collections.Generic.List[string]
    foreach ($target in $targets) {
      $file = Join-Path $outDir "$name-$target.webp"
      & $magick $master -resize "${target}x" -quality $Quality -define webp:method=6 $file
      if ($LASTEXITCODE -ne 0) { Fail "Could not write $file." }
      $webBytes += (Get-Item $file).Length
      $srcset.Add("images/projects/$slug/$name-$target.webp ${target}w")
    }
    $main = $targets | Where-Object { $_ -le 1840 } | Select-Object -Last 1
    $pictures.Add(('{ "src": "images/projects/' + $slug + '/' + $name + '-' + $main + '.webp", "srcset": "' + ($srcset -join ', ') + '", "width": ' + $width + ', "height": ' + $height + ' }'))
  }
}
finally {
  Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue
}

# ---------- Content entry ----------
$nl = if ($site.Text.Contains("`r`n")) { "`r`n" } else { "`n" }
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('    {')
$lines.Add('      "slug": ' + (ConvertTo-JsonString $slug) + ',')
$lines.Add('      "category": ' + (ConvertTo-JsonString $picked.slug) + ',')
$lines.Add('      "title": ' + (ConvertTo-JsonText @{ en = $TitleEn; sq = $TitleSq }) + ',')
if ($SummaryEn) { $lines.Add('      "summary": ' + (ConvertTo-JsonText @{ en = $SummaryEn; sq = $SummarySq }) + ',') }
if ($Client) { $lines.Add('      "client": ' + (ConvertTo-JsonString $Client) + ',') }
$lines.Add('      "year": ' + [int]$yearAnswer + ',')
$lines.Add('      "cover": ' + $pictures[0] + ',')
$media = @($pictures)
if ($Video) { $media += '{ "embed": ' + (ConvertTo-JsonString $Video) + ' }' }
$lines.Add('      "images": [')
for ($i = 0; $i -lt $media.Count; $i++) { $lines.Add('        ' + $media[$i] + $(if ($i -lt $media.Count - 1) { ',' } else { '' })) }
$lines.Add('      ]')
$lines.Add('    },')
$entry = ($lines -join $nl) + $nl

$anchor = [regex]::Match($site.Text, '"projects"\s*:\s*\[[^\S\r\n]*\r?\n')
if (-not $anchor.Success) { Fail 'Could not find the "projects" list in content\content.js.' }
$newText = $site.Text.Insert($anchor.Index + $anchor.Length, $entry)

# Make sure the file still reads before saving it.
try {
  $start = $newText.IndexOf('{', $newText.IndexOf('window.SITE_CONTENT'))
  $null = $newText.Substring($start, $newText.LastIndexOf('}') - $start + 1) | ConvertFrom-Json
} catch {
  Fail "Something went wrong building the project entry; content.js was not changed. ($($_.Exception.Message))"
}
[IO.File]::WriteAllText($contentPath, $newText, $Utf8)

Write-Host ""
Write-Host ("Added ""{0}"" ({1}) with {2} image(s)." -f $TitleEn, $picked.label.en, $pictures.Count) -ForegroundColor Green
Write-Host ("Originals: {0:N1} MB  ->  web copies: {1:N1} MB" -f ($originalBytes / 1MB), ($webBytes / 1MB))
Write-Host "Web copies: images\projects\$slug"
Write-Host ""

if (-not $NoPreview) {
  $page = "file:///" + ((Join-Path $SiteRoot 'project.html') -replace '\\', '/') + "?p=$slug"
  $browser = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") |
    Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($browser) {
    Write-Host "Opening a preview in your browser..."
    Start-Process $browser $page
  } else {
    Write-Host "Preview: $page"
  }
}
Write-Host "When it looks right, double-click publish.cmd to put it online."
