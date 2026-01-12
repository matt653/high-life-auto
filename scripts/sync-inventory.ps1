
# Set the source and destination paths
$sourcePath = "H:\My Drive\Matt\new app stuf\matt ai\frazer data\DealerCarSearch-1.csv"
$destPath = "C:\Users\matt_\OneDrive\Desktop\office website folder\high-life-auto\public\frazer-inventory.csv"

# Check if the source file exists
if (Test-Path $sourcePath) {
    # Copy the file and force overwrite
    Copy-Item -Path $sourcePath -Destination $destPath -Force
    Write-Host "Success: Inventory file synced from H: drive to App." -ForegroundColor Green
    Write-Host "Source: $sourcePath"
    Write-Host "Destination: $destPath"
}
else {
    Write-Host "Error: Source file not found at $sourcePath" -ForegroundColor Red
    Write-Host "Please check that your H: drive is connected."
}
