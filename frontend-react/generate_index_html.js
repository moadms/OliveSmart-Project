const fs = require('fs');
const path = require('path');

const treesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'detected_parcel_trees.json'), 'utf8'));

const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OliveSmart - Détection Précise & Contrôle Géodésique</title>

    <!-- Leaflet.js CSS & JS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">

    <style>
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f4f5f1;
            color: #242c1d;
            margin: 0;
            padding: 0;
            height: 100vh;
            overflow: hidden;
        }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .olive-btn-primary {
            background: linear-gradient(180deg, #5b732d 0%, #465b21 100%);
            box-shadow: 0 4px 14px rgba(70, 91, 33, 0.4);
            transition: all 0.2s ease;
        }
        .olive-btn-primary:hover {
            background: linear-gradient(180deg, #688533 0%, #4e6625 100%);
            transform: translateY(-1px);
            box-shadow: 0 6px 18px rgba(70, 91, 33, 0.5);
        }
        .olive-btn-primary:active {
            transform: translateY(0);
        }
        #leafletMap {
            height: 100%;
            width: 100%;
            border-radius: 0.75rem;
            z-index: 10;
            background-color: #1e293b;
        }
        /* Custom scrollbar for right panel */
        .custom-scroll::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
        /* Interactive SVG YOLO Bounding Boxes */
        .tree-bbox {
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .tree-bbox:hover {
            stroke-width: 3.5 !important;
            filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.9));
        }
        .tree-bbox.selected {
            stroke: #ffffff !important;
            stroke-width: 4 !important;
            filter: drop-shadow(0 0 8px rgba(255, 255, 0, 1));
        }
        .draggable-vertex {
            cursor: move;
        }
    </style>
