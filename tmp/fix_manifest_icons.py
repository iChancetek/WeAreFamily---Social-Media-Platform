import json

filepath = r"c:\Users\chanc\Documents\WeAreFamily\public\manifest.json"

with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

def update_src(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "src" and isinstance(v, str) and v.startswith("/icons/"):
                obj[k] = f"{v}?v=2"
            elif isinstance(v, (dict, list)):
                update_src(v)
    elif isinstance(obj, list):
        for item in obj:
            update_src(item)

update_src(data)

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4)

print("Success")
