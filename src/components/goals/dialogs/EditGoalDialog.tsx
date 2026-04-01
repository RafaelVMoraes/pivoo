import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Goal, useGoals } from '@/hooks/useGoals';
import { useSelfDiscovery } from '@/hooks/useSelfDiscovery';
import { useTranslation } from '@/hooks/useTranslation';
import { X, ChevronDown, MessageCircle } from 'lucide-react';

interface EditGoalDialogProps {
  goal: Goal;
  isOpen: boolean;
  onClose: () => void;
}

export const EditGoalDialog = ({ goal, isOpen, onClose }: EditGoalDialogProps) => {
  const { updateGoal } = useGoals();
  const { lifeWheelData, valuesData } = useSelfDiscovery();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description || '');
  const [targetDate, setTargetDate] = useState(goal.target_date || '');
  const [priority, setPriority] = useState<Goal['priority']>(goal.priority);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    Array.isArray(goal.life_wheel_area)
      ? goal.life_wheel_area
      : goal.life_wheel_area
      ? [goal.life_wheel_area]
      : []
  );
  const [selectedValues, setSelectedValues] = useState<string[]>(goal.related_values || []);
  const [status, setStatus] = useState<Goal['status']>(goal.status);

  // Reflection fields
  const [surfaceMotivation, setSurfaceMotivation] = useState(goal.surface_motivation || '');
  const [deeperMotivation, setDeeperMotivation] = useState(goal.deeper_motivation || '');
  const [identityMotivation, setIdentityMotivation] = useState(goal.identity_motivation || '');

  const lifeWheelAreas = lifeWheelData.map(item => item.area_name);
  const availableValues = valuesData.filter(v => v.selected).map(v => v.value_name);

  useEffect(() => {
    setTitle(goal.title);
    setDescription(goal.description || '');
    setTargetDate(goal.target_date || '');
    setPriority(goal.priority);
    setSelectedAreas(
      Array.isArray(goal.life_wheel_area)
        ? goal.life_wheel_area
        : goal.life_wheel_area
        ? [goal.life_wheel_area]
        : []
    );
    setSelectedValues(goal.related_values || []);
    setStatus(goal.status);
    setSurfaceMotivation(goal.surface_motivation || '');
    setDeeperMotivation(goal.deeper_motivation || '');
    setIdentityMotivation(goal.identity_motivation || '');
  }, [goal]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedAreas.length === 0) return;

    setIsSubmitting(true);
    try {
      await updateGoal(goal.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        target_date: targetDate || undefined,
        priority,
        life_wheel_area: selectedAreas,
        related_values: selectedValues.length > 0 ? selectedValues : undefined,
        status,
        surface_motivation: surfaceMotivation.trim() || undefined,
        deeper_motivation: deeperMotivation.trim() || undefined,
        identity_motivation: identityMotivation.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('goal.edit.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('goal.fields.title')} *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="min-h-[44px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('goal.fields.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('goal.fields.priority')}</Label>
            <div className="grid grid-cols-3 gap-3">
              {(['gold', 'silver', 'bronze'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    priority === p ? 'bg-accent/20 border-primary' : 'border-border'
                  }`}
                >
                  <div className="text-xl mb-1">
                    {p === 'gold' ? '🥇' : p === 'silver' ? '🥈' : '🥉'}
                  </div>
                  <div className="text-sm font-medium">
                    {t(`goal.priority.${p}`)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('goal.fields.lifeAreas')} *</Label>
            <div className="flex flex-wrap gap-2">
              {lifeWheelAreas.map(area => (
                <Badge
                  key={area}
                  variant={selectedAreas.includes(area) ? 'default' : 'outline'}
                  className="cursor-pointer min-h-[44px] px-4 text-sm"
                  onClick={() => toggleArea(area)}
                >
                  {t(`selfDiscovery.lifeWheel.areas.${area}`)}
                  {selectedAreas.includes(area)}
                </Badge>
              ))}
            </div>
          </div>

          {availableValues.length > 0 && (
            <div className="space-y-2">
              <Label>{t('goal.fields.relatedValues')}</Label>
              <div className="flex flex-wrap gap-2">
                {availableValues.map(value => (
                  <Badge
                    key={value}
                    variant={selectedValues.includes(value) ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-1"
                    onClick={() => toggleValue(value)}
                  >
                    {t(`selfDiscovery.values.${value}`)}
                    {selectedValues.includes(value)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target-date">{t('goal.fields.targetDate')}</Label>
              <Input
                id="target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('goal.fields.status')}</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as Goal['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['active', 'in_progress', 'on_hold', 'completed', 'archived'].map(s => (
                    <SelectItem key={s} value={s}>
                      {t(`goal.status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} />
                  {t('goal.reflection.title')}
                </div>
                <ChevronDown size={16} />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-4 space-y-4">
              {[
                ['surface', surfaceMotivation, setSurfaceMotivation],
                ['deeper', deeperMotivation, setDeeperMotivation],
                ['identity', identityMotivation, setIdentityMotivation],
              ].map(([key, value, setter]: any) => (
                <div key={key} className="space-y-2">
                  <Label>{t(`goal.reflection.${key}.label`)}</Label>
                  <Textarea
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={t(`goal.reflection.${key}.placeholder`)}
                    rows={2}
                  />
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim() || selectedAreas.length === 0}>
              {isSubmitting ? t('common.saving') : t('common.saveChanges')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
