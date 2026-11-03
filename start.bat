@echo off
cd /d "%~dp0"
echo Starting UndanganKita on http://localhost:8000 ...
start "" http://localhost:8000
python server.py
pause
