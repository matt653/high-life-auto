@echo off
echo Updating inventory from Frazer...
copy /Y "C:\Frazer30\VehicleUploads\DealerCarSearch-1.csv" "H:\My Drive\Matt\new app stuf\matt ai\remote idea\public\frazer-inventory.csv"
echo Inventory updated successfully!
echo.
echo To run this automatically fast:
echo 1. Open Task Scheduler
echo 2. Create Basic Task
echo 3. Name: "Update High Life Inventory"
echo 4. Trigger: Daily at 7:00 PM
echo 5. Action: Start a Program -> Select this update_inventory.bat file
echo.
pause
