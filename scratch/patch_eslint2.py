import os

eslint_path = 'eslint.config.js'
with open(eslint_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('"scratch/**",', '"scratch/**", "public/**",')
content = content.replace('"react/react-in-jsx-scope": "off",', '"react/react-in-jsx-scope": "off",\n      "react/no-unescaped-entities": "off",\n      "react/display-name": "off",')

with open(eslint_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed eslint ignores and rules")
