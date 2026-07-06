import os

with open('c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/server/index.ts', 'r', encoding='utf8') as f:
    lines = f.readlines()

imports = [
    'import { Server, Socket } from "socket.io";\n',
    'import { detectPersona } from "../ai/router.js";\n',
    'import { processPersonaStream } from "../ai/groqService.js";\n',
    'import { PrefilterService } from "../services/ai/PrefilterService.js";\n',
    'import { GroqExtraction } from "../services/ai/GroqExtraction.js";\n',
    'import { TaskService } from "../services/tasks/TaskService.js";\n',
    'import { DecisionWorkflow } from "../services/decisions/DecisionWorkflow.js";\n',
    'import { DocumentService } from "../services/documents/DocumentService.js";\n',
    'import { ConversationBuffer } from "../services/ai/ConversationBuffer.js";\n',
    'import { NotesDispatcher } from "../services/notes/NotesDispatcher.js";\n',
    'import { NotesService } from "../services/notes/NotesService.js";\n',
    'import { SummaryBuilder } from "../services/summary/SummaryBuilder.js";\n',
    'import { MemoryService } from "../services/memory/MemoryService.js";\n',
]

socket_controller_content = "".join(imports) + "\n"
socket_controller_content += "export const setupSocket = (io: Server) => {\n"
for i in range(71, 508):
    socket_controller_content += lines[i]
socket_controller_content += "};\n"

with open('c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/server/controllers/socketController.ts', 'w', encoding='utf8') as f:
    f.write(socket_controller_content)

new_index_lines = []
for i in range(71):
    new_index_lines.append(lines[i])

new_index_lines.append('import { setupSocket } from "./controllers/socketController.js";\n')
new_index_lines.append('import { securityMiddleware } from "./middleware/security.js";\n')
new_index_lines.append('import { httpLogger } from "./middleware/logger.js";\n')
new_index_lines.append('import { errorHandler } from "./middleware/errorHandler.js";\n')

express_json_idx = -1
for i, line in enumerate(new_index_lines):
    if 'app.use(express.json())' in line:
        express_json_idx = i
        break

if express_json_idx != -1:
    new_index_lines.insert(express_json_idx, 'app.use(httpLogger);\n')
    new_index_lines.insert(express_json_idx, 'app.use(securityMiddleware);\n')

for i in range(508, len(lines)):
    if 'httpServer.listen' in lines[i]:
        new_index_lines.append('  setupSocket(io);\n')
    new_index_lines.append(lines[i])

new_index_lines.append('app.use(errorHandler);\n')

with open('c:/Users/Siddharth Puhan/cpp/.vscode/do.c/python/disaster-connect-pwa/server/index.ts', 'w', encoding='utf8') as f:
    f.write("".join(new_index_lines))

print("Extraction completed.")
