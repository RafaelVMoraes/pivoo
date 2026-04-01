import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Goal, useGoals } from '@/hooks/useGoals';
import { ActivityList } from '../forms/ActivityList';
import {
  Target,
  RotateCcw,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit2,
  Archive,
  Trash2,
  CheckCircle,
  Heart,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/hooks/useTranslation';
import { EditGoalDialog } from './EditGoalDialog';

interface GoalDetailsDialogProps {
  goal: Goal;
  isOpen: boolean;
  onClose: () => void;
}

// Helper to mimic a deep copy to avoid mutation
function deepCloneChecklist(arr: any[]) {
  return arr.map(item => ({ ...item }));
}

export const GoalDetailsDialog = ({
  goal,
  isOpen,
  onClose
}: GoalDetailsDialogProps) => {
  const { t } = useTranslation();
  const { updateGoal, deleteGoal, getSuccessChecklistProgress, canCompleteGoal } = useGoals();
  const [showReflection, setShowReflection] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Local state for checklist (so that toggling is instant)
  const [localChecklist, setLocalChecklist] = useState(goal.success_checklist ? deepCloneChecklist(goal.success_checklist) : []);

  // When dialog opens or goal changes, update local checklist to match latest goal prop
  useEffect(() => {
    setLocalChecklist(goal.success_checklist ? deepCloneChecklist(goal.success_checklist) : []);
  }, [goal.success_checklist, goal.id, isOpen]);

  const hasReflection =
    goal.surface_motivation ||
    goal.deeper_motivation ||
    goal.identity_motivation;

  // Compute progress using localChecklist if available
  const checklistForProgress = (goal.success_checklist && localChecklist.length === goal.success_checklist.length)
    ? { ...goal, success_checklist: localChecklist }
    : goal;
  const successProgress = getSuccessChecklistProgress(checklistForProgress);

  const valuesCount = goal.related_values?.length || 0;
  const areasCount = Array.isArray(goal.life_wheel_area) 
    ? goal.life_wheel_area.length 
    : goal.life_wheel_area ? 1 : 0;

  const handleDelete = async () => {
    if (window.confirm(t('goal.delete.confirmation'))) {
      await deleteGoal(goal.id);
      onClose();
    }
  };

  const handleArchive = async () => {
    await updateGoal(goal.id, { status: 'archived' });
    onClose();
  };

  // Updated: Use local state for instant feedback + sync server
  const handleToggleChecklistItem = async (itemId: string) => {
    if (!localChecklist) return;
    // Optimistically update local checklist
    setLocalChecklist(prevChecklist =>
      prevChecklist.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );

    // Update on server, using goal.success_checklist as base, to avoid drifting if something changed server-side
    const updatedChecklist = (goal.success_checklist ?? []).map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    await updateGoal(goal.id, { success_checklist: updatedChecklist });

    // (Optional: Re-sync after save? -- up to you; for most uses, leave as is)
  };

  const handleMarkComplete = async () => {
    if (!canCompleteGoal(goal)) {
      return;
    }
    await updateGoal(goal.id, { status: 'completed' });
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-start justify-between gap-4">
            <DialogTitle className="flex items-center gap-3">
              {goal.type === 'target' ? (
                <Target size={20} className="text-primary" />
              ) : (
                <RotateCcw size={20} className="text-primary" />
              )}
              <span>{goal.title}</span>
            </DialogTitle>

            {/* Top actions: 3-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                  <Edit2 size={14} className="mr-2" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive size={14} className="mr-2" />
                  {t('common.archive')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 size={14} className="mr-2" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Context Badges */}
            <div className="flex gap-2 flex-wrap">
              {/* Why it matters badge */}
              {hasReflection && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className={cn(badgeVariants({ variant: 'outline' }), 'cursor-pointer')}>
                      <MessageCircle size={12} className="mr-1" />
                      {t('goal.whyItMatters')}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="max-w-xs">
                    <div className="space-y-2">
                      {goal.surface_motivation && (
                        <p className="text-xs"><strong>{t('reflection.surface.label')}:</strong> {goal.surface_motivation}</p>
                      )}
                      {goal.deeper_motivation && (
                        <p className="text-xs"><strong>{t('reflection.deeper.label')}:</strong> {goal.deeper_motivation}</p>
                      )}
                      {goal.identity_motivation && (
                        <p className="text-xs"><strong>{t('reflection.identity.label')}:</strong> {goal.identity_motivation}</p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Values badge */}
              {valuesCount > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className={cn(badgeVariants({ variant: 'outline' }), 'cursor-pointer')}>
                      <Heart size={12} className="mr-1" />
                      {valuesCount} {t('goal.values')}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="text-xs">
                      {goal.related_values?.map(v => t(`selfDiscovery.values.${v}`)).join(', ')}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Life areas badge */}
              {areasCount > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className={cn(badgeVariants({ variant: 'outline' }), 'cursor-pointer')}>
                      <Compass size={12} className="mr-1" />
                      {areasCount} {t('goal.lifeAreas')}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="text-xs">
                      {(Array.isArray(goal.life_wheel_area) ? goal.life_wheel_area : [goal.life_wheel_area])
                        .filter(Boolean)
                        .map(a => {
                          const translationKey = `selfDiscovery.lifeWheel.areas.${a}`;
                          const translated = t(translationKey);
                          // If translation returns the key itself, it means the translation doesn't exist
                          // In that case, just use the original area name
                          return translated === translationKey ? a : translated;
                        })
                        .join(', ')}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Description */}
            {goal.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {t('goal.description')}
                </h4>
                <p className="text-foreground">{goal.description}</p>
              </div>
            )}

            {/* Definition of Success */}
            {goal.success_checklist && goal.success_checklist.length > 0 && (
              <div className="p-4 bg-accent/20 rounded-lg border border-border">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary" />
                  {t('goal.definitionOfSuccess')} ({successProgress.completed}/{successProgress.total})
                </h4>
                <div className="space-y-2">
                  {localChecklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => handleToggleChecklistItem(item.id)}
                      />
                      <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Mark Complete button - only enabled when all items are checked */}
                {goal.status !== 'completed' && (
                  <Button
                    className="mt-4 w-full"
                    onClick={handleMarkComplete}
                    disabled={!canCompleteGoal(checklistForProgress)}
                  >
                    <CheckCircle size={14} className="mr-2" />
                    {t('goal.markComplete')}
                  </Button>
                )}
              </div>
            )}

            {/* Activities */}
            <ActivityList goalId={goal.id} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <EditGoalDialog
        goal={goal}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
        }}
      />
    </>
  );
};
