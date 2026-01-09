import cv2
import mss
import numpy as np
import time
import atexit
from pynput import keyboard

filename = f"flask_{int(time.time())}.avi"
fourcc = cv2.VideoWriter_fourcc(*"XVID")
monitor = {"top": 0, "left": 0, "width": 1920, "height": 1080}
fps = 10

out = cv2.VideoWriter(filename, fourcc, fps, (monitor["width"], monitor["height"]))

keystrokes = []

def cleanup():
    out.release()

atexit.register(cleanup)

def on_press(key):
    if hasattr(key, "char") and key.char is not None:
        keystrokes.append(key.char)
    elif key == keyboard.Key.space:
        keystrokes.append(" ")
    elif key == keyboard.Key.enter:
        keystrokes.append(" [ENTER] ")
    elif key == keyboard.Key.backspace:
        keystrokes.append(" [BACKSPACE] ")
    else:
        keystrokes.append(" [" + str(key).replace("Key.", "").upper() + "] ")

listener = keyboard.Listener(on_press=on_press)
listener.daemon = True
listener.start()

with mss.mss() as sct:
    while True:
        frame = np.array(sct.grab(monitor))
        frame = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)
        text = "".join(keystrokes[-20:])
        cv2.putText(frame, text, (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        out.write(frame)
