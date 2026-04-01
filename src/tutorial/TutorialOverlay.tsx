import { useEffect, useMemo, useState } from 'react';
import { useTutorial } from './TutorialContext';
import { HighlightOverlay } from './HighlightOverlay';
import { TutorialStepCard } from './TutorialStepCard';

const waitMs = 250;

export const TutorialOverlay = () => {
  const { isActive, currentStep, currentSectionLength, currentStepIndex, nextStep, skipTutorial, isMandatory } = useTutorial();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!currentStep) return;

    const refreshRect = () => {
      const target = document.querySelector(currentStep.target);
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTargetRect(target.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    refreshRect();
    const timeout = window.setTimeout(refreshRect, waitMs);
    const interval = window.setInterval(refreshRect, 1000);
    window.addEventListener('resize', refreshRect);
    window.addEventListener('scroll', refreshRect, true);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      window.removeEventListener('resize', refreshRect);
      window.removeEventListener('scroll', refreshRect, true);
    };
  }, [currentStep]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isMandatory) {
        skipTutorial();
      }
    };

    if (isActive) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isActive, isMandatory, skipTutorial]);

  const tooltipPosition = useMemo(() => {
    if (!targetRect) {
      return { top: 80, left: 12 };
    }
    const top = Math.min(window.innerHeight - 220, targetRect.bottom + 12);
    const left = Math.max(12, Math.min(window.innerWidth - 380, targetRect.left));
    return { top, left };
  }, [targetRect]);

  if (!isActive || !currentStep) {
    return null;
  }

  return (
    <>
      {targetRect ? <HighlightOverlay rect={targetRect} /> : <div className="fixed inset-0 bg-black/55 z-[100]" />}
      <TutorialStepCard
        title={currentStep.title}
        description={currentStep.description}
        stepLabel={`Step ${currentStepIndex + 1} of ${currentSectionLength}`}
        top={tooltipPosition.top}
        left={tooltipPosition.left}
        onNext={nextStep}
        onSkip={skipTutorial}
      />
    </>
  );
};
