import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

os.makedirs('frontend-react/scientific_assets', exist_ok=True)

# Configuration graphique haute résolution style article Q1
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['axes.edgecolor'] = '#cbd5e1'
plt.rcParams['axes.linewidth'] = 1.2

# ==============================================================================
# SCHÉMA 1 : ARCHITECTURE DU SYSTÈME MULTI-COUCHES (Spring Boot + Python AI)
# ==============================================================================
def create_system_architecture_schema():
    fig, ax = plt.subplots(figsize=(14, 7), dpi=300)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 7)
    ax.axis('off')

    # Titre général
    ax.text(7, 6.6, "Architecture Système Multi-Couches : OliveSmart Cadastre & Diagnostic", 
            ha='center', va='center', fontsize=15, fontweight='bold', color='#0f172a')
    ax.text(7, 6.25, "Flux d'échange non-bloquant entre le Client Leaflet, le Microservice Spring Boot :8080 et le Moteur IA Python :8000", 
            ha='center', va='center', fontsize=10, color='#475569', style='italic')

    # Bloc 1 : Frontend Web (React / Leaflet)
    box1 = patches.FancyBboxPatch((0.5, 1.2), 3.5, 4.5, boxstyle="round,pad=0.2", 
                                  fc='#f0fdf4', ec='#16a34a', lw=2)
    ax.add_patch(box1)
    ax.text(2.25, 5.3, "COUCHIE CLIENT (IHM)", ha='center', va='center', fontsize=11, fontweight='bold', color='#166534')
    ax.text(2.25, 4.95, "React 18 • Leaflet.js • Tailwind", ha='center', va='center', fontsize=9, color='#15803d')
    
    sub1_1 = patches.FancyBboxPatch((0.8, 3.7), 2.9, 0.9, boxstyle="round,pad=0.1", fc='#ffffff', ec='#86efac', lw=1.2)
    ax.add_patch(sub1_1)
    ax.text(2.25, 4.15, "1. Outil Polygone Tactile\nTracé WGS84 (S1..Sn)", ha='center', va='center', fontsize=8.5, color='#1e293b')

    sub1_2 = patches.FancyBboxPatch((0.8, 2.4), 2.9, 1.0, boxstyle="round,pad=0.1", fc='#ffffff', ec='#86efac', lw=1.2)
    ax.add_patch(sub1_2)
    ax.text(2.25, 2.9, "Rendu Vectoriel SVG/Leaflet\n- Rectangles géodésiques\n- Points troncs & Tooltips", ha='center', va='center', fontsize=8.5, color='#1e293b')

    sub1_3 = patches.FancyBboxPatch((0.8, 1.4), 2.9, 0.7, boxstyle="round,pad=0.1", fc='#ffffff', ec='#86efac', lw=1.2)
    ax.add_patch(sub1_3)
    ax.text(2.25, 1.75, "Rapport & Fiches Sanitaires", ha='center', va='center', fontsize=8.5, color='#1e293b')

    # Bloc 2 : Microservice Backend (Spring Boot 3 / WebFlux)
    box2 = patches.FancyBboxPatch((5.0, 1.2), 3.8, 4.5, boxstyle="round,pad=0.2", 
                                  fc='#eff6ff', ec='#2563eb', lw=2)
    ax.add_patch(box2)
    ax.text(6.9, 5.3, "MICROSERVICE CORE :8080", ha='center', va='center', fontsize=11, fontweight='bold', color='#1e40af')
    ax.text(6.9, 4.95, "Spring Boot 3.3 • Java 21 • WebFlux", ha='center', va='center', fontsize=9, color='#1d4ed8')

    sub2_1 = patches.FancyBboxPatch((5.3, 3.8), 3.2, 0.8, boxstyle="round,pad=0.1", fc='#ffffff', ec='#93c5fd', lw=1.2)
    ax.add_patch(sub2_1)
    ax.text(6.9, 4.2, "REST Controller Réactif\n/api/v1/parcelles/analyser", ha='center', va='center', fontsize=8.5, color='#1e293b')

    sub2_2 = patches.FancyBboxPatch((5.3, 2.6), 3.2, 0.9, boxstyle="round,pad=0.1", fc='#ffffff', ec='#93c5fd', lw=1.2)
    ax.add_patch(sub2_2)
    ax.text(6.9, 3.05, "Service Ray-Casting\nValidation géométrique du polygone\nContrôle limites cadastrales", ha='center', va='center', fontsize=8.5, color='#1e293b')

    sub2_3 = patches.FancyBboxPatch((5.3, 1.4), 3.2, 0.9, boxstyle="round,pad=0.1", fc='#ffffff', ec='#93c5fd', lw=1.2)
    ax.add_patch(sub2_3)
    ax.text(6.9, 1.85, "WebClient Non-Bloquant\nBuffer 16 Mo • Timeout 60s\nAgrégation DTO & Statistiques", ha='center', va='center', fontsize=8.5, color='#1e293b')

    # Bloc 3 : Moteur IA Python (Port 8000)
    box3 = patches.FancyBboxPatch((9.7, 1.2), 3.8, 4.5, boxstyle="round,pad=0.2", 
                                  fc='#fdf4ff', ec='#9333ea', lw=2)
    ax.add_patch(box3)
    ax.text(11.6, 5.3, "MOTEUR IA & GÉODÉSIE :8000", ha='center', va='center', fontsize=11, fontweight='bold', color='#6b21a8')
    ax.text(11.6, 4.95, "PyTorch • YOLOv11 • OpenCV • NumPy", ha='center', va='center', fontsize=9, color='#7e22ce')

    sub3_1 = patches.FancyBboxPatch((10.0, 3.8), 3.2, 0.8, boxstyle="round,pad=0.1", fc='#ffffff', ec='#d8b4fe', lw=1.2)
    ax.add_patch(sub3_1)
    ax.text(11.6, 4.2, "Ingestion Tuiles Satellites\nESRI World Imagery (Z19, 0.25m)", ha='center', va='center', fontsize=8.5, color='#1e293b')

    sub3_2 = patches.FancyBboxPatch((10.0, 2.6), 3.2, 0.9, boxstyle="round,pad=0.1", fc='#ffffff', ec='#d8b4fe', lw=1.2)
    ax.add_patch(sub3_2)
    ax.text(11.6, 3.05, "Double Inférence IA\n- YOLOv11 CoordAttention\n- Distance Transform (Canopée)", ha='center', va='center', fontsize=8.5, color='#1e293b')

    sub3_3 = patches.FancyBboxPatch((10.0, 1.4), 3.2, 0.9, boxstyle="round,pad=0.1", fc='#ffffff', ec='#d8b4fe', lw=1.2)
    ax.add_patch(sub3_3)
    ax.text(11.6, 1.85, "Fusion Spatiale & Diagnostics\n- Clustering < 15px (Anti-doublon)\n- Filtre masse foliaire >= 35px²", ha='center', va='center', fontsize=8.5, color='#1e293b')

    # Flèches bidirectionnelles avec annotations
    # 1 -> 2
    ax.annotate('', xy=(5.0, 4.2), xytext=(4.0, 4.2),
                arrowprops=dict(arrowstyle="->", color='#2563eb', lw=2, mutation_scale=15))
    ax.text(4.5, 4.4, "POST JSON\nVertices WGS84", ha='center', va='bottom', fontsize=7.5, fontweight='bold', color='#1d4ed8')

    ax.annotate('', xy=(4.0, 2.2), xytext=(5.0, 2.2),
                arrowprops=dict(arrowstyle="->", color='#16a34a', lw=2, mutation_scale=15))
    ax.text(4.5, 2.4, "JSON Response\n219 Arbres + Santé", ha='center', va='bottom', fontsize=7.5, fontweight='bold', color='#15803d')

    # 2 -> 3
    ax.annotate('', xy=(9.7, 4.2), xytext=(8.8, 4.2),
                arrowprops=dict(arrowstyle="->", color='#9333ea', lw=2, mutation_scale=15))
    ax.text(9.25, 4.4, "Proxy WebClient\nImage + Poly", ha='center', va='bottom', fontsize=7.5, fontweight='bold', color='#6b21a8')

    ax.annotate('', xy=(8.8, 2.2), xytext=(9.7, 2.2),
                arrowprops=dict(arrowstyle="->", color='#2563eb', lw=2, mutation_scale=15))
    ax.text(9.25, 2.4, "Arbres Détectés\nBBoxes + ExG", ha='center', va='bottom', fontsize=7.5, fontweight='bold', color='#1d4ed8')

    # Pied de page explicatif
    foot = patches.FancyBboxPatch((0.5, 0.2), 13.0, 0.65, boxstyle="round,pad=0.1", fc='#f8fafc', ec='#cbd5e1', lw=1)
    ax.add_patch(foot)
    ax.text(7.0, 0.52, "✓ Découplage complet : Haute disponibilité (fallback automatique si un nœud redémarre) • Latence globale < 550 ms",
            ha='center', va='center', fontsize=9, fontweight='bold', color='#334155')

    plt.tight_layout()
    out_file = 'frontend-react/scientific_assets/architecture_systeme_schema.png'
    plt.savefig(out_file, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Schéma 1 créé : {out_file}")

# ==============================================================================
# SCHÉMA 2 : PIPELINE DE VISION PAR ORDINATEUR & DÉTECTION DES ARBRES
# ==============================================================================
def create_detection_pipeline_schema():
    fig, ax = plt.subplots(figsize=(15, 8), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 8)
    ax.axis('off')

    ax.text(7.5, 7.6, "Pipeline Algorithmique : De la Coordonnée GPS au Cadre Arbre Calibré", 
            ha='center', va='center', fontsize=15, fontweight='bold', color='#0f172a')
    ax.text(7.5, 7.25, "Traitement d'imagerie satellitaire sub-métrique (ESRI Zoom 19) par fusion YOLOv11 & morphologie spectrale", 
            ha='center', va='center', fontsize=10, color='#475569', style='italic')

    steps = [
        {"x": 0.5, "y": 4.2, "w": 3.1, "h": 2.4, "title": "Étape 1 : Géoréférencement", "color": "#0284c7", "bg": "#f0f9ff",
         "items": ["• Sommets GPS (Lat/Lng WGS84)", "• Projection Web Mercator EPSG:3857", "• Calcul GSD local : 0.25 m/px", "• Téléchargement tuiles Zoom 19"]},
        
        {"x": 4.1, "y": 4.2, "w": 3.1, "h": 2.4, "title": "Étape 2 : Crop & Masque ROI", "color": "#2563eb", "bg": "#eff6ff",
         "items": ["• Découpage précis polygone + marge", "• Masque binaire cv2.fillPoly", "• Réduction espace calcul de 95%", "• Inférence sub-seconde garantie"]},

        {"x": 7.7, "y": 4.2, "w": 3.4, "h": 2.4, "title": "Étape 3 : Double Inférence", "color": "#7c3aed", "bg": "#f5f3ff",
         "items": ["• Flux A : YOLOv11s (Boîtes houppier)", "• Flux B : Indice ExG = 2G - R - B", "• Distance Transform (L2) sur canopée", "• Détection des sommets d'arbres serrés"]},

        {"x": 11.6, "y": 4.2, "w": 2.9, "h": 2.4, "title": "Étape 4 : Post-Filtrage", "color": "#059669", "bg": "#ecfdf5",
         "items": ["• Clustering spatial (dist < 15px)", "• Fusion anti-doublon des cadres", "• Filtre masse foliaire >= 35px²", "• 0 faux positif dans les allées"]},

        {"x": 2.2, "y": 0.9, "w": 4.8, "h": 2.5, "title": "Étape 5 : Métrologie Géométrique & Âge", "color": "#d97706", "bg": "#fffbeb",
         "items": ["• Diamètre réel : D = (W + H)/2 * GSD (en mètres)", "• Surface canopée : S = π * (D/2)² (en m²)", "• Catégorisation agronomique :", "   - JEUNE (< 3.8m) | ADULTE (3.8-7.2m) | CENTENAIRE (> 7.2m)"]},

        {"x": 7.8, "y": 0.9, "w": 5.0, "h": 2.5, "title": "Étape 6 : Diagnostic Sanitaire & Rendu", "color": "#dc2626", "bg": "#fef2f2",
         "items": ["• Classification spectrale ExG individuelle :", "   - (1) SAIN : Vert fonce, vigueur chlorophyllienne", "   - (2) STRESS : Chlorose, deficit hydrique", "   - (3) SUSPECT : Dessechement (Verticilliose)", "• Retro-projection WGS84 et rendu Leaflet"]}
    ]

    for s in steps:
        p = patches.FancyBboxPatch((s['x'], s['y']), s['w'], s['h'], boxstyle="round,pad=0.15", 
                                  fc=s['bg'], ec=s['color'], lw=1.8)
        ax.add_patch(p)
        ax.text(s['x'] + s['w']/2, s['y'] + s['h'] - 0.28, s['title'], 
                ha='center', va='center', fontsize=9.5, fontweight='bold', color=s['color'])
        
        y_text = s['y'] + s['h'] - 0.65
        for item in s['items']:
            ax.text(s['x'] + 0.15, y_text, item, ha='left', va='center', fontsize=8, color='#1e293b')
            y_text -= 0.38

    # Flèches horizontales du haut
    ax.annotate('', xy=(4.1, 5.4), xytext=(3.6, 5.4),
                arrowprops=dict(arrowstyle="->", color='#0284c7', lw=2, mutation_scale=14))
    ax.annotate('', xy=(7.7, 5.4), xytext=(7.2, 5.4),
                arrowprops=dict(arrowstyle="->", color='#2563eb', lw=2, mutation_scale=14))
    ax.annotate('', xy=(11.6, 5.4), xytext=(11.1, 5.4),
                arrowprops=dict(arrowstyle="->", color='#7c3aed', lw=2, mutation_scale=14))

    # Flèche retour bas
    ax.annotate('', xy=(12.5, 3.4), xytext=(12.5, 4.2),
                arrowprops=dict(arrowstyle="->", color='#059669', lw=2, mutation_scale=14))
    ax.annotate('', xy=(7.8, 2.15), xytext=(7.0, 2.15),
                arrowprops=dict(arrowstyle="->", color='#d97706', lw=2, mutation_scale=14))

    plt.tight_layout()
    out_file = 'frontend-react/scientific_assets/pipeline_vision_detection_schema.png'
    plt.savefig(out_file, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Schéma 2 créé : {out_file}")

# ==============================================================================
# SCHÉMA 3 : GÉOMÉTRIE DU CADRE & ÉLIMINATION DES DOUBLONS (Visual Calibration)
# ==============================================================================
def create_canopy_geometry_schema():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6), dpi=300)

    # 1. Sous-figure Gauche : Ancien Problème (Doublons & Allées)
    ax1.set_xlim(0, 10)
    ax1.set_ylim(0, 10)
    ax1.set_title("Avant Optimisation : Conflits & Boîtes Parasites", fontsize=12, fontweight='bold', color='#dc2626')
    ax1.set_facecolor('#fef2f2')

    # Simulation sol ocre
    ground = patches.Rectangle((0, 0), 10, 10, fc='#e2d4be', ec='none')
    ax1.add_patch(ground)

    # Arbres (cercles verts)
    tree1 = patches.Circle((3, 6.5), 1.6, fc='#2d5a27', ec='#1b3817', lw=1.5, alpha=0.9)
    tree2 = patches.Circle((7, 6.2), 1.7, fc='#33662c', ec='#1b3817', lw=1.5, alpha=0.9)
    ax1.add_patch(tree1)
    ax1.add_patch(tree2)

    # Conflit sur Arbre 1 : 2 boîtes décalées empilées
    b1_1 = patches.Rectangle((1.2, 4.8), 3.4, 3.4, fc='none', ec='#22c55e', lw=2, ls='--')
    b1_2 = patches.Rectangle((1.5, 5.1), 3.2, 3.2, fc='none', ec='#f59e0b', lw=2)
    ax1.add_patch(b1_1)
    ax1.add_patch(b1_2)
    ax1.plot(2.9, 6.5, 'o', color='#ffffff', mec='#22c55e', ms=7)
    ax1.plot(3.1, 6.7, 'o', color='#ffffff', mec='#f59e0b', ms=7)
    ax1.text(3, 8.8, "[X] 2 boites empilees\nsur le meme arbre !", ha='center', va='center', fontsize=9.5, fontweight='bold', color='#991b1b')

    # Boîte parasite dans l'allée de terre
    dirt_box = patches.Rectangle((4.5, 2.0), 1.2, 1.2, fc='none', ec='#ef4444', lw=2)
    ax1.add_patch(dirt_box)
    ax1.plot(5.1, 2.6, 'o', color='#ffffff', mec='#ef4444', ms=6)
    ax1.text(5.1, 1.2, "[X] Fausse detection\ndans la terre nue (bruit sol)", ha='center', va='center', fontsize=9, fontweight='bold', color='#991b1b')

    ax1.set_xticks([])
    ax1.set_yticks([])

    # 2. Sous-figure Droite : Système Calibré (Cadre Optimal Unique)
    ax2.set_xlim(0, 10)
    ax2.set_ylim(0, 10)
    ax2.set_title("Apres Optimisation : Cadrage Parfait & Allees Nettoyees", fontsize=12, fontweight='bold', color='#16a34a')
    ax2.set_facecolor('#f0fdf4')

    ground2 = patches.Rectangle((0, 0), 10, 10, fc='#e2d4be', ec='none')
    ax2.add_patch(ground2)

    tree1_clean = patches.Circle((3, 6.5), 1.6, fc='#2d5a27', ec='#1b3817', lw=1.5, alpha=0.9)
    tree2_clean = patches.Circle((7, 6.2), 1.7, fc='#33662c', ec='#1b3817', lw=1.5, alpha=0.9)
    ax2.add_patch(tree1_clean)
    ax2.add_patch(tree2_clean)

    # Arbre 1 : Cadre unique fusionné
    b1_opt = patches.Rectangle((1.3, 4.8), 3.4, 3.4, fc='#22c55e', ec='#15803d', lw=2.5, alpha=0.25)
    b1_stroke = patches.Rectangle((1.3, 4.8), 3.4, 3.4, fc='none', ec='#15803d', lw=2.5)
    ax2.add_patch(b1_opt)
    ax2.add_patch(b1_stroke)
    ax2.plot(3.0, 6.5, 'o', color='#ffffff', mec='#15803d', mew=2, ms=8)
    ax2.text(3.0, 8.8, "[OK] 1 Arbre = 1 Seul Cadre\nFusion spatiale (< 3.8m)", ha='center', va='center', fontsize=9.5, fontweight='bold', color='#166534')

    # Arbre 2 : Cadre optimal
    b2_opt = patches.Rectangle((5.2, 4.4), 3.6, 3.6, fc='#22c55e', ec='#15803d', lw=2.5, alpha=0.25)
    b2_stroke = patches.Rectangle((5.2, 4.4), 3.6, 3.6, fc='none', ec='#15803d', lw=2.5)
    ax2.add_patch(b2_opt)
    ax2.add_patch(b2_stroke)
    ax2.plot(7.0, 6.2, 'o', color='#ffffff', mec='#15803d', mew=2, ms=8)
    ax2.text(7.0, 8.8, "[OK] Cadrage Diametre Exact\nO 5.8m (ExG Chlorophylle)", ha='center', va='center', fontsize=9.5, fontweight='bold', color='#166534')

    # Allée nettoyée
    ax2.text(5.0, 2.2, "[OK] Allee de terre 100% propre\nFiltre surface foliaire (>= 35 px2)", 
             ha='center', va='center', fontsize=9.5, fontweight='bold', color='#166534',
             bbox=dict(boxstyle="round,pad=0.4", fc="#dcfce7", ec="#86efac", lw=1.2))

    ax2.set_xticks([])
    ax2.set_yticks([])

    plt.tight_layout()
    out_file = 'frontend-react/scientific_assets/calibrage_geometrique_houppier_schema.png'
    plt.savefig(out_file, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Schéma 3 créé : {out_file}")

if __name__ == '__main__':
    create_system_architecture_schema()
    create_detection_pipeline_schema()
    create_canopy_geometry_schema()
