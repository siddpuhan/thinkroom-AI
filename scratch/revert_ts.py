import os
import re

# Revert src/
src_dir = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src'
for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.tsx') and 'types' not in root and 'store' not in root and 'utils' not in root and 'db.ts' not in file:
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            # Remove the patches
            content = content.replace('// @ts-nocheck\n', '')
            content = re.sub(r'\(props: any\)\s*=>', '(props) =>', content)
            content = re.sub(r'\(\{ (.*?) \}: any\)\s*=>', r'({\1}) =>', content)
            content = re.sub(r'\((e|event|err|error|msg|task|doc|note): any\)\s*=>', r'(\1) =>', content)
            content = re.sub(r'useState<any>\((.*?)\)', r'useState(\1)', content)
            content = re.sub(r'useState<any>\(\)', r'useState()', content)
            content = re.sub(r'useRef<any>\((.*?)\)', r'useRef(\1)', content)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Revert filename
            os.rename(filepath, filepath.replace('.tsx', '.jsx'))

# Revert server/
server_dir = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/server'
for root, _, files in os.walk(server_dir):
    for file in files:
        if file.endswith('.ts') and 'node_modules' not in root:
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            content = content.replace('// @ts-nocheck\n', '')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            os.rename(filepath, filepath.replace('.ts', '.js'))

# Also revert index.html
html_path = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/index.html'
if os.path.exists(html_path):
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('/src/main.tsx', '/src/main.jsx')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Reverted mass rename")
