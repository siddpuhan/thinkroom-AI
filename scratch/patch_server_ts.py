import os
import re

server_dir = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/server'

for root, _, files in os.walk(server_dir):
    for file in files:
        if file.endswith('.js') and 'node_modules' not in root:
            filepath = os.path.join(root, file)
            new_filepath = filepath[:-3] + '.ts'
            os.rename(filepath, new_filepath)
            
            with open(new_filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if not content.startswith('// @ts-nocheck'):
                content = '// @ts-nocheck\n' + content
                
            with open(new_filepath, 'w', encoding='utf-8') as f:
                f.write(content)

print("Renamed and patched server files")
