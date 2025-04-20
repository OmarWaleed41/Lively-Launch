@echo off
setlocal

set "BATCH_DIR=%~dp0"
set "TARGET=%BATCH_DIR%run_serv.bat"
set "SHORTCUT_NAME=LivelyLaunchServer"

echo Installing Node Modules...
call npm install || (
    echo npm install failed!
    pause
    exit /b
)

echo Dependencies installed successfully!
echo.

powershell -command "$s = (New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Startup') + '\%SHORTCUT_NAME%.lnk'); $s.TargetPath = '%TARGET%'; $s.Save()"

echo Server is added to Startup With Windows
echo.
pause

