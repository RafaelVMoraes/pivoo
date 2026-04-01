/**
 * analysis-chat/index.ts
 * ----------------------------------------------------------------------------
 * Cloud Function (Deno) for analysis chat integration with Supabase Auth and
 * Google Gemini API, providing structured analytical chatbot sessions.
 *
 * Main features:
 * - Receives an array of user, assistant, and system messages.
 * - Validates and sanitizes chat messages for security and integrity.
 * - Checks input for prompt injection attempts.
 * - Calls Gemini API for structured analytical responses.
 * - Secures access via Supabase Auth session for the user.
 * - Responds with full error handling for authentication and AI service issues.
 *
 * No business logic should be changed without full review.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS configuration for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ----------------------
//      Types & Limits
// ----------------------

/**
 * Represents a message in the chat conversation.
 * - 'role' determines message origin: user, assistant, or system.
 * - 'content' is the actual message text.
 */
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Expected POST request body shape to this function.
 */
interface RequestBody {
  messages: ChatMessage[];
  isInitialAnalysis?: boolean;
  customApiKey?: string;
}

function resolveApiConfig(customApiKey?: string): { apiKey: string; model: string } {
  const normalizedCustomKey = customApiKey?.trim() || '';
  if (normalizedCustomKey) {
    return {
      apiKey: normalizedCustomKey,
      model: 'gemini-2.5-flash',
    };
  }

  const defaultApiKey = Deno.env.get('GEMINI_API_KEY') || '';
  return {
    apiKey: defaultApiKey,
    model: 'gemma-3-27b-it',
  };
}

// Maximum allowed message content length (characters)
const MAX_CONTENT_LENGTH = 10000;
// Maximum number of messages permitted per request
const MAX_MESSAGES = 30;

// ---------------------------------------------
//      Prompt Injection Detection Patterns
// ---------------------------------------------

/**
 * Patterns of suspicious instructions that might indicate prompt injection.
 * Only applied to 'user' role messages.
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

// ---------------------------------------------
//      Utility: Prompt Injection Checking
// ---------------------------------------------

/**
 * Returns true if the provided text matches any dangerous prompt patterns.
 */
function detectPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some(pattern => pattern.test(text));
}

// ---------------------------------------------
//      Utility: Message Content Sanitization
// ---------------------------------------------

/**
 * Sanitizes input for the model:
 * - trims whitespace,
 * - removes most control characters,
 * - limits excessive consecutive special characters.
 */
function sanitizeContent(text: string): string {
  // Remove leading/trailing whitespace, collapse internal spaces to single
  let sanitized = text.trim().replace(/\s+/g, ' ');

  // Strip control characters (except for newlines)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Limit excessive repeated special characters (e.g. "-----" → "--")
  sanitized = sanitized.replace(/([^\w\s])\1{4,}/g, '$1$1$1');

  return sanitized;
}

// ---------------------------------------------
//      Message Array Validation & Filtering
// ---------------------------------------------

/**
 * Validates a messages array:
 * - Confirms shape, size, message roles, content requirements.
 * - Sanitizes message content.
 * - Checks for prompt injection (user messages only).
 *
 * Returns: { valid, sanitized messages, error string }
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

    // Extract and check role/content shape
    const { role, content } = msg as { role?: string; content?: string };

    // Only allow user/assistant/system
    if (!role || !['user', 'assistant', 'system'].includes(role)) {
      return { valid: false, error: 'Invalid message role' };
    }

    // Content must be a non-empty string
    if (typeof content !== 'string' || content.trim().length === 0) {
      return { valid: false, error: 'Message content must be a non-empty string' };
    }

    // Check length of single message's content
    if (content.length > MAX_CONTENT_LENGTH) {
      return { valid: false, error: `Message content exceeds ${MAX_CONTENT_LENGTH} characters` };
    }

    // Detect prompt injection in user submissions only
    if (role === 'user' && detectPromptInjection(content)) {
      console.warn('Potential prompt injection detected in analysis message');
      return { valid: false, error: 'Your message contains patterns that cannot be processed. Please rephrase your question.' };
    }

    // Clean content for safe AI processing
    sanitized.push({ role: role as ChatMessage['role'], content: sanitizeContent(content) });
  }

  return { valid: true, sanitized };
}

// ---------------------------------------------
//      Gemini API Content Converter
// ---------------------------------------------

/**
 * Constructs the contents array expected by the Gemini chat API based on
 * sanitized messages and the analysis phase (initial or follow-up).
 *
 * Prepends system instructions as the first message if present, and ensures
 * the appropriate guidance for the analysis phase.
 */
