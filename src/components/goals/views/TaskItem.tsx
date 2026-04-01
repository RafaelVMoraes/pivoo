import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Sun, Moon, CloudSun, Info, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface TaskItemProps {
  activityTitle: string;
  activityDescription?: string;
  goalTitle: string;
  priority: 'gold' | 'silver' | 'bronze';
  timeOfDay?: 'morning' | 'afternoon' | 'night' | 'whole_day' | null;
  dayContext?: string;
  isCompleted: boolean;
  isNotDone?: boolean;
  isLate: boolean;
  onToggle: () => void;
}

const priorityColors: Record<string, string> = {
  gold: 'bg-amber-500',
  silver: 'bg-slate-400',
  bronze: 'bg-orange-700',
};

const priorityLabels: Record<string, string> = {
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

const TimeIcon = ({ timeOfDay }: { timeOfDay?: string }) => {
  switch (timeOfDay) {
    case 'morning':
      return <Sun size={12} className="text-amber-500" />;
    case 'afternoon':
      return <CloudSun size={12} className="text-orange-400" />;
    case 'night':
      return <Moon size={12} className="text-indigo-400" />;
    case 'whole_day':
      return null; // No icon for whole day
    default:
      return null;
  }
};

export const TaskItem = ({
  activityTitle,
  activityDescription,
  goalTitle,
  priority,
  timeOfDay,
  dayContext,
  isCompleted,
  isLate,
  isNotDone,
  onToggle,
}: TaskItemProps) => {
  const { t } = useTranslation();
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          'p-4 flex items-center gap-3 hover:bg-accent/30 transition-colors border-b border-border last:border-b-0',
          isCompleted && 'opacity-60',
          isNotDone && 'bg-destructive/5'
        )}
      >
        <Checkbox
          checked={isCompleted}
          onCheckedChange={onToggle}
          className="h-5 w-5 shrink-0"
        />

        {/* Priority indicator */}
        <div
          className={cn('w-2 h-2 rounded-full shrink-0', priorityColors[priority])}
          title={`${priority} priority`}
        />

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'font-medium text-foreground truncate',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {activityTitle}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isNotDone ? (
            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
              <AlertCircle size={10} className="mr-1" />
              {t('dashboard.notDone')}
            </Badge>
          ) : isLate && !isCompleted && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
              <AlertCircle size={10} className="mr-1" />
              {t('tasks.late')}
            </Badge>
          )}

          {(timeOfDay || dayContext) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TimeIcon timeOfDay={timeOfDay} />
              {timeOfDay === 'whole_day' && <span className="text-[10px]">{t('frequency.wholeDay')}</span>}
              {dayContext && <span>{dayContext}</span>}
            </div>
          )}

          {/* Info button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsInfoOpen(true);
            }}
          >
            <Info size={14} className="text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Task Details Dialog */}
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded-full', priorityColors[priority])} />
              {activityTitle}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('tasks.linkedObjective')}: {goalTitle}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            {/* Linked Objective */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Target size={14} />
                {t('tasks.linkedObjective')}
              </div>
              <p className="text-foreground pl-5">{goalTitle}</p>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                {t('goals.priority')}
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'capitalize',
                  priority === 'gold' && 'border-amber-500 text-amber-500',
                  priority === 'silver' && 'border-slate-400 text-slate-400',
                  priority === 'bronze' && 'border-orange-700 text-orange-700'
                )}
              >
                {priorityLabels[priority]}
              </Badge>
            </div>

            {/* Description (if available) */}
            {activityDescription && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">
                  {t('goals.description')}
                </div>
                <p className="text-foreground text-sm">{activityDescription}</p>
              </div>
            )}

            {/* Schedule info */}
            {(timeOfDay || dayContext) && (
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">
                  {t('tasks.schedule')}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TimeIcon timeOfDay={timeOfDay} />
                  {timeOfDay && timeOfDay !== 'whole_day' && (
                    <span className="capitalize">{t(`frequency.${timeOfDay}`)}</span>
                  )}
                  {timeOfDay === 'whole_day' && (
                    <span>{t('frequency.wholeDay')}</span>
                  )}
                  {dayContext && <span className="text-muted-foreground">• {dayContext}</span>}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                {t('goals.status')}
              </div>
              <Badge variant={isCompleted ? 'default' : (isNotDone || isLate) ? 'destructive' : 'secondary'}>
                {isCompleted ? t('tasks.completed') : isNotDone ? t('dashboard.notDone') : isLate ? t('tasks.late') : t('tasks.pending')}
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
