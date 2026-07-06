import json
import os

pkg_path = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/server/package.json'
with open(pkg_path, 'r', encoding='utf-8') as f:
    pkg = json.load(f)

pkg['scripts']['start'] = 'node --loader ts-node/esm index.ts'
pkg['scripts']['dev'] = 'nodemon --exec "node --loader ts-node/esm index.ts"'
pkg['scripts']['type-check'] = 'tsc --noEmit'

with open(pkg_path, 'w', encoding='utf-8') as f:
    json.dump(pkg, f, indent=2)

ts_path = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/server/tsconfig.json'
tsconfig = {
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": True,
    "strict": False,
    "skipLibCheck": True,
    "forceConsistentCasingInFileNames": True,
    "outDir": "./dist",
    "allowJs": True
  },
  "include": ["**/*.ts", "**/*.js"],
  "exclude": ["node_modules", "dist"]
}

with open(ts_path, 'w', encoding='utf-8') as f:
    json.dump(tsconfig, f, indent=2)

print("Updated package.json and tsconfig.json")
