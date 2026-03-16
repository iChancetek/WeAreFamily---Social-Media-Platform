import sys
filepath = r"c:\Users\chanc\Documents\WeAreFamily\components\stories\stories-tray-client.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = '            {/* Viewer Overlay */}'
if target in content:
    replacement = '''                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Viewer Overlay */}'''
    content = content.replace(target, replacement)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Target not found")
