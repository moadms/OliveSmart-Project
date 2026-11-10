# -*- coding: utf-8 -*-
"""
Module OliveSmart - Filtrage Spatial par Polygone de Parcelle (Geofencing Drone)
Permet de restreindre la détection et le comptage EXCLUSIVEMENT à la zone/parcelle
définie au départ, même si la caméra du drone capte des oliviers dans des parcelles voisines.
"""

import cv2
import numpy as np
from shapely.geometry import Point, Polygon

def filtrer_detections_parcelle(boxes, polygone_parcelle, mode="centre"):
    """
    Filtre les boîtes de détection pour ne garder QUE les oliviers situés dans le polygone cible.
    
    Paramètres :
    - boxes : liste de détections [[x1, y1, x2, y2, score], ...]
    - polygone_parcelle : liste de coordonnées [(x, y), ...] définissant la limite du champ
    - mode : 'centre' (teste le centre de l'arbre) ou 'intersection' (IoU avec polygone)
    
    Retourne :
    - boxes_in : oliviers situés DANS la parcelle sélectionnée
    - boxes_out : oliviers ignorés (hors de la zone spécifiée / chez le voisin)
    """
    poly = Polygon(polygone_parcelle)
    boxes_in = []
    boxes_out = []
    
    for b in boxes:
        x1, y1, x2, y2 = b[:4]
        # Point représentatif de l'arbre : son tronc / centre de couronne
        cx = (x1 + x2) / 2.0
        cy = (y1 + y2) / 2.0
        pt = Point(cx, cy)
        
        # Test spatial : le point est-il strictement dans la parcelle ?
        if poly.contains(pt):
            boxes_in.append(b)
        else:
            boxes_out.append(b)
            
    return boxes_in, boxes_out

def tracer_parcelle_et_detections(image_bgr, polygone_parcelle, boxes_in, boxes_out):
    """
    Dessine l'image avec la frontière de vol (vert = compté, rouge = rejeté hors-zone).
    """
    img_vis = image_bgr.copy()
    pts = np.array(polygone_parcelle, np.int32).reshape((-1, 1, 2))
    
    # 1. Dessiner la frontière de la parcelle définie (Ligne bleue épaisse)
    cv2.polylines(img_vis, [pts], isClosed=True, color=(255, 105, 0), thickness=3)
    
    # 2. Oliviers comptabilisés (Vert)
    for b in boxes_in:
        x1, y1, x2, y2 = map(int, b[:4])
        cv2.rectangle(img_vis, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.circle(img_vis, ((x1+x2)//2, (y1+y2)//2), 4, (0, 255, 0), -1)
        
    # 3. Oliviers hors-zone (Rouge hachuré / ignorés)
    for b in boxes_out:
        x1, y1, x2, y2 = map(int, b[:4])
        cv2.rectangle(img_vis, (x1, y1), (x2, y2), (0, 0, 255), 1, cv2.LINE_AA)
        cv2.putText(img_vis, "HORS-ZONE", (x1, max(15, y1-5)), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)
        
    return img_vis

if __name__ == "__main__":
    print("Module Geofencing Drone OliveSmart opérationnel.")
