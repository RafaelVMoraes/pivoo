/**
 * google-ai-chat Cloud Function (Deno)
 * -----------------------------------------------------------------------------
 * Provides a secure, authenticated chat interface to the Google Gemini API,
 * with Supabase Auth integration. Enables session-based conversational AI.
 * 
 * Features:
 *   - Strong validation and sanitization of chat input.
 *   - Prompt injection detection (basic, user messages only).
 *   - Summarization mode (optional) for conversation memory.
 *   - Responds only to authenticated, authorized Supabase sessions.
 *   - CORS support for browser-based requests.
 * 
 * This function is intended as a bridge between the Supabase-authenticated client 
 * and Google Gemini for chat/assistant scenarios. It performs all validation and security
 * checks (do not relax these without security review).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * CORS headers to allow client-side requests from any origin.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --------------------
//      TYPE DEFS
// --------------------

/**
 * ChatMessage: represents a single message in the chat history.
 *    role: one of 'user', 'assistant', or 'system'.
 *    content: message text.
 */
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * RequestBody: JSON shape expected from the client.
 *   messages: array of ChatMessage(s)
 *   summarize (optional): if true, triggers summary instead of regular chat
 */
interface RequestBody {
  messages: ChatMessage[];
  summarize?: boolean;
  customApiKey?: string;
}

function resolveApiConfig(customApiKey?: string): { apiKey: string; model: string } {
  const normalizedCustomKey = customApiKey?.trim() || '';
  if (normalizedCustomKey) {
    return { apiKey: normalizedCustomKey, model: 'gemini-2.5-flash' };
  }

  const defaultApiKey = Deno.env.get('GEMINI_API_KEY') || '';
  return { apiKey: defaultApiKey, model: 'gemma-3-27b-it' };
}

// --------------------
//      CONSTANTS
// --------------------

/**
 * Chat/message constraints.
 * MAX_CONTENT_LENGTH: Longest one message can be.
 * MAX_MESSAGES:       Limit on total message objects per request.
 */
const MAX_CONTENT_LENGTH = 8000;
const MAX_MESSAGES = 50;

/**
 * Patterns indicating possible prompt injection attempts.
 * Only user messages are checked (system and assistant owned by server).
 */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /forget\s+(everything|all|your)\s+(instructions|rules|prompts)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /new\s+instructions?\s*:/i,
  /override\s+(system|previous|all)/i,
  /\[system\s*(prompt|message|instruction)\]/i,
  /act\s+as\s+(if|though)\s+you/i,
  /pretend\s+(to\s+be|you\s+are)/i,
  /what\s+are\s+your\s+(instructions|rules|prompts|system\s+prompt)/i,
  /reveal\s+(your|the)\s+(instructions|prompts|system)/i,
  /show\s+me\s+(your|the)\s+(instructions|prompts|system)/i,
];

// --------------------
//   SANITIZATION & VALIDATION HELPERS
// --------------------

/**
 * detectPromptInjection
 * Checks a message string for patterns that suggest prompt injection.
 * Returns true if it looks suspicious.
 */
function detectPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * sanitizeContent
 * Removes excessive whitespace, control chars, and long runs of special chars.
 * Result is safe for use in model prompt.
 */
function sanitizeContent(text: string): string {
  let sanitized = text.trim().replace(/\s+/g, ' ');
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  sanitized = sanitized.replace(/([^\w\s])\1{4,}/g, '$1$1$1');
  return sanitized;
}

/**
 * validateMessages
 * Checks an input array for valid chat message shape/content, 
 * performs injection screening (on user messages),
 * and returns sanitized objects for model prompt.
 * Returns: { valid, sanitized (array), error? }
 */
