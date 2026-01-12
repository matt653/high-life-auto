$sourcePath = "H:\My Drive\Matt\new app stuf\matt ai\frazer data\DealerCarSearch-1.csv"
$destPath = "c:\Users\matt_\OneDrive\Desktop\office website folder\high-life-auto\public\frazer-inventory.csv"

Write-Host "Checking for inventory updates..."
if (Test-Path $sourcePath) {
    Copy-Item -Path $sourcePath -Destination $destPath -Force
    Write-Host "Inventory updated successfully from H: drive at $(Get-Date)"
} else {
    Write-Error "Source file not found: $sourcePath"
}
