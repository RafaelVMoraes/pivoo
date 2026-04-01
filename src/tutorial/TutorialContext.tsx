import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TUTORIAL_SECTIONS } from './config';
import { TutorialSectionId, TutorialStep } from './types';

interface TutorialProgress {
  hasCompletedOnboarding: boolean;
  completedSections: TutorialSectionId[];
}

interface TutorialContextType {
  isActive: boolean;
  isMandatory: boolean;
  currentStep: TutorialStep | null;
  currentSectionId: TutorialSectionId | null;
  currentStepIndex: number;
  currentSectionLength: number;
  progress: TutorialProgress;
  startSection: (sectionId: TutorialSectionId) => void;
  startOnboarding: () => void;
  nextStep: () => void;
  skipTutorial: () => void;
  closeCenter: () => void;
  isCenterOpen: boolean;
  openCenter: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);
const STORAGE_KEY = 'pivoo_tutorial_progress';

const getDefaultProgress = (): TutorialProgress => ({
  hasCompletedOnboarding: false,
  completedSections: [],
});

export const TutorialProvider = ({ children }: { children: ReactNode }) => {
  const { user, isGuest } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [progress, setProgress] = useState<TutorialProgress>(getDefaultProgress);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<TutorialSectionId | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMandatory, setIsMandatory] = useState(false);
  const [isCenterOpen, setIsCenterOpen] = useState(false);

  const actorKey = user?.id ?? (isGuest ? 'guest' : 'anonymous');

  useEffect(() => {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${actorKey}`);
    setProgress(raw ? JSON.parse(raw) : getDefaultProgress());
    setProgressLoaded(true);
  }, [actorKey]);

  const persistProgress = useCallback((next: TutorialProgress) => {
    setProgress(next);
    localStorage.setItem(`${STORAGE_KEY}:${actorKey}`, JSON.stringify(next));
  }, [actorKey]);

  const startSection = useCallback((sectionId: TutorialSectionId) => {
    setCurrentSectionId(sectionId);
    setCurrentStepIndex(0);
    setIsMandatory(sectionId === 'onboarding' && !progress.hasCompletedOnboarding);
    setIsCenterOpen(false);
  }, [progress.hasCompletedOnboarding]);

  const startOnboarding = useCallback(() => {
    startSection('onboarding');
  }, [startSection]);

  useEffect(() => {
    const shouldStart = progressLoaded && (user || isGuest) && !progress.hasCompletedOnboarding && !currentSectionId;
    if (shouldStart) {
      startOnboarding();
    }
  }, [user, isGuest, progress.hasCompletedOnboarding, startOnboarding, currentSectionId, progressLoaded]);

  const activeSection = useMemo(
    () => TUTORIAL_SECTIONS.find((section) => section.id === currentSectionId) ?? null,
    [currentSectionId]
  );

  const currentStep = activeSection?.steps[currentStepIndex] ?? null;

  useEffect(() => {
    if (currentStep?.route && location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [currentStep?.route, navigate, location.pathname]);

  const completeSection = useCallback((sectionId: TutorialSectionId) => {
    const nextCompleted = progress.completedSections.includes(sectionId)
      ? progress.completedSections
      : [...progress.completedSections, sectionId];

    persistProgress({
      hasCompletedOnboarding: progress.hasCompletedOnboarding || sectionId === 'onboarding',
      completedSections: nextCompleted,
    });
  }, [persistProgress, progress.completedSections, progress.hasCompletedOnboarding]);

  const clearRun = useCallback(() => {
    setCurrentSectionId(null);
    setCurrentStepIndex(0);
    setIsMandatory(false);
  }, []);

  const nextStep = useCallback(() => {
    if (!activeSection) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= activeSection.steps.length) {
      completeSection(activeSection.id);
      clearRun();
      return;
    }
    setCurrentStepIndex(nextIndex);
  }, [activeSection, clearRun, completeSection, currentStepIndex]);

  const skipTutorial = useCallback(() => {
    if (currentSectionId === 'onboarding') {
      persistProgress({
        ...progress,
        hasCompletedOnboarding: true,
      });
    }
    clearRun();
  }, [clearRun, currentSectionId, persistProgress, progress]);

  return (
    <TutorialContext.Provider
      value={{
        isActive: Boolean(activeSection),
        isMandatory,
        currentStep,
        currentSectionId,
        currentStepIndex,
        currentSectionLength: activeSection?.steps.length ?? 0,
        progress,
        startSection,
        startOnboarding,
        nextStep,
        skipTutorial,
        isCenterOpen,
        openCenter: () => setIsCenterOpen(true),
        closeCenter: () => setIsCenterOpen(false),
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used inside TutorialProvider');
  }
  return context;
};
