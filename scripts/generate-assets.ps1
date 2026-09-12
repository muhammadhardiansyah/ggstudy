Add-Type -AssemblyName System.Drawing

function New-RoundedRectanglePath {
    param(
        [System.Drawing.RectangleF]$rect,
        [float]$radius
    )
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2
    $arc = New-Object System.Drawing.RectangleF($rect.X, $rect.Y, $diameter, $diameter)

    # Top-left
    $path.AddArc($arc, 180, 90)

    # Top-right
    $arc.X = $rect.Right - $diameter
    $path.AddArc($arc, 270, 90)

    # Bottom-right
    $arc.Y = $rect.Bottom - $diameter
    $path.AddArc($arc, 0, 90)

    # Bottom-left
    $arc.X = $rect.Left
    $path.AddArc($arc, 90, 90)

    $path.CloseFigure()
    return $path
}

# 1. Generate icon.png (64x64)
$bmp64 = New-Object System.Drawing.Bitmap(64, 64)
$g64 = [System.Drawing.Graphics]::FromImage($bmp64)
$g64.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g64.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$rect64 = New-Object System.Drawing.RectangleF(0, 0, 64, 64)
$path64 = New-RoundedRectanglePath -rect $rect64 -radius 16
$brushBg = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#d4a373"))
$g64.FillPath($brushBg, $path64)

