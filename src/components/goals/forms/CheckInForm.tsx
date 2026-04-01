import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { useCheckIns } from '@/hooks/useCheckIns';
import { useTranslation } from '@/hooks/useTranslation';

interface CheckInFormProps {
  goalId: string;
  activityId?: string;
}

export const CheckInForm = ({ goalId, activityId }: CheckInFormProps) => {
  const { checkIns, isLoading, createCheckIn } = useCheckIns(goalId, activityId);
  const { t } = useTranslation();
  const [inputType, setInputType] = useState<'numeric' | 'checkbox' | 'percentage'>('checkbox');
  const [progressValue, setProgressValue] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let value = progressValue;
    if (inputType === 'checkbox') {
      value = isDone ? 'true' : 'false';
    }

    if (!value.trim() && inputType !== 'checkbox') return;

    setIsSubmitting(true);
    try {
      await createCheckIn({
        goal_id: goalId,
        activity_id: activityId,
        progress_value: inputType === 'checkbox' ? (isDone ? 'done' : 'false') : value,
        input_type: inputType,
        date: new Date(selectedDate).toISOString()
      });
      setProgressValue('');
      setIsDone(false);
      setSelectedDate(new Date().toISOString().split('T')[0]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCheckInValue = (checkIn: any) => {
    switch (checkIn.input_type) {
      case 'percentage':
        return `${checkIn.progress_value}%`;
      case 'checkbox':
        return (checkIn.progress_value === 'true' || checkIn.progress_value === 'done') ? t('checkin.done') : t('checkin.notDone');
      default:
        return checkIn.progress_value;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">{t('checkin.header')}</h4>
        <TrendingUp size={16} className="text-primary" />
      </div>

      {/* Check-in form */}
      <Card className="p-4 bg-accent/30">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm mb-2">{t('checkin.inputType')}</Label>
              <Select value={inputType} onValueChange={(value: any) => setInputType(value)}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkbox">{t('checkin.checkbox')}</SelectItem>
                  <SelectItem value="numeric">{t('checkin.numeric')}</SelectItem>
                  <SelectItem value="percentage">{t('checkin.percentage')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date" className="text-sm mb-2">{t('checkin.date')}</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
          </div>

          {inputType === 'checkbox' ? (
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <Label htmlFor="done-toggle" className="text-sm font-medium">{t('checkin.markDone')}</Label>
              <Switch
                id="done-toggle"
                checked={isDone}
                onCheckedChange={setIsDone}
                className="min-h-[24px]"
              />
            </div>
          ) : (
            <div>
              <Label className="text-sm mb-2">{t('checkin.value')}</Label>
              <Input
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                placeholder={inputType === 'percentage' ? t('checkin.placeholderPercentage') : t('checkin.placeholderNumber')}
                type="number"
                min={inputType === 'percentage' ? '0' : undefined}
                max={inputType === 'percentage' ? '100' : undefined}
                className="min-h-[44px]"
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || (inputType !== 'checkbox' && !progressValue.trim())}
            className="w-full min-h-[44px]"
          >
            <CheckCircle size={14} className="mr-2" />
            {isSubmitting ? t('checkin.recording') : t('checkin.recordProgress')}
          </Button>
        </form>
      </Card>

      {/* Recent check-ins */}
      {checkIns.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('checkin.recentProgress')}</Label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {checkIns.slice(0, 5).map(checkIn => (
              <div key={checkIn.id} className="flex items-center justify-between text-sm p-2 bg-accent/20 rounded">
                <span className="text-foreground font-medium">
                  {formatCheckInValue(checkIn)}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatDate(checkIn.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
