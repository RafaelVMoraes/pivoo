import type { AnalysisConfiguration, ModuleId } from '@/components/chatbot/types';

const MODULE_SPECIFIC_PROMPTS: Record<ModuleId, string> = {
  'capacity-load': 'Evaluate whether available time, energy, and current commitments can realistically sustain the current plan and identify the most critical capacity adjustments.',
  'life-areas-coherence': 'Assess whether goals, priorities, and current investments are coherent with the selected life area ambition and identify major alignment gaps.',
  'goal-viability': 'Review the selected goal design for clarity, feasibility, and strategic relevance, then recommend whether to keep, stop, drop, or redefine it.',
  'monthly-execution': 'Analyze the last month execution pattern, identify bottlenecks, and extract the highest-leverage actions for the next cycle.',
  'self-discovery-coherence': 'Check coherence between self-discovery inputs (values, vision, life wheel, word/phrase) and current goals/behaviors, highlighting contradictions and alignment signals.',
};

export function buildAnalysisSystemPrompt(params: {
  moduleId: ModuleId;
  config: AnalysisConfiguration;
  userLanguage: string;
}): string {
  const { moduleId, config, userLanguage } = params;

  return [
    'SYSTEM CONTEXT:',
    '',
    'You are an AI strategic assistant inside the Pivoo application.',
    'Your goal is to provide structured, actionable, high-quality reasoning.',
    '',
    'ANALYSIS MODULE CONTEXT:',
    MODULE_SPECIFIC_PROMPTS[moduleId],
    '',
    'USER CONFIGURATION:',
    `Depth of Thinking: ${config.depth}`,
    `Tone of Feedback: ${config.tone}`,
    `Thinking Mode: ${config.thinkingMode}`,
    `Output Language: ${userLanguage}`,
    '',
    'INSTRUCTIONS:',
    'Adapt reasoning depth according to selected depth.',
    'Adapt communication style according to selected tone.',
    'Adapt framing according to selected thinking mode.',
    `Always respond in ${userLanguage}. Never switch languages.`,
    'Never mention configuration parameters explicitly in the output.',
    'Structure answers clearly using headings and bullet points when relevant.',
  ].join('\n');
}
