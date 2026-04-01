/**
 * useChatbot.ts
 *
 * Compatibility/alias export for app-wide chatbot chat hook (with summary/rolling memory).
 *
 * This file re-exports the new "useChatWithSummary" hook under the legacy "useChatbot" name
 * for easy migration and consistent imports elsewhere in the codebase.
 *
 * Also re-exports the DisplayMessage type as ChatMessage, providing a stable type alias for
 * all chatbot message objects.
 */

// Export the main chat hook (renamed for legacy/compatibility usage)
export { useChatWithSummary as useChatbot } from './useChatWithSummary';

// Export the chat message display type (renamed for stable usage throughout the app)
export type { DisplayMessage as ChatMessage } from './useChatWithSummary';
