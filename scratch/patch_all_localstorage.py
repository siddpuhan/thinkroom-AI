import os

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'localStorage.getItem' in content and 'typeof window' not in content:
        content = content.replace('localStorage.getItem', '(typeof window !== "undefined" ? localStorage.getItem.bind(localStorage) : () => null)')
    if 'localStorage.setItem' in content and 'typeof window' not in content:
        content = content.replace('localStorage.setItem', '(typeof window !== "undefined" ? localStorage.setItem.bind(localStorage) : () => {})')
    if 'localStorage.removeItem' in content and 'typeof window' not in content:
        content = content.replace('localStorage.removeItem', '(typeof window !== "undefined" ? localStorage.removeItem.bind(localStorage) : () => {})')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

base_dir = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src'
for root, _, files in os.walk(base_dir):
    for file in files:
        if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
            patch_file(os.path.join(root, file))

print("Patched all localStorage uses")
