
        // Sommets exacts de la capture du professeur (Marrakech / Haouz)
        const INITIAL_VERTICES = [
            { id: 'S1', lat: 31.63443, lng: -7.96600 },
            { id: 'S2', lat: 31.63455, lng: -7.96602 },
            { id: 'S3', lat: 31.63470, lng: -7.96565 },
            { id: 'S4', lat: 31.63474, lng: -7.96504 },
            { id: 'S5', lat: 31.63320, lng: -7.96456 },
            { id: 'S6', lat: 31.63290, lng: -7.96521 }
        ];

        // 9 oliviers de référence
        const MOCK_TREES = [
            { id: 1, lat: 31.63435, lng: -7.96580, status: 'SAIN', diam: 6.1, age: '38 ans (Adulte)', conf: 0.91 },
            { id: 2, lat: 31.63420, lng: -7.96550, status: 'SAIN', diam: 5.9, age: '32 ans (Adulte)', conf: 0.88 },
            { id: 3, lat: 31.63405, lng: -7.96525, status: 'SAIN', diam: 5.8, age: '30 ans (Adulte)', conf: 0.87 },
            { id: 4, lat: 31.63385, lng: -7.96500, status: 'SAIN', diam: 5.7, age: '28 ans (Adulte)', conf: 0.86 },
            { id: 5, lat: 31.63370, lng: -7.96540, status: 'STRESS', diam: 5.4, age: '24 ans (Adulte)', conf: 0.84 },
            { id: 6, lat: 31.63350, lng: -7.96520, status: 'STRESS', diam: 5.3, age: '22 ans (Adulte)', conf: 0.83 },
            { id: 7, lat: 31.63335, lng: -7.96495, status: 'STRESS', diam: 5.2, age: '20 ans (Adulte)', conf: 0.82 },
            { id: 8, lat: 31.63320, lng: -7.96510, status: 'SUSPECT', diam: 4.8, age: '4 ans (Jeune)', conf: 0.79 },
            { id: 9, lat: 31.63305, lng: -7.96515, status: 'SUSPECT', diam: 4.7, age: '65 ans (Centenaire)', conf: 0.78 }
        ];

        let currentVertices = [...INITIAL_VERTICES];
        let map = null;
        let polygonLayer = null;
        let markersLayer = null;
        let treesLayer = null;
        let satTile = null;
        let osmTile = null;
        let activeTile = 'sat';

        // 1. Initialisation de la carte Leaflet
        function initMap() {
            map = L.map('leafletMap', { zoomControl: false }).setView([31.6338, -7.9653], 17);
            L.control.zoom({ position: 'topleft' }).addTo(map);

            // Couche Satellite ESRI
            satTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                attribution: 'ESRI World Imagery'
            }).addTo(map);

            // Couche OpenStreetMap
            osmTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: 'OpenStreetMap'
            });

            polygonLayer = L.layerGroup().addTo(map);
            markersLayer = L.layerGroup().addTo(map);
            treesLayer = L.layerGroup().addTo(map);

            // Clic sur la carte pour ajouter des sommets
            map.on('click', function(e) {
                if (currentVertices.length >= 12) return;
                const nextId = `S${currentVertices.length + 1}`;
                currentVertices.push({
                    id: nextId,
                    lat: Number(e.latlng.lat.toFixed(5)),
                    lng: Number(e.latlng.lng.toFixed(5))
                });
                renderVertices();
            });

            renderVertices();
        }

        // 2. Rendu des sommets et du polygone
        function renderVertices() {
            polygonLayer.clearLayers();
            markersLayer.clearLayers();

            if (currentVertices.length >= 3) {
                const latlngs = currentVertices.map(v => [v.lat, v.lng]);
                L.polygon(latlngs, {
                    color: '#4d6928',
                    weight: 3,
                    fillColor: '#3d5220',
                    fillOpacity: 0.25
                }).addTo(polygonLayer);
            }

            // Sommets (cercles blancs cerclés de vert)
            currentVertices.forEach(v => {
                const marker = L.circleMarker([v.lat, v.lng], {
                    radius: 6,
                    fillColor: '#ffffff',
                    color: '#4d6928',
                    weight: 3,
                    fillOpacity: 1
                }).addTo(markersLayer);
                marker.bindTooltip(`<strong>${v.id}</strong>: ${v.lat}, ${v.lng}`, { direction: 'top' });
            });

            // Mise à jour de la grille des sommets HTML
            const grid = document.getElementById('verticesGrid');
            grid.innerHTML = currentVertices.map(v => `
                <div class="bg-[#f9faf7] border border-[#e5e7dc] rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700 flex justify-between font-mono">
                    <span class="font-bold text-[#5b732d]">${v.id}</span>
                    <span>${v.lat.toFixed(5)}, ${v.lng.toFixed(5)}</span>
                </div>
            `).join('');

            document.getElementById('verticesCount').innerText = `${currentVertices.length} sommets géodésiques tracés (Marrakech / Haouz) :`;
            document.getElementById('btnAnalyzeText').innerText = `${currentVertices.length} points tracés — Analyser avec YOLO →`;
        }

        // 3. Rendu des arbres détectés
        function renderTrees(trees) {
            treesLayer.clearLayers();
            trees.forEach(tree => {
                const color = tree.status === 'SAIN' ? '#00c853' : (tree.status === 'STRESS' ? '#ffb300' : '#ef5350');
                const marker = L.circleMarker([tree.lat, tree.lng], {
                    radius: 8,
                    fillColor: color,
                    color: '#ffffff',
                    weight: 2,
                    fillOpacity: 0.95
                }).addTo(treesLayer);

                marker.on('click', () => showTreeDetails(tree));
                marker.bindTooltip(`Olivier #${tree.id} (${tree.status})`);
            });
        }

        // 4. Affichage de la fiche d'un arbre
        function showTreeDetails(tree) {
            const container = document.getElementById('treeDetailContainer');
            const badgeClass = tree.status === 'SAIN' ? 'bg-green-100 text-green-700' : (tree.status === 'STRESS' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700');
            container.innerHTML = `
                <div class="bg-white border-2 border-[#5b732d] p-4 rounded-xl shadow-md transition-all">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-extrabold text-gray-900">Olivier #${tree.id}</span>
                        <span class="text-[10px] font-extrabold px-2 py-0.5 rounded ${badgeClass}">
                            ${tree.status}
                        </span>
                    </div>
                    <div class="space-y-1.5 text-xs text-gray-600 font-medium">
                        <div><strong>Latitude :</strong> ${tree.lat}</div>
                        <div><strong>Longitude :</strong> ${tree.lng}</div>
                        <div><strong>Diamètre Couronne :</strong> ${tree.diam} m</div>
                        <div><strong>Âge Allométrique :</strong> ${tree.age}</div>
                        <div><strong>Confiance YOLO :</strong> ${(tree.conf * 100).toFixed(1)}%</div>
                    </div>
                </div>
            `;
        }

        // 5. Exécution de l'analyse YOLO (Appel direct au microservice Spring Boot)
        async function runYoloAnalysis() {
            const btn = document.getElementById('btnAnalyzeYolo');
            const icon = document.getElementById('btnAnalyzeIcon');
            const text = document.getElementById('btnAnalyzeText');
            
            icon.innerText = '⏳';
            text.innerText = 'Inférence YOLO en cours (Microservice Spring Boot)...';
            btn.disabled = true;

            const startTime = performance.now();
            let treesToDisplay = MOCK_TREES;
            let isSpringLive = false;

            try {
                const res = await fetch('http://localhost:8080/api/v1/parcelles/analyser', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        parcelId: 'P-MAR-HAOUZ-01',
                        vertices: currentVertices,
                        gsdMetersPerPixel: 0.05
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    isSpringLive = true;
                    treesToDisplay = data.trees.map(t => ({
                        id: t.id,
                        lat: t.lat,
                        lng: t.lng,
                        status: t.healthStatus,
                        diam: t.crownDiameterMeters,
                        age: t.crownDiameterMeters < 3.0 ? '4 ans (Jeune)' : (t.crownDiameterMeters > 6.7 ? '65 ans (Centenaire)' : `${Math.round(t.crownDiameterMeters * 5.5)} ans (Adulte)`),
                        conf: t.confidence
                    }));
                }
            } catch (e) {
                console.warn("Spring Boot hors-ligne, basculement mode autonome :", e);
            }

            const elapsed = Math.round(performance.now() - startTime);

            setTimeout(() => {
                renderTrees(treesToDisplay);
                document.getElementById('resultsCard').classList.remove('hidden');
                document.getElementById('resInferenceTime').innerHTML = `⏱️ ${elapsed > 0 ? elapsed : 213} ms ${isSpringLive ? '<span class="ml-1 text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-mono font-bold">API Spring Boot :8080</span>' : '<span class="ml-1 text-[10px] bg-gray-600 text-white px-1.5 py-0.5 rounded font-mono font-bold">Mode Autonome</span>'}`;
                
                icon.innerText = '🤖';
                text.innerText = '♻️ Relancer l\'analyse YOLO';
                btn.disabled = false;

                // Afficher premier arbre par défaut
                if (treesToDisplay.length > 0) showTreeDetails(treesToDisplay[0]);
            }, 500);
        }

        // Événements boutons
        document.getElementById('btnAnalyzeYolo').addEventListener('click', runYoloAnalysis);
        document.getElementById('btnResetPoints').addEventListener('click', () => {
            currentVertices = [...INITIAL_VERTICES];
            renderVertices();
            if (map) {
                const bounds = L.latLngBounds(currentVertices.map(v => [v.lat, v.lng]));
                map.fitBounds(bounds, { padding: [30, 30] });
            }
        });
        document.getElementById('btnCenterMap').addEventListener('click', () => {
            if (map && currentVertices.length > 0) {
                const bounds = L.latLngBounds(currentVertices.map(v => [v.lat, v.lng]));
                map.fitBounds(bounds, { padding: [30, 30] });
            }
        });
        document.getElementById('btnClearMap').addEventListener('click', () => {
            currentVertices = [];
            renderVertices();
            treesLayer.clearLayers();
            document.getElementById('resultsCard').classList.add('hidden');
        });
        document.getElementById('btnModifyContour').addEventListener('click', () => {
            document.getElementById('resultsCard').classList.add('hidden');
        });

        // Bascule de couches
        document.getElementById('btnLayerSat').addEventListener('click', function() {
            if (activeTile !== 'sat') {
                map.removeLayer(osmTile);
                map.addLayer(satTile);
                activeTile = 'sat';
                this.className = "px-2.5 py-1 text-xs rounded-lg font-bold bg-[#5b732d] text-white shadow-sm transition";
                document.getElementById('btnLayerOsm').className = "px-2.5 py-1 text-xs rounded-lg font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition";
            }
        });
        document.getElementById('btnLayerOsm').addEventListener('click', function() {
            if (activeTile !== 'osm') {
                map.removeLayer(satTile);
                map.addLayer(osmTile);
                activeTile = 'osm';
                this.className = "px-2.5 py-1 text-xs rounded-lg font-bold bg-[#5b732d] text-white shadow-sm transition";
                document.getElementById('btnLayerSat').className = "px-2.5 py-1 text-xs rounded-lg font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition";
            }
        });

        // Zoom boutons
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const z = parseInt(this.getAttribute('data-zoom'));
                map.setZoom(z);
                document.querySelectorAll('.zoom-btn').forEach(b => {
                    b.className = "zoom-btn px-2.5 py-1 rounded-md font-bold bg-white border border-gray-300 text-gray-700";
                });
                this.className = "zoom-btn px-2.5 py-1 rounded-md font-bold bg-[#5b732d] text-white shadow-sm";
            });
        });

        // Démarrage
        
        // Basculer entre Vue Carte et Vue Carr?s YOLO
        document.getElementById('btnViewMap').addEventListener('click', function() {
            document.getElementById('leafletMap').classList.remove('hidden');
            document.getElementById('boxesContainer').classList.add('hidden');
            this.className = "px-3 py-1.5 text-xs rounded-lg font-bold bg-[#5b732d] text-white shadow-sm transition flex items-center gap-1";
            document.getElementById('btnViewBoxes').className = "px-3 py-1.5 text-xs rounded-lg font-bold bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition flex items-center gap-1 border border-gray-300";
        });

        document.getElementById('btnViewBoxes').addEventListener('click', function() {
            document.getElementById('leafletMap').classList.add('hidden');
            document.getElementById('boxesContainer').classList.remove('hidden');
            this.className = "px-3 py-1.5 text-xs rounded-lg font-bold bg-[#5b732d] text-white shadow-sm transition flex items-center gap-1";
            document.getElementById('btnViewMap').className = "px-3 py-1.5 text-xs rounded-lg font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition flex items-center gap-1 border border-gray-300";
        });

        window.addEventListener('DOMContentLoaded', initMap);
    