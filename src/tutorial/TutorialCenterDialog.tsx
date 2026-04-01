import { CheckCircle2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TUTORIAL_SECTIONS } from './config';
import { useTutorial } from './TutorialContext';

export const TutorialCenterDialog = () => {
  const { isCenterOpen, closeCenter, startSection, startOnboarding, progress } = useTutorial();

  return (
    <Dialog open={isCenterOpen} onOpenChange={closeCenter}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tutorial</DialogTitle>
        </DialogHeader>

        <div className="mb-4 rounded-lg bg-muted p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Run full onboarding again</p>
            <p className="text-xs text-muted-foreground">A concise guided tour of the most important product flows.</p>
          </div>
          <Button onClick={startOnboarding}>Start</Button>
        </div>

        <ScrollArea className="h-[55vh] pr-3">
          <div className="space-y-3">
            {TUTORIAL_SECTIONS.filter((s) => s.id !== 'onboarding').map((section) => {
              const isCompleted = progress.completedSections.includes(section.id);
              return (
                <div key={section.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{section.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{section.steps.length} steps</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="completed" />}
                      <Button size="sm" variant="outline" onClick={() => startSection(section.id)}>
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Launch
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
