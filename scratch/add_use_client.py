import os
import glob

components_dir = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/components'

for root, _, files in os.walk(components_dir):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if '"use client"' not in content and "'use client'" not in content:
                new_content = '"use client";\n' + content
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Added 'use client' to {filepath}")

print("Done prepending 'use client'")
