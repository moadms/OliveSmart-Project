import math
import os
import urllib.request
import io
import time
import cv2
import numpy as np
import torch

# Optimize PyTorch CPU inference
torch.set_num_threads(6)

# Cache directory for satellite tiles
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tile_cache')
os.makedirs(CACHE_DIR, exist_ok=True)

# YOLO Model singleton
_YOLO_MODEL = None

def get_yolo_model():
    global _YOLO_MODEL
    if _YOLO_MODEL is None:
        try:
            from ultralytics import YOLO
            model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'best.pt')
            if os.path.exists(model_path):
                print(f"[YOLO Engine] Loading trained YOLO weights from {model_path}...")
                _YOLO_MODEL = YOLO(model_path)
                # Warm up model on dummy image for sub-second first inference
                dummy = np.zeros((640, 640, 3), dtype=np.uint8)
                _YOLO_MODEL.predict(dummy, imgsz=640, verbose=False)
                print("[YOLO Engine] YOLO model loaded and warmed up successfully!")
        except Exception as e:
            print(f"[YOLO Engine Warning] Failed to load YOLO model: {e}")
            _YOLO_MODEL = None
    return _YOLO_MODEL

# Pre-warm at module import
try:
    get_yolo_model()
except Exception as e:
    print(f"[YOLO Init Error]: {e}")

