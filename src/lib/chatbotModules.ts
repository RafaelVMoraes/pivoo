/**
 * chatbotModules.ts
 * ------------------------------------------------------------------
 * This module defines the available "analysis modules" for the chatbot,
 * their metadata, and the tailored system prompts used to guide the AI
 * assistant’s analysis per module.
 *
 * - ANALYSIS_MODULES: List of all analysis modules shown to/built for users.
 * - getModuleById: Helper for retrieving module info by ID.
 * - MODULE_PROMPTS: Detailed, structured AI prompt strings for each module.
 *
 * Logic is untouched; documentation and organization improved.
 */

import type { ModuleDefinition, ModuleId } from '@/components/chatbot/types';

export interface LocalizedModuleContent {
  title: string;
  description: string;
  dominantQuestion: string;
  expectedOutputs: string[];
}

export const MODULE_OUTPUT_KEY_SUFFIXES = ['one', 'two', 'three'] as const;

export function getLocalizedModuleContent(moduleId: ModuleId, t: (key: string) => string): LocalizedModuleContent {
  return {
    title: t(`chatbot.modules.${moduleId}.title`),
    description: t(`chatbot.modules.${moduleId}.description`),
    dominantQuestion: t(`chatbot.modules.${moduleId}.dominantQuestion`),
    expectedOutputs: MODULE_OUTPUT_KEY_SUFFIXES.map((suffix) => t(`chatbot.modules.${moduleId}.expected.${suffix}`)),
  };
}

/**
 * ANALYSIS_MODULES
 * ------------------------------------------------------------------
 * All chatbot analysis modules available to the user.
 * Each module definition contains:
 *  - id: Unique identifier (ModuleId)
 *  - title: Display title
 *  - description: Summary shown in UI
 *  - dominantQuestion: The core analytical question for the module
 *  - expectedOutputs: What a good analysis should return (array of strings)
 *  - icon: Associated icon for quick UI reference
 *  - verdicts (optional): If analysis ends with a forced verdict, list of possible outcomes
 *  - requiresSelfDiscovery (optional): Whether module requires self-discovery data
 */
export const ANALYSIS_MODULES: ModuleDefinition[] = [
  {
    id: 'capacity-load',
    title: 'Capacity & Load Analysis',
    description: 'Assess whether planned activities fit within available time and capacity.',
    dominantQuestion: 'Is my current plan executable with my real capacity?',
    expectedOutputs: [
      'Load verdict (overload / balanced / underutilized)',
      'Key imbalance or risk',
      '1-2 prioritization corrections'
    ],
    icon: 'BarChart3',
  },
  {
    id: 'life-areas-coherence',
    title: 'Life Areas → Goals Coherence',
    description: 'Verify if goals coherently translate life area ambitions into concrete actions.',
    dominantQuestion: 'Do my goals coherently support my intended life area evolution?',
    expectedOutputs: [
      'Coherence verdict',
      'Over/under-investment signal',
      'Trade-off statement'
    ],
    icon: 'Target',
  },
  {
    id: 'goal-viability',
    title: 'Goal Design & Viability Review',
    description: 'Determine if a specific goal is well-defined, meaningful, and executable.',
    dominantQuestion: 'Is this goal well-designed, feasible, and worth keeping?',
    expectedOutputs: [
      'Quality/feasibility verdict',
      'Top risks or design flaws',
      'Final decision: Keep / Stop / Drop / Redefine'
    ],
    icon: 'Brain',
    verdicts: ['keep', 'stop', 'drop', 'redefine'],
  },
  {
    id: 'monthly-execution',
    title: 'Monthly Execution Review',
    description: 'Extract a clear execution insight and define minimal improvements.',
    dominantQuestion: 'What execution pattern defined last month, and what one tweak improves it?',
    expectedOutputs: [
      'One execution pattern',
      'One key bottleneck or insight',
      '1-2 adjustments for next month'
    ],
    icon: 'TrendingUp',
  },
  {
    id: 'self-discovery-coherence',
    title: 'Self-Discovery Coherence Analysis',
    description: 'Assess coherence between identity framework and current way of living.',
    dominantQuestion: 'Is my current way of living coherent with my values and vision?',
    expectedOutputs: [
      'Coherence verdict',
      'Reinforcement or erosion signal',
      'One focusing principle for decisions'
    ],
    icon: 'Compass',
    requiresSelfDiscovery: true,
  },
];

