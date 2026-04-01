/**
 * googleChat.ts
 * -------------------------------------------------------------------------
 * This module provides in-memory chat state and helper functions for the
 * Pivoo AI assistant, including sending messages, maintaining a rolling
 * conversation (short- and long-term memory), summarizing old context,
 * and clearing or inspecting memory.
 *
 * Main functionalities:
 *  - Manage a rolling conversation memory that combines short-term (recent)
 *    messages with a long-term running summary of older exchanges.
 *  - Interface with Supabase edge function ('google-ai-chat') to generate
 *    assistant responses and summarize long-term context.
 *  - Keep conversation context compact with auto summarization, 
 *    supporting robust UX within memory/storage limits.
 * 
 * Note: Conversation data is stored in-memory and is cleared on page refresh.
 */

import { supabase } from '@/integrations/supabase/client';
import { getStoredCustomApiKey } from '@/lib/ai/modelConfig';

/**
 * Represents a single message in the conversation.
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Internal structure for managing rolling conversation memory.
 */
interface ConversationMemory {
  longTermSummary: string;       // Summarized context of earlier messages
  shortTermMessages: ChatMessage[]; // Recent messages (up to MAX_SHORT_TERM_MESSAGES)
}

/**
 * Prompt preamble for the AI system, setting its persona and instructions.
 */
const SYSTEM_PROMPT = `You are Pivoo, a friendly and supportive AI assistant helping users with self-discovery, goal-setting, and personal growth. 
Be encouraging, insightful, and provide actionable advice when appropriate.
Use markdown formatting when helpful (bold, italic, lists, line breaks).
Keep responses focused and practical.`;

/**
 * Conversation configuration constants.
 */
// How many recent (short-term) messages before summarization triggers (3 turns = 6 messages)
const MAX_SHORT_TERM_MESSAGES = 6;
const SUMMARY_MAX_WORDS = 150; // Used to trim overlong summaries

/**
 * In-memory conversation state.
 * Note: Resets on every page load.
 */
let conversationMemory: ConversationMemory = {
  longTermSummary: '',
  shortTermMessages: [],
};

/**
 * Builds the "system" prompt for the assistant, injecting long-term context if available.
 * The system message is always the first message in the conversation sent to the AI.
 */
function buildSystemMessage(): string {
  const languageInstruction = `Always respond in ${currentOutputLanguage}. Never switch languages.`;

  if (conversationMemory.longTermSummary) {
    // If there is previous context, include it under a clear heading for the model
    return `${SYSTEM_PROMPT}
${languageInstruction}

[Previous Conversation Context]
${conversationMemory.longTermSummary}

[Continue the conversation based on this context]`;
  }
  // Default: just the base system prompt
  return `${SYSTEM_PROMPT}
${languageInstruction}`;
}

let currentOutputLanguage = 'English';

export function setChatOutputLanguage(language: string): void {
  currentOutputLanguage = language;
}

/**
 * Summarizes a batch of messages using the AI.
 * Delegates to the 'google-ai-chat' Supabase function with a summarize flag.
 * Falls back to a basic excerpt if the AI summary fails.
 * 
 * @param messages Array of ChatMessage objects to summarize.
 * @returns The summary string.
 */
async function summarizeMessages(messages: ChatMessage[]): Promise<string> {
  if (messages.length === 0) return '';

  try {
    const messagesToSummarize = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Request a summary via the AI function
    const { data, error } = await supabase.functions.invoke('google-ai-chat', {
      body: {
        messages: messagesToSummarize,
        summarize: true,
        customApiKey: getStoredCustomApiKey(),
      },
    });

    if (error) {
      console.error('Error summarizing messages:', error);
      // Fallback: crude summary (last 4 snippets)
      return messages
        .slice(-4)
        .map(m => `${m.role}: ${m.content.slice(0, 100)}...`)
        .join(' | ');
    }

    return data?.text || '';
  } catch (err) {
    console.error('Summarization failed:', err);
    return '';
  }
}

