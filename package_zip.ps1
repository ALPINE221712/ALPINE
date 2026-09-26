$src = 'c:\Users\hp\Downloads\stitch_stocksense_enterprise_ims'
$dest = 'C:\Users\hp\Downloads\StockSense_Enterprise_IMS.zip'
$tempDir = 'c:\Users\hp\Downloads\temp_stocksense_zip'

if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null

$exclude = @('node_modules', '.git', 'dist', 'temp_stocksense_zip')

Get-ChildItem -Path $src | ForEach-Object {
    if ($_.Name -notin $exclude) {
        Copy-Item -Path $_.FullName -Destination $tempDir -Recurse -Force
    }
}

if (Test-Path "$tempDir\backend\node_modules") {
    Remove-Item -Recurse -Force "$tempDir\backend\node_modules"
}

if (Test-Path $dest) { Remove-Item -Force $dest }
Compress-Archive -Path "$tempDir\*" -DestinationPath $dest -Force
Remove-Item -Recurse -Force $tempDir

$zipItem = Get-Item $dest
Write-Output "ZIP created at $($zipItem.FullName) with size: $($zipItem.Length) bytes"
