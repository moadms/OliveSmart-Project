"""
=============================================================================
OliveSmart AI - Pipeline d'Entraînement Satellitaire Automatisé (YOLOv11s)
Auteur : Moad Moussaoui • Équipe OliveSmart Haouz/Meknès
=============================================================================
Ce script télécharge les tuiles satellites ESRI World Imagery des vergers
d'oliviers du Maroc (Marrakech-Haouz et Meknès-Saïss), génère les annotations
YOLO, et entraîne YOLOv11s avec les hyperparamètres anti-overfitting.
=============================================================================
"""

import os
import math
import urllib.request
import cv2
import numpy as np
import yaml
from ultralytics import YOLO

DATASET_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dataset_satellite_olives')
IMAGES_TRAIN = os.path.join(DATASET_DIR, 'images', 'train')
LABELS_TRAIN = os.path.join(DATASET_DIR, 'labels', 'train')
IMAGES_VAL = os.path.join(DATASET_DIR, 'images', 'val')
LABELS_VAL = os.path.join(DATASET_DIR, 'labels', 'val')

for p in [IMAGES_TRAIN, LABELS_TRAIN, IMAGES_VAL, LABELS_VAL]:
    os.makedirs(p, exist_ok=True)

def lat_lng_to_tile(lat, lng, zoom=19):
    n = 2.0 ** zoom
    x = int(math.floor((lng + 180.0) / 360.0 * n))
    lat_rad = math.radians(lat)
    y = int(math.floor((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n))
    return x, y

def fetch_satellite_tile(x, y, zoom=19):
    url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{y}/{x}"
    req = urllib.request.Request(url, headers={'User-Agent': 'OliveSmart-Trainer/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=6) as response:
            arr = np.asarray(bytearray(response.read()), dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is not None and img.shape[0] == 256 and img.shape[1] == 256:
                return img
    except Exception as e:
        pass
    return None

def extract_ground_truth_canopies(tile_bgr):
    """
    Extrait les boîtes englobantes des oliviers réels présents sur la tuile satellite
    basé sur l'analyse spectrale (ExG >= -4 & Gray < 112).
    """
    gray = cv2.cvtColor(tile_bgr, cv2.COLOR_BGR2GRAY)
    b_chan = tile_bgr[:, :, 0].astype(np.float32)
    g_chan = tile_bgr[:, :, 1].astype(np.float32)
    r_chan = tile_bgr[:, :, 2].astype(np.float32)
    exg = 2.0 * g_chan - r_chan - b_chan

    foliage = (gray < 112) & (exg >= -4)
    foliage_u8 = np.uint8(foliage * 255)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    clean = cv2.morphologyEx(foliage_u8, cv2.MORPH_OPEN, kernel)

    dist = cv2.distanceTransform(clean, cv2.DIST_L2, 5)
    dist_smooth = cv2.GaussianBlur(dist, (5, 5), 0)

    k_peak = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    dil = cv2.dilate(dist_smooth, k_peak)
    peaks = (dist_smooth == dil) & (dist_smooth >= 3.5)

    num_p, _, _, p_centroids = cv2.connectedComponentsWithStats(np.uint8(peaks * 255))
    boxes = []
    min_dist_px = 15.0

    raw_candidates = []
    for p_idx in range(1, num_p):
        pcx, pcy = p_centroids[p_idx]
        d_val = float(dist_smooth[int(round(pcy)), int(round(pcx))])
        raw_candidates.append((pcx, pcy, d_val))

    raw_candidates.sort(key=lambda item: -item[2])

    for pcx, pcy, d_val in raw_candidates:
        if all(math.hypot(pcx - bx[0], pcy - bx[1]) >= min_dist_px for bx in boxes):
            rad = max(8, int(round(d_val * 1.35)))
            x1 = max(0, int(pcx - rad))
            y1 = max(0, int(pcy - rad))
            x2 = min(255, int(pcx + rad))
            y2 = min(255, int(pcy + rad))
            sub = clean[y1:y2, x1:x2]
            if np.count_nonzero(sub) >= 30: # surface foliaire minimale
                boxes.append((pcx, pcy, x1, y1, x2, y2))

    yolo_labels = []
    for pcx, pcy, x1, y1, x2, y2 in boxes:
        # Coordonnées normalisées YOLO (0..1)
        bx = (pcx) / 256.0
        by = (pcy) / 256.0
        bw = (x2 - x1) / 256.0
        bh = (y2 - y1) / 256.0
        yolo_labels.append(f"0 {bx:.6f} {by:.6f} {bw:.6f} {bh:.6f}")

    return yolo_labels

def build_satellite_dataset():
    print("[Dataset Builder] Téléchargement des tuiles satellites des vergers marocains...")
    # Région 1 : Marrakech - Haouz (Verger du cadastre)
    # Région 2 : Meknès - Saïss (Bassin oléicole intensif)
    centers = [
        (31.6340, -7.9655, "haouz"),
        (33.8820, -5.5420, "meknes")
    ]

    count = 0
    for lat, lng, region in centers:
        tx, ty = lat_lng_to_tile(lat, lng, 19)
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                tile = fetch_satellite_tile(tx + dx, ty + dy, 19)
                if tile is not None:
                    labels = extract_ground_truth_canopies(tile)
                    if len(labels) >= 2: # Contient des oliviers
                        fname = f"{region}_{dx}_{dy}"
                        target_split = "train" if (dx + dy) % 4 != 0 else "val"
                        img_path = os.path.join(DATASET_DIR, 'images', target_split, f"{fname}.jpg")
                        lbl_path = os.path.join(DATASET_DIR, 'labels', target_split, f"{fname}.txt")
                        cv2.imwrite(img_path, tile)
                        with open(lbl_path, 'w') as f:
                            f.write("\n".join(labels))
                        count += 1

    print(f"[Dataset Builder] {count} tuiles satellites annotées prêtes dans {DATASET_DIR} !")

    # data.yaml
    yaml_dict = {
        'path': DATASET_DIR,
        'train': 'images/train',
        'val': 'images/val',
        'names': {0: 'Olive_Tree'}
    }
    yaml_file = os.path.join(DATASET_DIR, 'data.yaml')
    with open(yaml_file, 'w') as f:
        yaml.dump(yaml_dict, f, sort_keys=False)
    print(f"[Dataset Builder] data.yaml généré : {yaml_file}")
    return yaml_file

def train_yolo(yaml_path, epochs=15):
    print(f"[YOLO Trainer] Lancement de l'entraînement fine-tuning sur {epochs} époques...")
    base_model = 'yolo11s.pt' if os.path.exists('yolo11s.pt') else 'best.pt'
    model = YOLO(base_model)
    results = model.train(
        data=yaml_path,
        epochs=epochs,
        imgsz=256,
        batch=8,
        optimizer='AdamW',
        lr0=0.001,
        cos_lr=True,
        degrees=180.0,
        flipud=0.5,
        fliplr=0.5,
        mosaic=0.5,
        name='olivesmart_sat_run',
        verbose=True
    )
    best_weights = os.path.join('runs', 'detect', 'olivesmart_sat_run', 'weights', 'best.pt')
    if os.path.exists(best_weights):
        import shutil
        shutil.copy2(best_weights, 'best.pt')
        print(f"[YOLO Trainer] NOUVEAU best.pt déployé avec succès dans le projet !")
    return results

if __name__ == '__main__':
    yaml_file = build_satellite_dataset()
    print("Dataset prêt. Pour lancer l'entraînement complet sur Google Colab ou localement :")
    print(f"python train_satellite_yolo.py")
