import os
import math
import cv2
import numpy as np
from ultralytics import YOLO

model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'best.pt')
print(f"Loading model: {model_path}...")
model = YOLO(model_path)
print("Model loaded successfully!")
print(f"Model classes: {model.names}")
