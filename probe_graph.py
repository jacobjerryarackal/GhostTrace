import urllib.request
import json

url = 'https://ghosttrace-backend-uj15.onrender.com/api/graph'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=15) as res:
    data = json.loads(res.read().decode('utf-8'))
    print('Nodes count:', len(data['nodes']))
    for n in data['nodes']:
        print(f"  ID: {n['id']}, Type: {n['type']}, Status: {n.get('status')}, Label: {n.get('label')}")
    print('Edges count:', len(data['edges']))
    for e in data['edges']:
        print(f"  Edge: {e['source']} -> {e['target']} ({e['relationship']})")