$font64 = New-Object System.Drawing.Font("Arial", 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$brushWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$textRect64 = New-Object System.Drawing.RectangleF(0, 2, 64, 64)
$g64.DrawString("GG", $font64, $brushWhite, $textRect64, $sf)

$bmp64.Save("public/icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g64.Dispose()

# 2. Generate apple-icon.png (180x180)
$bmp180 = New-Object System.Drawing.Bitmap(180, 180)
$g180 = [System.Drawing.Graphics]::FromImage($bmp180)
$g180.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g180.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$rect180 = New-Object System.Drawing.RectangleF(0, 0, 180, 180)
$path180 = New-RoundedRectanglePath -rect $rect180 -radius 44
$g180.FillPath($brushBg, $path180)

$font180 = New-Object System.Drawing.Font("Arial", 80, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$textRect180 = New-Object System.Drawing.RectangleF(0, 4, 180, 180)
$g180.DrawString("GG", $font180, $brushWhite, $textRect180, $sf)

$bmp180.Save("public/apple-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp180.Save("public/apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g180.Dispose()

# 3. Generate favicon.ico (32x32 standard icon)
$bmp32 = New-Object System.Drawing.Bitmap($bmp64, 32, 32)
$hIcon = $bmp32.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = [System.IO.File]::OpenWrite("public/favicon.ico")
$icon.Save($fs)
$fs.Close()
$fsSrc = [System.IO.File]::OpenWrite("src/app/favicon.ico")
$icon.Save($fsSrc)
$fsSrc.Close()
$bmp32.Dispose()

# 4. Generate og-image.png (1200x630) for WhatsApp & Social Sharing
$w = 1200
$h = 630
$bmpOg = New-Object System.Drawing.Bitmap($w, $h)
$gOg = [System.Drawing.Graphics]::FromImage($bmpOg)
$gOg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gOg.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Background gradient (pastel cream to peach)
$gradRect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$cStart = [System.Drawing.ColorTranslator]::FromHtml("#fdfbf7")
$cEnd = [System.Drawing.ColorTranslator]::FromHtml("#ffe8d6")
$gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($gradRect, $cStart, $cEnd, 45.0)
$gOg.FillRectangle($gradBrush, $gradRect)

# Outer border (subtle card frame)
$penOuter = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#e8e1d5"), 12)
$gOg.DrawRectangle($penOuter, 6, 6, $w - 12, $h - 12)

# Top Bar: Logo Icon (yellow rounded box)
$logoRect = New-Object System.Drawing.RectangleF(70, 60, 90, 90)
$logoPath = New-RoundedRectanglePath -rect $logoRect -radius 24
$gOg.FillPath($brushBg, $logoPath)
$fontLogo = New-Object System.Drawing.Font("Arial", 46, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$logoTextRect = New-Object System.Drawing.RectangleF(70, 64, 90, 90)
$gOg.DrawString("GG", $fontLogo, $brushWhite, $logoTextRect, $sf)

# Top Bar: Site Name & Subtitle
$fontSiteName = New-Object System.Drawing.Font("Arial", 44, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$brushTitle = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#cc8b56"))
$brushSub = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#a98467"))

$sfLeft = New-Object System.Drawing.StringFormat
$sfLeft.Alignment = [System.Drawing.StringAlignment]::Near
$sfLeft.LineAlignment = [System.Drawing.StringAlignment]::Near

$gOg.DrawString("ggstudy", $fontSiteName, $brushTitle, 180, 64, $sfLeft)
$fontSiteSub = New-Object System.Drawing.Font("Arial", 20, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$gOg.DrawString("Materi & Latihan Koding Python", $fontSiteSub, $brushSub, 180, 116, $sfLeft)

# Top Right: Modul Pembelajaran Badge
$badgeTopRect = New-Object System.Drawing.RectangleF(870, 75, 260, 52)
$badgeTopPath = New-RoundedRectanglePath -rect $badgeTopRect -radius 26
$brushWhiteCard = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$gOg.FillPath($brushWhiteCard, $badgeTopPath)
$penBadge = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#d4a373"), 2.5)
$gOg.DrawPath($penBadge, $badgeTopPath)

$fontBadge = New-Object System.Drawing.Font("Arial", 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$sfCenter = New-Object System.Drawing.StringFormat
$sfCenter.Alignment = [System.Drawing.StringAlignment]::Center
$sfCenter.LineAlignment = [System.Drawing.StringAlignment]::Center
$gOg.DrawString("Modul Interaktif", $fontBadge, $brushTitle, $badgeTopRect, $sfCenter)

# Main Headline
$fontHead = New-Object System.Drawing.Font("Arial", 54, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$brushDark = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#292524"))
$gOg.DrawString("Portal Belajar Python Interaktif", $fontHead, $brushDark, 70, 205, $sfLeft)

# Main Description
$fontDesc = New-Object System.Drawing.Font("Arial", 25, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$brushDesc = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#5c677d"))
$descRect = New-Object System.Drawing.RectangleF(70, 285, 1050, 110)
$gOg.DrawString("Koleksi modul presentasi slide interaktif dan tantangan kode rumpang siap pakai untuk siswa dan pengajar. Belajar koding jadi asik dan terarah.", $fontDesc, $brushDesc, $descRect, $sfLeft)

# Divider line
$penDivider = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#e8e1d5"), 2)
$gOg.DrawLine($penDivider, 70, 440, 1130, 440)

# Bottom Feature Pills
function Draw-Pill {
    param([float]$x, [float]$y, [float]$w, [float]$h, [string]$text)
    $pRect = New-Object System.Drawing.RectangleF($x, $y, $w, $h)
    $pPath = New-RoundedRectanglePath -rect $pRect -radius 16
    $gOg.FillPath($brushWhiteCard, $pPath)
    $penPill = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#d4a373"), 1.8)
    $gOg.DrawPath($penPill, $pPath)
    $brushPillText = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#78350f"))
    $fontPill = New-Object System.Drawing.Font("Arial", 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $gOg.DrawString($text, $fontPill, $brushPillText, $pRect, $sfCenter)
}

Draw-Pill -x 70 -y 480 -w 230 -h 54 -text "Slide Interaktif"
Draw-Pill -x 320 -y 480 -w 260 -h 54 -text "Latihan Kode Python"
Draw-Pill -x 600 -y 480 -w 210 -h 54 -text "Ramah Pemula"

# Bottom Right Domain
$fontDomain = New-Object System.Drawing.Font("Arial", 22, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$gOg.DrawString("ggstudy.vercel.app", $fontDomain, $brushSub, 900, 492, $sfLeft)

$bmpOg.Save("public/og-image.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpOg.Save("public/badge-share.png", [System.Drawing.Imaging.ImageFormat]::Png)
Copy-Item "public/og-image.png" "src/app/opengraph-image.png" -Force

$gOg.Dispose()
$bmpOg.Dispose()

Write-Output "Assets successfully generated!"

