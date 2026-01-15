# Configuration
$sourceDir = "C:\Frazer30\VehicleUploads"

# List of all destination folders
$destinations = @(
    "C:\Users\matt_\OneDrive\Desktop\AI Tools\AI - frazer feed",
    "C:\Users\matt_\OneDrive\Desktop\Upload to drive\Frazer feed - backup"
)

# Log file location (stored in the first destination folder)
$logFile = Join-Path $destinations[0] "SyncLog.txt"

function Log-Message {
    param($message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] $message"
    Write-Host $line
    Add-Content -Path $logFile -Value $line
}

function Sync-Files {
    param($targetDir)
    
    # Ensure destination exists
    if (!(Test-Path -Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir | Out-Null
        Log-Message "Created directory: $targetDir"
    }

    Log-Message "Checking files for destination: $targetDir"

    # Filter out backup/duplicate files (e.g., file-2.csv)
    $files = Get-ChildItem -Path $sourceDir | Where-Object { 
        $_.Name -notmatch '-[2-9]\.' -and $_.Name -notmatch '-\d{2,}\.'
    }

    foreach ($file in $files) {
        $destFile = Join-Path -Path $targetDir -ChildPath $file.Name
        $shouldCopy = $false

        if (Test-Path -Path $destFile) {
            $destItem = Get-Item -Path $destFile
            # Copy if source is newer
            if ($file.LastWriteTime -gt $destItem.LastWriteTime) {
                $shouldCopy = $true
                Log-Message "Updates detected for $($file.Name)"
            }
        }
        else {
            $shouldCopy = $true
            Log-Message "New file found: $($file.Name)"
        }

        if ($shouldCopy) {
            try {
                Copy-Item -Path $file.FullName -Destination $destFile -Force
                Log-Message "Successfully copied: $($file.Name)"
                
                # TRIGGER WEBSITES UPDATE (Integrated AutoPublish)
                if ($file.Name -eq "DealerCarSearch-1.csv") {
                    try {
                        Log-Message "Triggering Website Update for DealerCarSearch-1.csv..."
                        
                        $repoRoot = "C:\Users\matt_\OneDrive\Desktop\office website folder\high-life-auto"
                        $websiteDest = Join-Path -Path $repoRoot -ChildPath "public\frazer-inventory-updated.csv"
                        
                        # 1. Copy to Website Folder
                        Copy-Item -Path $destFile -Destination $websiteDest -Force
                        Log-Message "Copied to website repo public folder."
                        
                        # 2. Git Push
                        Push-Location -Path $repoRoot
                        if (git status --porcelain) {
                            git add .
                            git commit -m "Auto-update inventory $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
                            git push origin main
                            Log-Message "SUCCESS: Pushed update to GitHub (Website will rebuild)."
                        }
                        else {
                            Log-Message "No git changes detected."
                        }
                    }
                    catch {
                        Log-Message "WEBSITE UPDATE FAILED: $($_.Exception.Message)"
                    }
                    finally {
                        Pop-Location
                    }
                }
            }
            catch {
                Log-Message "Error copying $($file.Name): $($_.Exception.Message)"
            }
        }
    }
}

# Helper to get 8am start time for a given date
function Get-StartTime($d) { return $d.Date.AddHours(8) }

Log-Message "Multi-Sync Agent Started. Schedule: Every 15 mins (8:00 AM - 7:00 PM, Mon-Sat)."

# Run immediately on startup
try {
    Log-Message "Performing initial startup sync..."
    foreach ($dest in $destinations) {
        Sync-Files -targetDir $dest
    }
}
catch {
    Log-Message "Startup Error: $($_.Exception.Message)"
    Read-Host "Press Enter to continue (checking schedule loop)..."
}

# Infinite loop
while ($true) {
    try {
        $now = Get-Date
        
        # Calculate tentative next run (15 mins from now)
        $target = $now.AddMinutes(15)
        
        $startHour = 8
        $endHour = 19 # 7 PM
        
        # 1. If currently Sunday, jump to Monday 8 AM
        if ($target.DayOfWeek -eq 'Sunday') {
            $target = Get-StartTime $target.AddDays(1)
        }
        # 2. If it's too late in the day (>= 19:00), jump to tomorrow 8 AM
        elseif ($target.Hour -ge $endHour) {
            $target = Get-StartTime $target.AddDays(1)
            # If that tomorrow is Sunday, jump to Monday
            if ($target.DayOfWeek -eq 'Sunday') {
                $target = Get-StartTime $target.AddDays(1)
            }
        }
        # 3. If it's too early in the day (< 8:00), jump to today 8 AM
        elseif ($target.Hour -lt $startHour) {
            $target = Get-StartTime $target
        }
        
        # Calculate wait time
        $current = Get-Date
        $secondsToWait = ($target - $current).TotalSeconds
        
        # Safety for negative wait
        if ($secondsToWait -le 0) {
            $secondsToWait = 10
            $target = $current.AddSeconds(10)
        }

        $timeSpan = [timespan]::FromSeconds($secondsToWait)
        Log-Message "Next run scheduled for $target (in $($timeSpan.Hours)h $($timeSpan.Minutes)m)"

        # Wait
        Start-Sleep -Seconds $secondsToWait

        Log-Message "Starting scheduled sync cycle..."
        foreach ($dest in $destinations) {
            Sync-Files -targetDir $dest
        }
        Log-Message "Sync cycle complete."
    }
    catch {
        Log-Message "Critical Error: $($_.Exception.Message)"
        Start-Sleep -Seconds 300
    }
}

Read-Host "Script stopped. Press Enter to close..."
