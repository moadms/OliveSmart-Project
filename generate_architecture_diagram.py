import matplotlib.pyplot as plt
import matplotlib.patches as patches

def generate_microservice_architecture_diagram():
    fig, ax = plt.subplots(figsize=(18, 11), dpi=300)
    ax.set_xlim(0, 18)
    ax.set_ylim(0, 11)
    ax.axis('off')

    # Background
    fig.patch.set_facecolor('#0f172a') # Slate 900
    ax.set_facecolor('#0f172a')

    # Color Palette
    c_front = '#38bdf8'     # Sky Blue
    c_spring = '#4ade80'    # Spring Green
    c_python = '#fbbf24'    # Amber / Python Yellow
    c_cloud = '#c084fc'     # Purple
    c_border = '#334155'    # Slate 700
    c_card_bg = '#1e293b'   # Slate 800

    # Main Title
    ax.text(9, 10.4, "ARCHITECTURE SYSTÈME DISTRIBUÉE & MICROSERVICES • OLIVESMART", 
            fontsize=20, fontweight='bold', color='#ffffff', ha='center', va='center')
    ax.text(9, 9.9, "EMSI — École Marocaine des Sciences de l'Ingénieur • Encadré par Pr. Mohamed Lachgar", 
            fontsize=12, color='#94a3b8', ha='center', va='center', style='italic')

    # =========================================================================
    # 1. FRONTEND BLOCK (Port 3000)
    # =========================================================================
    front_card = patches.FancyBboxPatch((0.8, 4.2), 4.8, 5.0, boxstyle="round,pad=0.2,rounding_size=0.3",
                                        facecolor=c_card_bg, edgecolor=c_front, linewidth=2.5)
    ax.add_patch(front_card)

    ax.text(3.2, 8.8, "🖥️ FRONTEND CLIENT", fontsize=14, fontweight='bold', color=c_front, ha='center')
    ax.text(3.2, 8.4, "React 18 • Leaflet.js • Node.js (Port 3000)", fontsize=10, color='#94a3b8', ha='center')

    front_items = [
        "• Cartographie Satellite Interactive (Zoom 19)",
        "• Tracé Polygonal de Parcelles (6 Sommets)",
        "• Rendu Géodésique Bounding Boxes (Leaflet)",
        "• Tableau de Bord KPI : Sains, Stress, Suspects",
        "• Fiche Diagnostic Olivier Individuel (#ID)",
        "• Exportation Cadastrale (GeoJSON & CSV)",
        "• Bouton Intégré 'Entraîner sur Colab (GPU)'"
    ]
    for idx, item in enumerate(front_items):
        ax.text(1.2, 7.8 - idx * 0.48, item, fontsize=9.5, color='#e2e8f0')

    # =========================================================================
    # 2. BACKEND SPRING BOOT (Port 8080)
    # =========================================================================
    spring_card = patches.FancyBboxPatch((6.6, 4.2), 4.8, 5.0, boxstyle="round,pad=0.2,rounding_size=0.3",
                                         facecolor=c_card_bg, edgecolor=c_spring, linewidth=2.5)
    ax.add_patch(spring_card)

    ax.text(9.0, 8.8, "⚙️ MICROSERVICE SPRING BOOT", fontsize=14, fontweight='bold', color=c_spring, ha='center')
    ax.text(9.0, 8.4, "Spring Boot 3.3 • Java 17 (Port 8080)", fontsize=10, color='#94a3b8', ha='center')

    spring_items = [
        "• ParcelAnalysisController (/api/v1/parcelles)",
        "• RayCastingGeofenceService (In-Polygon)",
        "• Filtrage Cadastral Strict des Arbres Extérieurs",
        "• Conversion Coordonnées WGS84 ⇄ WebMercator",
        "• Ordonnanceur & Métriques Métier (mAP, Vigueur)",
        "• DTOs Robustes & Validation des Requêtes JSON",
        "• API Gateway & CORS Management vers React"
    ]
    for idx, item in enumerate(spring_items):
        ax.text(7.0, 7.8 - idx * 0.48, item, fontsize=9.5, color='#e2e8f0')

    # =========================================================================
    # 3. AI ENGINE PYTHON / FASTAPI (Port 8000)
    # =========================================================================
    ai_card = patches.FancyBboxPatch((12.4, 4.2), 4.8, 5.0, boxstyle="round,pad=0.2,rounding_size=0.3",
                                     facecolor=c_card_bg, edgecolor=c_python, linewidth=2.5)
    ax.add_patch(ai_card)

    ax.text(14.8, 8.8, "🧠 MOTEUR IA & VISION", fontsize=14, fontweight='bold', color=c_python, ha='center')
    ax.text(14.8, 8.4, "Python 3.11 • PyTorch • YOLOv8/11 (Port 8000)", fontsize=10, color='#94a3b8', ha='center')

    ai_items = [
        "• YOLO11s / YOLOv8m + Coordinate Attention",
        "• Téléchargeur WMTS ESRI HD (Zoom 19)",
        "• Mosaïque Automatique & Recadrage Géospatial",
        "• Transformée de Distance Euclidienne (Troncs)",
        "• Fusion Anti-Doublons & Plafond Houppier (7.5m)",
        "• Diagnostic Sanitaire Spectral (ExG, VARI, NDVI)",
        "• Inférence Multi-Échelle SAHI (38 ms / image)"
    ]
    for idx, item in enumerate(ai_items):
        ax.text(12.8, 7.8 - idx * 0.48, item, fontsize=9.5, color='#e2e8f0')

    # =========================================================================
    # 4. EXTERNAL DATA & TRAINING CLOUD (Bottom Bar)
    # =========================================================================
    cloud_card = patches.FancyBboxPatch((0.8, 0.8), 16.4, 2.5, boxstyle="round,pad=0.2,rounding_size=0.3",
                                        facecolor=c_card_bg, edgecolor=c_cloud, linewidth=2.0)
    ax.add_patch(cloud_card)

    ax.text(9.0, 2.85, "☁️ SERVICES CLOUD, DONNÉES SATELLITAIRES & ENTRAÎNEMENT GPU", 
            fontsize=13, fontweight='bold', color=c_cloud, ha='center')

    # 3 sub-boxes in bottom card
    b1 = patches.FancyBboxPatch((1.2, 1.2), 4.8, 1.3, boxstyle="round,pad=0.1,rounding_size=0.2",
                                facecolor='#111827', edgecolor='#475569', linewidth=1.5)
    ax.add_patch(b1)
    ax.text(3.6, 2.1, "🛰️ Imagerie Satellite ESRI WMTS", fontsize=10, fontweight='bold', color='#38bdf8', ha='center')
    ax.text(3.6, 1.6, "Flux mondial HD ArcGIS MapServer\nZoom 19 • Résolution GSD 0.25 m/px", fontsize=8.5, color='#cbd5e1', ha='center')

    b2 = patches.FancyBboxPatch((6.6, 1.2), 4.8, 1.3, boxstyle="round,pad=0.1,rounding_size=0.2",
                                facecolor='#111827', edgecolor='#475569', linewidth=1.5)
    ax.add_patch(b2)
    ax.text(9.0, 2.1, "📚 Datasets Scientifiques Réels", fontsize=10, fontweight='bold', color='#4ade80', ha='center')
    ax.text(9.0, 1.6, "ICAERUS EU • Zenodo OTD (Rec. 13121962)\nMendeley Data (10.17632/xym8rd2srf.1)", fontsize=8.5, color='#cbd5e1', ha='center')

    b3 = patches.FancyBboxPatch((12.0, 1.2), 4.8, 1.3, boxstyle="round,pad=0.1,rounding_size=0.2",
                                facecolor='#111827', edgecolor='#475569', linewidth=1.5)
    ax.add_patch(b3)
    ax.text(14.4, 2.1, "🚀 Entraînement Cloud Google Colab", fontsize=10, fontweight='bold', color='#fbbf24', ha='center')
    ax.text(14.4, 1.6, "GPU Nvidia T4 (16GB VRAM gratuit)\nGénération automatique des poids best.pt", fontsize=8.5, color='#cbd5e1', ha='center')

    # =========================================================================
    # ARROWS & COMMUNICATION BUS
    # =========================================================================
    # 1. Front -> Spring Boot
    ax.annotate("", xy=(6.5, 6.7), xytext=(5.7, 6.7),
                arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=c_front, lw=2.5))
    ax.text(6.1, 7.0, "POST JSON\n/analyser", fontsize=9, fontweight='bold', color=c_front, ha='center')

    # 1b. Spring Boot -> Front
    ax.annotate("", xy=(5.7, 6.1), xytext=(6.5, 6.1),
                arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=c_spring, lw=2.5))
    ax.text(6.1, 5.5, "Response\nTrees + Health", fontsize=8.5, color=c_spring, ha='center')

    # 2. Spring Boot -> Python AI Engine
    ax.annotate("", xy=(12.3, 6.7), xytext=(11.5, 6.7),
                arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=c_spring, lw=2.5))
    ax.text(11.9, 7.0, "Inférence IA\nHTTP :8000", fontsize=9, fontweight='bold', color=c_spring, ha='center')

    # 2b. Python AI Engine -> Spring Boot
    ax.annotate("", xy=(11.5, 6.1), xytext=(12.3, 6.1),
                arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color=c_python, lw=2.5))
    ax.text(11.9, 5.5, "Boxes, Conf,\nSpectre ExG", fontsize=8.5, color=c_python, ha='center')

    # 3. Python AI Engine <-> ESRI WMTS (down and up)
    ax.annotate("", xy=(14.8, 2.6), xytext=(14.8, 4.1),
                arrowprops=dict(arrowstyle="<->,head_width=0.4,head_length=0.6", color='#a855f7', lw=2.0))
    ax.text(15.7, 3.4, "WMTS Tiles\nREST API", fontsize=8.5, color='#c084fc', ha='left')

    # 4. Colab -> Python AI (best.pt injection)
    ax.annotate("", xy=(14.8, 4.1), xytext=(14.8, 2.6),
                arrowprops=dict(arrowstyle="->,head_width=0.4,head_length=0.6", color='#f59e0b', lw=2.0, linestyle='--'))

    plt.tight_layout()
    output_path = "c:/Users/hp/Pictures/Olive-Project/architecture_microservices_systeme.png"
    plt.savefig(output_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
    plt.close()
    print(f"Schéma d'architecture généré avec succès : {output_path}")

if __name__ == '__main__':
    generate_microservice_architecture_diagram()
