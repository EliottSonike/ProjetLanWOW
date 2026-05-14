@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installation des dependances...
  npm install
)
node watcher.js
pause