/**
 * Rolls messages from short-term memory into the long-term summary as needed.
 * - If more than MAX_SHORT_TERM_MESSAGES are present, the oldest are summarized and
 *   appended to longTermSummary.
 * - Summaries are trimmed if their length surpasses limits.
 * - Only the latest messages are retained in shortTermMessages.
 */
async function manageMemory(): Promise<void> {
  const { shortTermMessages, longTermSummary } = conversationMemory;

  if (shortTermMessages.length > MAX_SHORT_TERM_MESSAGES) {
    // Identify messages to summarize (all but last MAX_SHORT_TERM_MESSAGES)
    const toSummarize = shortTermMessages.slice(0, -MAX_SHORT_TERM_MESSAGES);
    const toKeep = shortTermMessages.slice(-MAX_SHORT_TERM_MESSAGES);

    // AI-based summarization
    const newSummary = await summarizeMessages(toSummarize);

    // Concatenate to prior long-term summary
    conversationMemory.longTermSummary = longTermSummary
      ? `${longTermSummary}\n\n${newSummary}`
      : newSummary;

    // Truncate summary if it exceeds a word threshold
    const summaryWords = conversationMemory.longTermSummary.split(/\s+/);
    if (summaryWords.length > SUMMARY_MAX_WORDS * 3) {
      conversationMemory.longTermSummary = summaryWords.slice(-SUMMARY_MAX_WORDS * 2).join(' ');
    }

    // Retain only newest short-term messages
    conversationMemory.shortTermMessages = toKeep;

    console.log('Memory compressed. Summary length:', conversationMemory.longTermSummary.length);
  }
}

/**
 * Sends a user message to the AI, appending it to memory and returning the assistant's response.
 * Handles in-memory tracking, AI invocation, error recovery, and memory rolling.
 * 
 * @param message The user's message text.
 * @returns The assistant's response text.
 */
export async function sendChatMessage(message: string): Promise<string> {
  if (!message.trim()) {
    throw new Error('Message cannot be empty');
  }

  // Record the user message in short-term memory
  conversationMemory.shortTermMessages.push({
    role: 'user',
    content: message.trim(),
  });

  // Prepare the full context: system message + conversation so far
  const messagesForApi = [
    { role: 'system' as const, content: buildSystemMessage() },
    ...conversationMemory.shortTermMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  try {
    // Request an assistant reply from the AI
    const { data, error } = await supabase.functions.invoke('google-ai-chat', {
      body: {
        messages: messagesForApi,
        customApiKey: getStoredCustomApiKey(),
      },
    });

    if (error) {
      // Remove the user message if the AI fails
      conversationMemory.shortTermMessages.pop();
      throw new Error(error.message || 'Failed to get AI response');
    }

    const responseText = data?.text || 'I apologize, but I could not generate a response.';

    // Save assistant reply in memory
    conversationMemory.shortTermMessages.push({
      role: 'assistant',
      content: responseText,
    });

    // Summarize/move memory if required
    await manageMemory();

    return responseText;
  } catch (err) {
    // Roll back the user message if anything fails
    conversationMemory.shortTermMessages.pop();
    throw err;
  }
}

/**
 * Retrieves the active conversation (not summarized).
 * 
 * @returns Array of recent conversation messages.
 */
export function getConversationMessages(): ChatMessage[] {
  // Shallow copy: consumers can't mutate internal state directly
  return [...conversationMemory.shortTermMessages];
}

/**
 * For debugging/devtools: get the raw longTermSummary and shortTermMessages.
 * 
 * @returns Snapshot of all tracked conversation memory.
 */
export function getMemoryState(): ConversationMemory {
  return { ...conversationMemory };
}

/**
 * Clears all conversation state (both summary and recent messages).
 * Use to reset chat history.
 */
export function clearConversation(): void {
  conversationMemory = {
    longTermSummary: '',
    shortTermMessages: [],
  };
}
