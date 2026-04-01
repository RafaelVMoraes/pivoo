// Module IDs for the AI Chatbot
export type ModuleId = 
  | 'capacity-load'
  | 'life-areas-coherence'
  | 'goal-viability'
  | 'monthly-execution'
  | 'self-discovery-coherence';

// Scope options for capacity analysis (simplified to weekly/monthly)
export type CapacityScope = '' | 'weekly' | 'monthly';

// Scope options for self-discovery
export type SelfDiscoveryScope = '' | 'overall' | 'life-wheel' | 'values' | 'vision' | 'word-phrase';

// Verdict types for goal viability
export type GoalVerdict = 'keep' | 'stop' | 'drop' | 'redefine';

export type AnalysisDepth = 'quick-insight' | 'structured-analysis' | 'deep-dive';
export type FeedbackTone = 'supportive' | 'neutral' | 'direct-challenging';
export type ThinkingMode = 'practical' | 'strategic' | 'creative';

// Module configuration interfaces
export interface CapacityInputs {
  scope: CapacityScope;
  workHoursPerWeek: string;
  sleepHoursPerDay: string;
}

export interface LifeAreasInputs {
  selectedArea: string;
}

export interface GoalViabilityInputs {
  goalId: string;
}

export interface MonthlyExecutionInputs {
  // Uses only monthly data automatically
}

export interface SelfDiscoveryInputs {
  scope: SelfDiscoveryScope;
}

export interface AnalysisConfiguration {
  depth: AnalysisDepth | '';
  tone: FeedbackTone | '';
  thinkingMode: ThinkingMode | '';
}

// Combined analysis inputs
export interface AnalysisInputs {
  capacityLoad: CapacityInputs;
  lifeAreasCoherence: LifeAreasInputs;
  goalViability: GoalViabilityInputs;
  monthlyExecution: MonthlyExecutionInputs;
  selfDiscoveryCoherence: SelfDiscoveryInputs;
  analysisConfiguration: AnalysisConfiguration;
}

// Life area with goal count for dropdown display
export interface LifeAreaWithStats {
  area_name: string;
  current_score: number;
  desired_score: number;
  goalCount: number;
}

// Module definition
export interface ModuleDefinition {
  id: ModuleId;
  title: string;
  description: string;
  dominantQuestion: string;
  expectedOutputs: string[];
  icon: string; // Lucide icon name
  requiresSelfDiscovery?: boolean;
  verdicts?: GoalVerdict[];
}

// Session state
export interface AnalysisSession {
  moduleId: ModuleId | null;
  hasInitialOutput: boolean;
  initialOutput: string | null;
  inputs: AnalysisInputs;
}

// Chat message
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isInitialAnalysis?: boolean;
}
