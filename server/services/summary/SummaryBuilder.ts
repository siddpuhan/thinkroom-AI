import { googleAI, withRetry } from "../../utils/geminiClient.js";
import { logger } from "../../utils/logger.js";
import { ConversationBuffer } from "../ai/ConversationBuffer.js";
import { DocumentService } from "../documents/DocumentService.js";

export class SummaryBuilder {
  static async generateSummary(roomId, summaryType, requestorName) {
    logger.info("SUMMARY_BUILDER", `🚀 Starting summary generation. Type: ${summaryType}, Room: ${roomId}`);

    if (!googleAI) {
      logger.error("SUMMARY_BUILDER", "Gemini API is not configured.");
      throw new Error("Gemini API is not configured.");
    }

    const messageWindow = ConversationBuffer.getWindow(roomId);
    if (!messageWindow || messageWindow.length === 0) {
      logger.warn("SUMMARY_BUILDER", "No messages in buffer to summarize.");
      throw new Error("No recent messages to summarize.");
    }

    const conversationText = messageWindow
      .map(msg => `[${msg.sender_name}]: ${msg.text}`)
      .join('\n');

    let systemPrompt = '';
    let documentCategory = 'General Documentation';
    
    if (summaryType === 'meeting') {
      documentCategory = 'Meeting Summary';
      systemPrompt = `You are an expert AI meeting assistant. Generate a comprehensive Meeting Summary based on the provided conversation.
REQUIRED JSON FORMAT (no markdown formatting block):
{
  "title": "Meeting Summary: [Topic]",
  "content": "A detailed 2-3 paragraph summary of the meeting's main points and conclusions.",
  "highlights": ["Key point 1", "Key point 2", "Decision made", "Important risk"],
  "participants": ["Name1", "Name2"]
}
Focus on: Discussion Topics, Tasks Created, Decisions Made, Risks, Pending Work.`;
    } else if (summaryType === 'daily') {
      documentCategory = 'Catch Up Summary';
      systemPrompt = `You are an expert AI project manager. Generate a Daily Summary (Today's Work) based on the provided conversation.
REQUIRED JSON FORMAT (no markdown formatting block):
{
  "title": "Daily Summary: Today's Work",
  "content": "A concise overview of what was accomplished today and what is pending.",
  "highlights": ["Task completed: X", "Task pending: Y", "AI insight: Z"],
  "participants": ["Name1", "Name2"]
}
Focus on: Tasks completed, tasks pending, decisions, overall progress.`;
    } else {
      documentCategory = 'Catch Up Summary';
      systemPrompt = `You are a helpful AI assistant. Generate a Catch-Up Summary ('While You Were Away') for a user who just joined the room based on the provided conversation.
REQUIRED JSON FORMAT (no markdown formatting block):
{
  "title": "While You Were Away",
  "content": "A brief summary of what the user missed.",
  "highlights": ["Important message 1", "Task assigned to someone", "Decision finalized"],
  "participants": ["Name1", "Name2"]
}
Focus on: Messages missed, tasks assigned, decisions finalized, important discussions.`;
    }

    try {
      logger.info("SUMMARY_BUILDER", `📡 Calling Gemini API (model: gemini-2.5-flash)...`);
      
      const model = googleAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const response = await withRetry(() => model.generateContent({
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\nConversation:\n${conversationText}` }] }
        ]
      }));

      const rawJson = response.response.text();
      if (!rawJson) {
        throw new Error("Empty response from Gemini");
      }

      const parsed = JSON.parse(rawJson);
      
      if (!parsed.title || !parsed.content) {
        throw new Error("Invalid response format from Gemini. Missing title or content.");
      }

      const contentObj = {
        details: parsed.content,
        highlights: parsed.highlights || [],
      };

      const recentDoc = await DocumentService.getRecentDocument(roomId, documentCategory);

      let savedDocument;
      if (recentDoc) {
        savedDocument = await DocumentService.update(recentDoc.id, {
          title: parsed.title,
          status: 'final',
          summary: parsed.content.substring(0, 200) + '...',
          content: JSON.stringify(contentObj),
          participants: parsed.participants || [],
          sourceMessages: [],
          confidence: 0.9,
        });
        logger.info("SUMMARY_BUILDER", `🔄 Updated existing recent summary ${savedDocument.id}`);
      } else {
        savedDocument = await DocumentService.create({
          roomId,
          category: documentCategory,
          title: parsed.title,
          status: 'final',
          summary: parsed.content.substring(0, 200) + '...',
          content: JSON.stringify(contentObj),
          participants: parsed.participants || [],
          sourceMessages: [],
          confidence: 0.9,
        });
        logger.info("SUMMARY_BUILDER", `✅ Created new summary ${savedDocument.id}`);
      }

      return savedDocument;

    } catch (err: any) {
      logger.error("SUMMARY_BUILDER", `❌ Summary generation failed: ${err.message}`);
      throw err;
    }
  }
}

