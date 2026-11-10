import os
import math
import cv2
import numpy as np
from ultralytics import YOLO

# Cache directory for satellite tiles
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tile_cache')

def lat_lng_to_tile(lat, lng, zoom=19):
    n = 2.0 ** zoom
    x = int(math.floor((lng + 180.0) / 360.0 * n))
    lat_rad = math.radians(lat)
    y = int(math.floor((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n))
    return x, y

def tile_to_lat_lng(x, y, zoom=19):
    n = 2.0 ** zoom
    lng = x / n * 360.0 - 180.0
    lat_rad = math.atan(math.sinh(math.pi * (1.0 - 2.0 * y / n)))
    lat = math.degrees(lat_rad)
    return lat, lng

def fetch_tile(x, y, zoom=19):
    import urllib.request
    cache_path = os.path.join(CACHE_DIR, f"{zoom}_{y}_{x}.jpg")
    if os.path.exists(cache_path):
        img = cv2.imread(cache_path)
        if img is not None and img.shape[0] == 256 and img.shape[1] == 256:
            return img

    url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{y}/{x}"
    req = urllib.request.Request(url, headers={'User-Agent': 'OliveSmart-Detector/3.0'})
    try:
        with urllib.request.urlopen(req, timeout=6) as response:
            arr = np.asarray(bytearray(response.read()), dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is not None:
                cv2.imwrite(cache_path, img)
                return img
    except Exception as e:
        print(f"Error fetching tile {x},{y}: {e}")
    return np.full((256, 256, 3), 128, dtype=np.uint8)

def test_pipeline():
    # Vertices of the user's parcel from their screenshot
    vertices = [
        {"lat": 31.63468, "lng": -7.96582},
        {"lat": 31.63445, "lng": -7.96495},
        {"lat": 31.63380, "lng": -7.96465},
        {"lat": 31.63285, "lng": -7.96505},
        {"lat": 31.63300, "lng": -7.96590},
        {"lat": 31.63410, "lng": -7.96625}
    ]

    lats = [v['lat'] for v in vertices]
    lngs = [v['lng'] for v in vertices]
    min_lat, max_lat = min(lats), max(lats)
    min_lng, max_lng = min(lngs), max(lngs)

    zoom = 19
    x_min, y_min = lat_lng_to_tile(max_lat, min_lng, zoom)
    x_max, y_max = lat_lng_to_tile(min_lat, max_lng, zoom)

    n_cols = x_max - x_min + 1
    n_rows = y_max - y_min + 1
    print(f"Grid: {n_cols} cols x {n_rows} rows")

    mosaic = np.zeros((n_rows * 256, n_cols * 256, 3), dtype=np.uint8)
    for r_idx, ty in enumerate(range(y_min, y_max + 1)):
        for c_idx, tx in enumerate(range(x_min, x_max + 1)):
            t_img = fetch_tile(tx, ty, zoom)
            mosaic[r_idx*256:(r_idx+1)*256, c_idx*256:(c_idx+1)*256] = t_img

    n = 2.0 ** zoom
    def latlng_to_mosaic_px(lat, lng):
        tile_x = ((lng + 180.0) / 360.0) * n
        lat_rad = math.radians(lat)
        tile_y = (1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n
        px = (tile_x - x_min) * 256.0
        py = (tile_y - y_min) * 256.0
        return px, py

    poly_px = np.array([latlng_to_mosaic_px(v['lat'], v['lng']) for v in vertices], dtype=np.int32)
    poly_mask = np.zeros(mosaic.shape[:2], dtype=np.uint8)
    cv2.fillPoly(poly_mask, [poly_px], 255)

    # Bounding box of the polygon
    px1 = max(0, int(np.min(poly_px[:, 0])) - 20)
    py1 = max(0, int(np.min(poly_px[:, 1])) - 20)
    px2 = min(mosaic.shape[1], int(np.max(poly_px[:, 0])) + 20)
    py2 = min(mosaic.shape[0], int(np.max(poly_px[:, 1])) + 20)

    crop = mosaic[py1:py2, px1:px2]
    crop_h, crop_w = crop.shape[:2]
    print(f"Crop size: {crop_w} x {crop_h}")

    # Load YOLO
    model = YOLO("best.pt")
    import time
    t0 = time.time()
    
    # Run YOLO on crop
    results = model.predict(crop, conf=0.12, imgsz=max(crop_h, crop_w, 640), verbose=False)
    yolo_ms = int((time.time() - t0) * 1000)
    print(f"YOLO inference took {yolo_ms}ms, detected {len(results[0].boxes)} boxes in crop")

    yolo_trees = []
    for box in results[0].boxes:
        bx1, by1, bx2, by2 = box.xyxy[0].tolist()
        conf = float(box.conf[0])
        # global coords in mosaic
        gx1, gy1, gx2, gy2 = bx1 + px1, by1 + py1, bx2 + px1, by2 + py1
        gcx, gcy = (gx1 + gx2) / 2.0, (gy1 + gy2) / 2.0
        if cv2.pointPolygonTest(poly_px, (gcx, gcy), False) >= 0:
            yolo_trees.append((gcx, gcy, gx1, gy1, gx2, gy2, conf))

    print(f"YOLO boxes inside polygon: {len(yolo_trees)}")

    # Dense Canopy analysis to recover any tree crowns in tight rows missed by YOLO
    gray = cv2.cvtColor(mosaic, cv2.COLOR_BGR2GRAY)
    b = mosaic[:, :, 0].astype(np.float32)
    g = mosaic[:, :, 1].astype(np.float32)
    r = mosaic[:, :, 2].astype(np.float32)
    exg = 2.0 * g - r - b

    # Real olive foliage mask
    foliage = (gray < 105) & (exg >= -5) & (poly_mask > 0)
    foliage_u8 = np.uint8(foliage * 255)
    
    # Distance transform on foliage
    dist = cv2.distanceTransform(foliage_u8, cv2.DIST_L2, 5)
    dist_smooth = cv2.GaussianBlur(dist, (5, 5), 0)
    
    k_peak = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))
    dil = cv2.dilate(dist_smooth, k_peak)
    peaks = (dist_smooth == dil) & (dist_smooth >= 3.2) & (poly_mask > 0)

    num_p, _, _, p_centroids = cv2.connectedComponentsWithStats(np.uint8(peaks * 255))
    recovered = []
    for p_idx in range(1, num_p):
        pcx, pcy = p_centroids[p_idx]
        d_val = float(dist_smooth[int(round(pcy)), int(round(pcx))])
        # Check distance to any existing YOLO box center
        if all(math.hypot(pcx - ycx, pcy - ycy) >= 16.0 for ycx, ycy, _, _, _, _, _ in yolo_trees):
            if all(math.hypot(pcx - rcx, pcy - rcy) >= 16.0 for rcx, rcy, _, _, _, _, _ in recovered):
                rad = max(8, int(round(d_val * 1.35)))
                rx1 = max(0, int(pcx - rad))
                rx2 = min(mosaic.shape[1] - 1, int(pcx + rad))
                ry1 = max(0, int(pcy - rad))
                ry2 = min(mosaic.shape[0] - 1, int(pcy + rad))
                recovered.append((pcx, pcy, rx1, ry1, rx2, ry2, 0.88))

    print(f"Recovered canopy trees inside polygon: {len(recovered)}")
    all_final = yolo_trees + recovered
    print(f"Total olive trees in polygon: {len(all_final)}")

    # Draw on visualization image
    vis = mosaic.copy()
    cv2.polylines(vis, [poly_px], True, (0, 255, 0), 2)
    for cx, cy, x1, y1, x2, y2, conf in all_final:
        cv2.rectangle(vis, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 255), 2)
        cv2.circle(vis, (int(cx), int(cy)), 3, (255, 255, 255), -1)

    cv2.imwrite("vis_perfect_test.jpg", vis)
    print("Saved vis_perfect_test.jpg successfully!")

if __name__ == '__main__':
    test_pipeline()