function validateMessages(messages: unknown): { valid: boolean; error?: string; sanitized?: ChatMessage[] } {
  if (!Array.isArray(messages)) {
    return { valid: false, error: 'Messages must be an array' };
  }

  if (messages.length === 0) {
    return { valid: false, error: 'Messages cannot be empty' };
  }

  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: `Too many messages. Maximum is ${MAX_MESSAGES}` };
  }

  const sanitized: ChatMessage[] = [];
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') {
      return { valid: false, error: 'Each message must be an object' };
    }

    // Validate role and content shape
    const { role, content } = msg as { role?: string; content?: string };

    if (!role || !['user', 'assistant', 'system'].includes(role)) {
      return { valid: false, error: 'Invalid message role' };
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return { valid: false, error: 'Message content must be a non-empty string' };
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return { valid: false, error: `Message content exceeds ${MAX_CONTENT_LENGTH} characters` };
    }

    // Screen prompt injection *only* on user messages
    if (role === 'user' && detectPromptInjection(content)) {
      console.warn('Potential prompt injection detected in user message');
      return { valid: false, error: 'Your message contains patterns that cannot be processed. Please rephrase your question.' };
    }

    sanitized.push({ role: role as ChatMessage['role'], content: sanitizeContent(content) });
  }

  return { valid: true, sanitized };
}

/**
 * buildGeminiContents
 * Transforms sanitized conversation into Gemini API input format.
 * If present, system message is injected as initial "user" context, 
 * followed by all assistant/user messages as chat sequence.
 */
function buildGeminiContents(messages: ChatMessage[]) {
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Insert the (single) system message as context, if present
  const systemMessage = messages.find(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  if (systemMessage) {
    contents.push({
      role: 'user',
      parts: [{ text: `[System Instructions]\n${systemMessage.content}\n\n[Conversation Start]` }]
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I will follow these instructions.' }]
    });
  }

  // Append all normal user/assistant (history) messages in conversation order
  for (const msg of conversationMessages) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  }

  return contents;
}

// -------------------------------
//        MAIN ENTRYPOINT
// -------------------------------

/**
 * Deno.serve: Single entry point for Deno function requests (Supabase Edge Functions).
 * Handles:
 *   - OPTIONS preflight for CORS
 *   - Loads secrets from env
 *   - Auth validation (Supabase JWT, user session)
 *   - Safe body/json parsing
 *   - Message validation/sanitization
 *   - Summarization logic (if requested)
 *   - Constructs Gemini API request, handles propagation and errors
 */
Deno.serve(async (req) => {
  // Respond to CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Load configuration from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const defaultGeminiApiKey = Deno.env.get('GEMINI_API_KEY');

    // 2. Check for critical configuration/secrets
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Require Authorization header (JWT from client)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Create Supabase client that propagates the caller's JWT for getUser
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log(`Authenticated request from user: ${user.id}`);

    // 5. Parse and validate request body (expecting JSON with messages)
    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Message array validation & sanitization (also checks length, roles, injection, etc)
    const validation = validateMessages(body.messages);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messages = validation.sanitized!;
    const apiConfig = resolveApiConfig(body.customApiKey);
    if (!apiConfig.apiKey && !defaultGeminiApiKey) {
      console.error('Missing AI API key configuration');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const isSummarizeRequest = body.summarize === true;

    // 7. If summarizing, override chat with special summary "instruction" message
    let finalMessages = messages;
    if (isSummarizeRequest) {
      const conversationText = messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      finalMessages = [{
        role: 'user' as const,
        content: `Summarize the following conversation in 150 words or less, capturing the key topics discussed, decisions made, and any important context that should be remembered for future reference:\n\n${conversationText}`
      }];
    }

    console.log(`Processing chat request, messages: ${finalMessages.length}, summarize: ${isSummarizeRequest}`);

    // 8. Build and send Gemini API request
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiConfig.model}:generateContent?key=${apiConfig.apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: buildGeminiContents(finalMessages),
        generationConfig: {
          maxOutputTokens: isSummarizeRequest ? 256 : 1024,
          temperature: isSummarizeRequest ? 0.3 : 0.7,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ]
      }),
    });

    // 9. Respond on API error
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 10. Read Gemini response and extract model reply text
    const geminiData = await geminiResponse.json();
    const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('Gemini response received successfully');

    // 11. Return structured API JSON (includes full Gemini raw for diagnostics)
    return new Response(
      JSON.stringify({
        text: responseText,
        raw: geminiData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Catch-all for unexpected server errors
    console.error('Unexpected error in google-ai-chat function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
