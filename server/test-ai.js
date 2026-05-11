import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

// Initialize Groq client with API key from .env
const apiKey = process.env.GROQ_API_KEY;

if (!apiKey || apiKey === "gsk_your_key_here") {
  console.error("❌ ERROR: Your GROQ_API_KEY is missing or still set to the placeholder in .env!");
  console.error("Please replace 'gsk_your_key_here' with your actual key from https://console.groq.com");
  process.exit(1);
}

const groq = new Groq({ apiKey });

async function main() {
  const chatCompletion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: "Say: ThinkRoom AI is working for free on Groq!" }],
  });
  console.log(chatCompletion.choices[0].message.content);
}

main();
