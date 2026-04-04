import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSelfDiscovery } from '@/hooks/useSelfDiscovery';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { useYear } from '@/contexts/YearContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, X, Plus, AlertCircle, Trash2, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SuccessChecklistItem } from '@/hooks/useGoals';
import { ActivityList } from '@/components/goals/forms/ActivityList';

interface AddGoalDialogProps {
  children: React.ReactNode;
  onRefresh?: () => void;
}

export const AddGoalDialog = ({ children, onRefresh }: AddGoalDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdGoalId, setCreatedGoalId] = useState<string | null>(null);
  const { user } = useAuth();
  const { lifeWheelData, valuesData } = useSelfDiscovery();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { selectedYear, isPastYear, currentYear } = useYear();

  const canCreateGoal = !isPastYear;

  // Step 1: Basic info
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'habit' | 'target'>('target');
  const [priority, setPriority] = useState<'gold' | 'silver' | 'bronze'>('bronze');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  // Dates - default start date is tomorrow, end date is end of year
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const endOfYear = `${selectedYear}-12-31`;

  const [startDate, setStartDate] = useState(tomorrowStr);
  const [endDate, setEndDate] = useState(endOfYear);

  // Target value (only for target goals)
  const [targetValue, setTargetValue] = useState('');

  // Step 2: Definition of Success (mandatory)
  const [successChecklist, setSuccessChecklist] = useState<SuccessChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Step 3: Reflections (optional, auto-saved)
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [surfaceMotivation, setSurfaceMotivation] = useState('');
  const [deeperMotivation, setDeeperMotivation] = useState('');
  const [identityMotivation, setIdentityMotivation] = useState('');

  const lifeWheelAreas = lifeWheelData.map(item => item.area_name);
  const availableValues = valuesData.filter(value => value.selected).map(value => value.value_name);

  const resetForm = () => {
    setStep(1);
    setTitle('');
    setType('target');
    setPriority('bronze');
    setSelectedAreas([]);
    setDescription('');
    setStartDate(tomorrowStr);
    setEndDate(endOfYear);
    setTargetValue('');
    setSuccessChecklist([]);
    setNewChecklistItem('');
    setSelectedValues([]);
    setSurfaceMotivation('');
    setDeeperMotivation('');
    setIdentityMotivation('');
    setCreatedGoalId(null);
  };

  const createGoal = async (): Promise<string | null> => {
    if (!user || !title.trim() || successChecklist.length === 0) return null;

    setIsSubmitting(true);
    try {
      const { data, error: goalError } = await supabase
        .from('goals')
        .insert([{
          title: title.trim(),
          description: description.trim() || null,
          type,
          status: 'active',
          priority,
          start_date: startDate,
          end_date: type === 'target' ? endDate : null,
          target_date: type === 'target' ? endDate : null,
          target_value: type === 'target' ? targetValue.trim() || null : null,
          life_wheel_area: selectedAreas.length > 0 ? selectedAreas : null,
          related_values: selectedValues.length > 0 ? selectedValues : null,
          surface_motivation: surfaceMotivation.trim() || null,
          deeper_motivation: deeperMotivation.trim() || null,
          identity_motivation: identityMotivation.trim() || null,
          success_checklist: successChecklist.map(item => ({ id: item.id, text: item.text, completed: item.completed })),
          user_id: user.id,
        }])
        .select('id')
        .single();

      if (goalError) throw goalError;

      return data.id;
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: t('goal.creationErrorTitle'),
        description: t('goal.creationErrorDescription'),
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextFromStep3 = async () => {
    if (!createdGoalId) {
      const goalId = await createGoal();
      if (goalId) {
        setCreatedGoalId(goalId);
        setStep(4);
      }
    } else {
      setStep(4);
    }
  };

  const handleFinish = () => {
    toast({
      title: t('goal.creationSuccessTitle'),
      description: t('goal.creationSuccessDescription'),
    });
    resetForm();
    setIsOpen(false);
    onRefresh?.();
  };

  const toggleArea = (area: string) => {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const toggleValue = (value: string) => {
    setSelectedValues(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setSuccessChecklist(prev => [
      ...prev,
      { id: crypto.randomUUID(), text: newChecklistItem.trim(), completed: false }
    ]);
    setNewChecklistItem('');
  };

  const removeChecklistItem = (id: string) => {
    setSuccessChecklist(prev => prev.filter(item => item.id !== id));
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      {/* Goal Type */}
      <div>
        <Label className="mb-1 block">{t('goal.type')}</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('target')}
            className={`flex items-center w-1/2 px-3 py-2 rounded-lg border-2 transition-all text-left ${
              type === 'target'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <span className="text-2xl mr-2 shrink-0">🎯</span>
            <div>
              <div className="font-medium leading-tight text-sm">{t('goal.targetGoal')}</div>
              <div className="text-xs text-muted-foreground">{t('goal.targetGoalDescription')}</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setType('habit')}
            className={`flex items-center w-1/2 px-3 py-2 rounded-lg border-2 transition-all text-left ${
              type === 'habit'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <span className="text-2xl mr-2 shrink-0">🔄</span>
            <div>
              <div className="font-medium leading-tight text-sm">{t('goal.habitGoal')}</div>
              <div className="text-xs text-muted-foreground">{t('goal.habitGoalDescription')}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">{t('goal.title')} *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('goal.titlePlaceholder')}
          className="min-h-[44px]"
        />
      </div>

      {/* Priority */}
      <div>
        <Label>{t('goal.priority')} *</Label>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(['gold', 'silver', 'bronze'] as const).map(p => (
            <button
              key={p}
              type="button"
              title={t(`goal.priority.${p}`)}
              onClick={() => setPriority(p)}
              className={`flex items-center justify-center rounded-2xl border-2 px-4 py-3 text-lg transition-all
                ${priority === p
                  ? p === 'gold'
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : p === 'silver'
                      ? 'border-gray-400 bg-gray-400/10'
                      : 'border-amber-700 bg-amber-700/10'
                  : 'border-border hover:border-primary/50'
                }
                min-h-[54px] w-full font-medium
              `}
              style={{ padding: 0 }}
            >
              <span 
                aria-label={t(`goal.priority.${p}`)}
                className="text-2xl mr-3"
              >
                {p === 'gold' ? '🥇' : p === 'silver' ? '🥈' : '🥉'}
              </span>
              <div className="flex flex-col items-start">
                <span className="text-base font-semibold">{t(`goal.priority.${p}`)}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {t(`goal.priority.${p}Description`)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Life Areas */}
      {lifeWheelAreas.length > 0 && (
        <div className="space-y-2">
          <Label>{t('goal.lifeArea')} *</Label>
          <div className="flex flex-wrap gap-2">
            {lifeWheelAreas.map(area => (
              <Badge
                key={area}
                variant={selectedAreas.includes(area) ? 'default' : 'outline'}
                className="cursor-pointer hover:scale-105 transition-transform min-h-[44px] px-4 text-sm"
                onClick={() => toggleArea(area)}
              >
                {t(`selfDiscovery.lifeWheel.areas.${area}`)}
                {selectedAreas.includes(area)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-4">
        <div className="flex-1 flex flex-col space-y-1.5">
          <Label htmlFor="start-date">{t('goal.startDate')}</Label>
          <div className="relative">
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pr-10 min-h-[38px] text-base"
              style={{ maxWidth: 220 }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" tabIndex={-1}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" />
              </svg>
            </span>
          </div>
        </div>
        {type === 'target' && (
          <div className="flex-1 flex flex-col space-y-1.5">
            <Label htmlFor="end-date">{t('goal.endDate')}</Label>
            <div className="relative">
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pr-10 min-h-[38px] text-base"
                style={{ maxWidth: 220 }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" tabIndex={-1}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" />
                </svg>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Target Value (only for target goals) */}
      {type === 'target' && (
        <div className="space-y-2">
          <Label htmlFor="target-value">{t('goal.targetValue')}</Label>
          <Input
            id="target-value"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder={t('goal.targetValuePlaceholder')}
            className="min-h-[44px]"
          />
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">{t('goal.description')}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('goal.descriptionPlaceholder')}
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="p-4 bg-accent/20 rounded-lg border border-border">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          ✅ {t('goal.definitionOfSuccess')} *
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          {t('goal.definitionOfSuccessDescription')}
        </p>

        {/* Add new item */}
        <div className="flex gap-2 mb-4">
          <Input
            value={newChecklistItem}
            onChange={(e) => setNewChecklistItem(e.target.value)}
            placeholder={t('goal.successCriteriaPlaceholder')}
            className="min-h-[44px]"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
          />
          <Button type="button" onClick={addChecklistItem} disabled={!newChecklistItem.trim()}>
            <Plus size={16} />
          </Button>
        </div>

        {/* Checklist items */}
        <div className="space-y-2">
          {successChecklist.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 bg-background rounded-lg border">
              <span className="flex-1 text-sm">{item.text}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeChecklistItem(item.id)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
          {successChecklist.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
              {t('goal.noSuccessCriteria')}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      {/* Related Values */}
      {availableValues.length > 0 && (
        <div className="space-y-2">
          <Label>{t('goal.relatedValues')}</Label>
          <div className="flex flex-wrap gap-2">
            {availableValues.map(value => (
              <Badge
                key={value}
                variant={selectedValues.includes(value) ? 'default' : 'outline'}
                className="cursor-pointer hover:scale-105 transition-transform px-3 py-1"
                onClick={() => toggleValue(value)}
              >
                {t(`selfDiscovery.values.${value}`)}
                {selectedValues.includes(value)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Reflections (Optional & Collapsible) */}
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-2 bg-accent/40 rounded-lg border border-border text-left focus:outline-none hover:bg-accent/30 transition-colors"
            aria-label={t('goal.reflection.title')}
          >
            <span className="flex items-center gap-2 font-medium">
              💭 {t('goal.reflection.title')}
              <span className="text-xs text-muted-foreground ml-2">
                ({t('optional')})
              </span>
            </span>
            <ChevronDown className="h-4 w-4 opacity-70" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 mt-2 p-4 bg-accent/10 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              {t('goal.reflectionDescription')}
            </p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">{t('reflection.surface.label')}</Label>
                <Textarea
                  value={surfaceMotivation}
                  onChange={(e) => setSurfaceMotivation(e.target.value)}
                  placeholder={t('reflection.surface.placeholder')}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('reflection.deeper.label')}</Label>
                <Textarea
                  value={deeperMotivation}
                  onChange={(e) => setDeeperMotivation(e.target.value)}
                  placeholder={t('reflection.deeper.placeholder')}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('reflection.identity.label')}</Label>
                <Textarea
                  value={identityMotivation}
                  onChange={(e) => setIdentityMotivation(e.target.value)}
                  placeholder={t('reflection.identity.placeholder')}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  const canProceedStep1 = title.trim() && selectedAreas.length > 0;
  const canProceedStep2 = successChecklist.length > 0;

  const renderStep4 = () => {
    if (!createdGoalId) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="px-2 py-2 bg-accent/50 rounded-md border text-sm flex items-center gap-2">
          <span className="text-lg">📋</span>
          <span className="font-medium">{t('activity.header')}</span>
          <span className="text-xs text-muted-foreground ml-2">{t('goal.activitiesOptionalDescription')}</span>
        </div>
        <div className="pt-1">
          <ActivityList goalId={createdGoalId} />
        </div>
      </div>
    );
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && createdGoalId) {
      // If dialog is closed and goal was created, refresh and reset
      onRefresh?.();
      resetForm();
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {!canCreateGoal
              ? t('goal.cannotCreateGoal')
              : step === 1
              ? t('goal.createGoalForYear', { year: selectedYear })
              : step === 2
              ? t('goal.defineSuccess')
              : step === 3
              ? t('goal.addContext')
              : t('goal.addActivities')}
          </DialogTitle>
        </DialogHeader>

        {!canCreateGoal ? (
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('goal.cannotCreatePastYear', {
                  currentYear,
                  nextYear: currentYear + 1,
                })}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            {/* Step indicator */}
            <div className="flex items-center gap-2 py-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    s <= step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <div className="py-4">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </div>

            <div className="flex flex-wrap justify-between gap-2 border-t pt-4">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="min-h-[44px] w-full sm:w-auto">
                  <ArrowLeft size={14} className="mr-2" />
                  {t('common.back')}
                </Button>
              )}
              <div className="hidden flex-1 sm:block" />
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  {t('common.next')}
                  <ArrowRight size={14} className="ml-2" />
                </Button>
              ) : step === 3 ? (
                <Button
                  type="button"
                  onClick={handleNextFromStep3}
                  disabled={isSubmitting || !canProceedStep1 || !canProceedStep2}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  {isSubmitting ? t('goal.creating') : t('common.next')}
                  <ArrowRight size={14} className="ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  {t('common.finish')}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
