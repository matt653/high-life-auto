$Action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-WindowStyle Hidden -File ""C:\Users\matt_\OneDrive\Desktop\office website folder\high-life-auto\scripts\MasterSync.ps1"""
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Principal = New-ScheduledTaskPrincipal -GroupId "BUILTIN\Administrators" -RunLevel Highest
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -multipleInstances IgnoreNew

Register-ScheduledTask -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -TaskName "HighLifeAuto_MasterSync" -Description "Syncs Frazer Inventory to Website and GDrive automatically" -Force

Write-Host "Task 'HighLifeAuto_MasterSync' created successfully!" -ForegroundColor Green
Write-Host "It will run automatically next time you log in."
Write-Host "Starting it now..."
Start-ScheduledTask -TaskName "HighLifeAuto_MasterSync"
