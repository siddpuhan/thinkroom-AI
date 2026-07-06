import re

file_path = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/utils/offlineSync.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("getStorageKey(roomId: string)", "getStorageKey(roomId)")
content = content.replace("getOfflineMessages(roomId: string)", "getOfflineMessages(roomId)")
content = content.replace("localStorage.removeItem(`offlineMessages_${roomId: string}`)", "localStorage.removeItem(`offlineMessages_${roomId}`)")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed offlineSync.ts")
