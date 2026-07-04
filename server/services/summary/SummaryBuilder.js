import { groq, withRetry } from "../../utils/groqClient.js";
import { logger } from "../../utils/logger.js";
import { ConversationBuffer } from "../ai/ConversationBuffer.js";
import { SummaryService } from "./SummaryService.js";

export class SummaryBuilder {
  static async generateSummary(roomId, summaryType, requestorName) {
    logger.info("SUMMARY_BUILDER", `🚀 Starting summary generation. Type: ${summaryType}, Room: ${roomId}`);

    const messageWindow = ConversationBuffer.getWindow(roomId);
    if (!messageWindow || messageWindow.length === 0) {
      logger.warn("SUMMARY_BUILDER", "No messages in buffer to summarize.");
      throw new Error("No recent messages to summarize.");
    }

    const conversationText = messageWindow
      .map(msg => `[${msg.sender_name}]: ${msg.text}`)
      .join('\n');

    let systemPrompt = '';
    
    if (summaryType === 'meeting') {
      systemPrompt = `You are an expert AI meeting assistant. Generate a comprehensive Meeting Summary based on the provided conversation.
REQUIRED JSON FORMAT:
{
  "title": "Meeting Summary: [Topic]",
  "content": "A detailed 2-3 paragraph summary of the meeting's main points and conclusions.",
  "highlights": ["Key point 1", "Key point 2", "Decision made", "Important risk"],
  "participants": ["Name1", "Name2"]
}
Focus on: Discussion Topics, Tasks Created, Decisions Made, Risks, Pending Work.`;
    } else if (summaryType === 'daily') {
      systemPrompt = `You are an expert AI project manager. Generate a Daily Summary (Today's Work) based on the provided conversation.
REQUIRED JSON FORMAT:
{
  "title": "Daily Summary: Today's Work",
  "content": "A concise overview of what was accomplished today and what is pending.",
  "highlights": ["Task completed: X", "Task pending: Y", "AI insight: Z"],
  "participants": ["Name1", "Name2"]
}
Focus on: Tasks completed, tasks pending, decisions, overall progress.`;
    } else {
      // Default to catch_up
      systemPrompt = `You are a helpful AI assistant. Generate a Catch-Up Summary ('While You Were Away') for a user who just joined the room based on the provided conversation.
REQUIRED JSON FORMAT:
{
  "title": "Catch-Up: While You Were Away",
  "content": "A brief summary of what the user missed.",
  "highlights": ["Important message 1", "Task assigned to someone", "Decision finalized"],
  "participants": ["Name1", "Name2"]
}
Focus on: Messages missed, tasks assigned, decisions finalized, important discussions.`;
    }

    try {
      logger.info("SUMMARY_BUILDER", `📡 Calling Groq API...`);
      
      const completion = await withRetry(() => groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Conversation:\n${conversationText}` }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 1024,
        response_format: { type: "json_object" }
      }));

      const rawJson = completion.choices[0]?.message?.content;
      if (!rawJson) {
        throw new Error("Empty response from Groq");
      }

      const parsed = JSON.parse(rawJson);
      
      if (!parsed.title || !parsed.content) {
        throw new Error("Invalid response format from Groq. Missing title or content.");
      }

      // Save to database
      const savedSummary = await SummaryService.create({
        roomId,
        summaryType: summaryType === 'meeting' || summaryType === 'daily' || summaryType === 'catch_up' ? summaryType : 'catch_up',
        title: parsed.title,
        content: parsed.content,
        highlights: parsed.highlights || [],
        participants: parsed.participants || [],
        createdBy: requestorName || 'AI_SYSTEM'
      });

      return savedSummary;

    } catch (err) {
      logger.error("SUMMARY_BUILDER", `❌ Summary generation failed: ${err.message}`);
      throw err;
    }
  }
}
