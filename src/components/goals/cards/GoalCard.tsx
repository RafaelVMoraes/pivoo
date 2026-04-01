import { useState } from 'react';
import { Goal, useGoals } from '@/hooks/useGoals';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  MoreVertical,
  Edit2,
  Archive,
  Trash2,
  Eye,
  CheckCircle,
  ListChecks,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useActivities } from '@/hooks/useActivities';
import { useCheckIns } from '@/hooks/useCheckIns';
import { GoalDetailsDialog } from '../dialogs/GoalDetailsDialog';
import { EditGoalDialog } from '../dialogs/EditGoalDialog';

interface EnhancedGoalCardProps {
  goal: Goal;
  onRefresh?: () => void;
}

export const EnhancedGoalCard = ({ goal, onRefresh }: EnhancedGoalCardProps) => {
  const { t, language } = useTranslation();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { updateGoal, deleteGoal, getSuccessChecklistProgress } = useGoals();
  const { activities } = useActivities(goal.id);
  const { checkIns } = useCheckIns(goal.id);

  const localeMap = { en: 'en-US', pt: 'pt-BR', fr: 'fr-FR' };
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(localeMap[language] || 'en-US', {
      month: 'short',
      day: 'numeric',
    });

  // Get success checklist progress
  const successProgress = getSuccessChecklistProgress(goal);

  // Calculate monthly progress (percentage of expected activities completed this month)
  const calculateMonthlyProgress = (): number => {
    if (activities.length === 0) return 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();

    // Count expected check-ins for this month based on activity frequencies
    let totalExpected = 0;
    let totalCompleted = 0;

    activities.forEach(activity => {
      if (activity.status !== 'active') return;

      // Calculate expected check-ins for this month
      let expected = 0;
      if (activity.frequency_type === 'daily') {
        expected = daysPassed;
      } else if (activity.frequency_type === 'weekly') {
        // Count how many scheduled days have passed this month
        const weeksElapsed = Math.ceil(daysPassed / 7);
        const daysPerWeek = activity.days_of_week?.length || 1;
        expected = weeksElapsed * daysPerWeek;
      } else if (activity.frequency_type === 'monthly') {
        // If the scheduled day has passed, expect 1 completion
        if (activity.day_of_month && activity.day_of_month <= daysPassed) {
          expected = 1;
        }
      }

      totalExpected += expected;

      // Count completed check-ins for this activity this month
      const activityCheckIns = checkIns.filter(ci => {
        if (ci.activity_id !== activity.id) return false;
        const checkInDate = new Date(ci.date);
        return checkInDate >= startOfMonth && 
               checkInDate < now &&
               (ci.progress_value === 'done' || 
                ci.progress_value === 'no_evolution' ||
                ci.progress_value === 'some_evolution' ||
                ci.progress_value === 'good_evolution');
      });

      // For daily/weekly, count unique days completed
      // For monthly, count if completed
      if (activity.frequency_type === 'daily' || activity.frequency_type === 'weekly') {
        const uniqueDays = new Set(
          activityCheckIns.map(ci => new Date(ci.date).toISOString().split('T')[0])
        );
        totalCompleted += uniqueDays.size;
      } else if (activity.frequency_type === 'monthly') {
        totalCompleted += activityCheckIns.length > 0 ? 1 : 0;
      }
    });

    if (totalExpected === 0) return 0;
    return Math.min(100, Math.round((totalCompleted / totalExpected) * 100));
  };

  const monthlyProgress = calculateMonthlyProgress();

  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return 'bg-green-500 text-green-50';
    if (progress >= 60) return 'bg-blue-500 text-blue-50';
    if (progress >= 40) return 'bg-yellow-500 text-yellow-50';
    return 'bg-red-500 text-red-50';
  };

  const handleDelete = async () => {
    if (window.confirm(t('goal.delete.confirmation'))) {
      await deleteGoal(goal.id);
      onRefresh?.();
    }
  };

  const handleArchive = async () => {
    await updateGoal(goal.id, { status: 'archived' });
    onRefresh?.();
  };

  const priorityMeta = {
    gold: { emoji: '🥇', label: t('goal.priority.gold') },
    silver: { emoji: '🥈', label: t('goal.priority.silver') },
    bronze: { emoji: '🥉', label: t('goal.priority.bronze') },
  }[goal.priority];

  // Check if end date is different from end of year
  const endOfYear = new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0];
  const showTargetDate = goal.end_date && goal.end_date !== endOfYear;

  return (
    <>
      <Card className="glass-card hover:shadow-md transition-shadow group relative">
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold truncate">{goal.title}</h3>
                <Badge variant="outline" className="shrink-0">
                  {priorityMeta.emoji} {priorityMeta.label}
                </Badge>
                {/* Definition of Success progress */}
                {successProgress.total > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle size={12} />
                    {successProgress.completed} / {successProgress.total}
                  </Badge>
                )}
                {/* Activities count */}
                <Badge variant="secondary" className="flex items-center gap-1">
                  <ListChecks size={12} />
                  {activities.length} {t(activities.length === 1 ? 'goal.activity' : 'goal.activities')}
                </Badge>
                {/* Target date (only if different from end of year) */}
                {showTargetDate && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(goal.end_date!)}
                  </Badge>
                )}
                {/* Monthly progress badge */}
                {activities.length > 0 && (
                  <Badge className={`${getProgressColor(monthlyProgress)}`}>
                    {monthlyProgress}% {t('goal.thisMonth')}
                  </Badge>
                )}
              </div>
              {goal.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {goal.description}
                </p>
              )}
            </div>

            {/* View Details Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDetailsOpen(true)}
              className="shrink-0"
            >
              <Eye size={14} className="mr-1" />
              {t('goal.viewDetails')}
            </Button>
          </div>
        </div>

        {/* 3-dot menu in top-right corner of the card */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label={t('goal.actions')}
                className="p-2 rounded-md hover:bg-accent/50 transition-opacity"
              >
                <MoreVertical size={16} />
              </button>
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
        </div>
      </Card>

      {/* Dialogs */}
      <GoalDetailsDialog
        goal={goal}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          onRefresh?.();
        }}
      />
      <EditGoalDialog
        goal={goal}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          onRefresh?.();
        }}
      />
    </>
  );
};
