export type TutorialSectionId =
  | 'onboarding'
  | 'dashboard-overview'
  | 'goals-management'
  | 'task-view'
  | 'high-level-view'
  | 'goal-creation'
  | 'self-discovery'
  | 'ai-assistant'
  | 'chat'
  | 'functions'
  | 'investigations'
  | 'journaling';

export interface TutorialStep {
  id: string;
  target: string;
  title: string;
  description: string;
  route?: string;
  placement?: 'top' | 'bottom';
}

export interface TutorialSection {
  id: TutorialSectionId;
  title: string;
  description: string;
  steps: TutorialStep[];
}
