import re

file_path = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/store/taskStore.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix sorting type errors
content = re.sub(r'\(a:\s*any,\s*b:\s*any\)\s*=>\s*new Date\(b\.created_at\)\.getTime\(\)\s*-\s*new Date\(a\.created_at\)\.getTime\(\)',
                 '(a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()', content)

content = content.replace("latestDecisionCandidate, latestDecisionFinal, error, clearError, and 6 more", "") # (comment out just in case)
content = re.sub(r'\(d\)\s*=>', '(d: any) =>', content)
content = re.sub(r'\(n\)\s*=>', '(n: any) =>', content)
content = re.sub(r'\(t\)\s*=>', '(t: any) =>', content)
content = re.sub(r'\(category\)\s*=>', '(category: any) =>', content)
content = re.sub(r'\(status\)\s*=>', '(status: any) =>', content)
content = re.sub(r'\(isGenerating\)\s*=>', '(isGenerating: any) =>', content)
content = re.sub(r'\(taskId,\s*newStatus\)\s*=>', '(taskId: any, newStatus: any) =>', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

file_path2 = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/utils/offlineSync.ts'
with open(file_path2, 'r', encoding='utf-8') as f:
    content2 = f.read()
    
content2 = re.sub(r'\(roomId\)', '(roomId: string)', content2)
content2 = re.sub(r'\(roomId,\s*messages\)', '(roomId: string, messages: any[])', content2)
content2 = re.sub(r'\(roomId,\s*message\)', '(roomId: string, message: any)', content2)

with open(file_path2, 'w', encoding='utf-8') as f:
    f.write(content2)

file_path3 = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/db.ts'
with open(file_path3, 'r', encoding='utf-8') as f:
    content3 = f.read()

content3 = re.sub(r'\(message\)', '(message: any)', content3)
content3 = re.sub(r'\(resource\)', '(resource: any)', content3)

with open(file_path3, 'w', encoding='utf-8') as f:
    f.write(content3)

file_path4 = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/store/chatStore.ts'
with open(file_path4, 'r', encoding='utf-8') as f:
    content4 = f.read()

content4 = re.sub(r'\(socket\)', '(socket: any)', content4)
content4 = re.sub(r'\(roomId\)', '(roomId: any)', content4)
content4 = re.sub(r'\(data\)', '(data: any)', content4)

with open(file_path4, 'w', encoding='utf-8') as f:
    f.write(content4)

print("Stores patched")
