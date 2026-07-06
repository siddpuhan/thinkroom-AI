import os
import shutil

if os.path.exists('dist'):
    shutil.rmtree('dist')

if os.path.exists('original_AITaskWorkspace.jsx'):
    os.remove('original_AITaskWorkspace.jsx')

if os.path.exists('src/store/chatStore.d.ts'):
    os.remove('src/store/chatStore.d.ts')

eslint_path = 'eslint.config.js'
with open(eslint_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('files: ["**/*.{js,jsx,ts,tsx}"],', 'ignores: ["dist/**", "scratch/**", "node_modules/**"],\n    files: ["src/**/*.{js,jsx,ts,tsx}", "server/**/*.{js,ts}"],')

with open(eslint_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Cleaned up files and fixed eslint config")
