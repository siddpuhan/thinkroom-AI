import { Task, Document, Note, Decision, Message } from './models';

export interface ServerToClientEvents {
  task_created: (task: Task) => void;
  task_updated: (task: Task) => void;
  task_deleted: (payload: { taskId: string }) => void;
  document_created: (doc: Document) => void;
  document_updated: (doc: Document) => void;
  document_deleted: (payload: { docId: string }) => void;
  note_created: (note: Note) => void;
  note_updated: (note: Note) => void;
  note_deleted: (payload: { noteId: string }) => void;
  decision_candidate: (decision: Decision) => void;
  decision_finalized: (decision: Decision) => void;
  summary_generation_status: (payload: { status: 'generating' | 'completed' | 'error', type: string }) => void;
  chat_message: (message: Message) => void;
  error: (payload: { message: string }) => void;
}

export interface ClientToServerEvents {
  join_room: (roomId: string) => void;
  get_tasks: (payload: { roomId: string }, callback: (tasks: Task[]) => void) => void;
  get_documents: (payload: { roomId: string }, callback: (docs: Document[]) => void) => void;
  get_notes: (payload: { roomId: string }, callback: (notes: Note[]) => void) => void;
  hard_delete_task: (payload: { taskId: string, roomId: string }) => void;
  hard_delete_document: (payload: { docId: string, roomId: string }) => void;
  hard_delete_decision: (payload: { decisionId: string, roomId: string }) => void;
  request_summary: (payload: { roomId: string, requestorName: string, message: string }) => void;
}
