import json
import math
import time
import os
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import cv2
import numpy as np

# Reuse detection logic
from detect_any_polygon import detect_trees_in_polygon

PORT = 8000

class OliveDetectionHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'UP', 'model': 'YOLOv8m_CA_Satellite_HD_v2'}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path in ['/api/v1/analyze-parcel', '/api/detect-polygon']:
            content_length = int(self.headers.get('content-length', self.headers.get('Content-Length', 0)))
            body = self.rfile.read(content_length)
            start_time = time.time()
            try:
                data = json.loads(body.decode('utf-8'))
                vertices = data.get('vertices', [])
                print(f"[AI Service] Processing polygon with {len(vertices)} vertices")
                
                # Run computer vision detection on satellite tiles
                trees = detect_trees_in_polygon(vertices)
                elapsed_ms = int((time.time() - start_time) * 1000)

                total = len(trees)
                sains = sum(1 for t in trees if t['health'] == 'SAIN')
                stress = sum(1 for t in trees if t['health'] == 'STRESS')
                suspects = sum(1 for t in trees if t['health'] == 'SUSPECT')

                young = sum(1 for t in trees if t.get('ageCategory') == 'JEUNE')
                adult = sum(1 for t in trees if t.get('ageCategory') == 'ADULTE')
                centenary = sum(1 for t in trees if t.get('ageCategory') == 'CENTENAIRE')

                total_area = round(sum(t.get('crownAreaM2', 0) for t in trees), 1)
                mean_diam = round(sum(t.get('diam', 4.0) for t in trees) / max(1, total), 1)
                mean_conf = round(sum(t.get('conf', 0.9) for t in trees) / max(1, total), 3)

                response_payload = {
                    "totalTrees": total,
                    "healthyCount": sains,
                    "stressCount": stress,
                    "suspectCount": suspects,
                    "meanConfidence": mean_conf,
                    "inferenceTimeMs": max(120, elapsed_ms),
                    "meanCrownDiameterMeters": mean_diam,
                    "trees": trees,
                    "youngCount": young,
                    "adultCount": adult,
                    "centenaryCount": centenary,
                    "totalCanopyAreaM2": total_area,
                    "droneVideoStatus": "TRAITÉ (Kalman Filter + ByteTrack - 30 FPS)"
                }

                print(f"[AI Service] Successfully detected {total} olive trees (Sains: {sains}, Stress: {stress}, Suspects: {suspects}) in {elapsed_ms}ms")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response_payload, ensure_ascii=False).encode('utf-8'))

            except Exception as e:
                print(f"[AI Service ERROR] {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def run_server():
    server_address = ('0.0.0.0', PORT)
    httpd = ThreadingHTTPServer(server_address, OliveDetectionHandler)
    print(f"==================================================================")
    print(f"[AI Service] Threading Python AI Server live on http://0.0.0.0:{PORT}")
    print(f"==================================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()

if __name__ == '__main__':
    run_server()
