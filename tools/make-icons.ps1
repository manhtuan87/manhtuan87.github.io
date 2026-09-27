# Saves the app icons (drawn by tools/icon.html) as PNG files with headless Chrome.
# Run the local server first:  python tools/serve-site.py 8767
param([string]$Base = 'http://localhost:8767')
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$root = Split-Path -Parent $PSScriptRoot
$profile = Join-Path $env:TEMP 'land-icon-chrome'
$icons = @(
  @{ file = 'icon-192.png'; size = 192; mask = 0 },
  @{ file = 'icon-512.png'; size = 512; mask = 0 },
  @{ file = 'icon-maskable-512.png'; size = 512; mask = 1 },
  @{ file = 'apple-touch-icon.png'; size = 180; mask = 1 }
)
foreach ($i in $icons) {
  $out = Join-Path $root ('icons\' + $i.file)
  $url = "$Base/tools/icon.html?size=$($i.size)&mask=$($i.mask)"
  & $chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 `
    --default-background-color=00000000 --user-data-dir="$profile" `
    --window-size="$($i.size),$($i.size)" --screenshot="$out" $url 2>$null | Out-Null
  Write-Output "$($i.file): $((Get-Item $out).Length) bytes"
}
