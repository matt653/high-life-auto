@echo off
echo Starting High Life Auto Inventory Sync...
powershell.exe -ExecutionPolicy Bypass -File "C:\Users\matt_\OneDrive\Desktop\office website folder\high-life-auto\scripts\MasterSync.ps1"
if %errorlevel% neq 0 (
    echo Error: The script failed to run.
)
echo Sync process ended.
pause
