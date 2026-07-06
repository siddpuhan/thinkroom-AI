import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { logger } from "./logger.js";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  logger.warn("GEMINI-CLIENT", "GEMINI_API_KEY environment variable is not set. AI capabilities will be disabled.");
}

export const googleAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Executes a Gemini API call function with exponential backoff retries.
 * @param {Function} apiCallFn - The async function that makes the Gemini API call.
 * @param {number} maxRetries - Maximum number of retry attempts. Default is 3.
 * @param {number} initialDelay - Initial delay in milliseconds. Default is 1000ms.
 * @returns {Promise<any>} - The resolved result from the API call.
 */
export async function withRetry(apiCallFn, maxRetries = 3, initialDelay = 1000) {
  let attempt = 0;
  while (true) {
    try {
      return await apiCallFn();
    } catch (error: any) {
      attempt++;
      
      const statusCode = error.status || error.statusCode;
      const isRateLimit = statusCode === 429 || error.message?.includes("RESOURCE_EXHAUSTED");
      const isServerError = statusCode >= 500;
      const isNetworkError = !statusCode; // DNS or connection failure
      
      const shouldRetry = isRateLimit || isServerError || isNetworkError;
      
      if (attempt >= maxRetries || !shouldRetry) {
        logger.error("GEMINI-CLIENT", `Call failed after ${attempt} attempts. Error: ${error.message}`);
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, attempt - 1);
      logger.warn("GEMINI-CLIENT", `Attempt ${attempt} failed with ${statusCode || 'NetworkError'}: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
