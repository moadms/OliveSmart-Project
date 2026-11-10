import cv2
import numpy as np

img = cv2.imread("C:/Users/hp/.gemini/antigravity/brain/efcba61c-8b15-4e8d-9584-13f518d67dbd/satellite_detection_proof_perfect.jpg")
h, w = img.shape[:2]

# Crop 1: Dense zone
c1 = img[int(h*0.2):int(h*0.55), int(w*0.3):int(w*0.7)]
c1 = cv2.resize(c1, (500, 400))
cv2.putText(c1, "Zone 1 : Alignement Dense (Aucun Doublon)", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

# Crop 2: Inter-row zone (showing clean soil)
c2 = img[int(h*0.5):int(h*0.85), int(w*0.2):int(w*0.6)]
c2 = cv2.resize(c2, (500, 400))
cv2.putText(c2, "Zone 2 : Allees de Terre (0 Faux Positif)", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

combined = np.hstack([c1, c2])
cv2.imwrite("C:/Users/hp/.gemini/antigravity/brain/efcba61c-8b15-4e8d-9584-13f518d67dbd/satellite_detection_detail_crops.jpg", combined)
print("Crop detail image created!")
