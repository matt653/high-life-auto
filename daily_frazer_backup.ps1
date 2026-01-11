$sourceFile = "C:\Frazer30\VehicleUploads\DealerCarSearch-1.csv"
$destDir = "H:\My Drive\Matt\new app stuf\matt ai\frazer data"
$destFile = Join-Path -Path $destDir -ChildPath "DealerCarSearch-1.csv"

# Ensure destination directory exists
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Write-Host "Created directory: $destDir"
}

if (Test-Path $sourceFile) {
    # Check if destination file exists and delete it
    if (Test-Path $destFile) {
        Remove-Item -Path $destFile -Force
        Write-Host "Deleted old file: $destFile"
    }

    # Copy the new file
    Copy-Item -Path $sourceFile -Destination $destDir -Force
    Write-Host "Success: Copied '$sourceFile' to '$destDir' at $(Get-Date)"
} else {
    Write-Error "Source file not found: $sourceFile"
}
