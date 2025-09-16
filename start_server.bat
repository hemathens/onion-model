@echo off
echo Starting Teachable Machine Image Classifier...
echo.
echo Make sure you have Python installed on your system.
echo.
echo If Python is not installed, you can download it from: https://python.org
echo.
echo Starting web server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

python -m http.server 8000

pause