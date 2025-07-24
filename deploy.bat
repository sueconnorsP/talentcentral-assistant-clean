@echo off
echo 🔄 Building React app from my-chat-ui...
cd my-chat-ui
call npm run build

echo 📦 Copying build to client directory in server root...
cd ..
rmdir /s /q client\build
xcopy /E /I /Y my-chat-ui\build client\build

echo 💾 Staging changes for Git...
git add .
git commit -m "Deploy updated TalentCentral fullstack app"
git push origin main

echo 🚀 Deployment pushed! Render will now rebuild.
pause
