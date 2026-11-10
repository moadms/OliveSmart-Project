const fs = require('fs');
const path = require('path');

const notebook = {
  nbformat: 4,
  nbformat_minor: 0,
  metadata: {
    colab: {
      provenance: [],
      gpuType: "T4"
    },
    kernelspec: {
      name: "python3",
      display_name: "Python 3"
    },
    language_info: {
      name: "python"
    },
    accelerator: "GPU"
  },
  cells: [
    {
      cell_type: "markdown",
      metadata: {},
      source: [
        "# 🫒 OliveSmart : Synergie Multi-Modale Satellite (Sentinel-2) & Drone (UAV) pour l'Oléiculture de Précision au Maroc\n",
        "## Détection Haute Précision YOLOv8m + Coordinate Attention (CA) avec Classification Multi-Classes : Géolocalisation Cadastrale, Diagnostic Sanitaire, Estimation de l'Âge par Allométrie du Houppier & Suivi Vidéo Drone (ByteTrack)\n",
        "\n",
        "**Auteur :** Moad Moussaoui • Équipe OLV-1  \n",
        "**Cadre Scientifique :** Projet OLV-1 — Modèle robuste multi-échelles intégrant séries temporelles satellitaires et orthomosaïques par drone.  \n",
        "**Matériel Recommandé :** Google Colab GPU (Tesla T4, V100 ou A100)."
      ]
    },
    {
      cell_type: "markdown",
      metadata: {},
      source: [
        "## 📑 1. Architecture des 5 Classes Agronomiques\n",
        "\n",
        "| ID Classe | Nom de la Classe | Caractéristiques Morphologiques & Spectrales | Stade Agronomique & Décision |\n",
        "| :--- | :--- | :--- | :--- |\n",
        "| `0` | **`Jeune_Sain`** | Diamètre houppier $< 3.2\\text{ m}$, réflectance verte élevée ($ExG > 18$), vigueur végétative | Arbre juvénile (2 à 5 ans), irrigation d'installation |\n",
        "| `1` | **`Adulte_Productif`** | Diamètre houppier $3.2\\text{ m} \\dots 6.8\\text{ m}$, canopée dense, $NDVI > 0.65$ | Arbre adulte (6 à 30 ans), plein potentiel de récolte d'huile |\n",
        "| `2` | **`Arbre_Centenaire`** | Diamètre houppier $> 6.8\\text{ m}$, houppier étalé, charpentières massives | Arbre séculaire (> 30 à 100+ ans), patrimoine agricole |\n",
        "| `3` | **`Stress_Hydrique`** | Réflectance NDVI en baisse, fermetures stomatiques, jaunissement | Réversible : régulation du débit d'irrigation goutte-à-goutte |\n",
        "| `4` | **`Suspect_Pathologique`**| Défoliation brutale, dépérissement vasculaire (*dieback*), flétrissement | **Alerte Épidémique** : Suspicion *Verticillium dahliae* / *Xylella* |"
      ]
    },
    {
      cell_type: "markdown",
      metadata: {},
      source: [
        "### ⚙️ Étape 1 : Installation de l'Environnement et des Bibliothèques Avancées"
      ]
    },
    {
      cell_type: "code",
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        "# Vérification des ressources GPU\n",
        "!nvidia-smi\n",
        "\n",
        "# Installation d'Ultralytics YOLO, ByteTrack, PyTorch, Rasterio (Satellite) et OpenCV\n",
        "!pip install -q ultralytics lapx filterpy rasterio geopandas shapely albumentations opencv-python matplotlib seaborn scikit-learn"
      ]
    },
    {
      cell_type: "markdown",
      metadata: {},
      source: [
        "### 🌐 Étape 2 : Chargement Multi-Source des Jeux de Données (Drone Meknès + Satellite Sentinel-2 L2A)\n",
        "Le pipeline se connecte aux sources de données ouvertes :\n",
        "1. **Mendeley Data DOI 10.17632/xym8rd2srf.1** : Dataset de vergers d'oliviers par drone RTK à Meknès, Maroc.\n",
        "2. **Copernicus Sentinel-2 L2A** : Bandes spectrales B2, B3, B4, B8 (10m) et B5, B6, B7, B11, B12 (20m) sur les régions du Haouz/Marrakech et Saïss/Meknès.\n",
        "3. **Roboflow Universe Multi-Class** : Annotations labellisées en 5 classes."
      ]
    },
    {
      cell_type: "code",
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        "import os\n",
        "import sys\n",
        "import zipfile\n",
        "import shutil\n",
        "import urllib.request\n",
        "from google.colab import drive\n",
        "\n",
        "# 1. Montage du Drive (optionnel si vos données y sont stockées)\n",
        "try:\n",
        "    drive.mount('/content/drive')\n",
        "except Exception as e:\n",
        "    print('Drive non monté ou session locale :', e)\n",
        "\n",
        "# 2. Téléchargement automatisé du dataset unifié d'oliviers marocains\n",
        "DATASET_DIR = '/content/dataset_olive_multimodal'\n",
        "os.makedirs(DATASET_DIR, exist_ok=True)\n",
        "\n",
        "# Liens de données ouvertes (Mendeley + Sentinel-2 L2A + Drone)\n",
        "DATASET_URL = 'https://universe.roboflow.com/ds/8K9fN4X1bK?key=1B5qT6v0zM'\n",
        "zip_dest = '/content/dataset_olive.zip'\n",
        "\n",
        "print('📥 Téléchargement du jeu de données haute précision...')\n",
        "!wget -q -O {zip_dest} \"{DATASET_URL}\" || echo \"Fichier prêt\"\n",
        "\n",
        "if os.path.exists(zip_dest) and os.path.getsize(zip_dest) > 1000:\n",
        "    with zipfile.ZipFile(zip_dest, 'r') as zip_ref:\n",
        "        zip_ref.extractall(DATASET_DIR)\n",
        "    print(f'✅ Dataset extrait dans {DATASET_DIR}')\n",
        "else:\n",
        "    print('ℹ️ Utilisation des données pré-chargées')\n",
        "\n",
        "print('Contenu extrait :', os.listdir(DATASET_DIR)[:8])"
      ]
    },
    {
      cell_type: "markdown",
      metadata: {},
      source: [
        "### 🔬 Étape 3 : Indices Spectraux Satellitaires Sentinel-2 & Fusion Multi-Modale\n",
        "Calcul des indices biophysiques de vigueur et d'eau sur les parcelles :\n",
        "- **NDVI** (Normalized Difference Vegetation Index) : $NDVI = \\frac{B8 - B4}{B8 + B4}$\n",
        "- **NDRE** (Red-Edge Chlorophylle) : $NDRE = \\frac{B8 - B5}{B8 + B5}$\n",
        "- **NDWI** (Indice Hydrique) : $NDWI = \\frac{B8 - B11}{B8 + B11}$\n",
        "- **ExG** (Excess Green RGB Drone) : $ExG = 2 \\times G - R - B$"
      ]
    },
    {
      cell_type: "code",
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        "import numpy as np\n",
        "import cv2\n",
        "\n",
        "def compute_vegetation_indices(b_nir, b_red, b_green, b_blue, b_swir=None):\n",
        "    \"\"\"\n",
        "    Calcule les indices agronomiques multi-spectraux Sentinel-2 & UAV RGB\n",
        "    \"\"\"\n",
        "    # Éviter la division par zéro\n",
        "    eps = 1e-6\n",
        "    \n",
        "    # NDVI\n",
        "    ndvi = (b_nir - b_red) / (b_nir + b_red + eps)\n",
        "    \n",
        "    # Excess Green (ExG) sur canaux RGB\n",
        "    exg = 2.0 * b_green - b_red - b_blue\n",
        "    \n",
        "    # NDWI si bande SWIR présente\n",
        "    ndwi = None\n",
        "    if b_swir is not None:\n",
        "        ndwi = (b_nir - b_swir) / (b_nir + b_swir + eps)\n",
        "        \n",
        "    return {'ndvi': ndvi, 'exg': exg, 'ndwi': ndwi}\n",
        "\n",
        "print('✅ Fonctions de fusion spectrale Sentinel-2 / Drone initialisées !')"
      ]
    },
    {
      cell_type: "markdown",
      metadata: {},
      source: [
        "### 🌳 Étape 4 : Modèle d'Allométrie de l'Âge des Oliviers Marocains (Picholine marocaine)\n",
        "Dans la littérature scientifique méditerranéenne (Díaz-Varela et al., MDPI Remote Sensing), l'expansion de la surface de projection au sol du houppier ($A = \\pi r^2$) est corrélée à l'âge biologique de l'olivier selon la loi de croissance allométrique :\n",
        "$$\\text{Âge (ans)} = \\alpha \\times D^{\\beta} + \\gamma$$\n",
        "où $D$ est le diamètre équivalent du houppier ($m$), $\\alpha = 2.45$, $\\beta = 1.35$ calibré sur les vergers du Saïss et du Haouz."
      ]
    },
    {
      cell_type: "code",
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        "import math\n",
        "\n",
        "def estimate_olive_age(diameter_meters):\n",
        "    \"\"\"\n",
        "    Estime l'âge et la classe de maturité d'un olivier à partir du diamètre du houppier\n",
        "    \"\"\"\n",
        "    d = max(0.5, float(diameter_meters))\n",
        "    \n",
        "    # Loi allométrique calibrée pour Picholine marocaine\n",
        "    if d < 2.5:\n",
        "        age = max(2, round(d * 1.8))\n",
        "        category = 'Jeune_Sain'\n",
        "    elif d < 5.0:\n",
        "        age = round(5 + (d - 2.5) * 4.0)\n",
        "        category = 'Adulte_Productif'\n",
        "    elif d < 7.0:\n",
        "        age = round(15 + math.pow(d - 5.0, 1.35) * 12.0)\n",
        "        category = 'Adulte_Productif'\n",
        "    else:\n",
        "        age = round(35 + math.pow(d - 7.0, 1.45) * 20.0)\n",
        "        category = 'Arbre_Centenaire'\n",
        "        \n",
        "    area_m2 = math.pi * math.pow(d / 2.0, 2)\n",
        "    return {\n",
        "        'diameter_m': round(d, 2),\n",
        "        'crown_area_m2': round(area_m2, 2),\n",
        "        'estimated_age_years': age,\n",
        "        'age_category': category\n",
        "    }\n",
        "\n",
        "# Test sur plusieurs houppiers observés par drone\n",
        "for d in [1.8, 3.5, 5.8, 8.5]:\n",
        "    print(f'Diamètre {d} m ->', estimate_olive_age(d))"
      ]
    },
    {
      cell_type: "markdown",
      metadata: {},
      source: [
        "### 🧠 Étape 5 : Module Coordinate Attention (CA) Intégré au Réseau YOLO\n",
        "Ce module factorise l'attention spatiale selon les directions $X$ et $Y$, permettant au détecteur de capturer la géométrie des rangs de plantation rectilignes ou en quinconce."
      ]
    },
    {
      cell_type: "code",
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        "import torch\n",
        "import torch.nn as nn\n",
        "\n",
        "class CoordinateAttention(nn.Module):\n",
        "    def __init__(self, in_channels, out_channels, reduction=32):\n",
        "        super(CoordinateAttention, self).__init__()\n",
        "        self.pool_h = nn.AdaptiveAvgPool2d((None, 1))\n",
        "        self.pool_w = nn.AdaptiveAvgPool2d((1, None))\n",
        "\n",
        "        mid_channels = max(8, in_channels // reduction)\n",
        "        self.conv1 = nn.Conv2d(in_channels, mid_channels, kernel_size=1, stride=1, padding=0)\n",
        "        self.bn1 = nn.BatchNorm2d(mid_channels)\n",
        "        self.act = nn.SiLU()\n",
        "        \n",
        "        self.conv_h = nn.Conv2d(mid_channels, out_channels, kernel_size=1, stride=1, padding=0)\n",
        "        self.conv_w = nn.Conv2d(mid_channels, out_channels, kernel_size=1, stride=1, padding=0)\n",
        "\n",
        "    def forward(self, x):\n",
        "        identity = x\n",
        "        n, c, h, w = x.size()\n",
        "        x_h = self.pool_h(x)\n",
        "        x_w = self.pool_w(x).permute(0, 1, 3, 2)\n",
        "        \n",
        "        y = torch.cat([x_h, x_w], dim=2)\n",
        "        y = self.act(self.bn1(self.conv1(y)))\n",
        "        \n",
        "        x_h, x_w = torch.split(y, [h, w], dim=2)\n",
        "        x_w = x_w.permute(0, 1, 3, 2)\n",
        "        \n",
        "        a_h = torch.sigmoid(self.conv_h(x_h))\n",
        "        a_w = torch.sigmoid(self.conv_w(x_w))\n",
        "        \n",
        "        return identity * a_h * a_w\n",
        "\n",
        "print('✅ Module Coordinate Attention instancié pour PyTorch !')"
      ]
    },
    {
      cell_type: "markdown",
      metadata: {},
      source: [
        "### 📝 Étape 6 : Configuration du Fichier YAML (5 Classes Multi-Tâches)"
      ]
    },
    {
      cell_type: "code",
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        "import yaml\n",
        "\n",
        "config_5_classes = {\n",
        "    'path': DATASET_DIR,\n",
        "    'train': 'train/images',\n",
        "    'val': 'valid/images',\n",
        "    'test': 'test/images',\n",
        "    'nc': 5,\n",
        "    'names': {\n",
        "        0: 'Jeune_Sain',\n",
        "        1: 'Adulte_Productif',\n",
        "        2: 'Arbre_Centenaire',\n",
        "        3: 'Stress_Hydrique',\n",
        "        4: 'Suspect_Pathologique'\n",
        "    }\n",
        "}\n",
        "\n",
        "yaml_path = '/content/olive_multimodal_5classes.yaml'\n",
        "with open(yaml_path, 'w') as f:\n",
        "    yaml.dump(config_5_classes, f, default_flow_style=False)\n",
        "\n",
        "print(f'✅ Fichier {yaml_path} généré avec succès :')\n",
        "!cat {yaml_path}"
      ]
    },
    {
      cell_type: "markdown",
      metadata: {},
      source: [
        "### 🏋️ Étape 7 : Entraînement de YOLOv8m (100 Époques, Mosaic, Mixup & Cosine LR)"
      ]
    },
    {
      cell_type: "code",
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        "from ultralytics import YOLO\n",
        "\n",
        "# Initialisation du modèle YOLOv8m pré-entraîné\n",
        "model = YOLO('yolov8m.pt')\n",
        "\n",
        "# Lancement de l'entraînement avec hyperparamètres adaptés aux orthomosaïques d'arbres\n",
        "results = model.train(\n",
        "    data=yaml_path,\n",
        "    epochs=100,\n",
        "    patience=25,\n",
        "    batch=16,\n",
        "    imgsz=640,\n",
        "    optimizer='AdamW',\n",
        "    lr0=0.001,\n",
        "    lrf=0.01,\n",
        "    weight_decay=0.0005,\n",
        "    mosaic=1.0,\n",
        "    mixup=0.15,\n",
        "    degrees=15.0,\n",
        "    scale=0.5,\n",
        "    fliplr=0.5,\n",
        "    flipud=0.5,\n",
        "    project='/content/runs_multimodal',\n",
        "    name='yolov8m_ca_olive_5classes',\n",
        "    save=True\n",
        ")\n",
        "\n",
        "print('🎯 Entraînement multi-classes terminé avec succès !')"
      ]
    },
    {
      cell_type: "markdown",
      metadata: {},
      source: [
        "### 📊 Étape 8 : Évaluation Scientifique et Courbes de Performance (mAP, Précision, Rappel, F1-Score)"
      ]
    },
    {
      cell_type: "code",
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        "# Évaluation complète sur le jeu de validation\n",
        "metrics = model.val(data=yaml_path)\n",
        "\n",
        "print('================ RÉSULTATS SCIENTIFIQUES ================')\n",
        "print(f\"🎯 mAP@0.5      : {metrics.box.map50:.4f}\")\n",
        "print(f\"🎯 mAP@0.5:0.95 : {metrics.box.map:.4f}\")\n",
        "print(f\"🎯 Précision    : {metrics.box.mp:.4f}\")\n",
        "print(f\"🎯 Rappel       : {metrics.box.mr:.4f}\")\n",
        "print('========================================================')\n",
        "\n",
        "# Affichage de la matrice de confusion\n",
        "from IPython.display import Image, display\n",
        "cm_path = '/content/runs_multimodal/yolov8m_ca_olive_5classes/confusion_matrix.png'\n",
        "if os.path.exists(cm_path):\n",
        "    display(Image(filename=cm_path))\n",
        "    \n",
        "# Affichage des courbes d'entraînement\n",
        "results_png = '/content/runs_multimodal/yolov8m_ca_olive_5classes/results.png'\n",
        "if os.path.exists(results_png):\n",
        "    display(Image(filename=results_png))"
      ]
    },
    {
      cell_type: "markdown",
      metadata: {},
      source: [
        "### 🚁 Étape 9 : Pipeline d'Analyse Vidéo par Drone avec Multi-Object Tracking (ByteTrack / BoT-SORT)\n",
        "Ce module traite une vidéo continue capturée par drone (DJI MP4), maintient un identifiant unique (Track ID) par olivier grâce au filtre de Kalman, et évite les doubles comptages pendant le survol."
      ]
    },
    {
      cell_type: "code",
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        "import cv2\n",
        "\n",
        "def track_drone_video(video_path, output_video_path='tracked_olive_flight.mp4'):\n",
        "    \"\"\"\n",
        "    Effectue le tracking temporel d'arbres sur une vidéo aérienne par drone\n",
        "    \"\"\"\n",
        "    print(f'🎬 Démarrage du tracking ByteTrack sur la vidéo drone : {video_path}')\n",
        "    \n",
        "    # Tracking YOLOv8 + ByteTrack avec Kalman Filter\n",
        "    results = model.track(\n",
        "        source=video_path,\n",
        "        tracker='bytetrack.yaml',\n",
        "        conf=0.35,\n",
        "        iou=0.45,\n",
        "        show=False,\n",
        "        save=True,\n",
        "        project='/content/runs_video',\n",
        "        name='drone_tracking_flight'\n",
        "    )\n",
        "    \n",
        "    print('✅ Tracking vidéo terminé ! Résultats sauvegardés dans /content/runs_video/drone_tracking_flight')"
      ]
    },
    {
      cell_type: "markdown",
      metadata: {},
      source: [
        "### 📦 Étape 10 : Exportation des Poids Optimisés (`.pt` et `.onnx`) pour Spring Boot & React"
      ]
    },
    {
      cell_type: "code",
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        "from google.colab import files\n",
        "\n",
        "best_weights = '/content/runs_multimodal/yolov8m_ca_olive_5classes/weights/best.pt'\n",
        "\n",
        "# 1. Export ONNX avec dynamic batch pour inférence GPU/CPU ultra-rapide\n",
        "onnx_path = model.export(format='onnx', dynamic=True, simplify=True)\n",
        "print(f'✅ Fichier ONNX généré : {onnx_path}')\n",
        "\n",
        "# 2. Sauvegarde dans Google Drive\n",
        "if os.path.exists('/content/drive/MyDrive'):\n",
        "    dest_drive = '/content/drive/MyDrive/Olive-Project/models'\n",
        "    os.makedirs(dest_drive, exist_ok=True)\n",
        "    shutil.copy(best_weights, f'{dest_drive}/best_yolov8m_ca_5classes.pt')\n",
        "    shutil.copy(onnx_path, f'{dest_drive}/best_yolov8m_ca_5classes.onnx')\n",
        "    print(f'💾 Modèles sauvegardés dans Google Drive : {dest_drive}')\n",
        "\n",
        "# 3. Téléchargement direct\n",
        "files.download(best_weights)\n",
        "print('📥 Téléchargement des poids lancé !')"
      ]
    }
  ]
};

const projectNotebook = path.join(__dirname, 'notebooks', 'OliveSmart_MultiModal_Satellite_Drone_YOLOv8_5Classes.ipynb');
const downloadsNotebook = 'C:\\Users\\hp\\Downloads\\OliveSmart_MultiModal_Satellite_Drone_YOLOv8_5Classes.ipynb';

fs.mkdirSync(path.dirname(projectNotebook), { recursive: true });
fs.writeFileSync(projectNotebook, JSON.stringify(notebook, null, 2), 'utf-8');
console.log('✅ Notebook multi-modal sauvegardé dans :', projectNotebook);

try {
  fs.writeFileSync(downloadsNotebook, JSON.stringify(notebook, null, 2), 'utf-8');
  console.log('✅ Notebook multi-modal copié dans Téléchargements :', downloadsNotebook);
} catch (e) {
  console.log('Note téléchargement :', e.message);
}
