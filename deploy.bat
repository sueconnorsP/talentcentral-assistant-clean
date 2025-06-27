@echo off
echo 🛠 Building React app...
cd my-chat-ui
call npm run build

echo 🔄 Copying build to server root...
cd ..
rmdir /s /q build
xcopy /E /I /Y my-chat-ui\build build

echo 🚀 Restarting server...
taskkill /F /IM node.exe >nul 2>&1
start "" /B cmd /c "node server.js"

echo ✅ Deployment complete!
pause
