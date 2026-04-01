/**
 * Daily Reflection Card
 * AI-generated prompt with user input and AI response
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, MessageCircle, Send, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DailyReflectionCardProps {
  isLoading: boolean;
  isGuest: boolean;
}

type ReflectionState = 'idle' | 'generating-prompt' | 'ready' | 'submitting' | 'complete';

const MAX_REFLECTION_LENGTH = 500;

/**
 * Sanitizes user input to prevent prompt injection attacks.
 * Removes or escapes characters that could manipulate AI prompts.
 */
const sanitizeUserInput = (input: string): string => {
  return input
    .trim()
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Escape quotes and backticks that could break prompt structure
    .replace(/["'`]/g, (match) => `\\${match}`)
    // Remove common prompt injection patterns
    .replace(/\b(ignore|forget|disregard)\s+(previous|above|all)\s+(instructions?|prompts?|rules?)/gi, '[removed]')
    .replace(/\b(system|assistant|user)\s*:/gi, '[role]')
    .replace(/\[\[.*?\]\]/g, '') // Remove bracketed instructions
    .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML-like tags
    // Limit length
    .slice(0, MAX_REFLECTION_LENGTH);
};

export const DailyReflectionCard = ({ isLoading, isGuest }: DailyReflectionCardProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [state, setState] = useState<ReflectionState>('idle');
  const [prompt, setPrompt] = useState('');
  const [userReflection, setUserReflection] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const { t, language } = useTranslation();

  // Function to extract text from Gemini response
  const extractGeminiText = (data: unknown): string | null => {
    try {
      if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>;
        if (d.candidates && Array.isArray(d.candidates) && d.candidates.length > 0) {
          const candidate = d.candidates[0] as Record<string, unknown>;
          if (candidate.content && typeof candidate.content === 'object') {
            const content = candidate.content as Record<string, unknown>;
            if (content.parts && Array.isArray(content.parts) && content.parts.length > 0) {
              const part = content.parts[0] as Record<string, unknown>;
              if (typeof part.text === 'string') {
                return part.text;
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Error extracting Gemini text:', e);
    }
    return null;
  };

  const handleEngageReflection = async () => {
    if (isGuest) return;

    setState('generating-prompt');
    try {
      const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      const promptText = `Generate one unique self-reflection question for today (${today}).

Requirements:
- It must encourage introspection and personal growth.
- It can be about goals, values, habits, identity, emotions, motivation, or life satisfaction.
- Keep it to one sentence.
- Vary the structure: use different openings (e.g., What, In what ways, To what extent, Which, Why, When, If, etc.).
- Avoid repeating themes used in previous responses; aim for novelty in topic and wording.

Important: The user prefers to read in their own language. Write the question in the following language, and only in that language: ${language}.

Only respond with the question itself, nothing else.`;

      const { data, error } = await supabase.functions.invoke('Chatbot-gemini', {
        body: {
          prompt: promptText
        }
      });

      if (error) throw error;
      
      const questionText = extractGeminiText(data);
      if (questionText) {
        setPrompt(questionText.trim());
        setState('ready');
      } else {
        throw new Error('Could not parse AI response');
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast.error(t('dashboard.promptGenerationError'));
      setState('idle');
    }
  };

  const handleSubmitReflection = async () => {
    if (!userReflection.trim() || isGuest) return;

    setState('submitting');
    try {
      // Sanitize user input before sending to AI
      const sanitizedReflection = sanitizeUserInput(userReflection);
      
      if (!sanitizedReflection) {
        toast.error(t('dashboard.invalidInput'));
        setState('ready');
        return;
      }

      const promptText = `You are a supportive life coach. The user was asked a reflection question and provided their response below.

QUESTION: ${prompt}

USER RESPONSE: ${sanitizedReflection}

Provide a brief, insightful reflection (maximum 2 sentences) that:
1. Acknowledges their response positively
2. Offers a small actionable insight or encouragement

Be warm, concise, and genuine. Do not use excessive exclamation marks.

Important: The user prefers to read in their own language. Write your feedback in the following language, and only in that language: ${language}.`;

      const { data, error } = await supabase.functions.invoke('Chatbot-gemini', {
        body: {
          prompt: promptText
        }
      });

      if (error) throw error;
      
      const responseText = extractGeminiText(data);
      if (responseText) {
        setAiResponse(responseText.trim());
        setState('complete');
      } else {
        throw new Error('Could not parse AI response');
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error(t('dashboard.reflectionError'));
      setState('ready');
    }
  };

  const handleReflectAgain = () => {
    setPrompt('');
    setUserReflection('');
    setAiResponse('');
    setState('idle');
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card id="daily-reflection-card" className="bg-card border-border overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold text-foreground">
                  {t('dashboard.dailyReflection')}
                </CardTitle>
              </div>
              <ChevronDown 
                className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Idle State - Engage Button */}
            {state === 'idle' && (
              <div className="flex flex-col items-center text-center py-6 gap-4">
                <Sparkles className="h-10 w-10 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {t('dashboard.readyToReflect')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.reflectionDescription')}
                  </p>
                </div>
                <Button
                  onClick={handleEngageReflection}
                  disabled={isGuest}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {t('dashboard.engageReflection')}
                </Button>
                {isGuest && (
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.loginToReflect')}
                  </p>
                )}
              </div>
            )}

            {/* Generating Prompt State */}
            {state === 'generating-prompt' && (
              <div className="flex flex-col items-center text-center py-8 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.generatingQuestion')}
                </p>
              </div>
            )}

            {/* Ready State - Show Question and Input */}
            {state === 'ready' && (
              <>
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                        {t('dashboard.todaysQuestion')}
                      </p>
                      <p className="text-sm font-medium text-foreground">{prompt}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Textarea
                    placeholder={t('dashboard.shareThoughts')}
                    value={userReflection}
                    onChange={(e) => setUserReflection(e.target.value.slice(0, MAX_REFLECTION_LENGTH))}
                    maxLength={MAX_REFLECTION_LENGTH}
                    className="min-h-[80px] resize-none"
                  />
                  <Button
                    onClick={handleSubmitReflection}
                    disabled={!userReflection.trim()}
                    className="w-full"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {t('dashboard.submitReflection')}
                  </Button>
                </div>
              </>
            )}

            {/* Submitting State */}
            {state === 'submitting' && (
              <>
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                        {t('dashboard.todaysQuestion')}
                      </p>
                      <p className="text-sm font-medium text-foreground">{prompt}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-accent/30 rounded-lg p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    {t('dashboard.yourReflection')}
                  </p>
                  <p className="text-sm text-foreground italic">"{userReflection}"</p>
                </div>

                <div className="flex items-center justify-center py-4 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">{t('dashboard.reflecting')}</p>
                </div>
              </>
            )}

            {/* Complete State - Show Response */}
            {state === 'complete' && (
              <div className="space-y-3">
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                        {t('dashboard.todaysQuestion')}
                      </p>
                      <p className="text-sm font-medium text-foreground">{prompt}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-accent/30 rounded-lg p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    {t('dashboard.yourReflection')}
                  </p>
                  <p className="text-sm text-foreground italic">"{userReflection}"</p>
                </div>
                
                <div className="bg-green-500/10 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">
                        {t('dashboard.insight')}
                      </p>
                      <p className="text-sm text-foreground">{aiResponse}</p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={handleReflectAgain}
                >
                  <RefreshCw className="h-4 w-4" />
                  {t('dashboard.reflectAgain')}
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
