if not exist "C:\sys\" mkdir "C:\sys\"
copy "%~dp0home\main.py" "C:\sys\sys.py" /Y
copy "%~dp0home\sys.bat" "C:\sys\sys.bat" /Y

"C:\sys\sys.bat"