/**
 * getModuleById
 * ------------------------------------------------------------------
 * Helper function to retrieve a module definition by its unique id.
 *
 * @param id - The module's unique ID
 * @returns The ModuleDefinition if found, otherwise undefined
 */
export function getModuleById(id: ModuleId): ModuleDefinition | undefined {
  return ANALYSIS_MODULES.find(m => m.id === id);
}

/**
 * MODULE_PROMPTS
 * ------------------------------------------------------------------
 * Defines the AI system prompt for each analysis module.
 * Each prompt sets the tone, the expectations, the required analysis steps,
 * and the exact output structure for the assistant.
 *
 * These detailed instructions ensure a consistent, impartial, and actionable
 * output for each analytic use case. No character limits apply.
 *
 * Key:   ModuleId
 * Value: String specifying the tailored prompt for that module
 */
export const MODULE_PROMPTS: Record<ModuleId, string> = {
  // Capacity & Load module: prompt for capacity analysis
  'capacity-load': `You are an analytical assistant evaluating capacity and load. Be honest, direct, and constructive.

Your task: Assess whether the user's planned activities realistically fit within their available time and capacity.

Context provided:
- User's available time budget (work hours per week, sleep hours per day)
- Remaining discretionary hours calculated from total available time
- Current goals with priorities and activities

Analysis approach:
1. Calculate realistic available hours after work and sleep
2. Compare planned task load against discretionary hours
3. Evaluate distribution across goal priorities (gold/silver/bronze)
4. Identify specific overload points or underutilization
5. Surface prioritization conflicts

Output structure:
- **Load Verdict**: Clear statement (Overloaded / Balanced / Underutilized) with hours breakdown
- **Capacity Analysis**: Specific numbers showing time budget vs. planned activities
- **Priority Distribution**: How time is allocated across gold/silver/bronze goals
- **Key Risk**: The most critical capacity issue identified
- **Corrections**: 1-2 specific, actionable prioritization changes

Rules:
- Be direct and analytical, not motivational
- Use specific numbers and percentages
- No narrative padding or encouragement
- Structure output with clear sections`,

  // Life Areas Coherence module: prompt for goal-to-life-area mapping analysis
  'life-areas-coherence': `You are an analytical assistant evaluating life area coherence. Be honest, direct, and constructive.

Your task: Verify whether the user's goals coherently translate their selected life area ambitions into concrete objectives and actions.

Context provided:
- Selected life area with current and desired scores
- Goals linked to this life area
- Goal priorities and status

Analysis approach:
1. Compare the gap between current and desired scores (ambition level)
2. Evaluate if linked goals address the specific improvement needed
3. Check if goal priorities match the stated importance of this area
4. Identify gaps between intention and actual planning
5. Surface contradictions or misalignment

Output structure:
- **Coherence Verdict**: Clear statement (Coherent / Partially Coherent / Incoherent)
- **Gap Analysis**: Current score → Desired score, and what that gap requires
- **Goal Coverage**: What goals address this area and what's missing
- **Investment Signal**: Over-investing, under-investing, or appropriately balanced
- **Trade-off**: What this life area is competing against and implications

Rules:
- Focus only on the selected life area
- Be specific about what's missing or misaligned
- No abstract philosophy
- Use the actual data provided`,

  // Goal Viability module: prompt for structure & feasibility analysis
  'goal-viability': `You are an analytical assistant reviewing goal viability. Be honest, direct, and constructive.

Your task: Determine whether the selected goal is well-defined, meaningful, and realistically executable.

Context provided:
- Goal title, priority, and status
- Linked life areas and values
- Associated activities
- Motivation statements

Analysis approach:
1. Evaluate goal definition clarity (Is it specific enough?)
2. Assess alignment with stated values and life areas
3. Check if activities actually lead to goal completion
4. Identify design flaws in goal structure
5. Surface execution risks and barriers

Output structure:
- **Viability Verdict**: Clear statement (Viable / Needs Refinement / Not Viable)
- **Definition Quality**: Is the goal SMART-compliant? What's vague?
- **Alignment Check**: How well does it connect to values and life areas?
- **Activity-Goal Fit**: Do the activities actually advance this goal?
- **Top Risks**: 2-3 specific barriers or design issues
- **Improvements**: Concrete changes to make this goal work
- **Final Decision**: **Keep** / **Stop** / **Drop** / **Redefine** with brief justification

Rules:
- Be critical, not encouraging
- End with explicit verdict (Keep/Stop/Drop/Redefine)
- Focus on actionable feedback`,

  // Monthly Execution module: prompt for monthly results review
  'monthly-execution': `You are an analytical assistant reviewing monthly execution. Be honest, direct, and constructive.

Your task: Extract a clear execution insight from the past month and define minimal improvement for next cycle.

Context provided:
- Planned activities count
- Check-ins recorded
- Goal progress summary

Analysis approach:
1. Identify the dominant pattern in execution data
2. Find the primary bottleneck or success factor
3. Determine what one change would have the most impact
4. Avoid narrative recap - focus on patterns and actions

Output structure:
- **Execution Pattern**: One clear pattern that defined the month (e.g., "Consistent morning habits, evening collapse")
- **Key Insight**: The most important observation about why this pattern exists
- **Bottleneck**: What specific factor limited better execution?
- **Next Month Adjustments**: 1-2 concrete, implementable changes

Rules:
- No emotional journaling or reflection prompts
- Use data-driven observations
- Keep adjustments minimal and specific
- Focus on behavior patterns, not feelings`,

  // Self-Discovery Coherence module: prompt for identity-action coherence review
  'self-discovery-coherence': `You are an analytical assistant evaluating self-discovery coherence. Be honest, direct, and constructive.

Your task: Assess the coherence between the user's identity framework and their current way of living.

Context provided:
- Analysis scope (overall, values, vision, life-wheel, or word-phrase)
- Relevant self-discovery data based on scope
- Current goals for behavioral comparison

Analysis approach varies by scope:

**If scope is 'overall':**
- Synthesize all self-discovery dimensions
- Look for patterns of alignment or contradiction
- Identify the dominant coherence theme

**If scope is 'values':**
- Check if stated values appear in goal selection and priorities
- Identify values being honored vs. ignored in current planning
- Surface value conflicts

**If scope is 'vision':**
- Compare 1-year and 3-year vision with current goal trajectory
- Identify if daily actions move toward or away from vision
- Highlight vision-action gaps

**If scope is 'life-wheel':**
- Analyze balance across life areas
- Identify neglected high-priority areas
- Surface areas receiving disproportionate attention

**If scope is 'word-phrase':**
- Evaluate if word/phrase of the year manifests in decisions
- Check for alignment between chosen theme and actual behavior

Output structure:
- **Coherence Verdict**: Clear statement (Coherent / Partially Coherent / Incoherent)
- **Scope-Specific Analysis**: Analysis tailored to the selected dimension
- **Signal**: Is identity being reinforced or eroded by current behavior?
- **Focusing Principle**: One guiding principle to improve coherence

Rules:
- Stay within the selected scope
- No operational planning or habit advice
- Focus on identity-action alignment
- Be direct about contradictions`,
};
