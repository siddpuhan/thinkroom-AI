import os
import re

filepath = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/components/ChatPage.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('localStorage.getItem', '(typeof window !== "undefined" ? localStorage.getItem.bind(localStorage) : () => null)')
content = content.replace('localStorage.setItem', '(typeof window !== "undefined" ? localStorage.setItem.bind(localStorage) : () => {})')
content = content.replace('localStorage.removeItem', '(typeof window !== "undefined" ? localStorage.removeItem.bind(localStorage) : () => {})')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched localStorage")
