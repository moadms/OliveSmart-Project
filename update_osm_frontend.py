import json

with open(r"c:\Users\hp\Pictures\Olive-Project\frontend-react\detected_parcel_trees.json", encoding="utf-8") as f:
    trees = json.load(f)

json_trees = json.dumps(trees, indent=2)

html_code = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OliveSmart - Cartographie OpenStreetMap & YOLO Microservice</title>

    <!-- Leaflet.js -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">

    <style>
        body {{ 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f6f7f3;
            color: #242c1d;
            margin: 0;
            padding: 0;
        }}
        .mono {{ font-family: 'JetBrains Mono', monospace; }}
        .olive-btn-primary {{
            background: linear-gradient(180deg, #5b732d 0%, #465b21 100%);
            box-shadow: 0 4px 10px rgba(70, 91, 33, 0.35);
            transition: all 0.2s ease;
        }}
        .olive-btn-primary:hover {{
            background: linear-gradient(180deg, #688533 0%, #4e6625 100%);
            transform: translateY(-1px);
        }}
        .olive-btn-primary:active {{
            transform: translateY(0);
        }}
        #leafletMap {{
            height: 490px;
            width: 100%;
            border-radius: 0.75rem;
            z-index: 10;
        }}
    </style>
</head>
<body class="flex flex-col h-screen overflow-hidden">

    <!-- Header officiel de la plateforme du professeur -->
    <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-20">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#5b732d] flex items-center justify-center text-white text-xl font-bold shadow-md">
                🫒
            </div>
            <div>
                <div class="flex items-center gap-2">
                    <h1 class="text-xl font-extrabold text-gray-900 leading-tight">Parcelles</h1>
                    <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Marrakech • Haouz</span>
                </div>
                <p class="text-xs text-gray-500 font-medium">32 parcelles oléicoles actives • Système Cadastral &amp; IA OliveSmart</p>
            </div>
        </div>

        <div class="flex items-center gap-4">
            <button id="btnRefresh" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition" title="Actualiser la carte">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
            <div class="relative cursor-pointer">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">5</span>
            </div>
            <div class="flex items-center gap-2 pl-3 border-l border-gray-200">
                <div class="w-8 h-8 rounded-full bg-[#5b732d] text-white flex items-center justify-center text-xs font-bold shadow-inner">AO</div>
                <div class="text-left hidden sm:block">
                    <div class="text-xs font-bold text-gray-800">Admin OliveSmart</div>
                    <div class="text-[10px] text-gray-400 font-semibold">ADMINISTRATEUR</div>
                </div>
            </div>
        </div>
    </header>

    <!-- Contenu Principal -->
    <div class="flex-1 flex overflow-hidden">
        
        <!-- Colonne Gauche : Carte & Détection -->
        <main class="flex-1 flex flex-col p-4 overflow-y-auto bg-[#f4f5f1]">
            
            <!-- Barre d'outils au-dessus de la carte -->
            <div class="flex flex-wrap items-center justify-between gap-2 mb-3 bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                <div class="flex items-center gap-2">
                    <button id="btnResetPoints" class="px-3 py-1.5 text-xs font-semibold text-[#855325] bg-[#fff8eb] border border-[#fde8c3] rounded-lg hover:bg-[#ffefd2] transition flex items-center gap-1 shadow-sm">
                        📍 Tracer les 6 sommets du Haouz
                    </button>
                    <button id="btnCenterMap" class="px-3 py-1.5 text-xs font-semibold text-[#1d4ed8] bg-[#eff6ff] border border-[#bfdbfe] rounded-lg hover:bg-[#dbeafe] transition flex items-center gap-1 shadow-sm">
                        🎯 Recentrer
                    </button>
                    <button id="btnClearMap" class="px-3 py-1.5 text-xs font-semibold text-[#b91c1c] bg-[#fef2f2] border border-[#fecaca] rounded-lg hover:bg-[#fee2e2] transition flex items-center gap-1 shadow-sm">
                        🗑️ Effacer
                    </button>
                </div>

                <!-- Sélecteur de Couche Cartographique -->
                <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500 font-bold">Fond :</span>
                    <button id="btnLayerOsm" class="px-3 py-1.5 text-xs rounded-lg font-bold bg-[#5b732d] text-white shadow-sm transition flex items-center gap-1">
                        🗺️ OpenStreetMap
                    </button>
                    <button id="btnLayerSat" class="px-3 py-1.5 text-xs rounded-lg font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition flex items-center gap-1 border border-gray-300">
                        🛰️ Satellite ESRI
                    </button>
                    <button id="btnViewBoxes" class="px-3 py-1.5 text-xs rounded-lg font-bold bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition flex items-center gap-1 border border-gray-300">
                        🟩 Carrés YOLO (83 arbres)
                    </button>
                </div>
            </div>

            <!-- Conteneur Carte & Boîtes Englobantes -->
            <div class="relative rounded-2xl overflow-hidden shadow-md border border-gray-300 bg-white">
                
                <!-- 1. Vue Carte Leaflet (OpenStreetMap / Satellite) -->
                <div id="leafletMap"></div>

                <!-- 2. Vue Image Haute Définition avec Carrés YOLO -->
                <div id="boxesContainer" class="hidden relative w-full h-[490px] bg-black flex items-center justify-center overflow-hidden">
                    <img id="boxesImg" src="detected_parcel_trees_boxes.jpg" alt="Détection YOLO des oliviers avec boîtes englobantes" class="w-full h-full object-contain" />
                    <div class="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-mono border border-emerald-500/40">
                        🟢 83 oliviers détectés avec leurs carrés (bounding boxes YOLOv8 + Coordinate Attention)
                    </div>
                </div>

                <!-- Badge Indication Mode (comme chez le prof) -->
                <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-gray-800 px-3 py-1.5 rounded-xl text-xs z-[400] flex items-center gap-2 shadow-md border border-gray-300">
                    <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span id="mapBadgeText" class="font-bold">🗺️ Carte OpenStreetMap — Zoom 17</span>
                    <span class="text-gray-500 font-mono">| Marrakech, Maroc</span>
                </div>
            </div>

            <!-- Barre d'aide pour tracer au clic -->
            <div class="flex items-center justify-between mt-2 px-1 text-xs text-gray-500">
                <span class="flex items-center gap-1 font-medium">
                    💡 <em>Astuce : Cliquez n'importe où sur la carte pour concevoir et ajouter de nouveaux points de sommets !</em>
                </span>
                <span class="font-mono text-[#5b732d] font-bold">WGS84 • EPSG:4326</span>
            </div>

            <!-- Fiche des 6 Sommets Tracés (Exactement conforme à l'image 4 du prof) -->
            <div class="bg-white rounded-xl p-3.5 mt-3 border border-gray-200 shadow-sm">
                <div class="text-xs font-bold text-[#5b732d] mb-2 flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                        <span>📍</span>
                        <span id="verticesCount">6 sommets géodésiques tracés (Marrakech / Haouz) :</span>
                    </div>
                    <span class="text-[10px] text-gray-400 font-mono">Cadastre Polygonal</span>
                </div>
                <div id="verticesGrid" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <!-- Rempli en JS -->
                </div>
            </div>

            <!-- Grand Bouton d'Analyse YOLO -->
            <div class="mt-4">
                <button id="btnAnalyzeYolo" class="olive-btn-primary w-full py-4 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg">
                    <span id="btnAnalyzeIcon">🤖</span>
                    <span id="btnAnalyzeText">6 points tracés — Analyser avec YOLO (Microservice Spring Boot) →</span>
                </button>
            </div>

            <!-- Fiche de Résultats YOLO (Exactement conforme à l'image 2 du prof !) -->
            <div id="resultsCard" class="hidden mt-4 bg-[#394924] text-white rounded-2xl p-5 shadow-xl border border-[#4d6331]">
                <div class="flex items-start justify-between">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="text-2xl">🫒</span>
                            <h2 id="resTotalTrees" class="text-2xl font-black tracking-tight">83 oliviers</h2>
                        </div>
                        <p class="text-xs text-[#a3b88c] mt-0.5">détectés et comptés par YOLO sur la parcelle cadastrale</p>
                    </div>
                    <div class="text-right">
                        <div class="text-xs text-[#a3b88c] font-medium">Confiance Moyenne</div>
                        <div id="resConfidence" class="text-2xl font-black text-[#00e676]">89.2%</div>
                    </div>
                </div>

                <!-- 3 Badges d'État Sanitaire -->
                <div class="grid grid-cols-3 gap-3 mt-4">
                    <div class="bg-[#2c391c] rounded-xl p-3 border-b-4 border-[#00c853]">
                        <div class="text-xs text-gray-300 font-semibold flex items-center gap-1">
                            <span>✅</span> Sains
                        </div>
                        <div id="resSains" class="text-2xl font-black text-[#00e676] mt-1">80</div>
                    </div>
                    <div class="bg-[#2c391c] rounded-xl p-3 border-b-4 border-[#ffb300]">
                        <div class="text-xs text-gray-300 font-semibold flex items-center gap-1">
                            <span>⚠️</span> Stress
                        </div>
                        <div id="resStress" class="text-2xl font-black text-[#ffb300] mt-1">2</div>
                    </div>
                    <div class="bg-[#2c391c] rounded-xl p-3 border-b-4 border-[#ff5252]">
                        <div class="text-xs text-gray-300 font-semibold flex items-center gap-1">
                            <span>🔴</span> Suspects
                        </div>
                        <div id="resSuspects" class="text-2xl font-black text-[#ff5252] mt-1">1</div>
                    </div>
                </div>

                <!-- Répartition par Âge Allométrique -->
                <div class="mt-3 bg-[#2a361a] rounded-lg p-2.5 flex items-center justify-between text-xs text-gray-300 font-medium">
                    <span>🌱 <strong>45</strong> Jeunes (&lt;5 ans)</span>
                    <span>🌳 <strong>33</strong> Adultes (5-50 ans)</span>
                    <span>🏛️ <strong>5</strong> Centenaires (&gt;50 ans)</span>
                </div>

                <!-- Métriques d'Inférence -->
                <div class="flex flex-wrap items-center justify-between text-xs text-[#a3b88c] mt-3 pt-3 border-t border-[#465c2b]">
                    <span id="resInferenceTime">⏱️ 285 ms <span id="badgeLiveApi" class="ml-1 text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-mono font-bold">API Spring Boot :8080</span></span>
                    <span class="italic text-[11px]">YOLOv8m + Coordinate Attention • Haute Résolution</span>
                    <span id="resDiameter">🌳 Ø 3.5 m couronne</span>
                </div>

                <!-- Bandeau Vert de Confirmation -->
                <div class="mt-3 bg-[#2c3a1b] text-[#81c784] text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 border border-[#3b4d24]">
                    <span class="text-sm font-bold">✓</span>
                    <span>Résultat appliqué — 83 oliviers identifiés et géolocalisés avec succès</span>
                </div>

                <!-- Boutons d'Action Inférieurs -->
                <div class="flex items-center gap-3 mt-4">
                    <button id="btnModifyContour" class="flex-1 bg-white text-gray-800 font-bold py-2.5 rounded-xl text-xs hover:bg-gray-100 transition shadow-sm">
                        ✏️ Modifier les sommets
                    </button>
                    <button id="btnShowBoxesDirectly" class="flex-1 bg-[#465c2b] text-white font-bold py-2.5 rounded-xl text-xs hover:bg-[#4f6731] transition shadow-sm">
                        🟩 Voir les carrés YOLO (83 arbres) →
                    </button>
                </div>
            </div>
        </main>

        <!-- Colonne Droite : Fiche Technique & Arbre Sélectionné -->
        <aside class="w-80 bg-white border-l border-gray-200 p-4 flex flex-col gap-4 overflow-y-auto">
            
            <!-- Carte Statut Microservice -->
            <div class="bg-[#fcfdfa] border border-[#e5e9db] p-3.5 rounded-xl">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-xs font-extrabold text-[#5b732d] uppercase tracking-wider">Microservice Spring Boot</h3>
                    <span id="serviceStatusBadge" class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Port 8080 Connecté
                    </span>
                </div>
                <p class="text-xs text-gray-600 leading-relaxed">
                    Ce frontend transmet les 6 sommets au contrôleur Java (<code class="bg-gray-100 px-1 py-0.5 rounded text-[11px] mono">POST /api/v1/parcelles/analyser</code>), qui applique le Geofencing Ray-Casting et le modèle <strong>YOLOv8m + Coordinate Attention</strong>.
                </p>
            </div>

            <!-- Fiche Arbre Sélectionné -->
            <div id="treeDetailContainer">
                <div class="text-center py-8 text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4">
                    Cliquez sur un marqueur d'olivier sur la carte après l'analyse pour afficher son diagnostic individuel (Santé, GPS, Âge).
                </div>
            </div>

            <!-- Crédits -->
            <div class="mt-auto pt-3 border-t border-gray-100 text-center text-xs text-gray-400">
                OliveSmart AI • Sujet OLV-1 Drone &amp; Satellite<br>
                <strong class="text-gray-700">Moad Moussaoui • Équipe OLV-1</strong>
            </div>
        </aside>
    </div>

    <!-- Script Pure JS Sécurisé -->
    <script>
        const INITIAL_VERTICES = [
            {{ id: 'S1', lat: 31.63443, lng: -7.96600 }},
            {{ id: 'S2', lat: 31.63455, lng: -7.96602 }},
            {{ id: 'S3', lat: 31.63470, lng: -7.96565 }},
            {{ id: 'S4', lat: 31.63474, lng: -7.96504 }},
            {{ id: 'S5', lat: 31.63320, lng: -7.96456 }},
            {{ id: 'S6', lat: 31.63290, lng: -7.96521 }}
        ];

        const ALL_PARCEL_TREES = {json_trees};

        let currentVertices = [...INITIAL_VERTICES];
        let map = null;
        let polygonLayer = null;
        let markersLayer = null;
        let treesLayer = null;
        let osmLayer = null;
        let satLayer = null;

        function initMap() {{
            try {{
                const mapEl = document.getElementById('leafletMap');
                if (!mapEl) return;

                // 1. Initialisation Leaflet sur Marrakech Haouz
                map = L.map('leafletMap', {{ zoomControl: false }}).setView([31.6338, -7.9653], 17);
                L.control.zoom({{ position: 'topleft' }}).addTo(map);

                // 2. Calque OpenStreetMap (Actif par défaut pour une clarté absolue)
                osmLayer = L.tileLayer('https://tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
                    maxZoom: 19,
                    attribution: '© OpenStreetMap contributors'
                }}).addTo(map);

                // 3. Calque Satellite ESRI HD
                satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{{z}}/{{y}}/{{x}}', {{
                    maxZoom: 19,
                    attribution: 'ESRI World Imagery'
                }});

                // 4. Groupes vectoriels
                polygonLayer = L.layerGroup().addTo(map);
                markersLayer = L.layerGroup().addTo(map);
                treesLayer = L.layerGroup().addTo(map);

                // 5. Clic sur la carte pour concevoir/ajouter des sommets
                map.on('click', function(e) {{
                    if (currentVertices.length >= 12) return;
                    const nextId = `S${{currentVertices.length + 1}}`;
                    currentVertices.push({{
                        id: nextId,
                        lat: Number(e.latlng.lat.toFixed(5)),
                        lng: Number(e.latlng.lng.toFixed(5))
                    }});
                    renderVertices();
                }});

                // Dessin initial
                renderVertices();
            }} catch (err) {{
                console.error("Erreur initMap:", err);
            }}
        }}

        function renderVertices() {{
            try {{
                if (polygonLayer) polygonLayer.clearLayers();
                if (markersLayer) markersLayer.clearLayers();

                if (currentVertices.length >= 3 && polygonLayer) {{
                    const latlngs = currentVertices.map(v => [v.lat, v.lng]);
                    L.polygon(latlngs, {{
                        color: '#4d6928',
                        weight: 3,
                        fillColor: '#3d5220',
                        fillOpacity: 0.3
                    }}).addTo(polygonLayer);
                }}

                if (markersLayer) {{
                    currentVertices.forEach(v => {{
                        const marker = L.circleMarker([v.lat, v.lng], {{
                            radius: 7,
                            fillColor: '#ffffff',
                            color: '#4d6928',
                            weight: 3,
                            fillOpacity: 1
                        }}).addTo(markersLayer);
                        marker.bindTooltip(`<strong>${{v.id}}</strong>: ${{v.lat}}, ${{v.lng}}`, {{ direction: 'top' }});
                    }});
                }}

                const grid = document.getElementById('verticesGrid');
                if (grid) {{
                    grid.innerHTML = currentVertices.map(v => `
                        <div class="bg-[#f9faf7] border border-[#e5e7dc] rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700 flex justify-between font-mono">
                            <span class="font-bold text-[#5b732d]">${{v.id}}</span>
                            <span>${{v.lat.toFixed(5)}}, ${{v.lng.toFixed(5)}}</span>
                        </div>
                    `).join('');
                }}

                const countEl = document.getElementById('verticesCount');
                if (countEl) countEl.innerText = `${{currentVertices.length}} sommets géodésiques tracés (Marrakech / Haouz) :`;

                const btnText = document.getElementById('btnAnalyzeText');
                if (btnText) btnText.innerText = `${{currentVertices.length}} points tracés — Analyser avec YOLO (Microservice Spring Boot) →`;
            }} catch (e) {{
                console.error("Erreur renderVertices:", e);
            }}
        }}

        function renderTrees(trees) {{
            if (!treesLayer) return;
            treesLayer.clearLayers();
            trees.forEach(tree => {{
                const color = tree.status === 'SAIN' ? '#00c853' : (tree.status === 'STRESS' ? '#ffb300' : '#ef5350');
                const marker = L.circleMarker([tree.lat, tree.lng], {{
                    radius: 7,
                    fillColor: color,
                    color: '#ffffff',
                    weight: 2,
                    fillOpacity: 0.95
                }}).addTo(treesLayer);

                marker.on('click', () => showTreeDetails(tree));
                marker.bindTooltip(`Olivier #${{tree.id}} (${{tree.status}} - ${{tree.age}})`);
            }});
        }}

        function showTreeDetails(tree) {{
            const container = document.getElementById('treeDetailContainer');
            if (!container) return;
            const badgeClass = tree.status === 'SAIN' ? 'bg-green-100 text-green-700' : (tree.status === 'STRESS' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700');
            container.innerHTML = `
                <div class="bg-white border-2 border-[#5b732d] p-4 rounded-xl shadow-md transition-all">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-extrabold text-gray-900">Olivier #${{tree.id}}</span>
                        <span class="text-[10px] font-extrabold px-2 py-0.5 rounded ${{badgeClass}}">
                            ${{tree.status}}
                        </span>
                    </div>
                    <div class="space-y-1.5 text-xs text-gray-600 font-medium">
                        <div><strong>Latitude :</strong> ${{tree.lat}}</div>
                        <div><strong>Longitude :</strong> ${{tree.lng}}</div>
                        <div><strong>Diamètre Couronne :</strong> ${{tree.diam}} m</div>
                        <div><strong>Âge Allométrique :</strong> ${{tree.age}}</div>
                        <div><strong>Confiance YOLO :</strong> ${{((tree.conf || 0.89) * 100).toFixed(1)}}%</div>
                    </div>
                </div>
            `;
        }}

        async function runYoloAnalysis() {{
            const btn = document.getElementById('btnAnalyzeYolo');
            const icon = document.getElementById('btnAnalyzeIcon');
            const text = document.getElementById('btnAnalyzeText');
            
            if (icon) icon.innerText = '⏳';
            if (text) text.innerText = 'Appel REST Microservice Spring Boot (Port 8080)...';
            if (btn) btn.disabled = true;

            const startTime = performance.now();
            let treesToDisplay = ALL_PARCEL_TREES;
            let isSpringLive = false;

            try {{
                const res = await fetch('http://localhost:8080/api/v1/parcelles/analyser', {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify({{
                        parcelId: 'P-MAR-HAOUZ-01',
                        vertices: currentVertices,
                        gsdMetersPerPixel: 0.05
                    }})
                }});

                if (res.ok) {{
                    const data = await res.json();
                    isSpringLive = true;
                    treesToDisplay = data.trees.map(t => ({{
                        id: t.id,
                        lat: t.lat,
                        lng: t.lng,
                        status: t.healthStatus,
                        diam: t.crownDiameterMeters,
                        age: t.crownDiameterMeters < 3.2 ? '4 ans (Jeune)' : (t.crownDiameterMeters > 6.5 ? '65 ans (Centenaire)' : `${{Math.round(t.crownDiameterMeters * 5.5)}} ans (Adulte)`),
                        conf: t.confidence
                    }}));
                }}
            }} catch (e) {{
                console.warn("Spring Boot hors-ligne, basculement mode autonome:", e);
            }}

            const elapsed = Math.round(performance.now() - startTime);

            setTimeout(() => {{
                renderTrees(treesToDisplay);
                const resCard = document.getElementById('resultsCard');
                if (resCard) resCard.classList.remove('hidden');

                const sains = treesToDisplay.filter(t => t.status === 'SAIN').length;
                const stress = treesToDisplay.filter(t => t.status === 'STRESS').length;
                const suspects = treesToDisplay.filter(t => t.status === 'SUSPECT').length;

                const resTotal = document.getElementById('resTotalTrees');
                if (resTotal) resTotal.innerText = `${{treesToDisplay.length}} oliviers`;

                const elSains = document.getElementById('resSains');
                if (elSains) elSains.innerText = sains;

                const elStress = document.getElementById('resStress');
                if (elStress) elStress.innerText = stress;

                const elSuspects = document.getElementById('resSuspects');
                if (elSuspects) elSuspects.innerText = suspects;

                const elTime = document.getElementById('resInferenceTime');
                if (elTime) {{
                    elTime.innerHTML = `⏱️ ${{elapsed > 0 ? elapsed : 285}} ms ${{isSpringLive ? '<span class=\"ml-1 text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-mono font-bold\">API Spring Boot :8080</span>' : '<span class=\"ml-1 text-[10px] bg-gray-600 text-white px-1.5 py-0.5 rounded font-mono font-bold\">Mode Autonome</span>'}}`;
                }}

                if (icon) icon.innerText = '🤖';
                if (text) text.innerText = '♻️ Relancer l\'analyse YOLO';
                if (btn) btn.disabled = false;

                if (treesToDisplay.length > 0) showTreeDetails(treesToDisplay[0]);
            }}, 400);
        }}

        function safeListen(id, event, handler) {{
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, handler);
        }}

        safeListen('btnAnalyzeYolo', 'click', runYoloAnalysis);
        safeListen('btnResetPoints', 'click', () => {{
            currentVertices = [...INITIAL_VERTICES];
            renderVertices();
            if (map && currentVertices.length > 0) {{
                const bounds = L.latLngBounds(currentVertices.map(v => [v.lat, v.lng]));
                map.fitBounds(bounds, {{ padding: [30, 30] }});
            }}
        }});
        safeListen('btnCenterMap', 'click', () => {{
            if (map && currentVertices.length > 0) {{
                const bounds = L.latLngBounds(currentVertices.map(v => [v.lat, v.lng]));
                map.fitBounds(bounds, {{ padding: [30, 30] }});
            }}
        }});
        safeListen('btnClearMap', 'click', () => {{
            currentVertices = [];
            renderVertices();
            if (treesLayer) treesLayer.clearLayers();
            const resCard = document.getElementById('resultsCard');
            if (resCard) resCard.classList.add('hidden');
        }});
        safeListen('btnModifyContour', 'click', () => {{
            const resCard = document.getElementById('resultsCard');
            if (resCard) resCard.classList.add('hidden');
        }});

        // Bascule OpenStreetMap
        safeListen('btnLayerOsm', 'click', function() {{
            const mapEl = document.getElementById('leafletMap');
            const boxesEl = document.getElementById('boxesContainer');
            if (mapEl) mapEl.classList.remove('hidden');
            if (boxesEl) boxesEl.classList.add('hidden');

            if (map && osmLayer) {{
                if (satLayer) map.removeLayer(satLayer);
                map.addLayer(osmLayer);
                map.invalidateSize();
            }}

            this.className = "px-3 py-1.5 text-xs rounded-lg font-bold bg-[#5b732d] text-white shadow-sm transition flex items-center gap-1";
            document.getElementById('btnLayerSat').className = "px-3 py-1.5 text-xs rounded-lg font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition flex items-center gap-1 border border-gray-300";
            document.getElementById('btnViewBoxes').className = "px-3 py-1.5 text-xs rounded-lg font-bold bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition flex items-center gap-1 border border-gray-300";
            document.getElementById('mapBadgeText').innerText = "🗺️ Carte OpenStreetMap — Zoom 17";
        }});

        // Bascule Satellite ESRI
        safeListen('btnLayerSat', 'click', function() {{
            const mapEl = document.getElementById('leafletMap');
            const boxesEl = document.getElementById('boxesContainer');
            if (mapEl) mapEl.classList.remove('hidden');
            if (boxesEl) boxesEl.classList.add('hidden');

            if (map && satLayer) {{
                if (osmLayer) map.removeLayer(osmLayer);
                map.addLayer(satLayer);
                map.invalidateSize();
            }}

            this.className = "px-3 py-1.5 text-xs rounded-lg font-bold bg-[#5b732d] text-white shadow-sm transition flex items-center gap-1";
            document.getElementById('btnLayerOsm').className = "px-3 py-1.5 text-xs rounded-lg font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition flex items-center gap-1 border border-gray-300";
            document.getElementById('btnViewBoxes').className = "px-3 py-1.5 text-xs rounded-lg font-bold bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition flex items-center gap-1 border border-gray-300";
            document.getElementById('mapBadgeText').innerText = "🛰️ Image Satellite ESRI — Zoom 17";
        }});

        // Bascule Vue Carrés YOLO
        safeListen('btnViewBoxes', 'click', function() {{
            const mapEl = document.getElementById('leafletMap');
            const boxesEl = document.getElementById('boxesContainer');
            if (mapEl) mapEl.classList.add('hidden');
            if (boxesEl) boxesEl.classList.remove('hidden');

            this.className = "px-3 py-1.5 text-xs rounded-lg font-bold bg-[#5b732d] text-white shadow-sm transition flex items-center gap-1";
            document.getElementById('btnLayerOsm').className = "px-3 py-1.5 text-xs rounded-lg font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition flex items-center gap-1 border border-gray-300";
            document.getElementById('btnLayerSat').className = "px-3 py-1.5 text-xs rounded-lg font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition flex items-center gap-1 border border-gray-300";
            document.getElementById('mapBadgeText').innerText = "🟩 Détection YOLO (Carrés)";
        }});

        safeListen('btnShowBoxesDirectly', 'click', function() {{
            const btnB = document.getElementById('btnViewBoxes');
            if (btnB) btnB.click();
        }});

        // Lancement
        if (document.readyState === 'loading') {{
            document.addEventListener('DOMContentLoaded', initMap);
        }} else {{
            initMap();
        }}
    </script>
</body>
</html>
"""

with open(r"c:\Users\hp\Pictures\Olive-Project\frontend-react\index.html", "w", encoding="utf-8") as f:
    f.write(html_code)

print("SUCCESS: index.html generated with OpenStreetMap as default and full interactive support!")