function buildGeminiContents(messages: ChatMessage[], isInitial: boolean) {
  // Gemini API chat message format
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Separate system instructions and conversation history
  const systemMessage = messages.find(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  // Add system instructions with explicit output guidelines for the AI
  if (systemMessage) {
    const outputGuidance = isInitial
      ? 'Provide a comprehensive, structured analysis. Use markdown formatting with clear sections, bullet points, and bold for key terms.'
      : 'Respond directly and helpfully. Continue the analytical conversation, staying focused on the topic.';

    contents.push({
      role: 'user',
      parts: [{
        text:
          `[System Instructions]\n${systemMessage.content}\n\n[Output Guidelines]\n${outputGuidance}\n\n[Begin Analysis]`
      }]
    });

    contents.push({
      role: 'model',
      parts: [{
        text: 'Understood. I will provide honest, direct, and structured analytical responses using markdown formatting.'
      }]
    });
  }

  // Append user and assistant conversation (converted to user/model roles)
  for (const msg of conversationMessages) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  }

  return contents;
}

// ---------------------------------------------
//        Cloud Function Entry Point
// ---------------------------------------------

/**
 * Handles HTTP requests for the analysis chat endpoint.
 * - Performs CORS preflight.
 * - Authenticates user with Supabase.
 * - Validates and sanitizes input.
 * - Executes Gemini API call.
 * - Handles errors and returns AI response.
 */
Deno.serve(async (req) => {
  // Handle CORS preflight early
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // -------------------------------------
    //   Environment Variables & Sanity
    // -------------------------------------
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const defaultGeminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // -------------------------------------
    //   Auth Header Parsing & Session
    // -------------------------------------
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client to validate the user session
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Check that the user session is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analysis request from user: ${user.id}`);

    // -------------------------------------
    //   Request Payload Parsing & Validation
    // -------------------------------------
    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiConfig = resolveApiConfig(body.customApiKey);
    if (!apiConfig.apiKey && !defaultGeminiApiKey) {
      console.error('Missing AI API key configuration');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate messages for shape, size, roles, and injection
    const validation = validateMessages(body.messages);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messages = validation.sanitized!;
    const isInitial = body.isInitialAnalysis === true;

    console.log(`Processing analysis: ${messages.length} messages, initial: ${isInitial}`);

    // -------------------------------------
    //   Gemini API Request & Handling
    // -------------------------------------
    // Use gemma-3-27b-it for unlimited responses
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiConfig.model}:generateContent?key=${apiConfig.apiKey}`;

    // Compose request to Gemini API with structured history
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: buildGeminiContents(messages, isInitial),
        generationConfig: {
          temperature: 0.4, // Slightly higher for more natural conversational follow-ups
          maxOutputTokens: isInitial ? 2048 : 1024, // Allow comprehensive initial analysis
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ]
      }),
    });

    // Handle errors from Gemini API (rate limit, server errors, etc)
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);

      // Special handling for quota/rate limit
      if (geminiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service rate limit reached. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable. Please try again.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract final AI-generated text from Gemini response structure
    const geminiData = await geminiResponse.json();
    const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log(`Analysis response received, length: ${responseText.length} chars`);

    // Return to client in shape { text }
    return new Response(
      JSON.stringify({ text: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Defensive error handler for anything unexpected
    console.error('Unexpected error in analysis-chat function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
