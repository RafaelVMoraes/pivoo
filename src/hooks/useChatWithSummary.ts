/**
 * useChatWithSummary.ts
 *
 * Custom React hook for managing a chatbot conversation with rolling memory and summary.
 * 
 * Features:
 * - Stores the user's and assistant's messages in state for UI display.
 * - Handles sending new user messages and retrieving async assistant responses.
 * - Provides error handling, optimistic updates, and chat session/reset support.
 * - Wraps Google-based chat backend logic (see @/integrations/googleChat).
 *
 * API:
 *   useChatWithSummary()
 *   => {
 *     messages,     // Array of chat display messages (user & assistant)
 *     isLoading,    // Boolean indicating if API call is in progress
 *     error,        // Any error string for UI display, else null
 *     sendMessage,  // Function: send a new user message (async)
 *     clearChat,    // Function: clear the chat session and local display
 *   }
 *
 * `DisplayMessage` type: standardized message for chatbot UI.
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  sendChatMessage, 
  getConversationMessages, 
  clearConversation,
  setChatOutputLanguage,
  type ChatMessage 
} from '@/integrations/googleChat';
import { useProfile } from '@/hooks/useProfile';
import { toPromptLanguage } from '@/lib/ai/language';

/**
 * DisplayMessage
 * Represents a single chat message in the chat UI.
 */
export interface DisplayMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

/**
 * useChatWithSummary
 *
 * Hook for managing a rolling-memory chat session, suitable for AI-powered chatbot UIs.
 *
 * @returns Chat state, loading/error, and imperative chat actions (send/clear).
 */
export const useChatWithSummary = () => {
  const { profile } = useProfile();
  // --- State hooks ---
  const [messages, setMessages] = useState<DisplayMessage[]>([]);           // All messages in current chat session
  const [isLoading, setIsLoading] = useState(false);                       // Loading spinner / API-inflight indicator
  const [error, setError] = useState<string | null>(null);                 // Error message, for UI display

  useEffect(() => {
    setChatOutputLanguage(toPromptLanguage(profile?.language));
  }, [profile?.language]);

  /**
   * Fetch current conversation messages from storage/session and update state for UI.
   * (This is a "sync now" utility, not automatically invoked.)
   */
  const syncMessages = useCallback(() => {
    const conversationMessages = getConversationMessages();
    setMessages(
      conversationMessages.map((msg, index) => ({
        id: `msg-${index}-${Date.now()}`,       // Uniqueness: index + now to handle quick refreshes
        content: msg.content,
        role: msg.role,
        timestamp: new Date(),
      }))
    );
  }, []);

  /**
   * Send a user message, optimistically adds it, and fetches assistant response.
   * Handles API success/error, rollback on error, and UI sync.
   *
   * @param {string} message - User's input message
   */
  const sendMessage = useCallback(async (message: string): Promise<void> => {
    // Prevent sending if message is empty or a message is already being sent
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    // --- Optimistic UI: add user message immediately ---
    const userMessage: DisplayMessage = {
      id: `user-${Date.now()}`,
      content: message.trim(),
      role: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Console log for debug/dev tracing; safe to remove for prod
      console.log('📤 Sending message with rolling memory...');

      // Await chatbot API (Google backend)
      const response = await sendChatMessage(message);

      // Add assistant's reply to chat UI
      const assistantMessage: DisplayMessage = {
        id: `assistant-${Date.now()}`,
        content: response,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      console.log('✅ Response received');
    } catch (err) {
      // --- Error handling (rollback optimistic update) ---
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      console.error('🔴 Chat error:', errorMessage);
      setError(errorMessage);

      // Remove user message that was optimistically added
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));

      // Add error message as an assistant reply
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: `Sorry, I encountered an error: ${errorMessage}`,
          role: 'assistant',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  /**
   * Clear the current chat session, including backend/rolling memory.
   * Resets error state.
   */
  const clearChat = useCallback(() => {
    clearConversation();   // Backend/session reset (Google)
    setMessages([]);       // UI state reset
    setError(null);        // Remove error banner, if any
  }, []);

  return {
    messages,      // Chat message history to render in UI
    isLoading,     // Loading spinner flag
    error,         // Last error, if any (null on success)
    sendMessage,   // Imperative: send a user-input message
    clearChat,     // Imperative: clear/reset the conversation
  };
};
