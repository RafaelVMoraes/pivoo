/**
 * useAnalysisChat.ts
 * 
 * Custom React hook for managing analysis chatbot conversations.
 *
 * This hook interacts with a Supabase edge function to perform contextual analysis and chat for
 * a specific module in the app. It handles a chat session with assistant/user messages, tracks 
 * loading/error state, manages session resets, and supports initial analysis and back-and-forth chat.
 *
 * Features:
 * - startAnalysis: Starts a new analysis session and fetches the first assistant message based on a user context string.
 * - sendMessage: Sends a message to the assistant and appends the response.
 * - clearSession: Resets the conversation state for a new session.
 * - State: Tracks all chat messages, loading state, error, and whether initial analysis is complete.
 *
 * API:
 *  useAnalysisChat({
 *    moduleId,
 *    contextBuilder, // function returning user context string for system prompt
 *  })
 * 
 * Returns: {
 *   messages,
 *   isLoading,
 *   error,
 *   hasInitialOutput,
 *   startAnalysis,
 *   sendMessage,
 *   clearSession,
 * }
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ChatMessage, ModuleId, AnalysisInputs } from '@/components/chatbot/types';
import { buildAnalysisSystemPrompt } from '@/lib/ai/analysisPrompts';
import { useProfile } from '@/hooks/useProfile';
import { getStoredCustomApiKey } from '@/lib/ai/modelConfig';
import { toPromptLanguage } from '@/lib/ai/language';
import { useTranslation } from '@/hooks/useTranslation';

// Options for useAnalysisChat hook
interface UseAnalysisChatOptions {
  moduleId: ModuleId;
  contextBuilder: () => string;
  analysisConfiguration: AnalysisInputs['analysisConfiguration'];
}

/**
 * Main hook for analysis chat.
 * 
 * @param {UseAnalysisChatOptions} options - { moduleId, contextBuilder }
 * @returns Chat session state and imperative chat methods.
 */
export const useAnalysisChat = ({ moduleId, contextBuilder, analysisConfiguration }: UseAnalysisChatOptions) => {
  const { profile } = useProfile();
  const { t } = useTranslation();
  // ----- Chat session state -----
  const [messages, setMessages] = useState<ChatMessage[]>([]);           // All chat messages in the session
  const [isLoading, setIsLoading] = useState(false);                     // Loading state for API calls
  const [error, setError] = useState<string | null>(null);               // Error message, if any
  const [hasInitialOutput, setHasInitialOutput] = useState(false);       // Flag to track if initial analysis has been performed

  /**
   * Starts an analysis by sending initial prompts (system + context as user) to the API,
   * and saves the assistant's reply as the first message.
   * Can only be called once per session (until reset).
   */
  const startAnalysis = useCallback(async (): Promise<string | null> => {
    if (hasInitialOutput) return null; // Prevent re-running after initial analysis

    setIsLoading(true);
    setError(null);

    // Get the system prompt and user context string
    const outputLanguage = toPromptLanguage(profile?.language);
    const systemPrompt = buildAnalysisSystemPrompt({
      moduleId,
      config: analysisConfiguration,
      userLanguage: outputLanguage,
    });
    const userContext = contextBuilder();

    try {
      // Request to Supabase Edge Function with system and user context messages
      const { data, error: invokeError } = await supabase.functions.invoke('analysis-chat', {
        body: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContext },
          ],
          isInitialAnalysis: true,
          customApiKey: getStoredCustomApiKey(),
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || t('chatbot.errorFailedAnalysis'));
      }

      // The assistant's reply (result of analysis)
      const responseText = data?.text || t('chatbot.errorUnableGenerateAnalysis');

      // Create the initial assistant message object
      const assistantMessage: ChatMessage = {
        id: `initial-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        isInitialAnalysis: true,
      };

      setMessages([assistantMessage]);
      setHasInitialOutput(true);

      return responseText;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('chatbot.errorAnalysisFailed');
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [analysisConfiguration, contextBuilder, hasInitialOutput, moduleId, profile?.language, t]);

  /**
   * Sends a user message to the assistant and appends both the user message and
   * the assistant's response to the chat.
   *
   * Handles errors by removing the user message on failure.
   */
  const sendMessage = useCallback(async (message: string): Promise<void> => {
    if (!message.trim() || isLoading) return; // Prevent send if already loading or message is empty

    // Shape the user's new message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Construct full chat history for API prompt (system + previous + current)
    const outputLanguage = toPromptLanguage(profile?.language);
    const systemPrompt = buildAnalysisSystemPrompt({
      moduleId,
      config: analysisConfiguration,
      userLanguage: outputLanguage,
    });
    const fullMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: message.trim() },
    ];

    try {
      // Send chat history to Edge Function for assistant response
      const { data, error: invokeError } = await supabase.functions.invoke('analysis-chat', {
        body: {
          messages: fullMessages,
          isInitialAnalysis: false, // Not an initial analysis; it's a back-and-forth message
          customApiKey: getStoredCustomApiKey(),
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || t('chatbot.errorFailedResponse'));
      }

      // The assistant's reply
      const responseText = data?.text || t('chatbot.errorUnableRespond');

      // Create the assistant message object
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('chatbot.errorResponseFailed');
      setError(errorMessage);
      // Undo the pending user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [analysisConfiguration, isLoading, messages, moduleId, profile?.language, t]);

  /**
   * Resets the chat session for a clean start (removes all messages, resets error and initial output).
   */
  const clearSession = useCallback(() => {
    setMessages([]);
    setHasInitialOutput(false);
    setError(null);
  }, []);

  // Hook return value: state + imperative chat methods
  return {
    messages,            // All messages in current chat session
    isLoading,           // True if awaiting API
    error,               // String error message, if any
    hasInitialOutput,    // True if initial analysis has been run
    startAnalysis,       // Call to run the initial module analysis call
    sendMessage,         // Call to send a message after initial analysis
    clearSession,        // Call to reset the chat session
  };
};
