$sourceFile = "C:\Users\matt_\OneDrive\Desktop\office pc onl web\frazer feeds\DealerCarSearch-1.csv"
$destinationFolder = "H:\My Drive\Matt\new app stuf\matt ai\frazer data"
$destinationFile = Join-Path -Path $destinationFolder -ChildPath "DealerCarSearch-1.csv"

# Ensure destination directory exists
if (-not (Test-Path -Path $destinationFolder)) {
    New-Item -ItemType Directory -Path $destinationFolder | Out-Null
    Write-Host "Created destination folder: $destinationFolder"
}

# Function to perform the copy
function Copy-File {
    try {
        Write-Host "$(Get-Date): File changed. Copying..."
        Copy-Item -Path $sourceFile -Destination $destinationFile -Force
        Write-Host "$(Get-Date): File copied successfully to $destinationFile"
    }
    catch {
        Write-Error "$(Get-Date): Error copying file. ensure the file is not open elsewhere."
    }
}

# Initial copy (to ensure it's up to date right now)
Copy-File

# Create FileSystemWatcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = "C:\Users\matt_\OneDrive\Desktop\office pc onl web\frazer feeds"
$watcher.Filter = "DealerCarSearch-1.csv"
$watcher.IncludeSubdirectories = $false
$watcher.EnableRaisingEvents = $true

# Define the action to take when the file changes
$action = {
    $path = $Event.SourceEventArgs.FullPath
    $changeType = $Event.SourceEventArgs.ChangeType
    Write-Host "$(Get-Date): File '$path' was $changeType."
    
    # Small delay to ensure file lock is released by the writing process
    Start-Sleep -Seconds 2
    
    Copy-File
}

# Register events
Register-ObjectEvent $watcher "Changed" -Action $action
Register-ObjectEvent $watcher "Created" -Action $action

Write-Host "Monitoring $sourceFile for changes..."
Write-Host "Press Ctrl+C to stop."

# Keep the script running
while ($true) {
    Start-Sleep -Seconds 5
}
