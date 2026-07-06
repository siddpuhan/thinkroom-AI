import re

file_path = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src/components/tasks/AITaskWorkspace.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const { tasks, fetchTasks, loading: tasksLoading } = useTaskStore();\n  const { notes, fetchNotes, loading: notesLoading } = useNoteStore();\n  const { documents, fetchDocuments, loading: docsLoading } = useDocumentStore();",
"const tasks = useTaskStore(state => state.tasks);\n  const notes = useTaskStore(state => state.notes);\n  const documents = useTaskStore(state => state.documents);")

content = content.replace("fetchTasks(roomId);\n    fetchNotes(roomId);\n    fetchDocuments(roomId);", "// no-op")

content = content.replace("const isDecisionCandidate = !!latestDecisionCandidate;\n  const isDecisionFinal = !!latestDecisionFinal;", "")
content = content.replace("const getDecisionMessage = () => '';", "")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("AITaskWorkspace.jsx patched")

file_path_2 = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/server/services/decisions/DecisionWorkflow.js'
with open(file_path_2, 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = content2.replace("const hasConsensus = Boolean(Boolean(evaluation.decision && evaluation.decision.length > 5));", "const hasConsensus = Boolean(evaluation.decision && evaluation.decision.length > 5);")

with open(file_path_2, 'w', encoding='utf-8') as f:
    f.write(content2)

print("DecisionWorkflow.js patched")
