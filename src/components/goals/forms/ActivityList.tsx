import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, SquareCheckBig, Edit2, Check, RotateCcw, Clock, Loader2, X, Trash2 } from 'lucide-react';
import { useActivities, Activity } from '@/hooks/useActivities';
import { useCheckIns } from '@/hooks/useCheckIns';
import { FrequencySelector } from './FrequencySelector';
import { useTranslation } from '@/hooks/useTranslation';

interface ActivityListProps {
  goalId: string;
}

export const ActivityList = ({ goalId }: ActivityListProps) => {
  const { t } = useTranslation();
  const { activities, isLoading, createActivity, updateActivity, deleteActivity, refetch } = useActivities(goalId);
  const { checkIns, createCheckIn } = useCheckIns(goalId);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creatingCheckIn, setCreatingCheckIn] = useState<string | null>(null);
  const [activityProgress, setActivityProgress] = useState<Record<string, number>>({});
  const [monthlyEvolution, setMonthlyEvolution] = useState<Record<string, 'no_evolution' | 'some_evolution' | 'good_evolution'>>({});

  // New activity form
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newActivityType, setNewActivityType] = useState<'habit' | 'target'>('habit');
  const [newTargetValue, setNewTargetValue] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newFrequency, setNewFrequency] = useState<{
    type: 'daily' | 'weekly' | 'monthly';
    timeOfDay?: 'morning' | 'afternoon' | 'night' | 'whole_day';
    daysOfWeek?: string[];
    dayOfMonth?: number;
  }>({
    type: 'weekly',
    timeOfDay: 'whole_day',
  });

  // Edit activity form
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editActivityType, setEditActivityType] = useState<'habit' | 'target'>('habit');
  const [editTargetValue, setEditTargetValue] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editFrequency, setEditFrequency] = useState<{
    type: 'daily' | 'weekly' | 'monthly';
    timeOfDay?: 'morning' | 'afternoon' | 'night' | 'whole_day';
    daysOfWeek?: string[];
    dayOfMonth?: number;
  }>({ type: 'weekly' });

  // Calculate monthly progress for each activity
  useEffect(() => {
    const progress: Record<string, number> = {};
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    activities.forEach(activity => {
      const activityCheckIns = checkIns.filter(ci => 
        ci.activity_id === activity.id && 
        new Date(ci.date) >= startOfMonth
      );
      
      let expectedCheckIns = 0;
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysPassed = now.getDate();
      
      if (activity.frequency_type === 'daily') {
        expectedCheckIns = daysPassed;
      } else if (activity.frequency_type === 'weekly') {
        const weeksElapsed = Math.ceil(daysPassed / 7);
        expectedCheckIns = weeksElapsed * (activity.days_of_week?.length || 1);
      } else if (activity.frequency_type === 'monthly') {
        expectedCheckIns = 1;
      }
      
      progress[activity.id] = expectedCheckIns > 0 
        ? Math.min(Math.round((activityCheckIns.length / expectedCheckIns) * 100), 100) 
        : 0;
    });
    setActivityProgress(progress);
  }, [activities, checkIns]);

  const resetNewForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewActivityType('habit');
    setNewTargetValue('');
    setNewEndDate('');
    setNewFrequency({ type: 'weekly', timeOfDay: 'whole_day' });
    setIsAdding(false);
  };

  const handleAddActivity = async () => {
    if (!newTitle.trim() || !newDescription.trim()) return;
    try {
      await createActivity({
        goal_id: goalId,
        title: newTitle.trim(),
        description: newDescription.trim(),
        activity_type: newActivityType,
        target_value: newActivityType === 'target' ? newTargetValue.trim() || undefined : undefined,
        end_date: newActivityType === 'target' && newEndDate ? newEndDate : undefined,
        frequency_type: newActivityType === 'habit' ? newFrequency.type : 'monthly',
        time_of_day: newActivityType === 'target' ? 'whole_day' : newFrequency.timeOfDay,
        days_of_week: newFrequency.daysOfWeek,
        day_of_month: newActivityType === 'target' ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() : newFrequency.dayOfMonth,
        status: 'active'
      });
      resetNewForm();
    } catch (error) {}
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingId(activity.id);
    setEditTitle(activity.title || activity.description);
    setEditDescription(activity.description);
    setEditActivityType(activity.activity_type || 'habit');
    setEditTargetValue(activity.target_value || '');
    setEditEndDate(activity.end_date ? activity.end_date.split('T')[0] : '');
    setEditFrequency({
      type: activity.frequency_type === 'custom' ? 'weekly' : (activity.frequency_type || 'weekly') as 'daily' | 'weekly' | 'monthly',
      timeOfDay: activity.time_of_day || 'whole_day',
      daysOfWeek: activity.days_of_week || [],
      dayOfMonth: activity.day_of_month
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim() || !editDescription.trim()) return;
    try {
      await updateActivity(editingId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        activity_type: editActivityType,
        target_value: editActivityType === 'target' ? editTargetValue.trim() || undefined : undefined,
        end_date: editActivityType === 'target' && editEndDate ? editEndDate : undefined,
        frequency_type: editActivityType === 'habit' ? editFrequency.type : 'monthly',
        time_of_day: editActivityType === 'target' ? 'whole_day' : editFrequency.timeOfDay,
        days_of_week: editFrequency.daysOfWeek,
        day_of_month: editFrequency.dayOfMonth
      });
      setEditingId(null);
    } catch (error) {}
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (window.confirm(t('activity.deleteConfirmation'))) {
      await deleteActivity(activityId);
    }
  };

  const handleMarkTargetCompleted = async (activityId: string) => {
    try {
      await updateActivity(activityId, { status: 'completed' });
      refetch();
    } catch (error) {
      console.error('Error marking target as completed:', error);
    }
  };

  const handleMarkDone = async (activity: Activity) => {
    if (creatingCheckIn === activity.id) return;
    setCreatingCheckIn(activity.id);
    try {
      // For target activities, use monthly evolution value if set, otherwise 'done'
      const progressValue = activity.activity_type === 'target' && monthlyEvolution[activity.id]
        ? monthlyEvolution[activity.id]
        : 'done';
      
      await createCheckIn({
        goal_id: goalId,
        activity_id: activity.id,
        date: new Date().toISOString(),
        progress_value: progressValue,
        input_type: 'checkbox'
      });
      // Clear monthly evolution after creating check-in
      setMonthlyEvolution(prev => {
        const next = { ...prev };
        delete next[activity.id];
        return next;
      });
      refetch();
    } finally {
      setCreatingCheckIn(null);
    }
  };

  const formatFrequency = (activity: Activity) => {
    if (activity.activity_type === 'target') return t('activity.monthlyTarget');
    if (activity.frequency_type === 'daily') return t('activity.daily');
    if (activity.frequency_type === 'weekly') return t('activity.weekly', { count: activity.days_of_week?.length || 1 });
    if (activity.frequency_type === 'monthly') return t('activity.monthly', { count: 1 });
    return activity.frequency || t('activity.custom');
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">{t('activity.header')}</h4>
        <Button size="sm" variant="outline" onClick={() => setIsAdding(true)} className="text-xs h-9 min-h-[44px] px-4">
          <Plus size={12} className="mr-1" />
          {t('activity.addButton')}
        </Button>
      </div>

      {/* New activity form - appears at top */}
      {isAdding && (
        <div className="bg-accent/50 p-4 rounded-lg space-y-3 border border-border">
          {/* Activity Type */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setNewActivityType('habit')}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                newActivityType === 'habit' ? 'border-primary bg-primary/10' : 'border-border'
              }`}
            >
              <div className="text-sm font-medium">🔄 {t('activity.habitType')}</div>
              <div className="text-xs text-muted-foreground">{t('activity.habitTypeDescription')}</div>
            </button>
            <button
              type="button"
              onClick={() => setNewActivityType('target')}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                newActivityType === 'target' ? 'border-primary bg-primary/10' : 'border-border'
              }`}
            >
              <div className="text-sm font-medium">🎯 {t('activity.targetType')}</div>
              <div className="text-xs text-muted-foreground">{t('activity.targetTypeDescription')}</div>
            </button>
          </div>

          {/* Title and Description */}
          <div className="space-y-2">
            <Label>{t('activity.title')} *</Label>
            <Input
              placeholder={t('activity.titlePlaceholder')}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <Label>{t('activity.description')} *</Label>
            <Textarea
              placeholder={t('activity.descriptionPlaceholder')}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Target value for target activities */}
          {newActivityType === 'target' && (
            <>
              <div className="space-y-2">
                <Label>{t('activity.targetValue')}</Label>
                <Input
                  placeholder={t('activity.targetValuePlaceholder')}
                  value={newTargetValue}
                  onChange={(e) => setNewTargetValue(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('activity.endDate')}</Label>
                <Input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
            </>
          )}

          {/* Frequency (only for habit activities) */}
          {newActivityType === 'habit' && (
            <FrequencySelector value={newFrequency} onChange={setNewFrequency} />
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddActivity} disabled={!newTitle.trim() || !newDescription.trim()} className="min-h-[44px]">
              <Check size={12} className="mr-1" />
              {t('activity.addButton')}
            </Button>
            <Button size="sm" variant="outline" onClick={resetNewForm} className="min-h-[44px]">
              <X size={12} className="mr-1" />
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {/* Activity list */}
      <div className="space-y-3">
        {activities.map(activity => {
          const isCreating = creatingCheckIn === activity.id;
          const progress = activityProgress[activity.id] || 0;
          const isEditing = editingId === activity.id;

          if (isEditing) {
            return (
              <div key={activity.id} className="bg-accent/50 p-4 rounded-lg space-y-3 border border-border">
                {/* Activity Type */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditActivityType('habit')}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      editActivityType === 'habit' ? 'border-primary bg-primary/10' : 'border-border'
                    }`}
                  >
                    <div className="text-sm font-medium">🔄 {t('activity.habitType')}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditActivityType('target')}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      editActivityType === 'target' ? 'border-primary bg-primary/10' : 'border-border'
                    }`}
                  >
                    <div className="text-sm font-medium">🎯 {t('activity.targetType')}</div>
                  </button>
                </div>

                <div className="space-y-2">
                  <Label>{t('activity.title')} *</Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('activity.description')} *</Label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                {editActivityType === 'target' && (
                  <>
                    <div className="space-y-2">
                      <Label>{t('activity.targetValue')}</Label>
                      <Input
                        value={editTargetValue}
                        onChange={(e) => setEditTargetValue(e.target.value)}
                        className="min-h-[44px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('activity.endDate')}</Label>
                      <Input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        className="min-h-[44px]"
                      />
                    </div>
                  </>
                )}

                {editActivityType === 'habit' && (
                  <FrequencySelector value={editFrequency} onChange={setEditFrequency} />
                )}

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} className="min-h-[44px]">
                    <Check size={12} className="mr-1" />
                    {t('common.save')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="min-h-[44px]">
                    <X size={12} className="mr-1" />
                    {t('common.cancel')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteActivity(activity.id)}
                    className="min-h-[44px] ml-auto"
                  >
                    <Trash2 size={12} className="mr-1" />
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <div key={activity.id} className="bg-accent/30 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm font-medium text-foreground">{activity.title}</span>
                    {activity.activity_type === 'habit'&& (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0.5 bg-muted border-muted-foreground/20 border font-normal text-muted-foreground h-5"
                      >
                        <RotateCcw size={9} className="mr-0.5 inline" />
                        {formatFrequency(activity)}
                      </Badge>
                    )}
                    {activity.frequency_type === 'monthly' && activity.activity_type === 'habit' && (
                      <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0.5 bg-muted border-muted-foreground/20 border font-normal text-muted-foreground h-5"
                    >
                      <Clock size={9} className="mr-0.5 inline" />
                      {activity.day_of_month}
                    </Badge>
                    )}
                    {activity.frequency_type === 'weekly' && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0.5 bg-muted border-muted-foreground/20 border font-normal text-muted-foreground h-5"
                      >
                        <Clock size={9} className="mr-0.5 inline" />
                        {(activity.days_of_week || []).map((day: string, idx: number) => {
                          const dayKey = `frequency.${day.toLowerCase()}`;
                          // Always show only first 3 letters of the translation
                          const dayLabel = t(dayKey).slice(0, 3);
                          return (
                            <span key={day}>
                              {dayLabel}
                              {idx < (activity.days_of_week?.length ?? 1) - 1 && ', '}
                            </span>
                          );
                        })}
                      </Badge>
                    )}
                    {activity.frequency_type === 'daily' && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0.5 bg-muted border-muted-foreground/20 border font-normal text-muted-foreground h-5"
                      >
                        <Clock size={9} className="mr-0.5 inline" />
                        {activity.time_of_day === 'morning' && t('frequency.morning')}
                        {activity.time_of_day === 'afternoon' && t('frequency.afternoon')}
                        {activity.time_of_day === 'night' && t('frequency.night')}
                        {activity.time_of_day === 'whole_day' && t('frequency.wholeDay')}
                      </Badge>
                    )}
                
                    {activity.activity_type === 'target' && activity.target_value && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0.5 h-5"
                      >
                        🎯 {activity.target_value}
                      </Badge>
                    )}
                  </div>
                  {activity.description !== activity.title && (
                    <p className="text-xs text-muted-foreground mb-2">{activity.description}</p>
                  )}
                </div>

                {/* Actions: Edit and Done */}
                <div className="flex gap-1 items-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditActivity(activity)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleMarkDone(activity)}
                    disabled={isCreating}
                    className="h-8 px-3"
                  >
                    {isCreating ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <SquareCheckBig size={14} />
                    )}
                  </Button>
                </div>
              </div>

              {/* Target-specific features */}
              {activity.activity_type === 'target' && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 pt-2 border-t border-border">
                  {/* Completion checkbox for target */}
                  <div className="flex items-center gap-2">
                    <input
                      id={`target-completed-${activity.id}`}
                      type="checkbox"
                      checked={activity.status === 'completed'}
                      onChange={() => {
                        if (activity.status === 'completed') {
                          updateActivity(activity.id, { status: 'active' });
                        } else {
                          handleMarkTargetCompleted(activity.id);
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor={`target-completed-${activity.id}`} className="text-sm cursor-pointer">
                      {t('activity.targetReached')}
                    </Label>
                  </div>
                  
                  {/* Monthly Evolution selector (only for active targets) */}
                  {activity.status === 'active' && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm min-w-max">
                        {t('activity.monthlyEvolution')}
                      </Label>
                      <Select
                        value={monthlyEvolution[activity.id] || ''}
                        onValueChange={(value: 'no_evolution' | 'some_evolution' | 'good_evolution') => {
                          setMonthlyEvolution(prev => ({ ...prev, [activity.id]: value }));
                        }}
                      >
                        <SelectTrigger className="min-h-[34px] w-[150px]">
                          <SelectValue placeholder={t('activity.selectEvolution')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no_evolution">{t('activity.noEvolution')}</SelectItem>
                          <SelectItem value="some_evolution">{t('activity.someEvolution')}</SelectItem>
                          <SelectItem value="good_evolution">{t('activity.goodEvolution')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* Monthly Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('activity.monthlyProgress')}</span>
                  <span className={`font-medium ${progress >= 70 ? 'text-green-500' : progress >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            </div>
          );
        })}

        {activities.length === 0 && !isAdding && (
          <div className="text-center py-8 px-4 bg-accent/20 rounded-lg border-2 border-dashed border-border">
            <p className="text-sm text-muted-foreground mb-3">{t('activity.noActivities')}</p>
            <p className="text-xs text-muted-foreground mb-4">{t('activity.noActivitiesExample')}</p>
            <Button size="sm" variant="outline" onClick={() => setIsAdding(true)} className="min-h-[44px]">
              <Plus size={14} className="mr-2" />
              {t('activity.addFirst')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
