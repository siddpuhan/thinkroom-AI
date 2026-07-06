import os
import re

def strip_extensions(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Replace .js and .jsx in imports
                # e.g., import ... from './store/taskStore.js'; -> import ... from './store/taskStore';
                new_content = re.sub(r'(import.*?from\s+[\'"].*?)\.js([\'"])', r'\1\2', content)
                new_content = re.sub(r'(import.*?from\s+[\'"].*?)\.jsx([\'"])', r'\1\2', new_content)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed imports in {filepath}")

strip_extensions('c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src')
