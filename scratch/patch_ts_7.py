import re

file_path = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/store/taskStore.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("Object.values(state.tasks)", "Object.values(state.tasks as any)")
content = content.replace("Object.values(state.documents)", "Object.values(state.documents as any)")
content = content.replace("Object.values(state.notes)", "Object.values(state.notes as any)")
content = content.replace("Object.values(tasks)", "Object.values(tasks as any)")
content = content.replace("Object.values(documents)", "Object.values(documents as any)")
content = content.replace("Object.values(notes)", "Object.values(notes as any)")

content = re.sub(r'\(state: any\)\s*=>\s*state\.addMessage', '(state: any) => (state as any).addMessage', content)
content = re.sub(r'\(state: any\)\s*=>\s*state\.updateMessage', '(state: any) => (state as any).updateMessage', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

file_path3 = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/components/chat/ChatInput.tsx'
if __import__("os").path.exists(file_path3):
    with open(file_path3, 'r', encoding='utf-8') as f:
        content3 = f.read()
    content3 = content3.replace("(state: any) => state.addMessage", "(state: any) => (state as any).addMessage")
    content3 = content3.replace("(state: any) => state.updateMessage", "(state: any) => (state as any).updateMessage")
    with open(file_path3, 'w', encoding='utf-8') as f:
        f.write(content3)

print("Fixed unknown errors via as any")
