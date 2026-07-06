import os

f1 = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/context/ThemeContext.jsx'
with open(f1, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace("const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;", "const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;")
with open(f1, 'w', encoding='utf-8') as f:
    f.write(c)

f2 = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/utils/logger.ts'
with open(f2, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace("window.location.hostname", "(typeof window !== 'undefined' ? window.location.hostname : '')")
with open(f2, 'w', encoding='utf-8') as f:
    f.write(c)

print("Patched window uses")
