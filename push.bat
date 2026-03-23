@echo off
setlocal

set REMOTE_URL=https://github.com/sunilv8892-sudo/rks-3.git

if not exist .git (
	git init
)

git add .
git commit -m "Update site" 2>nul

git branch -M main 2>nul
git remote remove origin 2>nul
git remote add origin %REMOTE_URL%

git push -u origin main

if errorlevel 1 (
	echo Push failed, attempting fetch and rebase...
	git fetch origin
	git pull --rebase origin main
	git push -u origin main
)

echo Done.
pause