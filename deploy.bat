@echo off
echo 🛠 Building React app...
cd my-chat-ui
call npm run build

echo 🔄 Copying build to server root...
cd ..
rmdir /s /q build
xcopy /E /I /Y my-chat-ui\build build

echo ✅ Deployment ready! Pushing to GitHub...
git add .
git commit -m "Deploy fullstack TalentCentral Assistant"
git push origin main

pause