import { Button } from '@/components/ui/button';

interface TutorialStepCardProps {
  title: string;
  description: string;
  stepLabel: string;
  top: number;
  left: number;
  onNext: () => void;
  onSkip: () => void;
}

export const TutorialStepCard = ({
  title,
  description,
  stepLabel,
  top,
  left,
  onNext,
  onSkip,
}: TutorialStepCardProps) => {
  return (
    <div
      className="fixed z-[102] w-[min(360px,calc(100vw-1.5rem))] rounded-xl border border-border bg-card p-4 shadow-xl"
      style={{ top, left }}
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial step"
    >
      <p className="text-xs text-muted-foreground mb-2">{stepLabel}</p>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onSkip}>Skip tutorial</Button>
        <Button size="sm" onClick={onNext}>Next</Button>
      </div>
    </div>
  );
};
