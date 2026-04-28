Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("d:\chancellor\WeAreFamily\public\icons\PWAIcon.jpg")
$img.Save("d:\chancellor\WeAreFamily\public\icons\PWAIcon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
