import os
import re

def patch_env_vars(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace import.meta.env.VITE_ with process.env.NEXT_PUBLIC_
    new_content = re.sub(r'import\.meta\.env\.VITE_', r'process.env.NEXT_PUBLIC_', content)
    # Just in case there are naked import.meta.env
    new_content = re.sub(r'import\.meta\.env', r'process.env', new_content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched env vars in {filepath}")

base_dir = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src'
for root, _, files in os.walk(base_dir):
    for file in files:
        if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
            patch_env_vars(os.path.join(root, file))

print("Done patching env vars")
