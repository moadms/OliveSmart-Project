import os
import math
import cv2
import numpy as np

# Test spatial clustering and area filtering
def refine_trees(all_trees, foliage_mask, W_mos, H_mos):
    """
    1. Supprime les détections isolées sur de la mauvaise herbe (aire de feuillage < 50 px)
    2. Fusionne les détections multiples sur le même arbre (centre < 16 px)
    """
    # 1. Ne garder que les arbres qui ont un vrai disque de feuillage
    valid_trees = []
    for t in all_trees:
        cx, cy, x1, y1, x2, y2, conf = t
        icx, icy = int(round(cx)), int(round(cy))
        # Vérifier l'aire de feuillage dans la boîte
        bx1, by1 = max(0, int(x1)), max(0, int(y1))
        bx2, by2 = min(W_mos, int(x2)), min(H_mos, int(y2))
        sub_mask = foliage_mask[by1:by2, bx1:bx2]
        foliage_area = np.count_nonzero(sub_mask)
        
        # Un olivier adulte a au moins 45 px² de feuillage
        if foliage_area >= 40:
            valid_trees.append((cx, cy, x1, y1, x2, y2, conf, foliage_area))

    # 2. Fusion spatiale stricte : deux arbres ne peuvent pas être à moins de 16 px (~4.0 mètres)
    valid_trees.sort(key=lambda item: -item[6]) # Trier par confiance décroissante
    merged_trees = []
    min_dist = 16.0 # ~4.0 m

    for t in valid_trees:
        cx, cy, x1, y1, x2, y2, conf, area = t
        # Si trop proche d'un arbre déjà retenu, on fusionne les boîtes (union)
        merged = False
        for i, m in enumerate(merged_trees):
            mcx, mcy, mx1, my1, mx2, my2, mconf = m
            if math.hypot(cx - mcx, cy - mcy) < min_dist:
                # Élargir la boîte englobante pour couvrir tout le houppier
                nx1 = min(mx1, x1)
                ny1 = min(my1, y1)
                nx2 = max(mx2, x2)
                ny2 = max(my2, y2)
                ncx = (nx1 + nx2) / 2.0
                ncy = (ny1 + ny2) / 2.0
                nconf = max(mconf, conf)
                merged_trees[i] = (ncx, ncy, nx1, ny1, nx2, ny2, nconf)
                merged = True
                break
        if not merged:
            merged_trees.append((cx, cy, x1, y1, x2, y2, conf))

    return merged_trees

print("Refinement function defined successfully.")
