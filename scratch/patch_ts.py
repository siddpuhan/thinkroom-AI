import re
import os

base_dir = 'c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/src'

# taskStore.ts
with open(os.path.join(base_dir, 'store/taskStore.ts'), 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { create } from 'zustand';", "import { create } from 'zustand';\nimport { Task, Document, Note, Decision } from '../types/models';")

content = content.replace("export const useTaskStore = create((set, get) => ({", """
interface TaskStoreState {
  tasks: Record<string, Task>;
  documents: Record<string, Document>;
  notes: Record<string, Note>;
  isPanelOpen: boolean;
  latestTask: Task | null;
  latestDocument: Document | null;
  latestNote: Note | null;
  latestDecisionCandidate: Decision | null;
  latestDecisionFinal: Decision | null;
  showNotification: boolean;
  notificationType: 'task' | 'document' | 'note' | null;
  newTaskCount: number;
  isGeneratingTask: boolean;
  error: string | null;

  upsertTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  setTasks: (tasks: Task[]) => void;
  upsertDocument: (doc: Document) => void;
  removeDocument: (docId: string) => void;
  setDocuments: (docs: Document[]) => void;
  upsertNote: (note: Note) => void;
  removeNote: (noteId: string) => void;
  setNotes: (notes: Note[]) => void;
  
  openPanel: () => void;
  closePanel: () => void;
  dismissNotification: () => void;
  clearError: () => void;
  
  setDecisionCandidate: (decision: Decision) => void;
  setDecisionFinal: (decision: Decision) => void;
  
  fetchTasks: (roomId: string) => void;
  fetchDocuments: (roomId: string) => void;
  fetchNotes: (roomId: string) => void;
  fetchDecisions: (roomId: string) => void;
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
""")

content = content.replace("tasks: {},", "tasks: {} as Record<string, Task>,")
content = content.replace("documents: {},", "documents: {} as Record<string, Document>,")
content = content.replace("notes: {},", "notes: {} as Record<string, Note>,")

content = re.sub(r'upsertTask:\s*\(task\)\s*=>', 'upsertTask: (task: Task) =>', content)
content = re.sub(r'removeTask:\s*\(taskId\)\s*=>', 'removeTask: (taskId: string) =>', content)
content = re.sub(r'setTasks:\s*\(tasksList\)\s*=>', 'setTasks: (tasksList: Task[]) =>', content)

content = re.sub(r'upsertDocument:\s*\(doc\)\s*=>', 'upsertDocument: (doc: Document) =>', content)
content = re.sub(r'removeDocument:\s*\(docId\)\s*=>', 'removeDocument: (docId: string) =>', content)
content = re.sub(r'setDocuments:\s*\(docsList\)\s*=>', 'setDocuments: (docsList: Document[]) =>', content)

content = re.sub(r'upsertNote:\s*\(note\)\s*=>', 'upsertNote: (note: Note) =>', content)
content = re.sub(r'removeNote:\s*\(noteId\)\s*=>', 'removeNote: (noteId: string) =>', content)
content = re.sub(r'setNotes:\s*\(notesList\)\s*=>', 'setNotes: (notesList: Note[]) =>', content)

content = re.sub(r'setDecisionCandidate:\s*\(decision\)\s*=>', 'setDecisionCandidate: (decision: Decision) =>', content)
content = re.sub(r'setDecisionFinal:\s*\(decision\)\s*=>', 'setDecisionFinal: (decision: Decision) =>', content)

content = re.sub(r'fetchTasks:\s*async\s*\(roomId\)\s*=>', 'fetchTasks: async (roomId: string) =>', content)
content = re.sub(r'fetchDocuments:\s*async\s*\(roomId\)\s*=>', 'fetchDocuments: async (roomId: string) =>', content)
content = re.sub(r'fetchNotes:\s*async\s*\(roomId\)\s*=>', 'fetchNotes: async (roomId: string) =>', content)
content = re.sub(r'fetchDecisions:\s*async\s*\(roomId\)\s*=>', 'fetchDecisions: async (roomId: string) =>', content)

content = re.sub(r'const getLatestItems = \(category\)\s*=>', 'const getLatestItems = (category: string) =>', content)
content = re.sub(r'\((a,\s*b|a,\s*b,\s*c)\)\s*=>\s*new Date\([a-zA-Z]+\.[a-zA-Z_]+\)', '(a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()', content)

content = content.replace("new Date(b.created_at) - new Date(a.created_at)", "new Date(b.created_at).getTime() - new Date(a.created_at).getTime()")

content = re.sub(r'\.sort\(\(a,\s*b\)\s*=>\s*\{[^}]+\}\)', '.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())', content)


with open(os.path.join(base_dir, 'store/taskStore.ts'), 'w', encoding='utf-8') as f:
    f.write(content)

# chatStore.ts
with open(os.path.join(base_dir, 'store/chatStore.ts'), 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { create } from 'zustand';", "import { create } from 'zustand';\nimport { Message } from '../types/models';")

content = content.replace("export const useChatStore = create((set, get) => ({", """
interface ChatStoreState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
""")

content = re.sub(r'setMessages:\s*\(messages\)\s*=>', 'setMessages: (messages: Message[]) =>', content)
content = re.sub(r'addMessage:\s*\(message\)\s*=>', 'addMessage: (message: Message) =>', content)
content = re.sub(r'updateMessage:\s*\(messageId,\s*updates\)\s*=>', 'updateMessage: (messageId: string, updates: Partial<Message>) =>', content)
content = re.sub(r'setError:\s*\(error\)\s*=>', 'setError: (error: string | null) =>', content)
content = re.sub(r'setLoading:\s*\(loading\)\s*=>', 'setLoading: (loading: boolean) =>', content)

with open(os.path.join(base_dir, 'store/chatStore.ts'), 'w', encoding='utf-8') as f:
    f.write(content)

# offlineSync.ts
with open(os.path.join(base_dir, 'utils/offlineSync.ts'), 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { initDB } from '../db';", "import { initDB } from '../db';\nimport { Message } from '../types/models';")

content = re.sub(r'export const getOfflineMessages = async \(roomId\) => {', 'export const getOfflineMessages = async (roomId: string): Promise<Message[]> => {', content)
content = re.sub(r'export const syncOfflineMessages = async \(roomId\) => {', 'export const syncOfflineMessages = async (roomId: string): Promise<void> => {', content)
content = re.sub(r'export const saveMessagesOffline = async \(roomId,\s*messages\) => {', 'export const saveMessagesOffline = async (roomId: string, messages: Message[]): Promise<void> => {', content)
content = re.sub(r'export const savePendingMessage = async \(roomId,\s*message\) => {', 'export const savePendingMessage = async (roomId: string, message: Message): Promise<void> => {', content)
content = re.sub(r'export const clearOfflineMessages = async \(roomId\) => {', 'export const clearOfflineMessages = async (roomId: string): Promise<void> => {', content)

with open(os.path.join(base_dir, 'utils/offlineSync.ts'), 'w', encoding='utf-8') as f:
    f.write(content)

# db.ts
with open(os.path.join(base_dir, 'db.ts'), 'r', encoding='utf-8') as f:
    content = f.read()
    
content = content.replace("export const initDB = async () => {", "export const initDB = async (): Promise<any> => {")

with open(os.path.join(base_dir, 'db.ts'), 'w', encoding='utf-8') as f:
    f.write(content)