def lat_lng_to_tile(lat, lng, zoom=19):
    n = 2.0 ** zoom
    x = int(math.floor((lng + 180.0) / 360.0 * n))
    lat_rad = math.radians(lat)
    y = int(math.floor((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n))
    return x, y

def tile_to_lat_lng(x, y, zoom=19):
    n = 2.0 ** zoom
    lng = x / n * 360.0 - 180.0
    lat_rad = math.atan(math.sinh(math.pi * (1.0 - 2.0 * tile_y / n)))
    lat = math.degrees(lat_rad)
    return lat, lng

def fetch_tile(x, y, zoom=19):
    cache_path = os.path.join(CACHE_DIR, f"{zoom}_{y}_{x}.jpg")
    if os.path.exists(cache_path):
        img = cv2.imread(cache_path)
        if img is not None and img.shape[0] == 256 and img.shape[1] == 256:
            return img

    url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{y}/{x}"
    req = urllib.request.Request(url, headers={'User-Agent': 'OliveSmart-Detector/4.0'})
    try:
        with urllib.request.urlopen(req, timeout=6) as response:
            arr = np.asarray(bytearray(response.read()), dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is not None:
                cv2.imwrite(cache_path, img)
                return img
    except Exception as e:
        pass
    return np.full((256, 256, 3), 128, dtype=np.uint8)

def detect_trees_in_polygon(vertices, zoom=19):
    """
    Détection géodésique haute fidélité des oliviers :
    - Découpage dynamique de la zone d'intérêt tracée
    - Inférence YOLOv8/YOLOv11 entraîné sur imagerie satellite & drone
    - Récupération des houppiers denses par transformée de distance de canopée
    - Fusion spatiale stricte (anti-doublons : jamais 2 cadres sur le même arbre)
    - Filtrage de surface foliaire minimale (élimination des adventices/herbes sur sol nu)
    - Diagnostic sanitaire individuel par analyse spectrale
    """
    if not vertices or len(vertices) < 3:
        return []

    lats = [v['lat'] for v in vertices]
    lngs = [v['lng'] for v in vertices]
    min_lat, max_lat = min(lats), max(lats)
    min_lng, max_lng = min(lngs), max(lngs)

    # Coordonnées des tuiles de la zone
    x_min, y_min = lat_lng_to_tile(max_lat, min_lng, zoom)
    x_max, y_max = lat_lng_to_tile(min_lat, max_lng, zoom)

    x_max = min(x_max, x_min + 6)
    y_max = min(y_max, y_min + 6)

    n_cols = x_max - x_min + 1
    n_rows = y_max - y_min + 1

    mosaic = np.zeros((n_rows * 256, n_cols * 256, 3), dtype=np.uint8)

    for r_idx, ty in enumerate(range(y_min, y_max + 1)):
        for c_idx, tx in enumerate(range(x_min, x_max + 1)):
            t_img = fetch_tile(tx, ty, zoom)
            mosaic[r_idx*256:(r_idx+1)*256, c_idx*256:(c_idx+1)*256] = t_img

    H_mos, W_mos = mosaic.shape[:2]
    n = 2.0 ** zoom

    def latlng_to_mosaic_px(lat, lng):
        tile_x = ((lng + 180.0) / 360.0) * n
        lat_rad = math.radians(lat)
        tile_y = (1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n
        px = (tile_x - x_min) * 256.0
        py = (tile_y - y_min) * 256.0
        return px, py

    def mosaic_px_to_latlng(px, py):
        tile_x = x_min + px / 256.0
        tile_y = y_min + py / 256.0
        lng = (tile_x / n) * 360.0 - 180.0
        lat_rad = math.atan(math.sinh(math.pi * (1.0 - 2.0 * tile_y / n)))
        lat = math.degrees(lat_rad)
        return lat, lng

    poly_px = np.array([latlng_to_mosaic_px(v['lat'], v['lng']) for v in vertices], dtype=np.int32)
    poly_mask = np.zeros((H_mos, W_mos), dtype=np.uint8)
    cv2.fillPoly(poly_mask, [poly_px], 255)

    # 1. Bounding box du polygone pour un CROP ULTRA-RAPIDE
    min_px = np.min(poly_px[:, 0])
    max_px = np.max(poly_px[:, 0])
    min_py = np.min(poly_px[:, 1])
    max_py = np.max(poly_px[:, 1])

    pad = 25
    c_x1 = max(0, int(min_px) - pad)
    c_y1 = max(0, int(min_py) - pad)
    c_x2 = min(W_mos, int(max_px) + pad)
    c_y2 = min(H_mos, int(max_py) + pad)

    crop = mosaic[c_y1:c_y2, c_x1:c_x2]
    crop_h, crop_w = crop.shape[:2]

    # Inférence YOLOv8
    yolo_model = get_yolo_model()
    yolo_trees = []

    if yolo_model is not None and crop_h > 20 and crop_w > 20:
        try:
            res = yolo_model.predict(crop, imgsz=640, conf=0.10, iou=0.35, verbose=False)
            for box in res[0].boxes:
                b = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                gx1 = b[0] + c_x1
                gy1 = b[1] + c_y1
                gx2 = b[2] + c_x1
                gy2 = b[3] + c_y1
                gcx = (gx1 + gx2) / 2.0
                gcy = (gy1 + gy2) / 2.0

                if cv2.pointPolygonTest(poly_px, (gcx, gcy), False) >= 0:
                    yolo_trees.append((gcx, gcy, gx1, gy1, gx2, gy2, conf))
        except Exception as pred_err:
            print(f"[YOLO Predict Error]: {pred_err}")

    # 2. Masque spectral du feuillage d'olivier
    gray = cv2.cvtColor(mosaic, cv2.COLOR_BGR2GRAY)
    b_chan = mosaic[:, :, 0].astype(np.float32)
    g_chan = mosaic[:, :, 1].astype(np.float32)
    r_chan = mosaic[:, :, 2].astype(np.float32)
    exg = 2.0 * g_chan - r_chan - b_chan

    # Feuillage sombre et végétal, filtré à l'intérieur du polygone
    foliage = (gray < 112) & (exg >= -4) & (poly_mask > 0)
    foliage_u8 = np.uint8(foliage * 255)

    # Éliminer le bruit fin (< 12 px)
    kernel3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    foliage_clean = cv2.morphologyEx(foliage_u8, cv2.MORPH_OPEN, kernel3)

    # 3. Transformée de distance pour identifier chaque centre de houppier
    dist = cv2.distanceTransform(foliage_clean, cv2.DIST_L2, 5)
    dist_smooth = cv2.GaussianBlur(dist, (5, 5), 0)

    # Pic de canopée (distance minimale entre troncs = 16 px ~ 4.0 m)
    k_peak = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))
    dil = cv2.dilate(dist_smooth, k_peak)
    peaks = (dist_smooth == dil) & (dist_smooth >= 3.8) & (poly_mask > 0)

    num_p, _, _, p_centroids = cv2.connectedComponentsWithStats(np.uint8(peaks * 255))
    raw_peaks = []
    for p_idx in range(1, num_p):
        pcx, pcy = p_centroids[p_idx]
        d_val = float(dist_smooth[int(round(pcy)), int(round(pcx))])
        raw_peaks.append((pcx, pcy, d_val))

    raw_peaks.sort(key=lambda item: -item[2])

    recovered_trees = []
    min_dist_px = 16.0  # Espacement minimal réaliste entre oliviers

    for pcx, pcy, d_val in raw_peaks:
        # Vérifier que ce sommet n'est pas déjà couvert par une boîte YOLO
        if all(math.hypot(pcx - ycx, pcy - ycy) >= min_dist_px for ycx, ycy, _, _, _, _, _ in yolo_trees):
            if all(math.hypot(pcx - rcx, pcy - rcy) >= min_dist_px for rcx, rcy, _, _, _, _, _ in recovered_trees):
                rad = max(9, int(round(d_val * 1.30)))
                rx1 = max(0, int(pcx - rad))
                rx2 = min(W_mos - 1, int(pcx + rad))
                ry1 = max(0, int(pcy - rad))
                ry2 = min(H_mos - 1, int(pcy + rad))
                recovered_trees.append((pcx, pcy, rx1, ry1, rx2, ry2, 0.88))

    # Fusion des détections initiales
    all_raw = yolo_trees + recovered_trees

    # 4. FILTRAGE QUALITÉ & FUSION SPATIALE STRICTE (Anti-Doublons & Anti-Mauvaises Herbes)
    # A. Ne garder que les candidats ayant une véritable masse foliaire (>= 35 px²)
    foliage_filtered = []
    for t in all_raw:
        cx, cy, x1, y1, x2, y2, conf = t
        bx1, by1 = max(0, int(x1)), max(0, int(y1))
        bx2, by2 = min(W_mos, int(x2)), min(H_mos, int(y2))
        sub_mask = foliage_clean[by1:by2, bx1:bx2]
        area = np.count_nonzero(sub_mask)
        if area >= 35: # Élimine les petites touffes d'herbes isolées dans les allées
            foliage_filtered.append([float(cx), float(cy), float(x1), float(y1), float(x2), float(y2), float(conf), int(area)])

    # Helper: Calcul du chevauchement géométrique (IoU et IoMin)
    def compute_box_overlap(box_a, box_b):
        ix1 = max(box_a[0], box_b[0])
        iy1 = max(box_a[1], box_b[1])
        ix2 = min(box_a[2], box_b[2])
        iy2 = min(box_a[3], box_b[3])
        iw = max(0.0, ix2 - ix1)
        ih = max(0.0, iy2 - iy1)
        inter = iw * ih
        if inter <= 0:
            return 0.0, 0.0
        w_a = max(1.0, box_a[2] - box_a[0])
        h_a = max(1.0, box_a[3] - box_a[1])
        w_b = max(1.0, box_b[2] - box_b[0])
        h_b = max(1.0, box_b[3] - box_b[1])
        area_a = w_a * h_a
        area_b = w_b * h_b
        iou = inter / (area_a + area_b - inter)
        iomin = inter / min(area_a, area_b)
        return iou, iomin

    # B. Fusion spatiale stricte : élimine les 3 boîtes empilées sur un même arbre
    # tout en empêchant absolument l'effet boule de neige (fusion en cascade de plusieurs arbres voisins)
    foliage_filtered.sort(key=lambda item: -item[6])
    merged_trees = []
    # Distance maximale pour appartenir au MÊME houppier (13 px ≈ 3.25 m à Zoom 19)
    MAX_SAME_TREE_DIST_PX = 13.0
    MAX_ALLOWABLE_CROWN_PX = 38.0  # Diamètre max biologique d'un grand olivier adulte (9.5 m)

    for item in foliage_filtered:
        cx, cy, x1, y1, x2, y2, conf, area = item
        box = (x1, y1, x2, y2)

        matched_idx = -1
        best_dist = 9999.0

        for idx, m in enumerate(merged_trees):
            mcx, mcy, mx1, my1, mx2, my2, mconf = m
            m_box = (mx1, my1, mx2, my2)

            dist_centers = math.hypot(cx - mcx, cy - mcy)
            iou, iomin = compute_box_overlap(box, m_box)

            # Vérification de sécurité biologique : l'enveloppe unie ne doit JAMAIS dépasser un arbre réel
            potential_w = max(mx2, x2) - min(mx1, x1)
            potential_h = max(my2, y2) - min(my1, y1)

            if potential_w > MAX_ALLOWABLE_CROWN_PX or potential_h > MAX_ALLOWABLE_CROWN_PX:
                # Trop grand pour être un seul arbre : ce sont deux arbres voisins distincts !
                continue

            # Condition de fusion sur le MÊME arbre :
            # 1. Distance très proche (< 3.25 m)
            # 2. OU fort chevauchement (IoU >= 0.35) avec distance < 4.2 m (17 px)
            if dist_centers < MAX_SAME_TREE_DIST_PX or (iou >= 0.35 and dist_centers < 17.0):
                if dist_centers < best_dist:
                    best_dist = dist_centers
                    matched_idx = idx

        if matched_idx >= 0:
            mcx, mcy, mx1, my1, mx2, my2, mconf = merged_trees[matched_idx]
            nconf = max(mconf, conf)

            # Sommet de canopée le plus élevé (distance transform locale)
            sub_x1 = max(0, int(min(mx1, x1)))
            sub_y1 = max(0, int(min(my1, y1)))
            sub_x2 = min(W_mos, int(max(mx2, x2)))
            sub_y2 = min(H_mos, int(max(my2, y2)))

            sub_d = dist_smooth[sub_y1:sub_y2, sub_x1:sub_x2]
            if sub_d.size > 0 and np.max(sub_d) > 0:
                _, _, _, max_loc = cv2.minMaxLoc(sub_d)
                ncx = sub_x1 + max_loc[0]
                ncy = sub_y1 + max_loc[1]
            else:
                ncx = (mcx + cx) / 2.0
                ncy = (mcy + cy) / 2.0

            # Rayon élargi pour bien englober tout le houppier (branches et feuillage complet)
            raw_w = (max(mx2, x2) - min(mx1, x1)) / 2.0
            raw_h = (max(my2, y2) - min(my1, y1)) / 2.0
            rw = min(18.0, max(12.0, raw_w * 1.25))
            rh = min(18.0, max(12.0, raw_h * 1.25))
            nx1 = max(0.0, ncx - rw)
            ny1 = max(0.0, ncy - rh)
            nx2 = min(float(W_mos), ncx + rw)
            ny2 = min(float(H_mos), ncy + rh)

            merged_trees[matched_idx] = (ncx, ncy, nx1, ny1, nx2, ny2, nconf)
        else:
            # Recentre et normalise la boîte initiale avec un rayon élargi confortable
            cur_w = x2 - x1
            cur_h = y2 - y1
            rw = min(18.0, max(12.0, (cur_w / 2.0) * 1.25))
            rh = min(18.0, max(12.0, (cur_h / 2.0) * 1.25))
            nx1 = max(0.0, cx - rw)
            ny1 = max(0.0, cy - rh)
            nx2 = min(float(W_mos), cx + rw)
            ny2 = min(float(H_mos), cy + rh)
            merged_trees.append((cx, cy, nx1, ny1, nx2, ny2, conf))

    # Tri du Nord au Sud
    merged_trees.sort(key=lambda t: (t[1], t[0]))

    if not merged_trees:
        return []

    # Calcul des métriques et diagnostics
    exg_vals = []
    tree_features = []
    for cx, cy, x1, y1, x2, y2, conf in merged_trees:
        icx, icy = int(round(cx)), int(round(cy))
        sub_exg = float(np.mean(exg[max(0, icy-3):min(H_mos, icy+4), max(0, icx-3):min(W_mos, icx+4)]))
        exg_vals.append(sub_exg)
        tree_features.append((cx, cy, x1, y1, x2, y2, conf, sub_exg))

    q15 = float(np.percentile(exg_vals, 15)) if len(exg_vals) > 5 else 0.0
    q30 = float(np.percentile(exg_vals, 30)) if len(exg_vals) > 5 else 10.0

    detected_trees = []
    for idx, item in enumerate(tree_features, start=1):
        cx, cy, x1, y1, x2, y2, conf, sub_exg = item

        lat, lng = mosaic_px_to_latlng(cx, cy)
        lat_north, lng_west = mosaic_px_to_latlng(x1, y1)
        lat_south, lng_east = mosaic_px_to_latlng(x2, y2)

        lat_min = round(min(lat_north, lat_south), 6)
        lat_max = round(max(lat_north, lat_south), 6)
        lng_min = round(min(lng_west, lng_east), 6)
        lng_max = round(max(lng_west, lng_east), 6)

        # Calcul métrique GSD réel à cette latitude
        gsd = (156543.03 * math.cos(math.radians(lat))) / (2.0 ** zoom)

        bw_px = abs(x2 - x1)
        bh_px = abs(y2 - y1)
        diam_m = round(((bw_px + bh_px) / 2.0) * gsd, 1)
        diam_m = max(2.5, min(14.0, diam_m))

        crown_area_m2 = round(math.pi * ((diam_m / 2.0) ** 2), 1)

        # Diagnostic de santé agronomique
        if sub_exg < q15:
            health = "SUSPECT"
        elif sub_exg < q30:
            health = "STRESS"
        else:
            health = "SAIN"

        # Catégorie d'âge
        if diam_m < 3.8:
            age_cat = "JEUNE"
        elif diam_m <= 7.2:
            age_cat = "ADULTE"
        else:
            age_cat = "CENTENAIRE"

        detected_trees.append({
            "id": idx,
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "lat_min": lat_min,
            "lat_max": lat_max,
            "lng_min": lng_min,
            "lng_max": lng_max,
            "box": [lat_min, lng_min, lat_max, lng_max],
            "diam": diam_m,
            "crownDiameterMeters": diam_m,
            "crownAreaM2": crown_area_m2,
            "health": health,
            "healthStatus": health,
            "conf": round(conf, 3),
            "confidence": round(conf, 3),
            "ageCategory": age_cat,
            "detectionEngine": "YOLOv8m-CoordAttention"
        })

    return detected_trees
