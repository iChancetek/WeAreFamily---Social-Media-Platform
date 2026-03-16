import sys
filepath = r"c:\Users\chanc\Documents\WeAreFamily\components\stories\stories-tray-client.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line 123 (1-indexed) is 122 (0-indexed)
if '</div>' in lines[122]:
    print(f"Removing line 123: {lines[122]}")
    del lines[122]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Success")
else:
    print(f"Line 123 does not match template: {lines[122]}")
