import socketio
import cv2
import numpy as np
import base64
import mss
import pyautogui
import time

# --- CONFIG ---
SERVER_URL = "http://localhost:3000"
PC_NAME = "My Python PC" 
# --------------

sio = socketio.Client()
connected = False
cap = cv2.VideoCapture(0)

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
    # Start the loop
    send_screen()

@sio.event
def disconnect():
    global connected
    connected = False
    print("Disconnected from server")

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

def send_screen():
    if not connected:
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
            sio.emit("screen", base64.b64encode(sbuf).decode())

        # Capture Camera
        if cap.isOpened():
            ret, cam = cap.read()
            if ret:
                _, cbuf = cv2.imencode(".jpg", cam, [int(cv2.IMWRITE_JPEG_QUALITY), 50])
                sio.emit("camera", base64.b64encode(cbuf).decode())

    except Exception as e:
        print(f"Capture error: {e}")

    # Loop immediately
    sio.emit("sync", callback=send_screen)

if __name__ == "__main__":
    try:
        sio.connect(SERVER_URL)
        sio.wait()
    except KeyboardInterrupt:
        cap.release()
        print("Stopped.")
    except Exception as e:
        print(f"Connection Failed: {e}")