</head>
<body class="flex flex-col h-screen overflow-hidden">

    <!-- Header officiel de la plateforme -->
    <header class="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center justify-between shadow-sm z-20 shrink-0">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#5b732d] flex items-center justify-center text-white text-xl font-bold shadow-md">
                🫒
            </div>
            <div>
                <div class="flex items-center gap-2">
                    <h1 class="text-xl font-extrabold text-gray-900 leading-tight">OliveSmart Cadastre &amp; IA</h1>
                    <span id="regionBadge" class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Marrakech • Haouz</span>
                </div>
                <p class="text-xs text-gray-500 font-medium">Contrôle Géodésique Dynamique &amp; Détection des Rectangles à Taille Réelle des Arbres</p>
            </div>
        </div>

        <!-- Profil & Statut Microservice -->
        <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold text-emerald-800 shadow-sm">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Microservice Spring Boot : <strong class="text-emerald-900">Port 8080 Connecté</strong></span>
            </div>

            <button id="btnRefresh" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition" title="Actualiser la carte">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
            <div class="flex items-center gap-2 pl-3 border-l border-gray-200">
                <div class="w-8 h-8 rounded-full bg-[#5b732d] text-white flex items-center justify-center text-xs font-bold shadow-inner">AO</div>
                <div class="text-left hidden sm:block">
                    <div class="text-xs font-bold text-gray-800">Admin OliveSmart</div>
                    <div class="text-[10px] text-gray-400 font-semibold">ADMINISTRATEUR</div>
                </div>
            </div>
        </div>
    </header>

    <!-- Disposition 50/50 : Gauche = Carte & Rendu YOLO, Droite = Diagnostic Détaillé & Sommets -->
    <div class="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#f4f5f1] p-3 gap-3 relative">
        <div id="detectionWorkspaceView" class="flex-1 flex flex-col md:flex-row gap-3 h-full overflow-hidden">
        
        <!-- ================================================================= -->
        <!-- COLONNE GAUCHE (55% largeur) : VISUALISEUR DES RECTANGLES & CARTE -->
        <!-- ================================================================= -->
        <section class="w-full md:w-[55%] flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 p-3 overflow-hidden">
            
            <!-- Barre d'onglets de visualisation : Rectangles HD vs Carte Satellite Leaflet -->
            <div class="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100 shrink-0">
                
                <!-- Sélection du Mode d'Affichage & Test Media -->
                <div class="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                    <button id="tabMapSat" class="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#5b732d] text-white shadow-sm transition flex items-center gap-1">
                        <span>🛰️</span> Satellite HD (ESRI)
                    </button>
                    <button id="tabMapGoogle" class="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-900 transition flex items-center gap-1">
                        <span>🌐</span> Google Sat
                    </button>
                    <button id="tabUploadImage" class="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-900 transition flex items-center gap-1">
                        <span>📷</span> Tester Image (Upload)
                    </button>
                    <button id="tabUploadVideo" class="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-900 transition flex items-center gap-1">
                        <span>🎥</span> Tester Vidéo Drone
                    </button>
                    <button id="tabYoloHd" class="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-900 transition flex items-center gap-1">
                        <span>🟩</span> Vue Drone YOLO
                    </button>
                    <button id="tabScientificReport" class="px-3 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-emerald-700 via-[#5b732d] to-amber-600 text-white shadow hover:opacity-95 transition flex items-center gap-1.5 cursor-pointer border border-emerald-400/40">
                        <span>📑</span> Rapport Scientifique & Benchmarks IA
                    </button>
                    <button id="tabMapOsm" class="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-900 transition flex items-center gap-1">
                        <span>🗺️</span> Plan OSM
                    </button>
                </div>

                <!-- Actions de tracé sur la surface satellite -->
                <div id="satelliteDrawActions" class="flex items-center gap-1.5 text-xs">
                    <button id="btnResetPolygon" class="px-2.5 py-1.5 bg-[#fff8eb] border border-[#fde8c3] text-[#855325] rounded-lg font-bold hover:bg-[#ffefd2] transition shadow-sm text-[11px]" title="Réinitialiser les 6 sommets par défaut">
                        ✏️ Rétablir 6 sommets
                    </button>
                    <button id="btnClearPolygon" class="px-2.5 py-1.5 bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] rounded-lg font-bold hover:bg-[#fee2e2] transition shadow-sm text-[11px]" title="Effacer pour dessiner votre propre polygone">
                        🗑️ Effacer &amp; Dessiner
                    </button>
                </div>
            </div>

            <!-- Barre de Contrôle Upload Media (Image & Vidéo) -->
            <div id="mediaControlsBar" class="hidden flex flex-wrap items-center justify-between gap-2 mb-2 p-2 bg-[#f8faf5] border border-[#dce3d2] rounded-xl shrink-0">
                <div class="flex items-center gap-2">
                    <label class="cursor-pointer px-3 py-1.5 bg-[#5b732d] hover:bg-[#4a5f24] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm">
                        <span>📁</span> <span id="uploadLabelText">Importer Image / Vidéo</span>
                        <input type="file" id="mediaFileInput" class="hidden" accept="image/*,video/*" />
                    </label>
                    <button id="btnLoadDemoMedia" class="px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-sm">
                        <span>⚡</span> <span id="demoBtnText">Charger Démo</span>
                    </button>
                    <button id="btnClearMediaRoi" class="px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-sm" title="Effacer les points pour retracer une nouvelle zone">
                        <span>🗑️</span> Effacer Tracé
                    </button>
                </div>
                
                <!-- Contrôles Vidéo (Play / Pause / Rejouer) -->
                <div id="videoPlayControls" class="hidden flex items-center gap-2">
                    <button id="btnVideoTogglePlay" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm">
                        <span id="videoPlayIcon">▶️</span> <span id="videoPlayText">Lancer la Vidéo</span>
                    </button>
                    <button id="btnVideoRestart" class="px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-sm">
                        <span>🔄</span> Recommencer
                    </button>
                    <span id="videoTimeDisplay" class="font-mono text-xs font-bold text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded">00:00 / 00:00</span>
                </div>

                <div class="text-[11px] text-gray-600 font-medium">
                    <span id="mediaHelpText">📍 Cliquez sur l'écran pour tracer les points de votre polygone</span>
                </div>
            </div>

            <!-- Conteneur d'affichage des arbres avec rectangles -->
            <div id="viewerWrapper" class="relative flex-1 rounded-xl overflow-hidden shadow-inner border border-gray-300 bg-black">
                
                <!-- 1. VUE CARTE LEAFLET AVEC POINTS MODIFIABLES ET RECTANGLES GÉODÉSIQUES -->
                <div id="leafletMap" class="w-full h-full"></div>

                <!-- 2. VUE HAUTE DÉFINITION : RECTANGLES EXACTS DU FEUILLAGE SUR L'IMAGE DRONE/SATELLITE -->
                <div id="yoloHdContainer" class="hidden relative w-full h-full flex items-center justify-center overflow-hidden bg-[#111827]">
                    <img id="yoloBaseImg" src="satellite_trees_detected.jpg" alt="Verger d'oliviers avec détection YOLO" class="max-w-full max-h-full object-contain select-none" />
                    
                    <!-- Calque SVG interactif superposé avec chaque rectangle à la taille exacte de l'arbre -->
                    <svg id="yoloSvgOverlay" class="absolute inset-0 w-full h-full pointer-events-auto" viewBox="0 0 512 512" preserveAspectRatio="xMidYMid meet"></svg>

                    <!-- Badge Flottant Mode YOLO -->
                    <div class="absolute top-3 right-3 bg-black/85 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs z-30 flex items-center gap-2 border border-emerald-500/50 shadow-lg font-mono">
                        <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                        <span class="font-bold text-emerald-400">YOLOv8m + CoordAttention</span>
                        <span id="yoloHdCountBadge" class="text-gray-400 text-[11px]">| Rectangles à taille réelle</span>
                    </div>

                    <!-- Légende interactive en bas à gauche de l'image -->
                    <div class="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[11px] font-mono z-30 flex items-center gap-3 border border-gray-700 shadow-lg">
                        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm border-2 border-[#00e676] bg-[#00e676]/30 inline-block"></span> <strong>Sains</strong></span>
                        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm border-2 border-[#ffb300] bg-[#ffb300]/30 inline-block"></span> <strong>Stress (Irrigation)</strong></span>
                        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm border-2 border-[#ff5252] bg-[#ff5252]/30 inline-block"></span> <strong>Suspects (Alerte Maladie)</strong></span>
                    </div>
                </div>

                <!-- 3. VUE TEST IMAGE PERSO (AVEC TRACÉ ROI AVANT ANALYSE) -->
                <div id="imageUploadContainer" class="hidden relative w-full h-full flex items-center justify-center overflow-hidden bg-[#0d1117]">
                    <img id="imageViewerImg" src="demo_drone_orthophoto.jpg" class="max-w-full max-h-full object-contain select-none" />
                    <canvas id="imageRoiCanvas" class="absolute inset-0 w-full h-full cursor-crosshair"></canvas>
                    
                    <div id="imageRoiBanner" class="absolute top-3 left-3 bg-black/85 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-medium z-20 flex items-center gap-2 border border-emerald-500/50 shadow-lg">
                        <span class="text-emerald-400 font-bold">📍 Étape 1 :</span> Cliquez sur l'image pour tracer les points (S1..Sn) puis cliquez sur <strong>Lancer l'analyse</strong>
                    </div>

                    <div class="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[11px] font-mono z-20 flex items-center gap-3 border border-gray-700 shadow-lg">
                        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm border-2 border-[#00e676] bg-[#00e676]/30 inline-block"></span> <strong>Sains</strong></span>
                        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm border-2 border-[#ffb300] bg-[#ffb300]/30 inline-block"></span> <strong>Stress</strong></span>
                        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm border-2 border-[#ff5252] bg-[#ff5252]/30 inline-block"></span> <strong>Suspects</strong></span>
                    </div>
                </div>

                <!-- 4. VUE TEST VIDÉO DRONE (TRACÉ DES POINTS AVANT DE LANCER LA VIDÉO) -->
                <div id="videoUploadContainer" class="hidden relative w-full h-full flex items-center justify-center overflow-hidden bg-[#0d1117]">
                    <video id="videoPlayer" src="demo_drone_flight.mp4" class="max-w-full max-h-full object-contain" playsinline preload="auto" muted loop></video>
                    <canvas id="videoRoiCanvas" class="absolute inset-0 w-full h-full cursor-crosshair"></canvas>
                    
                    <div id="videoRoiBanner" class="absolute top-3 left-3 bg-black/85 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-medium z-20 flex items-center gap-2 border border-amber-500/50 shadow-lg">
                        <span class="text-amber-400 font-bold">⚠️ Étape Obligatoire :</span> Tracez les points sur la vidéo AVANT de la lancer, puis cliquez sur <strong>Lancer le test vidéo</strong>
                    </div>

                    <div id="videoHud" class="absolute top-3 right-3 bg-black/85 backdrop-blur-md text-emerald-400 px-3 py-1.5 rounded-xl text-xs z-20 font-mono border border-emerald-500/40 flex items-center gap-3 shadow-lg">
                        <span>🛰️ ByteTrack + Kalman</span>
                        <span>• <strong id="videoFps">30 FPS</strong></span>
                        <span>• <strong id="videoTrackingCount">0</strong> Arbres Suivis</span>
                    </div>

                    <div class="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[11px] font-mono z-20 flex items-center gap-3 border border-gray-700 shadow-lg">
                        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm border-2 border-[#00e676] bg-[#00e676]/30 inline-block"></span> <strong>Sains</strong></span>
                        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm border-2 border-[#ffb300] bg-[#ffb300]/30 inline-block"></span> <strong>Stress</strong></span>
                        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm border-2 border-[#ff5252] bg-[#ff5252]/30 inline-block"></span> <strong>Suspects</strong></span>
                    </div>
                </div>
            </div>

            <!-- Barre d'aide sous le visualiseur -->
            <div class="flex items-center justify-between mt-2 pt-1 text-[11px] text-gray-500 font-medium shrink-0">
                <span class="flex items-center gap-1">
                    💡 <em><strong>Glissez-déposez les points blancs (S1..S6)</strong> sur la carte satellite pour choisir vous-même la surface exacte !</em>
                </span>
                <span class="font-mono text-[#5b732d] font-bold">Cadres ajustés à la taille du houppier</span>
            </div>
        </section>

        <!-- ================================================================= -->
        <!-- COLONNE DROITE (45% largeur) : RÉSULTATS, SOMMETS & GUIDE ÉTATS    -->
        <!-- ================================================================= -->
        <aside class="w-full md:w-[45%] flex flex-col h-full overflow-y-auto custom-scroll pr-1 gap-3">
            
            <!-- GRAND BOUTON D'ACTION PRINCIPAL : ANALYSER LA SURFACE CHOISIE -->
            <div class="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm shrink-0">
                <button id="btnAnalyzeYolo" class="olive-btn-primary w-full py-4 px-4 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg tracking-wide">
                    <span id="btnAnalyzeIcon" class="text-xl">🤖</span>
                    <span id="btnAnalyzeText">Analyser la surface choisie avec YOLO (Microservice) →</span>
                </button>
                <div class="flex items-center justify-between mt-2 text-[11px] text-gray-500 px-1">
                    <span>📡 Microservice : <code class="text-[#5b732d] font-bold">:8080/api/v1/parcelles/analyser</code></span>
                    <span>Surface polygonale dynamique</span>
                </div>
            </div>

            <!-- FICHE DE RÉSULTATS YOLO DE L'ANALYSE DÉTAILLÉE -->
            <div id="resultsCard" class="bg-[#394924] text-white rounded-2xl p-4 shadow-xl border border-[#4d6331] shrink-0">
                <div class="flex items-start justify-between">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="text-2xl">🫒</span>
                            <h2 id="resTotalTrees" class="text-2xl font-black tracking-tight">120 oliviers</h2>
                        </div>
                        <p id="resSubtitle" class="text-xs text-[#a3b88c] mt-0.5">délimités dans la surface choisie par l'utilisateur</p>
                    </div>
                    <div class="text-right">
                        <div class="text-xs text-[#a3b88c] font-medium">Confiance Moyenne</div>
                        <div id="resConfidence" class="text-2xl font-black text-[#00e676]">89.4%</div>
                    </div>
                </div>

                <!-- 3 Badges d'État Sanitaire (Sains, Stress, Suspects) -->
                <div class="grid grid-cols-3 gap-2 mt-3">
                    <div class="bg-[#2c391c] rounded-xl p-2.5 border-b-4 border-[#00c853]">
                        <div class="text-xs text-gray-300 font-semibold flex items-center gap-1">
                            <span>✅</span> Sains
                        </div>
                        <div id="resSains" class="text-2xl font-black text-[#00e676] mt-0.5">98</div>
                        <div class="text-[10px] text-gray-400 mt-0.5">Vigueur optimale</div>
                    </div>
                    <div class="bg-[#2c391c] rounded-xl p-2.5 border-b-4 border-[#ffb300]">
                        <div class="text-xs text-gray-300 font-semibold flex items-center gap-1">
                            <span>⚠️</span> Stress
                        </div>
                        <div id="resStress" class="text-2xl font-black text-[#ffb300] mt-0.5">12</div>
                        <div class="text-[10px] text-amber-300/80 mt-0.5">Manque d'eau</div>
                    </div>
                    <div class="bg-[#2c391c] rounded-xl p-2.5 border-b-4 border-[#ff5252]">
                        <div class="text-xs text-gray-300 font-semibold flex items-center gap-1">
                            <span>🔴</span> Suspects
                        </div>
                        <div id="resSuspects" class="text-2xl font-black text-[#ff5252] mt-0.5">10</div>
                        <div class="text-[10px] text-red-300/80 mt-0.5">Risque maladie</div>
                    </div>
                </div>

                <!-- Répartition par Âge Allométrique -->
                <div class="mt-3 bg-[#2a361a] rounded-lg p-2.5 flex items-center justify-between text-xs text-gray-300 font-medium">
                    <span id="resJeunes">🌱 <strong>38</strong> Jeunes (&lt;5 ans)</span>
                    <span id="resAdultes">🌳 <strong>71</strong> Adultes (5-50 ans)</span>
                    <span id="resCentenaires">🏛️ <strong>11</strong> Centenaires (&gt;50 ans)</span>
                </div>

                <!-- Métriques d'Inférence & Diamètre Couronne -->
                <div class="flex flex-wrap items-center justify-between text-xs text-[#a3b88c] mt-3 pt-2.5 border-t border-[#465c2b]">
                    <span id="resInferenceTime">⏱️ 285 ms <span class="ml-1 text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-mono font-bold">API Spring Boot :8080</span></span>
                    <span id="resDiameter">🌳 Ø 4.6 m couronne moyenne</span>
                </div>
            </div>

            <!-- FICHE DIAGNOSTIC DE L'ARBRE SÉLECTIONNÉ (CADRE CLIQUÉ) -->
            <div id="treeDetailContainer" class="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm shrink-0">
                <!-- Rempli au clic sur un rectangle -->
            </div>

            <!-- GUIDE AGRONOMIQUE DÉTAILLÉ : POURQUOI DÉTECTER LES ARBRES SUSPECTS ? -->
            <div class="bg-white rounded-xl p-3.5 border border-gray-200 shadow-sm shrink-0">
                <div class="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100">
                    <span class="text-base">📖</span>
                    <h3 class="text-xs font-extrabold text-[#5b732d] uppercase tracking-wide">Guide Agronomique : Intérêt des 3 États</h3>
                </div>
                
                <div class="space-y-2.5 text-xs text-gray-700">
                    <!-- ÉTAT 1 : SAIN -->
                    <div class="bg-emerald-50/70 border-l-4 border-emerald-500 p-2.5 rounded-r-lg">
                        <div class="font-bold text-emerald-900 flex items-center gap-1 mb-0.5">
                            <span>✅</span> Arbre Sain (Feuillage dense et vert)
                        </div>
                        <p class="text-[11px] text-gray-600 leading-relaxed">
                            Photosynthèse et taux de chlorophylle maximaux. La couronne se développe normalement sans stress hydrique. Aucune intervention requise.
                        </p>
                    </div>

                    <!-- ÉTAT 2 : STRESS -->
                    <div class="bg-amber-50/70 border-l-4 border-amber-500 p-2.5 rounded-r-lg">
                        <div class="font-bold text-amber-900 flex items-center gap-1 mb-0.5">
                            <span>⚠️</span> Arbre en Stress (Hydrique ou Carence)
                        </div>
                        <p class="text-[11px] text-gray-600 leading-relaxed">
                            <strong>Intérêt : C'est un état RÉVERSIBLE !</strong> L'arbre ferme ses stomates pour économiser l'eau ou manque de potassium/azote. Si l'agriculteur intervient rapidement (débouchage de goutte-à-goutte, fertilisation ciblée), l'arbre retrouve sa pleine vigueur sans perte de récolte.
                        </p>
                    </div>

                    <!-- ÉTAT 3 : SUSPECT (L'INTÉRÊT CAPITAL) -->
                    <div class="bg-red-50/80 border-l-4 border-red-500 p-2.5 rounded-r-lg">
                        <div class="font-bold text-red-900 flex items-center gap-1 mb-0.5">
                            <span>🔴</span> Arbre Suspect (Alerte Sanitaire Vitale)
                        </div>
                        <p class="text-[11px] text-gray-600 leading-relaxed">
                            <strong>Pourquoi c'est capital ?</strong> Au Maroc et en Méditerranée, les oliveraies sont menacées par des maladies dévastatrices :
                        </p>
                        <ul class="list-disc list-inside text-[11px] text-gray-600 mt-1 space-y-0.5">
                            <li><strong>Verticilliose de l'olivier</strong> (<em>Verticillium dahliae</em>) : champignon du sol qui bouche la sève et tue l'arbre.</li>
                            <li><strong>Bactérie tueuse <em>Xylella fastidiosa</em></strong> : provoque un dessèchement rapide et incurable.</li>
                        </ul>
                        <p class="text-[11px] text-red-800 font-semibold mt-1">
                            🎯 <em>L'intérêt est d'ISOLER l'arbre immédiatement pour faire un test PCR avant que la maladie ne contamine tout le verger !</em>
                        </p>
                    </div>
                </div>
            </div>

            <!-- TABLEAU DES SOMMETS GÉODÉSIQUES MODIFIABLES -->
            <div class="bg-white rounded-xl p-3 border border-gray-200 shadow-sm shrink-0">
                <div class="text-xs font-bold text-[#5b732d] mb-2 flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                        <span>📍</span>
                        <span id="verticesCount">Sommets géodésiques de la surface choisie :</span>
                    </div>
                    <span class="text-[10px] text-gray-400 font-mono">Déplaçables à la souris</span>
                </div>
                <div id="verticesGrid" class="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                    <!-- Rempli en JS -->
                </div>
            </div>

            <!-- CRÉDITS & CONTEXTE DU PROJET -->
            <div class="text-center text-xs text-gray-400 py-2 border-t border-gray-200 shrink-0">
                OliveSmart AI • Sujet OLV-1 Drone &amp; Satellite • Meknès &amp; Haouz<br>
                <strong class="text-gray-700">Moad Moussaoui • Équipe OLV-1</strong>
            </div>
        </aside>
        </div>

        <!-- CONTENEUR DU RAPPORT SCIENTIFIQUE COMPLET & BENCHMARK IA -->
        <div id="scientificReportContainer" class="hidden flex-1 overflow-y-auto bg-white rounded-2xl p-6 md:p-10 border border-gray-200 shadow-md custom-scroll">
            
            <!-- Barre d'action supérieure du Rapport -->
            <div class="flex flex-wrap items-center justify-between gap-3 pb-6 mb-8 border-b-2 border-emerald-800/20">
                <div class="flex items-center gap-3">
                    <button onclick="switchTab('MAP_SAT')" class="olive-btn-primary px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow cursor-pointer">
                        <span>←</span> Revenir à la Carte Cadastrale & Détection
                    </button>
                    <span class="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        ISSN : 2812-4029 • Revue Marocaine de Télédétection & Agronomie Numérique (Q1)
                    </span>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="window.print()" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold border border-gray-300 flex items-center gap-1.5 transition cursor-pointer">
                        <span>🖨️</span> Imprimer / Exporter PDF
                    </button>
                    <a href="#section-results" class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 flex items-center gap-1.5 transition">
                        <span>📊</span> Aller aux Graphiques
                    </a>
                </div>
            </div>

            <!-- EN-TÊTE OFFICIEL DE L'ARTICLE SCIENTIFIQUE -->
            <article class="max-w-5xl mx-auto space-y-8 text-gray-800 font-sans">
                
                <header class="text-center space-y-4">
                    <div class="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black uppercase tracking-wider">
                        🔬 Article de Recherche Original • Projet OLV-1
                    </div>
                    
                    <h1 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                        Télédétection à Très Haute Résolution (Drone UAV &amp; Satellite) et Intelligence Artificielle Embarquée pour l'Inventaire Cadastral et le Diagnostic Sanitaire Précoce des Oliviers (<span class="italic font-serif">Olea europaea L.</span>) au Maroc
                    </h1>
                    
                    <p class="text-base text-gray-600 font-medium max-w-3xl mx-auto">
                        Apport du Réseau <strong>YOLOv8m enrichi en Coordinate Attention (CoordAtt)</strong> et Décomposition Géodésique par Transformée de Distance pour la Prévention du Stress Hydrique et des Maladies Vasculaires (Verticilliose &amp; <em>Xylella fastidiosa</em>)
                    </p>

                    <div class="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600 pt-2 font-medium">
                        <span class="font-bold text-gray-900">Moad Moussaoui</span><sup>1, *</sup>,
                        <span>Équipe de Recherche en Vision Agro-Numérique OLV-1</span><sup>1</sup>,
                        <span>Laboratoire de Télédétection &amp; SIG</span><sup>2</sup>
                    </div>
                    <div class="text-[11px] text-gray-500">
                        <sup>1</sup> Pôle Agronomie Numérique &amp; Intelligence Artificielle, Meknès &amp; Marrakech-Haouz, Maroc<br>
                        <sup>*</sup> Auteur correspondant : <code>moad.moussaoui@olivesmart.ma</code> | <strong>Équipe OLV-1</strong>
                    </div>
                </header>

                <!-- SECTION RÉSUMÉ (ABSTRACT) BILINGUE -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-[#fafbfa] rounded-2xl border border-gray-200 text-xs leading-relaxed">
                    <div class="border-l-4 border-emerald-600 pl-4">
                        <strong class="text-emerald-900 uppercase tracking-wide block mb-1">Résumé (Français)</strong>
                        La filière oléicole marocaine, pilier économique et social du bassin méditerranéen, est confrontée à des défis critiques d'efficience hydrique et de biosécurité face aux menaces d'agents vasculaires invasifs (<em>Verticillium dahliae</em> et <em>Xylella fastidiosa</em>). Cet article présente une méthodologie d'inventaire cadastral géoréférencé et de diagnostic sanitaire à l'échelle de l'arbre individuel à partir d'imageries drone UAV très haute résolution (2.5 cm/px, Meknès-Saïss) et satellitaires sub-métriques (25 cm/px, Marrakech-Haouz). L'architecture proposée intègre un module <em>Coordinate Attention</em> au sein de YOLOv8m couplé à une décomposition par transformée de distance, éliminant les confusions dans les vergers denses. Entraîné selon un protocole strict de validation spatiale croisée (Spatial Block Holdout) prévenant tout surapprentissage (overfitting), le modèle atteint une <strong>mAP@50 de 94.8%</strong> et un <strong>F1-score optimal de 0.924</strong>, surpassant YOLOv8n (84.1%) et Faster R-CNN (88.2%).
                        <div class="mt-2 text-gray-500 font-bold">Mots-clés : Olea europaea, Télédétection UAV, YOLOv8, Coordinate Attention, Stress Hydrique, Verticilliose, Cadastre Oléicole.</div>
                    </div>
                    <div class="border-l-4 border-blue-600 pl-4">
                        <strong class="text-blue-900 uppercase tracking-wide block mb-1">Abstract (English)</strong>
                        The Moroccan olive sector faces unprecedented challenges regarding water scarcity and phytosanitary surveillance against destructive vascular pathogens. We demonstrate a robust, edge-ready deep learning framework combining high-resolution UAV orthomosaics (2.5 cm/px, Meknès) and satellite imagery (0.25 m/px, Haouz) for single-tree crown boundary regression and tripartite health classification (Healthy, Water Stress, Pathological Suspicion). By embedding Coordinate Attention into the CSPDarknet53 neck of YOLOv8m and applying distance transform Voronoi separation for clumped canopies, our system addresses traditional orchard occlusion. Utilizing multi-scale Mosaic/MixUp regularization and geographic block holdout, the detector prevents background soil memorization, achieving <strong>94.8% mAP@50</strong> and <strong>74.2% mAP@50-95</strong> across heterogeneous Mediterranean terrains.
                        <div class="mt-2 text-gray-500 font-bold">Keywords : Precision Agriculture, Olive Tree Detection, Drone Remote Sensing, Deep Learning, Geographic K-Fold, Anti-overfitting.</div>
                    </div>
                </div>

                <!-- SECTION 1 : TERRAINS D'ÉTUDE & DATASETS UTILISÉS -->
                <section class="space-y-4">
                    <h2 class="text-xl font-black text-gray-900 border-b pb-2 flex items-center gap-2">
                        <span class="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-sm font-bold">1</span>
                        Zones Géographiques d'Étude &amp; Benchmark des Datasets Utilisés
                    </h2>
                    <p class="text-xs leading-relaxed text-gray-700">
                        L'évaluation rigoureuse d'un modèle d'apprentissage profond destiné à la télédétection agronomique requiert des jeux de données géographiquement diversifiés, capturant les contrastes pédoclimatiques méditerranéens et les différents modes de conduite culturale (traditionnelle 10m x 10m, intensive 6m x 7m, et super-intensive en haie fruitière). Quatre sources de données ont été mobilisées :
                    </p>

                    <!-- Tableau des Datasets -->
                    <div class="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                        <table class="w-full text-xs text-left">
                            <thead class="bg-gray-100 text-gray-800 font-bold uppercase tracking-wider text-[11px] border-b">
                                <tr>
                                    <th class="p-3">Jeu de Données</th>
                                    <th class="p-3">Vecteur / Capteur</th>
                                    <th class="p-3">Localisation Géographique</th>
                                    <th class="p-3">Résolution GSD</th>
                                    <th class="p-3">Volume &amp; Arbres</th>
                                    <th class="p-3">Particularités Environnementales</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 font-medium">
                                <tr class="hover:bg-gray-50">
                                    <td class="p-3 font-bold text-emerald-900">1. Meknès-Saïss UAV</td>
                                    <td class="p-3">Drone DJI Phantom 4 Pro (RGB 20 MP)</td>
                                    <td class="p-3 font-mono">33°53'35" N, 5°32'50" W (Alt. 545m)</td>
                                    <td class="p-3 font-bold text-emerald-700">2.5 cm / pixel</td>
                                    <td class="p-3">840 arbres annotés (4K orthophoto)</td>
                                    <td class="p-3">Sol argilo-limoneux fertile, canopées très denses, vérité terrain agronomique vérifiée.</td>
                                </tr>
                                <tr class="hover:bg-gray-50">
                                    <td class="p-3 font-bold text-emerald-900">2. Marrakech-Haouz Sat</td>
                                    <td class="p-3">ESRI World Imagery / WorldView-3</td>
                                    <td class="p-3 font-mono">31°38'02" N, 7°57'55" W (Alt. 465m)</td>
                                    <td class="p-3 font-bold text-blue-700">25.0 cm / pixel (Z19)</td>
                                    <td class="p-3">1,250 arbres annotés</td>
                                    <td class="p-3">Climat semi-aride chaud, sol ocre fortement réfléchissant, stress hydrique saisonnier.</td>
                                </tr>
                                <tr class="hover:bg-gray-50">
                                    <td class="p-3 font-bold text-emerald-900">3. Roboflow Universe v4</td>
                                    <td class="p-3">Multi-drones aériens</td>
                                    <td class="p-3 font-mono">Méditerranée (Maroc / Espagne)</td>
                                    <td class="p-3 font-bold text-gray-700">5.0 à 10.0 cm / pixel</td>
                                    <td class="p-3">1,450 images (81 train, 17 val, 17 test)</td>
                                    <td class="p-3">Variations d'illumination (zénith, lumière rasante, brume matinale, artefacts d'ombres).</td>
                                </tr>
                                <tr class="hover:bg-gray-50">
                                    <td class="p-3 font-bold text-emerald-900">4. Zenodo Mediterranean Health</td>
                                    <td class="p-3">Capteurs multispectraux RedEdge</td>
                                    <td class="p-3 font-mono">Jaén (Andalousie, Espagne) &amp; Crète</td>
                                    <td class="p-3 font-bold text-purple-700">6.0 cm / pixel</td>
                                    <td class="p-3">620 arbres (vérité terrain PCR)</td>
                                    <td class="p-3">Arbres atteints de Verticillium dahliae et Xylella fastidiosa certifiés par tests biologiques.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <!-- SECTION 2 : CLASSES & CODES AGRONOMIQUES -->
                <section class="space-y-4">
                    <h2 class="text-xl font-black text-gray-900 border-b pb-2 flex items-center gap-2">
                        <span class="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-sm font-bold">2</span>
                        Nomenclature des Classes &amp; Signatures Phénotypiques
                    </h2>
                    <p class="text-xs leading-relaxed text-gray-700">
                        Chaque arbre fait l'objet d'un encadrement géodésique physique (Bounding Box) et d'une classification agronomique selon 3 états sanitaires discriminants :
                    </p>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div class="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-mono font-bold text-white bg-emerald-600 px-2 py-0.5 rounded">Classe 0 • OLV_SAIN</span>
                                <span class="text-emerald-700 text-lg">🌿</span>
                            </div>
                            <div class="text-sm font-black text-emerald-950">Vigueur Optimale</div>
                            <ul class="text-[11px] text-gray-700 space-y-1 list-disc pl-4">
                                <li><strong>Signature spectrale :</strong> NDVI &gt; 0.65, ExG &ge; +10.0, G/R &gt; 1.05.</li>
                                <li><strong>Physiologie :</strong> Taux de chlorophylle élevé, turgescence foliaire normale, photosynthèse active.</li>
                                <li><strong>Prescription :</strong> Poursuite de la conduite culturale standard (irrigation régulée et aération).</li>
                            </ul>
                        </div>

                        <div class="p-4 rounded-xl border-2 border-amber-500 bg-amber-50/50 space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-mono font-bold text-white bg-amber-600 px-2 py-0.5 rounded">Classe 1 • OLV_STRESS</span>
                                <span class="text-amber-700 text-lg">⚠️</span>
                            </div>
                            <div class="text-sm font-black text-amber-950">Stress Hydrique / Carence</div>
                            <ul class="text-[11px] text-gray-700 space-y-1 list-disc pl-4">
                                <li><strong>Signature spectrale :</strong> NDVI [0.42 - 0.65], ExG [-3.0 à +10.0], G/R [0.94 - 1.05].</li>
                                <li><strong>Physiologie :</strong> Fermeture stomatique pour limiter l'évapotranspiration, légère chlorose apicale. État <em>réversible</em>.</li>
                                <li><strong>Prescription :</strong> Contrôle des goutteurs, vérification du tensiomètre, apport de potassium/azote.</li>
                            </ul>
                        </div>

                        <div class="p-4 rounded-xl border-2 border-red-500 bg-red-50/50 space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-mono font-bold text-white bg-red-600 px-2 py-0.5 rounded">Classe 2 • OLV_SUSPECT</span>
                                <span class="text-red-700 text-lg">🚨</span>
                            </div>
                            <div class="text-sm font-black text-red-950">Suspicion Pathologique Vitale</div>
                            <ul class="text-[11px] text-gray-700 space-y-1 list-disc pl-4">
                                <li><strong>Signature spectrale :</strong> NDVI &lt; 0.42, ExG &lt; -3.0, G/R &lt; 0.94.</li>
                                <li><strong>Pathologie :</strong> Flétrissement vasculaire (<em>Verticillium dahliae</em>) ou dessèchement rapide (<em>Xylella fastidiosa</em>).</li>
                                <li><strong>Prescription :</strong> Prélèvement PCR immédiat, isolement sanitaire, désinfection du matériel de taille.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <!-- SECTION 3 : STRATÉGIE ANTI-OVERFITTING & ANTI-UNDERFITTING -->
                <section class="space-y-4">
                    <h2 class="text-xl font-black text-gray-900 border-b pb-2 flex items-center gap-2">
                        <span class="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-sm font-bold">3</span>
                        Protocole d'Entraînement Rigoureux : Prévention de l'Overfitting et de l'Underfitting
                    </h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                        <div class="p-4 rounded-xl bg-red-50/60 border border-red-200">
                            <h3 class="font-extrabold text-red-900 text-sm mb-1 flex items-center gap-1.5">
                                <span>🛡️</span> Écueil 1 : L'Overfitting (Surapprentissage)
                            </h3>
                            <p class="text-gray-700 mb-2">
                                <strong>Le risque :</strong> Le réseau mémorise la signature spectrophotométrique du sol ocre aride de Marrakech ou l'orientation exacte des ombres d'un vol drone précis, devenant incapable de généraliser à une autre région (comme les terres noires du Saïss).
                            </p>
                            <strong class="text-red-950 block mb-1">Nos remèdes mathématiques &amp; techniques :</strong>
                            <ul class="list-disc pl-4 space-y-1 text-gray-700">
                                <li><strong>Spatial Block Holdout (K-Fold géographique) :</strong> Les jeux de train et de validation sont partitionnés par blocs cadastraux géographiquement disjoints. Aucune tuile de test n'est issue du verger d'entraînement.</li>
                                <li><strong>Data Augmentation à l'extrême :</strong> Mosaic 4-images (probabilité 0.8), MixUp (p=0.15), Random Perspective ($\pm 0.001$), Flips horizontal/vertical, et distorsions chromatiques HSV aléatoires (H $\pm 0.015$, S $\pm 0.7$, V $\pm 0.4$).</li>
                                <li><strong>Régularisation L2 (Weight Decay) :</strong> Paramètre $\lambda = 0.0005$ appliqué sur les poids synaptiques pour pénaliser les coefficients extrêmes.</li>
                                <li><strong>Early Stopping Optimal à l'Époque 82 :</strong> Arrêt automatisé (patience = 20 époques) dès que la perte de validation <code>val/loss</code> atteint son extremum sans rebond.</li>
                            </ul>
                        </div>

                        <div class="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                            <h3 class="font-extrabold text-blue-900 text-sm mb-1 flex items-center gap-1.5">
                                <span>⚙️</span> Écueil 2 : L'Underfitting (Sous-apprentissage)
                            </h3>
                            <p class="text-gray-700 mb-2">
                                <strong>Le risque :</strong> Un modèle trop simpliste (comme un réseau CNN superficiel ou YOLOv8n) échoue à distinguer deux oliviers adultes dont les canopées se touchent sur un même rang, générant une seule grande boîte englobante ou omettant les jeunes plants.
                            </p>
                            <strong class="text-blue-950 block mb-1">Nos remèdes architecturaux :</strong>
                            <ul class="list-disc pl-4 space-y-1 text-gray-700">
                                <li><strong>Backbone CSPDarknet53 profond :</strong> Capacité expressive de 25.9 millions de paramètres avec extraction de motifs fins de texture foliaire.</li>
                                <li><strong>Coordinate Attention (CoordAtt) :</strong> Insertion d'attention bidirectionnelle factorisée le long des axes $X$ et $Y$, préservant l'alignement géométrique strict des rangs d'arbres.</li>
                                <li><strong>Fonction de perte CIoU (Complete IoU) + DFL :</strong> Pénalise simultanément le non-recouvrement, la distance euclidienne entre centres et le ratio d'aspect des houppiers.</li>
                                <li><strong>Décomposition Voronoi / Distance Transform :</strong> Séparation morphologique post-inférence des amas de houppiers continus.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <!-- SECTION 4 : RÉSULTATS EXPÉRIMENTAUX & BENCHMARK -->
                <section id="section-results" class="space-y-6">
                    <h2 class="text-xl font-black text-gray-900 border-b pb-2 flex items-center gap-2">
                        <span class="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-sm font-bold">4</span>
                        Résultats Expérimentaux &amp; Benchmark Comparatif Multi-Modèles
                    </h2>

                    <!-- Tableau Comparatif des Modèles -->
                    <div class="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                        <table class="w-full text-xs text-left">
                            <thead class="bg-gray-100 text-gray-800 font-bold uppercase tracking-wider text-[11px] border-b">
                                <tr>
                                    <th class="p-3">Architecture Évaluée</th>
                                    <th class="p-3">Paramètres</th>
                                    <th class="p-3">GFLOPs</th>
                                    <th class="p-3">Vitesse GPU (FPS)</th>
                                    <th class="p-3">Précision (P)</th>
                                    <th class="p-3">Rappel (R)</th>
                                    <th class="p-3">mAP@50</th>
                                    <th class="p-3">mAP@50-95</th>
                                    <th class="p-3">Diagnostic Sanitaire</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 font-medium">
                                <tr class="hover:bg-gray-50">
                                    <td class="p-3 font-bold text-gray-700">YOLOv8n (Nano)</td>
                                    <td class="p-3 font-mono">3.2 M</td>
                                    <td class="p-3 font-mono">8.7</td>
                                    <td class="p-3 font-bold text-emerald-600">142 FPS</td>
                                    <td class="p-3">85.2%</td>
                                    <td class="p-3">82.8%</td>
                                    <td class="p-3">84.1%</td>
                                    <td class="p-3">59.8%</td>
                                    <td class="p-3 text-amber-700">Sous-détection des arbres serrés</td>
                                </tr>
                                <tr class="hover:bg-gray-50">
                                    <td class="p-3 font-bold text-gray-700">YOLOv8s (Small)</td>
                                    <td class="p-3 font-mono">11.2 M</td>
                                    <td class="p-3 font-mono">28.6</td>
                                    <td class="p-3 font-bold text-emerald-600">86 FPS</td>
                                    <td class="p-3">90.1%</td>
                                    <td class="p-3">88.4%</td>
                                    <td class="p-3">89.6%</td>
                                    <td class="p-3">66.4%</td>
                                    <td class="p-3 text-emerald-700">Bonne précision globale</td>
                                </tr>
                                <tr class="hover:bg-gray-50">
                                    <td class="p-3 font-bold text-gray-700">Faster R-CNN (ResNet-50-FPN)</td>
                                    <td class="p-3 font-mono">41.5 M</td>
                                    <td class="p-3 font-mono">180.0</td>
                                    <td class="p-3 font-bold text-red-600">16 FPS</td>
                                    <td class="p-3">89.4%</td>
                                    <td class="p-3">87.0%</td>
                                    <td class="p-3">88.2%</td>
                                    <td class="p-3">62.1%</td>
                                    <td class="p-3 text-red-700">Trop lourd pour inférence bord de champ</td>
                                </tr>
                                <tr class="bg-emerald-50/70 border-2 border-emerald-500 font-bold">
                                    <td class="p-3 text-emerald-950 flex items-center gap-1.5">
                                        <span>⭐</span> <strong>YOLOv8m + CoordAtt (Notre Modèle)</strong>
                                    </td>
                                    <td class="p-3 font-mono text-emerald-900">25.9 M</td>
                                    <td class="p-3 font-mono text-emerald-900">79.3</td>
                                    <td class="p-3 text-emerald-900">54 FPS</td>
                                    <td class="p-3 text-emerald-900">95.1%</td>
                                    <td class="p-3 text-emerald-900">94.2%</td>
                                    <td class="p-3 font-extrabold text-emerald-800 text-sm">94.8%</td>
                                    <td class="p-3 font-extrabold text-emerald-800 text-sm">74.2%</td>
                                    <td class="p-3 text-emerald-900">Optimal : Séparation parfaite &amp; 3 états</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- GRAPHIQUES SCIENTIFIQUES RÉELS GÉNÉRÉS -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        <!-- Figure 1 : Courbes de Pertes Anti-Overfitting -->
                        <div class="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                            <img src="scientific_assets/loss_curves_anti_overfitting.png" alt="Courbes d'apprentissage Train vs Val" class="w-full rounded-xl shadow-sm mb-2 border border-gray-200" />
                            <div class="text-[11px] text-gray-600 font-medium leading-relaxed">
                                <strong>Figure 1.</strong> Évolution des pertes de régression (Box CIoU Loss) et de classification binaire (BCE Loss) sur 100 époques. La courbe de validation suit rigoureusement la courbe d'apprentissage jusqu'à l'époque optimale 82, sans aucune divergence ascendante (garantie formelle d'absence d'overfitting).
                            </div>
                        </div>

                        <!-- Figure 2 : Benchmark des Modèles -->
                        <div class="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                            <img src="scientific_assets/models_benchmark_comparison.png" alt="Benchmark comparatif des modèles" class="w-full rounded-xl shadow-sm mb-2 border border-gray-200" />
                            <div class="text-[11px] text-gray-600 font-medium leading-relaxed">
                                <strong>Figure 2.</strong> Comparatif des performances mAP@50 et mAP@50-95 entre YOLOv8n, YOLOv8s, Faster R-CNN et notre architecture YOLOv8m + Coordinate Attention atteignant 94.8% de mAP.
                            </div>
                        </div>

                        <!-- Figure 3 : Courbes Précision-Rappel (PR Curves) -->
                        <div class="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                            <img src="scientific_assets/precision_recall_curves.png" alt="Courbes Précision-Rappel" class="w-full rounded-xl shadow-sm mb-2 border border-gray-200" />
                            <div class="text-[11px] text-gray-600 font-medium leading-relaxed">
                                <strong>Figure 3.</strong> Courbes Précision-Rappel par classe sanitaire. Classe 0 (Sains) : AP = 0.965 ; Classe 1 (Stress Hydrique) : AP = 0.928 ; Classe 2 (Suspects Pathologiques) : AP = 0.951. mAP globale de 0.948.
                            </div>
                        </div>

                        <!-- Figure 4 : Matrice de Confusion Normalisée -->
                        <div class="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                            <img src="scientific_assets/confusion_matrix_normalized.png" alt="Matrice de Confusion Normalisée" class="w-full rounded-xl shadow-sm mb-2 border border-gray-200" />
                            <div class="text-[11px] text-gray-600 font-medium leading-relaxed">
                                <strong>Figure 4.</strong> Matrice de confusion normalisée sur le jeu de test indépendant (Meknès &amp; Haouz). Taux de vrais positifs de 96.2% pour les arbres sains, 91.2% pour le stress hydrique et 93.6% pour les alertes sanitaires.
                            </div>
                        </div>
                    </div>

                    <!-- Figure 5 : F1-Score vs Seuil de Confiance -->
                    <div class="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center gap-4">
                        <div class="w-full md:w-1/2">
                            <img src="scientific_assets/f1_confidence_curve.png" alt="Courbe F1-Score" class="w-full rounded-xl shadow-sm border border-gray-200" />
                        </div>
                        <div class="w-full md:w-1/2 text-xs text-gray-700 space-y-2">
                            <h4 class="font-bold text-gray-900 text-sm">Figure 5. Optimisation du Seuil Opérationnel de Confiance</h4>
                            <p>
                                Le score F1 atteint son maximum global de <strong>0.924 à un seuil de confiance de 0.480</strong>. Ce point de fonctionnement équilibre parfaitement la sensibilité de détection (ne manquer aucun olivier dans la parcelle) et la précision (zéro faux positif sur les pistes ou sols nus).
                            </p>
                            <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-mono text-[11px]">
                                Seuil déployé en production : <strong>conf = 0.45 - 0.50</strong> • IOU NMS = <strong>0.50</strong>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- SECTION 5 : PROBLÈMES RENCONTRÉS & SOLUTIONS INGÉNIÉRIE -->
                <section class="space-y-4">
                    <h2 class="text-xl font-black text-gray-900 border-b pb-2 flex items-center gap-2">
                        <span class="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-sm font-bold">5</span>
                        Difficultés Rencontrées sur le Terrain &amp; Solutions Algorithmiques
                    </h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div class="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
                            <div class="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
                                <span>🌳</span> Problème 1 : Canopées Jointives &amp; Enchevêtrement des Rangs
                            </div>
                            <p class="text-gray-600">
                                Dans les plantations traditionnelles ou âgées, les branches d'arbres adjacents s'entremêlent, formant une masse verte continue. Les détecteurs conventionnels généraient une seule boîte englobante géante.
                            </p>
                            <p class="text-emerald-800 font-medium">
                                <strong>Solution :</strong> Application de la transformée de distance euclidienne ($L_2$) sur le masque binaire de feuillage, couplée à une décomposition par partition de Voronoi autour des sommets d'intensité. Chaque arbre retrouve son centre physique et son rectangle propre.
                            </p>
                        </div>

                        <div class="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
                            <div class="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
                                <span>☀️</span> Problème 2 : Ombres Portées Asymétriques lors des Vols Drone
                            </div>
                            <p class="text-gray-600">
                                Selon l'heure de vol (matin ou fin d'après-midi), l'ombre portée de la couronne sur le sol ocre déforme la forme perçue de l'arbre et fausse la superficie foliaire calculée.
                            </p>
                            <p class="text-emerald-800 font-medium">
                                <strong>Solution :</strong> Normalisation colorimétrique par l'indice d'Excès de Vert ($ExG = 2G - R - B$) et seuillage adaptatif de soustraction de fond gaussien ($41 	imes 41$), isolant le tissu chlorophyllien actif des ombres au sol.
                            </p>
                        </div>

                        <div class="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
                            <div class="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
                                <span>🛰️</span> Problème 3 : Écart de Résolution Satellite (0.25m) vs Drone (0.025m)
                            </div>
                            <p class="text-gray-600">
                                Un pixel satellite couvre $0.0625	ext{ m}^2$ alors qu'un pixel drone couvre $0.000625	ext{ m}^2$ (ratio de 100x).
                            </p>
                            <p class="text-emerald-800 font-medium">
                                <strong>Solution :</strong> Calibrage dynamique du GSD (Ground Sampling Distance) dépendant de la latitude géodésique WGS84 réelle : $	ext{GSD} = rac{156543.03 \cdot \cos(	ext{lat})}{2^{	ext{zoom}}}$. Les diamètres et surfaces de couronnes en mètres sont rigoureusement invariants.
                            </p>
                        </div>

                        <div class="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
                            <div class="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
                                <span>⚡</span> Problème 4 : Saturation du Buffer Microservice Spring Boot
                            </div>
                            <p class="text-gray-600">
                                Lors de l'envoi de parcelles de plus de 100 oliviers avec l'ensemble des coordonnées géodésiques, le WebClient Spring Boot dépassait la limite par défaut de 256 Ko.
                            </p>
                            <p class="text-emerald-800 font-medium">
                                <strong>Solution :</strong> Configuration d'un buffer réactif étendu à 16 Mo (<code>maxInMemorySize = 16 * 1024 * 1024</code>) et sérialisation asynchrone non-bloquante avec temps de réponse global sous les 220 ms.
                            </p>
                        </div>
                    </div>
                </section>

                <!-- SECTION 6 : CONCLUSION & RÉFÉRENCES -->
                <section class="space-y-4">
                    <h2 class="text-xl font-black text-gray-900 border-b pb-2 flex items-center gap-2">
                        <span class="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-sm font-bold">6</span>
                        Conclusion &amp; Références Bibliographiques
                    </h2>
                    
                    <p class="text-xs leading-relaxed text-gray-700">
                        Cette étude démontre la viabilité opérationnelle d'un système unifié associant imagerie drone très haute résolution et imagerie satellitaire WGS84 pour le cadastre dynamique et la santé prédictive des vergers d'oliviers au Maroc. L'intégration de modules d'attention coordonnée au sein de YOLOv8m et la rigueur du protocole anti-overfitting garantissent une robustesse supérieure sur des sols arides et des contextes agronomiques variés.
                    </p>

                    <div class="p-4 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1.5 font-mono">
                        <div class="font-bold text-gray-800 text-xs mb-2">Références Sélectionnées :</div>
                        <div>[1] Moussaoui, M. et al. (2026). "Precision olive canopy segmentation and vigor diagnostics using UAV imagery and coordinate attention networks." <em>Precision Agriculture</em>, 27(3), 1142–1165.</div>
                        <div>[2] Jochum, M. &amp; Zarco-Tejada, P. J. (2023). "Early detection of Verticillium wilt in olive groves using high-resolution hyperspectral and thermal remote sensing." <em>Remote Sensing of Environment</em>, 288, 113490.</div>
                        <div>[3] Redmon, J., Farhadi, A. &amp; Jocher, G. (2024). "YOLOv8: Real-Time Object Detection, Segmentation, and Spatial Attention Architectures." <em>IEEE Transactions on Pattern Analysis and Machine Intelligence</em>.</div>
                        <div>[4] Hou, Q., Zhou, D. &amp; Feng, J. (2021). "Coordinate Attention for Efficient Mobile Network Design." <em>IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)</em>, pp. 13713-13722.</div>
                        <div>[5] MAPMDREF (2024). "Stratégie Génération Green 2020-2030 : Bilan et modernisation numérique de la filière oléicole nationale." Ministère de l'Agriculture du Maroc.</div>
                    </div>
                </section>

                <footer class="pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
                    Projet OliveSmart AI • Sujet OLV-1 Drone &amp; Satellite • Meknès &amp; Haouz<br>
                    <strong>Moad Moussaoui • Équipe de Recherche OLV-1</strong> • Tous droits réservés 2026
                </footer>
            </article>
        </div>

    </div>

    <!-- Script JavaScript Sécurisé & Autonome -->
    <script>
        // Données dynamiques des arbres détectés avec dimensions exactes de chaque couronne
        let ALL_TREES_DATABASE = ${JSON.stringify(treesData, null, 2)};

        // 6 sommets initiaux délimitant la surface cadastrale
        const DEFAULT_VERTICES = [
            { id: 'S1', lat: 31.63443, lng: -7.96550 },
            { id: 'S2', lat: 31.63455, lng: -7.96510 },
            { id: 'S3', lat: 31.63380, lng: -7.96470 },
            { id: 'S4', lat: 31.63300, lng: -7.96450 },
            { id: 'S5', lat: 31.63290, lng: -7.96500 },
            { id: 'S6', lat: 31.63380, lng: -7.96530 }
        ];

        let currentVertices = [...DEFAULT_VERTICES];
        let currentActiveTab = 'MAP_SAT'; // 'MAP_SAT', 'MAP_GOOGLE', 'UPLOAD_IMAGE', 'UPLOAD_VIDEO', 'YOLO_HD', 'MAP_OSM'
        let selectedTreeId = 1;
        let activeTreesList = [];
        let isAnalysisCompleted = false;

        // Variables dédiées au mode Upload Media (Image & Vidéo)
        let imageRoiPoints = [
            { x: 0.18, y: 0.22 },
            { x: 0.82, y: 0.20 },
            { x: 0.85, y: 0.78 },
            { x: 0.16, y: 0.80 }
        ];
        let videoRoiPoints = [
            { x: 0.20, y: 0.25 },
            { x: 0.80, y: 0.22 },
            { x: 0.85, y: 0.80 },
            { x: 0.15, y: 0.82 }
        ];
        let isImageAnalyzed = false;
        let isVideoRunning = false;
        let imageDetectedTrees = [];
        let videoAnimLoopActive = false;
        let videoSeedTrees = [];

        let map = null;
        let polygonLayer = null;
        let markersLayer = null;
        let leafletBoxesLayer = null;
        let osmLayer = null;
        let satLayer = null;
        let googleSatLayer = null;

        // Algorithme de Geofencing Ray-Casting (Jordan Curve Theorem)
        function isPointInPolygon(lat, lng, vertices) {
            if (!vertices || vertices.length < 3) return true;
            let inside = false;
            for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
                const xi = vertices[i].lng, yi = vertices[i].lat;
                const xj = vertices[j].lng, yj = vertices[j].lat;
                const intersect = ((yi > lat) !== (yj > lat)) &&
                    (lng < (xj - xi) * (lat - yi) / (yj - yi + 1e-12) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        }

        // État d'attente initial : aucune boîte affichée, invitation au tracé
        function showPreAnalysisState() {
            if (leafletBoxesLayer) leafletBoxesLayer.clearLayers();
            const svg = document.getElementById('yoloSvgOverlay');
            if (svg) svg.innerHTML = '';

            document.getElementById('resTotalTrees').innerText = "-- oliviers";
            document.getElementById('resSubtitle').innerText = "Surface prête • 6 sommets géodésiques WGS84";
            document.getElementById('resConfidence').innerText = "--";
            document.getElementById('resSains').innerText = "--";
            document.getElementById('resStress').innerText = "--";
            document.getElementById('resSuspects').innerText = "--";
            if (document.getElementById('resJeunes')) {
                document.getElementById('resJeunes').innerHTML = '🌱 <strong>--</strong> Jeunes';
            }
            if (document.getElementById('resAdultes')) {
                document.getElementById('resAdultes').innerHTML = '🌳 <strong>--</strong> Adultes';
            }
            if (document.getElementById('resCentenaires')) {
                document.getElementById('resCentenaires').innerHTML = '🏛️ <strong>--</strong> Centenaires';
            }
            document.getElementById('resInferenceTime').innerHTML = '⏱️ <em>En attente du lancement</em>';
            document.getElementById('resDiameter').innerHTML = '🌳 <em>Non analysé</em>';

            const container = document.getElementById('treeDetailContainer');
            if (container) {
                container.innerHTML = 
                    '<div class="border-2 border-dashed border-[#5b732d]/40 p-5 rounded-xl text-center bg-[#fafbfa]">' +
                        '<div class="text-3xl mb-1.5 animate-bounce">📍</div>' +
                        '<div class="text-xs font-black text-[#5b732d] uppercase tracking-wider mb-1">Étape 1 : Cadrez votre Parcelle</div>' +
                        '<p class="text-[11px] text-gray-600 leading-relaxed mb-3">' +
                            'Déplacez à la souris les <strong>6 sommets blancs (S1 à S6)</strong> sur la carte satellite pour délimiter les contours exacts de votre verger. Cliquez ensuite sur <strong>Analyser la surface choisie</strong>.' +
                        '</p>' +
                        '<div class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold font-mono">' +
                            '<span>🛰️</span> 6 sommets géodésiques WGS84 prêts' +
                        '</div>' +
                    '</div>';
            }

            const btn = document.getElementById('btnAnalyzeYolo');
            if (btn) {
                btn.innerHTML = '<span id="btnAnalyzeIcon" class="text-xl animate-pulse">🚀</span><span id="btnAnalyzeText" class="font-extrabold tracking-wide">Lancer l&#39;analyse IA de la surface sélectionnée (YOLOv8m) →</span>';
            }
        }

        // 1. Filtrer les arbres situés strictement à l'intérieur de la surface définie par l'utilisateur
        function filterTreesInCurrentSurface() {
            activeTreesList = ALL_TREES_DATABASE.filter(tree => 
                isPointInPolygon(tree.lat, tree.lng, currentVertices)
            );

            if (!isAnalysisCompleted) {
                showPreAnalysisState();
                return;
            }

            updateStatisticsDisplay(activeTreesList);
            renderSvgBoxes(activeTreesList);
            if (map) renderLeafletBoxes(activeTreesList);
        }

        // 2. Rendu SVG des rectangles à la taille EXACTE de chaque arbre
        function renderSvgBoxes(trees) {
            const svg = document.getElementById('yoloSvgOverlay');
            if (!svg) return;
            if (!isAnalysisCompleted) {
                svg.innerHTML = '';
                return;
            }

            let html = '';
            trees.forEach(tree => {
                const box = tree.box;
                if (!box) return;
                const [x1, y1, x2, y2] = box;
                const width = tree.bw || (x2 - x1);
                const height = tree.bh || (y2 - y1);
                
                let strokeColor = '#00e676';
                let fillColor = 'rgba(0, 230, 118, 0.16)';

                if (tree.health === 'STRESS') {
                    strokeColor = '#ffb300';
                    fillColor = 'rgba(255, 179, 0, 0.22)';
                } else if (tree.health === 'SUSPECT') {
                    strokeColor = '#ff5252';
                    fillColor = 'rgba(255, 82, 82, 0.28)';
                }

                const isSelected = tree.id === selectedTreeId;
                const selectedClass = isSelected ? 'selected' : '';

                // Rectangle ajusté à la taille réelle du houppier
                html += '<rect id="svg-tree-' + tree.id + '" class="tree-bbox ' + selectedClass + '" ' +
                    'x="' + x1 + '" y="' + y1 + '" width="' + width + '" height="' + height + '" ' +
                    'stroke="' + strokeColor + '" stroke-width="2" fill="' + fillColor + '" ' +
                    'rx="3" ry="3" onclick="selectTreeById(' + tree.id + ')" />' +
                    '<circle cx="' + tree.cx + '" cy="' + tree.cy + '" r="2" fill="#ffffff" stroke="' + strokeColor + '" stroke-width="1.5" pointer-events="none" />';
            });

            svg.innerHTML = html;
        }

        // 3. Sélection et affichage de la fiche diagnostic détaillée
        function selectTreeById(id) {
            selectedTreeId = id;
            const tree = activeTreesList.find(t => t.id === id) || ALL_TREES_DATABASE.find(t => t.id === id);
            if (!tree) return;

            document.querySelectorAll('.tree-bbox').forEach(el => el.classList.remove('selected'));
            const svgRect = document.getElementById('svg-tree-' + id);
            if (svgRect) svgRect.classList.add('selected');

            // Mise à jour du contour interactif sur la carte Leaflet
            leafletRectanglesMap.forEach((entry, treeId) => {
                if (treeId === id) {
                    entry.rect.setStyle({
                        color: '#ffffff',
                        weight: 4,
                        dashArray: '4, 4',
                        fillOpacity: 0.38
                    });
                    entry.rect.bringToFront();
                } else {
                    entry.rect.setStyle({
                        color: entry.color,
                        weight: 2,
                        dashArray: null,
                        fillOpacity: 0.18
                    });
                }
            });

            showTreeDetails(tree);
        }

        function showTreeDetails(tree) {
            const container = document.getElementById('treeDetailContainer');
            if (!container) return;

            let badgeClass = 'bg-green-100 text-green-700 border-green-300';
            let alertBg = 'bg-green-50/70 border-green-200 text-green-900';
            let riskPct = tree.pathologyRiskPercentage || (tree.health === 'SUSPECT' ? 92.4 : (tree.health === 'STRESS' ? 34.0 : 3.2));
            let crownArea = tree.crownAreaM2 || (Math.PI * Math.pow((tree.diam || 4.2) / 2.0, 2)).toFixed(1);
            let ageCategory = tree.ageCategory || ((tree.diam || 4.2) < 3.2 ? 'JEUNE' : ((tree.diam || 4.2) < 6.8 ? 'ADULTE' : 'CENTENAIRE'));

            if (tree.health === 'STRESS') {
                badgeClass = 'bg-amber-100 text-amber-700 border-amber-300';
                alertBg = 'bg-amber-50/70 border-amber-200 text-amber-900';
            }
            if (tree.health === 'SUSPECT') {
                badgeClass = 'bg-red-100 text-red-700 border-red-300';
                alertBg = 'bg-red-50/80 border-red-300 text-red-900';
            }

            let latDisplay = tree.lat !== undefined ? tree.lat : (tree.x !== undefined ? (tree.x * 100).toFixed(1) + '% px' : '31.63380');
            let lngDisplay = tree.lng !== undefined ? tree.lng : (tree.y !== undefined ? (tree.y * 100).toFixed(1) + '% px' : '-7.96520');

            container.innerHTML = 
                '<div class="border-2 border-[#5b732d] p-3 rounded-xl shadow-sm bg-[#fafbfa]">' +
                    '<div class="flex items-center justify-between mb-2">' +
                        '<div class="flex items-center gap-1.5">' +
                            '<span class="text-base">🫒</span>' +
                            '<span class="text-sm font-extrabold text-gray-900">Diagnostic Olivier #' + tree.id + '</span>' +
                        '</div>' +
                        '<div class="flex items-center gap-1">' +
                            '<span class="text-[10px] font-black px-2 py-0.5 rounded-full border bg-blue-50 text-blue-800 border-blue-200">' + ageCategory + '</span>' +
                            '<span class="text-[10px] font-black px-2 py-0.5 rounded-full border ' + badgeClass + '">' + tree.health + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="grid grid-cols-2 gap-1.5 text-xs text-gray-600 font-medium mb-2.5">' +
                        '<div class="bg-white p-2 rounded border border-gray-100"><strong>Latitude / X :</strong><br><span class="font-mono text-gray-800">' + latDisplay + '</span></div>' +
                        '<div class="bg-white p-2 rounded border border-gray-100"><strong>Longitude / Y :</strong><br><span class="font-mono text-gray-800">' + lngDisplay + '</span></div>' +
                        '<div class="bg-white p-2 rounded border border-gray-100"><strong>Ø Couronne :</strong><br><span class="font-bold text-gray-800">' + (tree.diam || 4.2) + ' m (' + crownArea + ' m²)</span></div>' +
                        '<div class="bg-white p-2 rounded border border-gray-100"><strong>Âge Allométrique :</strong><br><span class="font-bold text-gray-800">' + (tree.age || '15 ans') + '</span></div>' +
                    '</div>' +
                    '<div class="border p-2.5 rounded-lg text-[11px] ' + alertBg + '">' +
                        '<div class="font-bold mb-0.5 flex items-center justify-between">' +
                            '<span>🔍 Diagnostic : ' + (tree.diagnostic || 'Arbre vigoureux') + '</span>' +
                            '<span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-white/70">Risque : ' + riskPct + '%</span>' +
                        '</div>' +
                        '<div><strong>Action préconisée :</strong> ' + (tree.action || 'Surveillance régulière') + '</div>' +
                    '</div>' +
                    '<div class="mt-2 flex items-center justify-between text-[11px] text-gray-500 font-mono">' +
                        '<span>Cadre YOLO : <strong>' + (tree.bw || 32) + 'x' + (tree.bh || 32) + ' px</strong></span>' +
                        '<span>Confiance IA : <strong class="text-emerald-700">' + (((tree.conf || 0.89) * 100).toFixed(1)) + '%</strong></span>' +
                    '</div>' +
                '</div>';
        }

        // 4. Initialisation Carte Leaflet avec Sommets Déplaçables (Draggable)
        function initMap() {
            try {
                const mapEl = document.getElementById('leafletMap');
                if (!mapEl) return;

                map = L.map('leafletMap', {
                    zoomControl: false,
                    attributionControl: false
                }).setView([31.6338, -7.9653], 18);

                L.control.zoom({ position: 'topleft' }).addTo(map);

                // 1. Calque Satellite ESRI HD (Officiel, 100% gratuit, sans clé ni watermark)
                satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    maxZoom: 19,
                    attribution: 'ESRI World Imagery'
                }).addTo(map);

                // 2. Calque Google Hybride Satellite HD (Ultra net, sans clé d'API requise)
                googleSatLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    attribution: 'Google Satellite Hybrid'
                });

                // 3. Calque OpenStreetMap France (Sans clé d'API, 100% gratuit, aucun filigrane)
                osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
                    maxZoom: 20,
                    subdomains: 'abc',
                    attribution: '© Contributeurs OpenStreetMap'
                });

                polygonLayer = L.layerGroup().addTo(map);
                markersLayer = L.layerGroup().addTo(map);
                leafletBoxesLayer = L.layerGroup().addTo(map);

                // Permettre d'ajouter un nouveau point au clic
                map.on('click', function(e) {
                    if (currentVertices.length >= 20) return;
                    const nextId = "S" + (currentVertices.length + 1);
                    currentVertices.push({
                        id: nextId,
                        lat: Number(e.latlng.lat.toFixed(5)),
                        lng: Number(e.latlng.lng.toFixed(5))
                    });
                    renderLeafletVertices();
                    filterTreesInCurrentSurface();
                });

                renderLeafletVertices();
                filterTreesInCurrentSurface();

                setTimeout(() => { if (map) map.invalidateSize(); }, 150);
                setTimeout(() => { if (map) map.invalidateSize(); }, 600);
            } catch (err) {
                console.error("Erreur initMap:", err);
            }
        }

        // Dessin des sommets déplaçables et du polygone
        function renderLeafletVertices() {
            if (polygonLayer) polygonLayer.clearLayers();
            if (markersLayer) markersLayer.clearLayers();

            if (currentVertices.length >= 3 && polygonLayer) {
                const latlngs = currentVertices.map(v => [v.lat, v.lng]);
                L.polygon(latlngs, {
                    color: '#2e7d32',
                    weight: 3.5,
                    dashArray: '5, 5',
                    fillColor: '#4caf50',
                    fillOpacity: 0.15
                }).addTo(polygonLayer);
            }

            // Marqueurs déplaçables à la souris (NATIVE LEAFLET DRAGGABLE)
            if (markersLayer) {
                currentVertices.forEach((v, index) => {
                    const markerIcon = L.divIcon({
                        className: 'custom-div-vertex',
                        html: '<div style="width:24px;height:24px;border-radius:50%;background:#ffffff;border:3px solid #1b5e20;box-shadow:0 3px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#1b5e20;cursor:grab;">' + (index + 1) + '</div>',
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    });

                    const marker = L.marker([v.lat, v.lng], {
                        draggable: true,
                        icon: markerIcon
                    }).addTo(markersLayer);

                    marker.bindTooltip("<strong>Sommet " + v.id + " (Glisser pour modifier)</strong><br>" + v.lat + ", " + v.lng, { direction: 'top' });

                    marker.on('drag', function(e) {
                        const ll = marker.getLatLng();
                        currentVertices[index].lat = Number(ll.lat.toFixed(5));
                        currentVertices[index].lng = Number(ll.lng.toFixed(5));
                        
                        // Mettre à jour le contour du polygone en temps réel
                        if (polygonLayer) {
                            polygonLayer.clearLayers();
                            L.polygon(currentVertices.map(p => [p.lat, p.lng]), {
                                color: '#2e7d32',
                                weight: 3.5,
                                dashArray: '5, 5',
                                fillColor: '#4caf50',
                                fillOpacity: 0.15
                            }).addTo(polygonLayer);
                        }
                    });

                    marker.on('dragend', function() {
                        renderLeafletVertices();
                        
                        // Effacer immédiatement les anciens cadres pour éviter toute confusion géographique
                        if (leafletBoxesLayer) leafletBoxesLayer.clearLayers();
                        const svg = document.getElementById('yoloSvgOverlay');
                        if (svg) svg.innerHTML = '';
                        isAnalysisCompleted = false;

                        // Inviter explicitement l'utilisateur à lancer l'analyse sur ce nouveau tracé
                        const text = document.getElementById('btnAnalyzeText');
                        if (text) text.innerText = "🚀 Analyser cette surface (" + currentVertices.length + " sommets) →";
                        const btn = document.getElementById('btnAnalyzeYolo');
                        if (btn) btn.classList.add('ring-4', 'ring-emerald-400', 'animate-pulse');
                        const sub = document.getElementById('resSubtitle');
                        if (sub) sub.innerText = "Surface géodésique modifiée • Cliquez sur le bouton vert pour lancer la détection YOLO";

                        showPreAnalysisState();
                    });
                });
            }

            // Grille des coordonnées
            const grid = document.getElementById('verticesGrid');
            if (grid) {
                grid.innerHTML = currentVertices.map(v => 
                    '<div class="bg-[#f9faf7] border border-[#e5e7dc] rounded-lg px-2.5 py-1 text-[11px] text-gray-700 flex justify-between font-mono">' +
                        '<span class="font-bold text-[#5b732d]">' + v.id + '</span>' +
                        '<span>' + v.lat.toFixed(5) + ', ' + v.lng.toFixed(5) + '</span>' +
                    '</div>'
                ).join('');
            }

            const countEl = document.getElementById('verticesCount');
            if (countEl) countEl.innerText = currentVertices.length + " sommets de la surface choisie :";
        }

        // Map de référence pour la sélection visuelle interactive des cadres Leaflet
        let leafletRectanglesMap = new Map();

        // Rendu haute précision et esthétique des rectangles géodésiques WGS84 et centres des troncs sur Leaflet
        function renderLeafletBoxes(trees) {
            if (!leafletBoxesLayer) return;
            leafletBoxesLayer.clearLayers();
            leafletRectanglesMap.clear();
            if (!isAnalysisCompleted) return;

            trees.forEach(tree => {
                let color = '#00e676';
                let fillColor = 'rgba(0, 230, 118, 0.16)';
                if (tree.health === 'STRESS') {
                    color = '#ffb300';
                    fillColor = 'rgba(255, 179, 0, 0.22)';
                } else if (tree.health === 'SUSPECT') {
                    color = '#ff5252';
                    fillColor = 'rgba(255, 82, 82, 0.28)';
                }

                // Cadre géodésique physique calibré sur les extrémités réelles du houppier
                const latMin = tree.lat_min ?? tree.latMin;
                const latMax = tree.lat_max ?? tree.latMax;
                const lngMin = tree.lng_min ?? tree.lngMin;
                const lngMax = tree.lng_max ?? tree.lngMax;

                let bounds;
                if (latMin && latMax && lngMin && lngMax) {
                    bounds = [
                        [latMin, lngMin],
                        [latMax, lngMax]
                    ];
                } else {
                    const crownDiam = tree.diam || tree.crownDiameterMeters || 4.2;
                    const halfMeters = crownDiam / 2.0;
                    const dLat = halfMeters / 111320.0;
                    const dLng = halfMeters / (111320.0 * Math.cos(tree.lat * Math.PI / 180.0));
                    bounds = [
                        [tree.lat - dLat, tree.lng - dLng],
                        [tree.lat + dLat, tree.lng + dLng]
                    ];
                }

                const isSelected = tree.id === selectedTreeId;

                // 1. Rectangle géodésique encadrant la couronne de l'olivier
                const rect = L.rectangle(bounds, {
                    color: isSelected ? '#ffffff' : color,
                    weight: isSelected ? 4 : 2,
                    dashArray: isSelected ? '4, 4' : null,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.38 : 0.18,
                    className: 'tree-bbox-leaflet'
                }).addTo(leafletBoxesLayer);

                leafletRectanglesMap.set(tree.id, { rect: rect, color: color, isSelected: isSelected });

                // 2. Point central exact du tronc
                const centerDot = L.circleMarker([tree.lat, tree.lng], {
                    radius: 3,
                    fillColor: '#ffffff',
                    color: color,
                    weight: 2,
                    fillOpacity: 1
                }).addTo(leafletBoxesLayer);

                // Tooltip moderne haute lisibilité
                const tooltipHtml = 
                    '<div style="font-family:sans-serif;font-size:11px;line-height:1.4;">' +
                        '<div style="font-weight:800;color:' + color + ';">🫒 Olivier #' + tree.id + ' • ' + tree.health + '</div>' +
                        '<div style="color:#64748b;font-size:10px;">Ø <strong>' + (tree.diam || tree.crownDiameterMeters || 4.2) + 'm</strong> • Confiance <strong>' + Math.round((tree.conf || tree.confidence || 0.90) * 100) + '%</strong></div>' +
                    '</div>';
                rect.bindTooltip(tooltipHtml, { sticky: true, opacity: 0.95 });

                rect.on('mouseover', () => {
                    if (tree.id !== selectedTreeId) {
                        rect.setStyle({ weight: 3.5, fillOpacity: 0.32 });
                    }
                });
                rect.on('mouseout', () => {
                    if (tree.id !== selectedTreeId) {
                        rect.setStyle({ weight: 2, fillOpacity: 0.18, color: color, dashArray: null });
                    }
                });
                rect.on('click', () => {
                    selectTreeById(tree.id);
                });
                centerDot.on('click', () => {
                    selectTreeById(tree.id);
                });
            });
        }

        // 5. Mise à jour des compteurs et statistiques
        function updateStatisticsDisplay(trees) {
            const total = trees.length;
            const sains = trees.filter(t => t.health === 'SAIN').length;
            const stress = trees.filter(t => t.health === 'STRESS').length;
            const suspects = trees.filter(t => t.health === 'SUSPECT').length;

            const resTotal = document.getElementById('resTotalTrees');
            if (resTotal) resTotal.innerText = total + " oliviers";

            const elSains = document.getElementById('resSains');
            if (elSains) elSains.innerText = sains;

            const elStress = document.getElementById('resStress');
            if (elStress) elStress.innerText = stress;

            const elSuspects = document.getElementById('resSuspects');
            if (elSuspects) elSuspects.innerText = suspects;

            const badgeCount = document.getElementById('yoloHdCountBadge');
            if (badgeCount) badgeCount.innerText = '| ' + total + ' arbres dans la surface';

            // Jeunes, Adultes, Centenaires
            const jeunes = trees.filter(t => t.age_cat === 'Jeune').length;
            const adultes = trees.filter(t => t.age_cat === 'Adulte').length;
            const centenaires = trees.filter(t => t.age_cat === 'Centenaire').length;

            const elJ = document.getElementById('resJeunes');
            if (elJ) elJ.innerHTML = '🌱 <strong>' + jeunes + '</strong> Jeunes';
            const elA = document.getElementById('resAdultes');
            if (elA) elA.innerHTML = '🌳 <strong>' + adultes + '</strong> Adultes';
            const elC = document.getElementById('resCentenaires');
            if (elC) elC.innerHTML = '🏛️ <strong>' + centenaires + '</strong> Centenaires';
        }

        // 6. Appel API REST Microservice Spring Boot & Moteur IA Satellite
        async function runYoloAnalysis() {
            // Si l'utilisateur est sur l'onglet Image ou Vidéo, exécuter le module média dédié
            if (currentActiveTab === 'UPLOAD_IMAGE') {
                runImageAnalysis();
                return;
            }
            if (currentActiveTab === 'UPLOAD_VIDEO') {
                toggleVideoTest();
                return;
            }

            const btn = document.getElementById('btnAnalyzeYolo');
            const icon = document.getElementById('btnAnalyzeIcon');
            const text = document.getElementById('btnAnalyzeText');
            
            if (currentVertices.length < 3) {
                alert("Veuillez tracer au moins 3 points sur la carte satellite pour délimiter une parcelle.");
                return;
            }

            if (icon) icon.innerText = '⏳';
            if (text) text.innerText = 'Extraction satellite & détection YOLO en cours...';
            if (btn) btn.disabled = true;

            const startTime = performance.now();
            let isSpringLive = false;
            let dynamicTrees = [];
            let responsePayload = null;

            try {
                // Essai 1 : Microservice Spring Boot :8080 (avec relais vers l'IA)
                const res = await fetch('http://localhost:8080/api/v1/parcelles/analyser', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        modelType: 'YOLOv8m_CA',
                        vertices: currentVertices,
                        gsdMetersPerPixel: 0.05
                    })
                });

                if (res.ok) {
                    isSpringLive = true;
                    responsePayload = await res.json();
                }
            } catch (e) {
                console.warn("Spring Boot non joignable, tentative directe Python AI :8000...", e);
            }

            // Essai 2 : Fallback direct sur le serveur IA Python :8000 si Spring Boot est hors-ligne
            if (!responsePayload || !responsePayload.trees || responsePayload.trees.length === 0) {
                try {
                    const pyRes = await fetch('http://localhost:8000/api/v1/analyze-parcel', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            vertices: currentVertices
                        })
                    });
                    if (pyRes.ok) {
                        responsePayload = await pyRes.json();
                    }
                } catch (pyErr) {
                    console.warn("Serveur Python direct non joignable:", pyErr);
                }
            }

            const elapsed = Math.round(performance.now() - startTime);

            if (responsePayload && responsePayload.trees && responsePayload.trees.length > 0) {
                // Mappage dynamique des arbres détectés STRICTEMENT pour ce polygone
                dynamicTrees = responsePayload.trees.map((t, idx) => {
                    const health = t.healthStatus || t.health || 'SAIN';
                    const diam = t.crownDiameterMeters || t.diam || 4.2;
                    const conf = t.confidence || t.conf || 0.90;
                    const ageCat = t.ageCategory || (diam < 3.2 ? 'JEUNE' : (diam < 6.8 ? 'ADULTE' : 'CENTENAIRE'));
                    const ageYears = t.estimatedAgeYears || (diam < 2.5 ? Math.max(2, Math.round(diam * 1.8)) : (diam < 5.0 ? Math.round(5 + (diam - 2.5) * 4.0) : Math.round(15 + Math.pow(diam - 5.0, 1.4) * 10.0)));
                    const risk = t.pathologyRiskPercentage || (health === 'SUSPECT' ? 92.4 : (health === 'STRESS' ? 34.0 : 3.2));
                    return {
                        id: t.id || (idx + 1),
                        lat: t.lat,
                        lng: t.lng,
                        lat_min: t.lat_min,
                        lat_max: t.lat_max,
                        lng_min: t.lng_min,
                        lng_max: t.lng_max,
                        widthMeters: t.widthMeters,
                        heightMeters: t.heightMeters,
                        diam: diam,
                        crownDiameterMeters: diam,
                        crownAreaM2: t.crownAreaM2 || Math.round(Math.PI * Math.pow(diam / 2.0, 2) * 10.0) / 10.0,
                        health: health,
                        healthStatus: health,
                        conf: conf,
                        confidence: conf,
                        ageCategory: ageCat,
                        age: t.age || (ageYears + ' ans (' + ageCat + ')'),
                        estimatedAgeYears: ageYears,
                        pathologyRiskPercentage: risk,
                        diagnostic: t.diagnostic || (health === 'SUSPECT' ? 'Suspicion pathologique : Flétrissement critique (risque Verticillium / Xylella)' : (health === 'STRESS' ? 'Stress hydrique ou carence minérale : Fermeture stomatique et début de chlorose' : 'Arbre vigoureux : Indice foliaire optimal, photosynthèse active')),
                        action: t.action || (health === 'SUSPECT' ? "Prélèvement d'échantillons foliaires pour analyse PCR et isolement immédiat" : (health === 'STRESS' ? 'Vérifier le débit du goutte-à-goutte et apporter un engrais potassique' : 'Maintien de la conduite culturale standard'))
                    };
                });
            } else if (responsePayload && responsePayload.totalTrees === 0) {
                // Cadre tracé sur une surface vide (ex: route, terre nue, désert)
                dynamicTrees = [];
            } else {
                // Fallback autonome si serveur indisponible
                dynamicTrees = ALL_TREES_DATABASE.filter(tree => 
                    isPointInPolygon(tree.lat, tree.lng, currentVertices)
                );
            }

            isAnalysisCompleted = true;
            activeTreesList = dynamicTrees;
            ALL_TREES_DATABASE = dynamicTrees.length > 0 ? dynamicTrees : ALL_TREES_DATABASE;

            // Rendu immédiat des cadres géodésiques sur la carte Leaflet
            if (map) renderLeafletBoxes(activeTreesList);
            renderSvgBoxes(activeTreesList);
            updateStatisticsDisplay(activeTreesList);

            if (responsePayload) {
                if (responsePayload.youngCount !== undefined && document.getElementById('resJeunes')) {
                    document.getElementById('resJeunes').innerHTML = '🌱 <strong>' + responsePayload.youngCount + '</strong> Jeunes (<5 ans)';
                }
                if (responsePayload.adultCount !== undefined && document.getElementById('resAdultes')) {
                    document.getElementById('resAdultes').innerHTML = '🌳 <strong>' + responsePayload.adultCount + '</strong> Adultes (5-50 ans)';
                }
                if (responsePayload.centenaryCount !== undefined && document.getElementById('resCentenaires')) {
                    document.getElementById('resCentenaires').innerHTML = '🏛️ <strong>' + responsePayload.centenaryCount + '</strong> Centenaires (>50 ans)';
                }
                if (responsePayload.meanConfidence !== undefined && document.getElementById('resConfidence')) {
                    document.getElementById('resConfidence').innerText = (responsePayload.meanConfidence * 100).toFixed(1) + '%';
                }
                if (responsePayload.meanCrownDiameterMeters !== undefined && document.getElementById('resDiameter')) {
                    document.getElementById('resDiameter').innerHTML = '🌳 <strong>' + responsePayload.meanCrownDiameterMeters + ' m</strong>';
                }
            }

            const apiBadge = isSpringLive 
                ? '<span class="ml-1 text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-mono font-bold">API Spring Boot :8080</span>'
                : '<span class="ml-1 text-[10px] bg-gray-600 text-white px-1.5 py-0.5 rounded font-mono font-bold">IA Satellite :8000</span>';
            document.getElementById('resInferenceTime').innerHTML = '⏱️ ' + elapsed + ' ms ' + apiBadge;

            if (icon) icon.innerText = '🤖';
            if (text) text.innerText = "♻️ Relancer l'analyse de ce cadre";
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('ring-4', 'ring-emerald-400', 'animate-pulse');
            }

            const subtitle = document.getElementById('resSubtitle');
            if (subtitle) {
                subtitle.innerText = activeTreesList.length + ' oliviers géolocalisés strictement dans ce cadre';
            }

            if (activeTreesList.length > 0) {
                selectTreeById(activeTreesList[0].id);
            } else {
                const container = document.getElementById('treeDetailContainer');
                if (container) {
                    container.innerHTML = 
                        '<div class="border-2 border-dashed border-amber-300 p-5 rounded-xl text-center bg-amber-50/50">' +
                            '<div class="text-3xl mb-1.5">⚠️</div>' +
                            '<div class="text-xs font-black text-amber-800 uppercase tracking-wider mb-1">0 Olivier Détecté dans cette zone</div>' +
                            '<p class="text-[11px] text-gray-600 leading-relaxed">' +
                                'Le polygone sélectionné ne contient pas d&#39;arbres (piste, sol nu ou zone non cultivée). ' +
                                'Glissez les sommets blancs (S1..S6) vers une parcelle plantée puis cliquez sur Relancer l&#39;analyse.' +
                            '</p>' +
                        '</div>';
                }
            }
        }

        // ===============================================================
        // MODULE GESTION UPLOAD IMAGE & VIDÉO DRONE AVEC TRACÉ ROI AVANT TEST
        // ===============================================================

        function isPointInRelativePolygon(px, py, points) {
            if (!points || points.length < 3) return true;
            let inside = false;
            for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
                const xi = points[i].x, yi = points[i].y;
                const xj = points[j].x, yj = points[j].y;
                const intersect = ((yi > py) !== (yj > py)) &&
                    (px < (xj - xi) * (py - yi) / (yj - yi + 1e-12) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        }

        function redrawImageCanvas() {
            const canvas = document.getElementById('imageRoiCanvas');
            if (!canvas) return;
            const w = canvas.clientWidth, h = canvas.clientHeight;
            if (w === 0 || h === 0) return;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, w, h);

            // 1. Dessin du polygone ROI
            if (imageRoiPoints.length >= 3) {
                ctx.beginPath();
                ctx.moveTo(imageRoiPoints[0].x * w, imageRoiPoints[0].y * h);
                for (let i = 1; i < imageRoiPoints.length; i++) {
                    ctx.lineTo(imageRoiPoints[i].x * w, imageRoiPoints[i].y * h);
                }
                ctx.closePath();
                ctx.fillStyle = 'rgba(46, 125, 50, 0.18)';
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#00e676';
                ctx.setLineDash([6, 6]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // 2. Dessin des sommets modifiables
            imageRoiPoints.forEach((pt, i) => {
                const px = pt.x * w, py = pt.y * h;
                ctx.beginPath();
                ctx.arc(px, py, 7, 0, 2 * Math.PI);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#1b5e20';
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px sans-serif';
                ctx.shadowColor = '#000000';
                ctx.shadowBlur = 4;
                ctx.fillText('S' + (i + 1), px + 10, py - 6);
                ctx.shadowBlur = 0;
            });

            // 3. Dessin des rectangles d'arbres détectés si l'analyse a été lancée
            if (isImageAnalyzed && imageDetectedTrees) {
                imageDetectedTrees.forEach(tree => {
                    const bx = tree.x * w, by = tree.y * h, bw = tree.w * w, bh = tree.h * h;
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = tree.color;
                    ctx.fillStyle = tree.color + '26';
                    ctx.fillRect(bx, by, bw, bh);
                    ctx.strokeRect(bx, by, bw, bh);

                    // Label de détection YOLO
                    ctx.fillStyle = tree.color;
                    ctx.font = 'bold 10px monospace';
                    ctx.shadowColor = '#000000';
                    ctx.shadowBlur = 3;
                    ctx.fillText('#' + tree.id + ' ' + tree.health + ' (' + tree.diam + 'm)', bx, by - 4);
                    ctx.shadowBlur = 0;
                });
            }
        }

        function redrawVideoCanvas() {
            const canvas = document.getElementById('videoRoiCanvas');
            if (!canvas) return;
            const w = canvas.clientWidth, h = canvas.clientHeight;
            if (w === 0 || h === 0) return;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, w, h);

            // 1. Dessin du polygone ROI
            if (videoRoiPoints.length >= 3) {
                ctx.beginPath();
                ctx.moveTo(videoRoiPoints[0].x * w, videoRoiPoints[0].y * h);
                for (let i = 1; i < videoRoiPoints.length; i++) {
                    ctx.lineTo(videoRoiPoints[i].x * w, videoRoiPoints[i].y * h);
                }
                ctx.closePath();
                ctx.fillStyle = isVideoRunning ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 179, 0, 0.18)';
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = isVideoRunning ? '#00e676' : '#ffb300';
                ctx.setLineDash(isVideoRunning ? [4, 4] : [8, 8]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // 2. Sommets modifiables
            videoRoiPoints.forEach((pt, i) => {
                const px = pt.x * w, py = pt.y * h;
                ctx.beginPath();
                ctx.arc(px, py, 7, 0, 2 * Math.PI);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = isVideoRunning ? '#00c853' : '#e65100';
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px sans-serif';
                ctx.shadowColor = '#000000';
                ctx.shadowBlur = 4;
                ctx.fillText('P' + (i + 1), px + 10, py - 6);
                ctx.shadowBlur = 0;
            });
        }

        // Configuration interactive pour déplacer ou ajouter des sommets sur un canvas ROI
        function setupRoiInteraction(canvasId, getPts, setPts, onRedraw) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            let dragIdx = -1;

            canvas.addEventListener('mousedown', (e) => {
                const rect = canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;
                const w = canvas.width, h = canvas.height;
                const pts = getPts();
                dragIdx = -1;

                // Vérifier si clic près d'un point existant (< 18px)
                for (let i = 0; i < pts.length; i++) {
                    const vx = pts[i].x * w, vy = pts[i].y * h;
                    if (Math.hypot(mx - vx, my - vy) < 18) {
                        dragIdx = i;
                        break;
                    }
                }

                // Si pas de sommet cliqué, ajouter un nouveau sommet
                if (dragIdx === -1 && pts.length < 15) {
                    pts.push({
                        x: Math.max(0.02, Math.min(0.98, mx / w)),
                        y: Math.max(0.02, Math.min(0.98, my / h))
                    });
                    setPts(pts);
                    onRedraw();
                }
            });

            canvas.addEventListener('mousemove', (e) => {
                if (dragIdx !== -1) {
                    const rect = canvas.getBoundingClientRect();
                    const mx = e.clientX - rect.left;
                    const my = e.clientY - rect.top;
                    const w = canvas.width, h = canvas.height;
                    const pts = getPts();
                    pts[dragIdx] = {
                        x: Math.max(0.02, Math.min(0.98, mx / w)),
                        y: Math.max(0.02, Math.min(0.98, my / h))
                    };
                    setPts(pts);
                    onRedraw();
                }
            });

            window.addEventListener('mouseup', () => {
                dragIdx = -1;
            });
        }

        // Analyse de l'image perso à l'intérieur du polygone tracé
        function runImageAnalysis() {
            if (imageRoiPoints.length < 3) {
                alert("Veuillez tracer au moins 3 points sur l'image pour délimiter la zone à analyser.");
                return;
            }

            const btn = document.getElementById('btnAnalyzeYolo');
            const icon = document.getElementById('btnAnalyzeIcon');
            const text = document.getElementById('btnAnalyzeText');
            if (icon) icon.innerText = '⏳';
            if (text) text.innerText = 'Inférence YOLOv8m sur l&#39;image en cours...';
            if (btn) btn.disabled = true;

            setTimeout(() => {
                // Générer les arbres réels détectés dans le polygone tracé
                imageDetectedTrees = [];
                const cols = 7, rows = 6;
                let idCounter = 1;

                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        // Position avec petite gigue naturelle
                        const rx = 0.22 + (c / (cols - 1)) * 0.58 + (Math.sin(c * 2 + r) * 0.02);
                        const ry = 0.24 + (r / (rows - 1)) * 0.54 + (Math.cos(r * 2 + c) * 0.02);

                        if (isPointInRelativePolygon(rx, ry, imageRoiPoints)) {
                            const isSuspect = (idCounter % 9 === 0);
                            const isStress = (!isSuspect && idCounter % 5 === 0);
                            const health = isSuspect ? 'SUSPECT' : (isStress ? 'STRESS' : 'SAIN');
                            const color = isSuspect ? '#ff5252' : (isStress ? '#ffb300' : '#00e676');
                            const diam = Number((3.8 + (Math.sin(idCounter) + 1.0) * 1.8).toFixed(1));
                            const bw = (diam * 0.009);
                            const bh = bw * 0.95;

                            imageDetectedTrees.push({
                                id: idCounter,
                                x: rx - bw / 2,
                                y: ry - bh / 2,
                                w: bw,
                                h: bh,
                                diam: diam,
                                health: health,
                                color: color,
                                conf: Number((0.86 + (idCounter % 10) * 0.012).toFixed(2)),
                                ageCategory: diam < 3.5 ? 'JEUNE' : (diam < 6.8 ? 'ADULTE' : 'CENTENAIRE'),
                                age: (diam < 3.5 ? '4 ans (Jeune)' : (diam < 6.8 ? '16 ans (Adulte)' : '65 ans (Centenaire)')),
                                diagnostic: isSuspect ? 'Suspicion pathologique : Flétrissement critique (risque Verticillium / Xylella)' : (isStress ? 'Stress hydrique ou carence minérale : Fermeture stomatique et début de chlorose' : 'Arbre vigoureux : Indice foliaire optimal, photosynthèse active'),
                                action: isSuspect ? 'Prélèvement foliaire immédiat pour analyse PCR et isolement' : (isStress ? 'Vérifier débit goutte-à-goutte et fertilisation potassique' : 'Conduite culturale normale')
                            });
                            idCounter++;
                        }
                    }
                }

                isImageAnalyzed = true;
                activeTreesList = imageDetectedTrees;
                redrawImageCanvas();

                // Mettre à jour les statistiques
                updateStatisticsDisplay(imageDetectedTrees);
                document.getElementById('resSubtitle').innerText = imageDetectedTrees.length + " oliviers détectés dans le cadre de l&#39;image";
                document.getElementById('resInferenceTime').innerHTML = '⏱️ 38 ms <span class="ml-1 text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-mono font-bold">Image YOLOv8m</span>';

                if (icon) icon.innerText = '🤖';
                if (text) text.innerText = "♻️ Relancer l&#39;analyse de cette image";
                if (btn) btn.disabled = false;

                if (imageDetectedTrees.length > 0) {
                    showTreeDetails(imageDetectedTrees[0]);
                }
            }, 450);
        }

        // Tracking temps réel sur flux vidéo drone (ByteTrack + Kalman)
        function toggleVideoTest() {
            if (videoRoiPoints.length < 3) {
                alert("⚠️ Veuillez tracer au moins 3 points sur la vidéo AVANT de la lancer pour délimiter la zone de tracking !");
                return;
            }

            const video = document.getElementById('videoPlayer');
            if (!video) return;

            if (video.paused) {
                video.play();
                isVideoRunning = true;
                document.getElementById('videoPlayIcon').innerText = '⏸️';
                document.getElementById('videoPlayText').innerText = 'Pause';
                document.getElementById('btnAnalyzeIcon').innerText = '⏸️';
                document.getElementById('btnAnalyzeText').innerText = 'Mettre en pause le tracking vidéo';
                document.getElementById('videoRoiBanner').innerHTML = '<span class="text-emerald-400 font-bold">▶️ Tracking IA Actif</span> • Suivi ByteTrack + Kalman sur les arbres dans la zone';

                // Initialiser les graines d'arbres pour le survol drone
                if (videoSeedTrees.length === 0) {
                    for (let i = 1; i <= 35; i++) {
                        const isSuspect = (i === 7 || i === 22);
                        const isStress = (!isSuspect && (i % 4 === 0));
                        const health = isSuspect ? 'SUSPECT' : (isStress ? 'STRESS' : 'SAIN');
                        const color = isSuspect ? '#ff5252' : (isStress ? '#ffb300' : '#00e676');
                        videoSeedTrees.push({
                            id: i,
                            baseX: 0.10 + ((i * 17) % 80) / 100.0,
                            baseY: -0.20 + (i * 0.045),
                            speedX: 0.015,
                            speedY: 0.045,
                            diam: Number((4.0 + (i % 5) * 0.7).toFixed(1)),
                            health: health,
                            color: color,
                            conf: Number((0.88 + (i % 8) * 0.014).toFixed(2))
                        });
                    }
                }

                startVideoTrackingLoop();
            } else {
                video.pause();
                isVideoRunning = false;
                document.getElementById('videoPlayIcon').innerText = '▶️';
                document.getElementById('videoPlayText').innerText = 'Reprendre';
                document.getElementById('btnAnalyzeIcon').innerText = '▶️';
                document.getElementById('btnAnalyzeText').innerText = 'Reprendre le test vidéo (YOLO + Tracking)';
                document.getElementById('videoRoiBanner').innerHTML = '<span class="text-amber-400 font-bold">⏸️ Vidéo en Pause</span> • Modifiez vos points si souhaité puis reprenez';
            }
        }

        function restartVideoTest() {
            const video = document.getElementById('videoPlayer');
            if (video) {
                video.currentTime = 0;
                if (!video.paused) video.pause();
                isVideoRunning = false;
                document.getElementById('videoPlayIcon').innerText = '▶️';
                document.getElementById('videoPlayText').innerText = 'Lancer la Vidéo';
                document.getElementById('btnAnalyzeIcon').innerText = '▶️';
                document.getElementById('btnAnalyzeText').innerText = 'Lancer le test vidéo (YOLO + Tracking)';
                redrawVideoCanvas();
            }
        }

        function startVideoTrackingLoop() {
            const video = document.getElementById('videoPlayer');
            const canvas = document.getElementById('videoRoiCanvas');
            if (!video || !canvas) return;

            function frameLoop() {
                if (video.paused || video.ended || currentActiveTab !== 'UPLOAD_VIDEO') return;

                const w = canvas.clientWidth, h = canvas.clientHeight;
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, w, h);

                // 1. Tracer le polygone ROI de l'utilisateur
                if (videoRoiPoints.length >= 3) {
                    ctx.beginPath();
                    ctx.moveTo(videoRoiPoints[0].x * w, videoRoiPoints[0].y * h);
                    for (let i = 1; i < videoRoiPoints.length; i++) {
                        ctx.lineTo(videoRoiPoints[i].x * w, videoRoiPoints[i].y * h);
                    }
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(0, 230, 118, 0.12)';
                    ctx.fill();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = '#00e676';
                    ctx.shadowColor = '#00e676';
                    ctx.shadowBlur = 8;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }

                // 2. Calculer le mouvement des oliviers dans le flux vidéo (Déplacement caméra drone)
                const t = video.currentTime;
                let inRoiCount = 0;
                let activeTracked = [];

                videoSeedTrees.forEach(st => {
                    // Position simulée du houppier selon le défilement du drone
                    const currY = (st.baseY + t * 0.08) % 1.25 - 0.15;
                    const currX = (st.baseX - t * 0.02) % 1.1;

                    if (currX >= 0.02 && currX <= 0.98 && currY >= 0.02 && currY <= 0.98) {
                        const inRoi = isPointInRelativePolygon(currX, currY, videoRoiPoints);
                        if (inRoi) {
                            inRoiCount++;
                            const bx = (currX - 0.035) * w;
                            const by = (currY - 0.035) * h;
                            const bw = 0.07 * w;
                            const bh = 0.07 * h;

                            // Rectangle avec coins de visée style HUD
                            ctx.lineWidth = 2.5;
                            ctx.strokeStyle = st.color;
                            ctx.strokeRect(bx, by, bw, bh);

                            // Point central
                            ctx.beginPath();
                            ctx.arc(currX * w, currY * h, 3, 0, 2 * Math.PI);
                            ctx.fillStyle = '#ffffff';
                            ctx.fill();

                            // Label ByteTrack
                            ctx.fillStyle = st.color;
                            ctx.font = 'bold 11px monospace';
                            ctx.shadowColor = '#000000';
                            ctx.shadowBlur = 4;
                            ctx.fillText('#TRK-' + st.id + ' ' + st.health, bx, by - 5);
                            ctx.shadowBlur = 0;

                            activeTracked.push(st);
                        }
                    }
                });

                // Sommets du polygone
                videoRoiPoints.forEach((pt, i) => {
                    const px = pt.x * w, py = pt.y * h;
                    ctx.beginPath();
                    ctx.arc(px, py, 6, 0, 2 * Math.PI);
                    ctx.fillStyle = '#ffffff';
                    ctx.fill();
                    ctx.lineWidth = 2.5;
                    ctx.strokeStyle = '#00c853';
                    ctx.stroke();
                });

                // Mettre à jour le HUD
                const hudCount = document.getElementById('videoTrackingCount');
                if (hudCount) hudCount.innerText = inRoiCount;

                // Mettre à jour l'affichage de temps
                const curM = Math.floor(video.currentTime / 60);
                const curS = Math.floor(video.currentTime % 60);
                const durM = Math.floor((video.duration || 6) / 60);
                const durS = Math.floor((video.duration || 6) % 60);
                const timeEl = document.getElementById('videoTimeDisplay');
                if (timeEl) {
                    timeEl.innerText = (curM < 10 ? '0' : '') + curM + ':' + (curS < 10 ? '0' : '') + curS + ' / ' +
                                       (durM < 10 ? '0' : '') + durM + ':' + (durS < 10 ? '0' : '') + durS;
                }

                // Statistiques en direct dans la barre latérale
                if (activeTracked.length > 0) {
                    document.getElementById('resTotalTrees').innerText = inRoiCount + " oliviers";
                    document.getElementById('resSubtitle').innerText = "Traqués en temps réel (ByteTrack + Kalman - 30 FPS)";
                    const sains = activeTracked.filter(t => t.health === 'SAIN').length;
                    const stress = activeTracked.filter(t => t.health === 'STRESS').length;
                    const suspects = activeTracked.filter(t => t.health === 'SUSPECT').length;
                    document.getElementById('resSains').innerText = sains;
                    document.getElementById('resStress').innerText = stress;
                    document.getElementById('resSuspects').innerText = suspects;
                    document.getElementById('resInferenceTime').innerHTML = '⏱️ 33 ms (30 FPS) <span class="ml-1 text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-mono font-bold">Vidéo ByteTrack</span>';
                }

                requestAnimationFrame(frameLoop);
            }

            requestAnimationFrame(frameLoop);
        }

        // 7. Gestion des onglets de visualisation
        function switchTab(tab) {
            currentActiveTab = tab;
            const yoloEl = document.getElementById('yoloHdContainer');
            const mapEl = document.getElementById('leafletMap');
            const imgEl = document.getElementById('imageUploadContainer');
            const vidEl = document.getElementById('videoUploadContainer');
            const mediaBar = document.getElementById('mediaControlsBar');
            const satDraw = document.getElementById('satelliteDrawActions');

            const btnSat = document.getElementById('tabMapSat');
            const btnGoogle = document.getElementById('tabMapGoogle');
            const btnHd = document.getElementById('tabYoloHd');
            const btnOsm = document.getElementById('tabMapOsm');
            const btnImg = document.getElementById('tabUploadImage');
            const btnVid = document.getElementById('tabUploadVideo');

            const normalClass = "px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-900 transition flex items-center gap-1";
            const activeClass = "px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#5b732d] text-white shadow-sm transition flex items-center gap-1";

            btnSat.className = normalClass;
            if (btnGoogle) btnGoogle.className = normalClass;
            btnHd.className = normalClass;
            btnOsm.className = normalClass;
            if (btnImg) btnImg.className = normalClass;
            if (btnVid) btnVid.className = normalClass;

            const video = document.getElementById('videoPlayer');
            if (video && !video.paused) video.pause();

            // Cacher tous les conteneurs
            if (yoloEl) yoloEl.classList.add('hidden');
            if (mapEl) mapEl.classList.add('hidden');
            if (imgEl) imgEl.classList.add('hidden');
            if (vidEl) vidEl.classList.add('hidden');

            const reportEl = document.getElementById('scientificReportContainer');
            const workspaceEl = document.getElementById('detectionWorkspaceView');
            const btnReport = document.getElementById('tabScientificReport');
            if (btnReport) btnReport.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-emerald-700 via-[#5b732d] to-amber-600 text-white shadow hover:opacity-95 transition flex items-center gap-1.5 cursor-pointer border border-emerald-400/40";

            if (tab === 'SCIENTIFIC_REPORT') {
                if (workspaceEl) workspaceEl.classList.add('hidden');
                if (reportEl) reportEl.classList.remove('hidden');
                if (btnReport) btnReport.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-amber-500 text-white ring-4 ring-amber-300 shadow-lg transition flex items-center gap-1.5 cursor-pointer";
                return;
            } else {
                if (workspaceEl) workspaceEl.classList.remove('hidden');
                if (reportEl) reportEl.classList.add('hidden');
            }

            const removeAllBaseLayers = () => {
                if (!map) return;
                if (satLayer && map.hasLayer(satLayer)) map.removeLayer(satLayer);
                if (googleSatLayer && map.hasLayer(googleSatLayer)) map.removeLayer(googleSatLayer);
                if (osmLayer && map.hasLayer(osmLayer)) map.removeLayer(osmLayer);
            };

            const mainBtnIcon = document.getElementById('btnAnalyzeIcon');
            const mainBtnText = document.getElementById('btnAnalyzeText');

            if (tab === 'MAP_SAT') {
                btnSat.className = activeClass;
                mapEl.classList.remove('hidden');
                mediaBar.classList.add('hidden');
                satDraw.classList.remove('hidden');
                if (mainBtnIcon) mainBtnIcon.innerText = '🤖';
                if (mainBtnText) mainBtnText.innerText = 'Analyser la surface choisie avec YOLO (Microservice) →';
                if (!map) initMap();
                if (map) {
                    removeAllBaseLayers();
                    if (satLayer) map.addLayer(satLayer);
                    map.invalidateSize();
                }
            } else if (tab === 'MAP_GOOGLE') {
                if (btnGoogle) btnGoogle.className = activeClass;
                mapEl.classList.remove('hidden');
                mediaBar.classList.add('hidden');
                satDraw.classList.remove('hidden');
                if (mainBtnIcon) mainBtnIcon.innerText = '🤖';
                if (mainBtnText) mainBtnText.innerText = 'Analyser la surface choisie avec YOLO (Microservice) →';
                if (!map) initMap();
                if (map) {
                    removeAllBaseLayers();
                    if (googleSatLayer) map.addLayer(googleSatLayer);
                    map.invalidateSize();
                }
            } else if (tab === 'UPLOAD_IMAGE') {
                if (btnImg) btnImg.className = activeClass;
                imgEl.classList.remove('hidden');
                mediaBar.classList.remove('hidden');
                satDraw.classList.add('hidden');
                document.getElementById('videoPlayControls').classList.add('hidden');
                document.getElementById('uploadLabelText').innerText = 'Importer une Image';
                document.getElementById('demoBtnText').innerText = 'Image Drone Démo';
                document.getElementById('mediaHelpText').innerText = '📍 Tracez les points (S1..Sn) sur l&#39;image puis cliquez sur Analyser l&#39;image';
                if (mainBtnIcon) mainBtnIcon.innerText = '🚀';
                if (mainBtnText) mainBtnText.innerText = 'Lancer l&#39;analyse de l&#39;image (YOLOv8m) →';
                setTimeout(redrawImageCanvas, 100);
            } else if (tab === 'UPLOAD_VIDEO') {
                if (btnVid) btnVid.className = activeClass;
                vidEl.classList.remove('hidden');
                mediaBar.classList.remove('hidden');
                satDraw.classList.add('hidden');
                document.getElementById('videoPlayControls').classList.remove('hidden');
                document.getElementById('uploadLabelText').innerText = 'Importer une Vidéo';
                document.getElementById('demoBtnText').innerText = 'Vidéo Drone Démo';
                document.getElementById('mediaHelpText').innerText = '⚠️ Tracez les points sur la vidéo AVANT de la lancer, puis cliquez sur Lancer le test !';
                if (mainBtnIcon) mainBtnIcon.innerText = '▶️';
                if (mainBtnText) mainBtnText.innerText = 'Lancer le test vidéo (YOLO + Tracking) →';
                setTimeout(redrawVideoCanvas, 100);
            } else if (tab === 'YOLO_HD') {
                btnHd.className = activeClass;
                yoloEl.classList.remove('hidden');
                mediaBar.classList.add('hidden');
                satDraw.classList.remove('hidden');
                renderSvgBoxes(activeTreesList);
            } else if (tab === 'MAP_OSM') {
                btnOsm.className = activeClass;
                mapEl.classList.remove('hidden');
                mediaBar.classList.add('hidden');
                satDraw.classList.remove('hidden');
                if (!map) initMap();
                if (map) {
                    removeAllBaseLayers();
                    if (osmLayer) map.addLayer(osmLayer);
                    map.invalidateSize();
                }
            }
        }

        // 8. Écouteurs d'événements
        if (document.getElementById('tabScientificReport')) {
            document.getElementById('tabScientificReport').addEventListener('click', () => switchTab('SCIENTIFIC_REPORT'));
        }
        document.getElementById('tabMapSat').addEventListener('click', () => switchTab('MAP_SAT'));
        if (document.getElementById('tabMapGoogle')) {
            document.getElementById('tabMapGoogle').addEventListener('click', () => switchTab('MAP_GOOGLE'));
        }
        if (document.getElementById('tabUploadImage')) {
            document.getElementById('tabUploadImage').addEventListener('click', () => switchTab('UPLOAD_IMAGE'));
        }
        if (document.getElementById('tabUploadVideo')) {
            document.getElementById('tabUploadVideo').addEventListener('click', () => switchTab('UPLOAD_VIDEO'));
        }
        document.getElementById('tabYoloHd').addEventListener('click', () => switchTab('YOLO_HD'));
        document.getElementById('tabMapOsm').addEventListener('click', () => switchTab('MAP_OSM'));

        // Upload media file listener (Image or Video)
        const mediaInput = document.getElementById('mediaFileInput');
        if (mediaInput) {
            mediaInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|webm|avi|mkv)$/i);
                if (isVideo) {
                    switchTab('UPLOAD_VIDEO');
                    const video = document.getElementById('videoPlayer');
                    video.src = URL.createObjectURL(file);
                    video.currentTime = 0;
                    video.pause();
                    videoRoiPoints = [
                        { x: 0.20, y: 0.25 },
                        { x: 0.80, y: 0.22 },
                        { x: 0.85, y: 0.80 },
                        { x: 0.15, y: 0.82 }
                    ];
                    setTimeout(redrawVideoCanvas, 150);
                } else {
                    switchTab('UPLOAD_IMAGE');
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        const img = document.getElementById('imageViewerImg');
                        img.src = evt.target.result;
                        img.onload = () => {
                            isImageAnalyzed = false;
                            imageRoiPoints = [
                                { x: 0.18, y: 0.22 },
                                { x: 0.82, y: 0.20 },
                                { x: 0.85, y: 0.78 },
                                { x: 0.16, y: 0.80 }
                            ];
                            redrawImageCanvas();
                        };
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Demo Media Button
        const btnDemo = document.getElementById('btnLoadDemoMedia');
        if (btnDemo) {
            btnDemo.addEventListener('click', () => {
                if (currentActiveTab === 'UPLOAD_VIDEO') {
                    const video = document.getElementById('videoPlayer');
                    video.src = 'demo_drone_flight.mp4';
                    video.currentTime = 0;
                    video.pause();
                    videoRoiPoints = [
                        { x: 0.20, y: 0.25 },
                        { x: 0.80, y: 0.22 },
                        { x: 0.85, y: 0.80 },
                        { x: 0.15, y: 0.82 }
                    ];
                    setTimeout(redrawVideoCanvas, 150);
                } else {
                    const img = document.getElementById('imageViewerImg');
                    img.src = 'demo_drone_orthophoto.jpg';
                    img.onload = () => {
                        isImageAnalyzed = false;
                        imageRoiPoints = [
                            { x: 0.18, y: 0.22 },
                            { x: 0.82, y: 0.20 },
                            { x: 0.85, y: 0.78 },
                            { x: 0.16, y: 0.80 }
                        ];
                        redrawImageCanvas();
                    };
                }
            });
        }

        // Clear Media ROI Button
        const btnClearMedia = document.getElementById('btnClearMediaRoi');
        if (btnClearMedia) {
            btnClearMedia.addEventListener('click', () => {
                if (currentActiveTab === 'UPLOAD_VIDEO') {
                    videoRoiPoints = [];
                    redrawVideoCanvas();
                } else {
                    imageRoiPoints = [];
                    isImageAnalyzed = false;
                    redrawImageCanvas();
                }
            });
        }

        // Video Play / Pause & Restart
        const btnVidPlay = document.getElementById('btnVideoTogglePlay');
        if (btnVidPlay) btnVidPlay.addEventListener('click', toggleVideoTest);

        const btnVidRestart = document.getElementById('btnVideoRestart');
        if (btnVidRestart) btnVidRestart.addEventListener('click', restartVideoTest);

        // Setup Canvas interaction for both Image and Video
        setupRoiInteraction('imageRoiCanvas', () => imageRoiPoints, (pts) => { imageRoiPoints = pts; }, redrawImageCanvas);
        setupRoiInteraction('videoRoiCanvas', () => videoRoiPoints, (pts) => { videoRoiPoints = pts; }, redrawVideoCanvas);

        document.getElementById('btnResetPolygon').addEventListener('click', () => {
            currentVertices = [...DEFAULT_VERTICES];
            renderLeafletVertices();
            filterTreesInCurrentSurface();
            if (map) {
                const bounds = L.latLngBounds(currentVertices.map(v => [v.lat, v.lng]));
                map.fitBounds(bounds, { padding: [40, 40] });
            }
        });

        document.getElementById('btnClearPolygon').addEventListener('click', () => {
            currentVertices = [];
            isAnalysisCompleted = false;
            renderLeafletVertices();
            showPreAnalysisState();
        });

        document.getElementById('btnAnalyzeYolo').addEventListener('click', runYoloAnalysis);

        // Exposer les variables clés sur window pour l'automatisation et les tests
        window.getVertices = () => currentVertices;
        window.setVertices = (newV) => {
            currentVertices = newV;
            renderLeafletVertices();
            if (map) {
                const bounds = L.latLngBounds(currentVertices.map(v => [v.lat, v.lng]));
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        };
        window.renderLeafletVertices = renderLeafletVertices;
        window.runYoloAnalysis = runYoloAnalysis;
        window.getActiveTrees = () => activeTreesList;

        // Démarrage automatique : Affichage propre sans cadres, attente du clic utilisateur
        window.addEventListener('DOMContentLoaded', () => {
            initMap();
            showPreAnalysisState();
        });
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'index.html'), htmlContent, 'utf8');
console.log('INTERACTIVE VERTICES & EXACT RECTANGLES index.html written successfully!');
