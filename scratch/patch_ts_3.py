import re

file_path = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/db.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("await store.add(message: any);", "await store.add(message);")
content = content.replace("await store.add(resource: any);", "await store.add(resource);")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

file_path2 = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/utils/offlineSync.ts'

with open(file_path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = content2.replace("const tx = db.transaction(roomId: string, 'readwrite');", "const tx = db.transaction(roomId, 'readwrite');")
content2 = content2.replace("const store = tx.objectStore(roomId: string);", "const store = tx.objectStore(roomId);")
content2 = content2.replace("const tx = db.transaction(roomId: string, 'readonly');", "const tx = db.transaction(roomId, 'readonly');")
content2 = content2.replace("await store.put(message: any);", "await store.put(message);")
content2 = content2.replace("await savePendingMessage(roomId: string, message: any);", "await savePendingMessage(roomId, message);")
content2 = content2.replace("await saveMessagesOffline(roomId: string, messages: any[]);", "await saveMessagesOffline(roomId, messages);")
content2 = content2.replace("await clearOfflineMessages(roomId: string);", "await clearOfflineMessages(roomId);")

with open(file_path2, 'w', encoding='utf-8') as f:
    f.write(content2)

print("Fixed syntax errors")
