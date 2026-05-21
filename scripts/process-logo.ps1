Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\VAN WOODROE\.gemini\antigravity-ide\brain\42ac5724-f98e-42a5-b8d6-b321575cd366\media__1779360045465.png"
$publicDir = "c:\Users\VAN WOODROE\Documents\ScholarMe\public"

# Load source image
$source = [System.Drawing.Image]::FromFile($sourcePath)
$width = $source.Width
$height = $source.Height

Write-Host "Source image: ${width}x${height}"

# --- Generate WHITE logo (white artwork on transparent background) ---
$whiteImg = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($x = 0; $x -lt $width; $x++) {
    if ($x % 100 -eq 0) { Write-Host "White logo: processing column $x / $width" }
    for ($y = 0; $y -lt $height; $y++) {
        $pixel = ([System.Drawing.Bitmap]$source).GetPixel($x, $y)
        
        # Calculate luminance (how bright the pixel is)
        $luminance = (0.299 * $pixel.R + 0.587 * $pixel.G + 0.114 * $pixel.B) / 255.0
        
        if ($luminance -gt 0.92) {
            # Near-white/background pixel -> fully transparent
            $whiteImg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
        } else {
            # Dark pixel (artwork) -> make it white, with alpha based on darkness
            # Darker pixels = more opaque
            $alpha = [Math]::Min(255, [int]((1.0 - $luminance) * 255 * 1.5))
            $alpha = [Math]::Max(0, $alpha)
            $whiteImg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 255, 255, 255))
        }
    }
}
$whitePath = Join-Path $publicDir "honsoc-logo-white.png"
$whiteImg.Save($whitePath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "White logo saved to: $whitePath"
$whiteImg.Dispose()

# --- Generate BLACK logo (black artwork on transparent background) ---
$blackImg = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($x = 0; $x -lt $width; $x++) {
    if ($x % 100 -eq 0) { Write-Host "Black logo: processing column $x / $width" }
    for ($y = 0; $y -lt $height; $y++) {
        $pixel = ([System.Drawing.Bitmap]$source).GetPixel($x, $y)
        $luminance = (0.299 * $pixel.R + 0.587 * $pixel.G + 0.114 * $pixel.B) / 255.0
        
        if ($luminance -gt 0.92) {
            # Background -> fully transparent
            $blackImg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Dark pixel -> keep as black with alpha based on darkness
            $alpha = [Math]::Min(255, [int]((1.0 - $luminance) * 255 * 1.5))
            $alpha = [Math]::Max(0, $alpha)
            $blackImg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 0, 0, 0))
        }
    }
}
$blackPath = Join-Path $publicDir "honsoc-logo-black.png"
$blackImg.Save($blackPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Black logo saved to: $blackPath"
$blackImg.Dispose()

# --- Generate GOLD logo (gold artwork on transparent background) ---
$goldImg = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$goldR = 255; $goldG = 215; $goldB = 0  # #FFD700

for ($x = 0; $x -lt $width; $x++) {
    if ($x % 100 -eq 0) { Write-Host "Gold logo: processing column $x / $width" }
    for ($y = 0; $y -lt $height; $y++) {
        $pixel = ([System.Drawing.Bitmap]$source).GetPixel($x, $y)
        $luminance = (0.299 * $pixel.R + 0.587 * $pixel.G + 0.114 * $pixel.B) / 255.0
        
        if ($luminance -gt 0.92) {
            # Background -> fully transparent
            $goldImg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Dark pixel -> gold with alpha based on darkness
            $alpha = [Math]::Min(255, [int]((1.0 - $luminance) * 255 * 1.5))
            $alpha = [Math]::Max(0, $alpha)
            $goldImg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $goldR, $goldG, $goldB))
        }
    }
}
$goldPath = Join-Path $publicDir "honsoc-logo-gold.png"
$goldImg.Save($goldPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Gold logo saved to: $goldPath"
$goldImg.Dispose()

$source.Dispose()
Write-Host ""
Write-Host "All 3 logo variants generated successfully with transparent backgrounds!"
Write-Host "  - White: $whitePath"
Write-Host "  - Black: $blackPath"
Write-Host "  - Gold:  $goldPath"
