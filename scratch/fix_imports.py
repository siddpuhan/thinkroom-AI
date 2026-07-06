import os

def replace_in_file(filepath, old, new):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(old, new)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

replace_in_file('src/app/resources/page.tsx', '../ResourceBoard', '../../ResourceBoard')
replace_in_file('src/app/chat/page.tsx', '../components/ChatPage', '../../components/ChatPage')
replace_in_file('src/app/page.tsx', '../LandingPage', '../../LandingPage')

# fix context
ctx = 'src/context/ThemeContext.jsx'
with open(ctx, 'r', encoding='utf-8') as f:
    c = f.read()
if 'use client' not in c:
    with open(ctx, 'w', encoding='utf-8') as f:
        f.write('"use client";\n' + c)

print("Fixed")
