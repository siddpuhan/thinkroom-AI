import re

file_path = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/store/taskStore.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("export const useTaskStore = create((set, get) => ({", "export const useTaskStore = create<any>((set: any, get: any) => ({")
content = re.sub(r'\(state\)\s*=>', '(state: any) =>', content)
content = re.sub(r'\(taskArray\)\s*=>', '(taskArray: any) =>', content)
content = re.sub(r'\(docArray\)\s*=>', '(docArray: any) =>', content)
content = re.sub(r'\(noteArray\)\s*=>', '(noteArray: any) =>', content)
content = re.sub(r'\(acc,\s*task\)\s*=>', '(acc: any, task: any) =>', content)
content = re.sub(r'\(acc,\s*doc\)\s*=>', '(acc: any, doc: any) =>', content)
content = re.sub(r'\(acc,\s*note\)\s*=>', '(acc: any, note: any) =>', content)
content = re.sub(r'\(prev\)\s*=>', '(prev: any) =>', content)
content = re.sub(r'\(d\)\s*=>', '(d: any) =>', content)
content = re.sub(r'\(t\)\s*=>', '(t: any) =>', content)
content = re.sub(r'\(n\)\s*=>', '(n: any) =>', content)

# Fix chat store
file_path2 = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/store/chatStore.ts'

with open(file_path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = content2.replace("export const useChatStore = create((set, get) => ({", "export const useChatStore = create<any>((set: any, get: any) => ({")
content2 = re.sub(r'\(state\)\s*=>', '(state: any) =>', content2)
content2 = re.sub(r'\(prev\)\s*=>', '(prev: any) =>', content2)
content2 = re.sub(r'\(chunk\)\s*=>', '(chunk: any) =>', content2)

with open(file_path2, 'w', encoding='utf-8') as f:
    f.write(content2)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed implicit any in stores aggressively")
