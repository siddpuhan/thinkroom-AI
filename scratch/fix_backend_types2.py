import os

# 1. groqService.ts
p = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/server/ai/groqService.ts'
with open(p, 'r', encoding='utf8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'messages: chatHistory' in line:
        lines[i] = line.replace('messages: chatHistory', 'messages: chatHistory as any')
with open(p, 'w', encoding='utf8') as f:
    f.writelines(lines)

# 2. DecisionWorkflow.ts
p = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/server/services/decisions/DecisionWorkflow.ts'
with open(p, 'r', encoding='utf8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'let parsed = {}' in line:
        lines[i] = line.replace('let parsed = {}', 'let parsed: any = {}')
with open(p, 'w', encoding='utf8') as f:
    f.writelines(lines)

# 3. SummaryBuilder.ts
p = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/server/services/summary/SummaryBuilder.ts'
with open(p, 'r', encoding='utf8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'participants: activeUsers' in line:
        lines[i] = line.replace('participants: activeUsers,', 'participants: activeUsers,\\n      sourceMessages: [],')
with open(p, 'w', encoding='utf8') as f:
    f.writelines(lines)
