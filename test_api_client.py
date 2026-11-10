import urllib.request
import json
import time

payload = {
    "vertices": [
        {"lat": 31.63468, "lng": -7.96582},
        {"lat": 31.63445, "lng": -7.96495},
        {"lat": 31.63380, "lng": -7.96465},
        {"lat": 31.63285, "lng": -7.96505},
        {"lat": 31.63300, "lng": -7.96590},
        {"lat": 31.63410, "lng": -7.96625}
    ]
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(
    'http://localhost:8080/api/v1/parcelles/analyser',
    data=data,
    headers={'Content-Type': 'application/json'}
)

t0 = time.time()
with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode('utf-8'))
    t1 = time.time()
    print(f"Success in {t1-t0:.2f}s!")
    print(f"Total Trees: {res.get('totalTrees')}")
    print(f"Healthy: {res.get('healthyCount')}, Stress: {res.get('stressCount')}, Suspect: {res.get('suspectCount')}")
    print(f"Confidence: {res.get('meanConfidence')}")
    print(f"Inference Time: {res.get('inferenceTimeMs')} ms")
    trees = res.get('trees', [])
    print(f"Trees count in list: {len(trees)}")
    if trees:
        print("First tree:", trees[0])
