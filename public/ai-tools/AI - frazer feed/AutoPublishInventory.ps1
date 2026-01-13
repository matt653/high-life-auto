# Configuration
$sourceFile = "C:\Users\matt_\OneDrive\Desktop\AI Tools\AI - frazer feed\DealerCarSearch-1.csv"
$repoRoot = "C:\Users\matt_\OneDrive\Desktop\office website folder\high-life-auto"
$destFile = Join-Path -Path $repoRoot -ChildPath "public\frazer-inventory-updated.csv"

# Function to perform the sync
function Sync-To-Git {
    Write-Host "File changed. Starting sync process..." -ForegroundColor Cyan

    # 1. Copy the file
    Copy-Item -Path $sourceFile -Destination $destFile -Force
    Write-Host "Copied CSV to website folder." -ForegroundColor Green

    # 2. Git operations
    Push-Location -Path $repoRoot
    try {
        # Check if there are changes
        $status = git status --porcelain
        if ($status) {
            git add .
            git commit -m "Auto-update inventory from CSV $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
            git push origin main
            Write-Host "Successfully pushed to GitHub. Netlify deploy triggered." -ForegroundColor Green
        }
        else {
            Write-Host "No changes detected by Git." -ForegroundColor Yellow
        }
    }
    catch {
        Write-Error "Git error: $_"
    }
    finally {
        Pop-Location
    }
}

# Initial Sync
Sync-To-Git

# Watcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = Split-Path -Parent $sourceFile
$watcher.Filter = Split-Path -Leaf $sourceFile
$watcher.EnableRaisingEvents = $true

$action = {
    # Debounce: Wait a moment for write to finish
    Start-Sleep -Seconds 2
    Sync-To-Git
}

Register-ObjectEvent $watcher "Changed" -Action $action
Register-ObjectEvent $watcher "Created" -Action $action

Write-Host "Monitoring $sourceFile for changes..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor Cyan

while ($true) { Start-Sleep -Seconds 5 }
