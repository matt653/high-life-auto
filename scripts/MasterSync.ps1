# Master Inventory Sync Script for High Life Auto
# Source: Frazer System
# Destinations: Website + AI Drive

$sourcePath = "C:\Frazer30\VehicleUploads\DealerCarSearch-1.csv"
$destLegacy = "H:\My Drive\Matt\new app stuf\matt ai\frazer data\DealerCarSearch-1.csv"
$destWebsite = "C:\Users\matt_\OneDrive\Desktop\office website folder\high-life-auto\public\frazer-inventory-updated.csv"
$repoPath = "C:\Users\matt_\OneDrive\Desktop\office website folder\high-life-auto"

Write-Host "--- High Life Auto Master Sync ---" -ForegroundColor Cyan
Write-Host "Source: $sourcePath"

function Sync-Files {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Detected change. syncing..." -ForegroundColor Yellow

    if (Test-Path $sourcePath) {
        # 1. Copy to Legacy Drive
        try {
            if (-not (Test-Path "H:\")) {
                Write-Host "  [WARN] H: Drive not found (Google Drive not mounted?)" -ForegroundColor Yellow
            }
            else {
                Copy-Item -Path $sourcePath -Destination $destLegacy -Force
                Write-Host "  [OK] Copied to H: Drive" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "  [ERR] Failed to copy to H: Drive: $_" -ForegroundColor Red
        }

        # 2. Copy to Website Public Folder
        try {
            Copy-Item -Path $sourcePath -Destination $destWebsite -Force
            Write-Host "  [OK] Copied to Website Folder" -ForegroundColor Green
            
            # 3. Git Push (Auto Deploy)
            Set-Location $repoPath
            git add public/frazer-inventory-updated.csv
            $gitStatus = git status --porcelain
            if ($gitStatus) {
                # Only commit if changes exist
                git commit -m "Auto-Update Inventory: $timestamp"
                git push
                Write-Host "  [OK] Pushed to GitHub (Deploying...)" -ForegroundColor Cyan
            }
            else {
                Write-Host "  [INFO] No content changes detected by Git." -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "  [ERR] Failed to update website: $_" -ForegroundColor Red
        }
    }
    else {
        Write-Host "  [ERR] Source file not found: $sourcePath" -ForegroundColor Red
    }
}

# Initial Sync on Start
Sync-Files

# Watcher
$folder = "C:\Frazer30\VehicleUploads"
$filter = "DealerCarSearch-1.csv"
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $folder
$watcher.Filter = $filter
$watcher.IncludeSubdirectories = $false
$watcher.EnableRaisingEvents = $true

$action = {
    $path = $Event.SourceEventArgs.FullPath
    $changeType = $Event.SourceEventArgs.ChangeType
    Write-Host "File Changed: $changeType"
    # Debounce
    Start-Sleep -Seconds 2
    Sync-Files
}

Register-ObjectEvent $watcher "Changed" -Action $action
Register-ObjectEvent $watcher "Created" -Action $action

Write-Host "Watching for changes... (Press Ctrl+C to stop)" -ForegroundColor Cyan

while ($true) {
    Start-Sleep -Seconds 5
}
