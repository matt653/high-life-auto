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
            }
            catch {
                Log-Message "Error copying $($file.Name): $($_.Exception.Message)"
            }
        }
    }
}

Log-Message "Multi-Sync Agent Started. Schedule: 6:00 AM, 2:00 PM, 6:00 PM."

# Run immediately on startup
Log-Message "Performing initial startup sync..."
foreach ($dest in $destinations) {
    Sync-Files -targetDir $dest
}

# Infinite loop
while ($true) {
    try {
        $now = Get-Date
        
        # Define the daily schedule (Hours: 0-23)
        # 6 = 6am, 14 = 2pm, 18 = 6pm
        $scheduleHours = @(6, 14, 18) 
        
        # Find the next scheduled time
        $target = $null
        foreach ($h in $scheduleHours) {
            $candidate = $now.Date.AddHours($h)
            if ($candidate -gt $now) {
                $target = $candidate
                break
            }
        }

        # If no more times today, set for 6am tomorrow
        if ($null -eq $target) {
            $target = $now.Date.AddDays(1).AddHours($scheduleHours[0])
        }

        # Calculate wait time
        $secondsToWait = ($target - $now).TotalSeconds
        $timeSpan = [timespan]::FromSeconds($secondsToWait)
        Log-Message "Next run in $($timeSpan.Hours)h $($timeSpan.Minutes)m at $target."

        # Wait
        Start-Sleep -Seconds $secondsToWait

        Log-Message "Starting scheduled sync cycle..."

        # Loop through all destinations
        foreach ($dest in $destinations) {
            Sync-Files -targetDir $dest
        }

        Log-Message "Sync cycle complete."
        
        # Pause briefly to prevent rapid re-triggering
        Start-Sleep -Seconds 60 
    }
    catch {
        Log-Message "Critical Error: $($_.Exception.Message)"
        Start-Sleep -Seconds 300
    }
}
