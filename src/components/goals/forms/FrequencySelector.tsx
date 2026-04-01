import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

// English keys for storage (always stored in English for consistency)
const DAY_KEYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export interface FrequencySelectorProps {
  value: {
    type: 'daily' | 'weekly' | 'monthly';
    value?: number;
    timeOfDay?: 'morning' | 'afternoon' | 'night' | 'whole_day';
    daysOfWeek?: string[];
    dayOfMonth?: number;
  };
  onChange: (value: FrequencySelectorProps['value']) => void;
}

export const FrequencySelector = ({ value, onChange }: FrequencySelectorProps) => {
  const { t } = useTranslation();
  
  // Map English keys to translated labels for display
  const dayTranslations: Record<string, string> = {
    Monday: t('frequency.monday'),
    Tuesday: t('frequency.tuesday'),
    Wednesday: t('frequency.wednesday'),
    Thursday: t('frequency.thursday'),
    Friday: t('frequency.friday'),
    Saturday: t('frequency.saturday'),
    Sunday: t('frequency.sunday'),
  };

  const toggleDay = (dayKey: string) => {
    const currentDays = value.daysOfWeek || [];
    const newDays = currentDays.includes(dayKey)
      ? currentDays.filter(d => d !== dayKey)
      : [...currentDays, dayKey];
    onChange({ ...value, daysOfWeek: newDays });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm">{t('frequency.frequencyType')}</Label>
          <Select
            value={value.type}
            onValueChange={(type: 'daily' | 'weekly' | 'monthly') => {
              // Reset timeOfDay when switching types
              // Daily requires specific time (default morning), weekly/monthly default to whole_day
              const newTimeOfDay = type === 'daily' 
                ? (value.timeOfDay && value.timeOfDay !== 'whole_day' ? value.timeOfDay : 'morning')
                : (value.timeOfDay || 'whole_day');
              onChange({ ...value, type, timeOfDay: newTimeOfDay, value: type === 'daily' ? undefined : value.value || 3 });
            }}
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t('frequency.daily')}</SelectItem>
              <SelectItem value="weekly">{t('frequency.weekly')}</SelectItem>
              <SelectItem value="monthly">{t('frequency.monthly')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Daily - Time of Day (required, no whole_day option) */}
      {value.type === 'daily' && (
        <div className="space-y-2">
          <Label className="text-sm">{t('frequency.timeOfDay')} *</Label>
          <Select
            value={value.timeOfDay || 'morning'}
            onValueChange={(time: 'morning' | 'afternoon' | 'night') =>
              onChange({ ...value, timeOfDay: time })
            }
          >
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder={t('frequency.selectTimeOfDay')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">{t('frequency.morning')}</SelectItem>
              <SelectItem value="afternoon">{t('frequency.afternoon')}</SelectItem>
              <SelectItem value="night">{t('frequency.night')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Weekly - Days of Week and Time of Day */}
      {value.type === 'weekly' && (
        <>
          <div className="space-y-2">
            <Label className="text-sm">{t('frequency.specificDaysOptional')}</Label>
            <div className="flex flex-wrap gap-2">
              {DAY_KEYS.map(dayKey => (
                <Badge
                  key={dayKey}
                  variant={(value.daysOfWeek || []).includes(dayKey) ? 'default' : 'outline'}
                  className="cursor-pointer hover:scale-105 transition-transform px-3 py-1"
                  onClick={() => toggleDay(dayKey)}
                >
                  {dayTranslations[dayKey]?.substring(0, 3) || dayKey.substring(0, 3)}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{t('frequency.timeOfDay')}</Label>
            <Select
              value={value.timeOfDay || 'whole_day'}
              onValueChange={(time: 'morning' | 'afternoon' | 'night' | 'whole_day') =>
                onChange({ ...value, timeOfDay: time })
              }
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder={t('frequency.selectTimeOfDay')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whole_day">{t('frequency.wholeDay')}</SelectItem>
                <SelectItem value="morning">{t('frequency.morning')}</SelectItem>
                <SelectItem value="afternoon">{t('frequency.afternoon')}</SelectItem>
                <SelectItem value="night">{t('frequency.night')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Monthly - Day of Month and Time of Day */}
      {value.type === 'monthly' && (
        <>
          <div className="space-y-2">
            <Label className="text-sm">{t('frequency.dayOfMonthOptional')}</Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={value.dayOfMonth || ''}
              onChange={(e) => onChange({ ...value, dayOfMonth: parseInt(e.target.value) || undefined })}
              placeholder={t('frequency.exampleDay')}
              className="min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">{t('frequency.timeOfDay')}</Label>
            <Select
              value={value.timeOfDay || 'whole_day'}
              onValueChange={(time: 'morning' | 'afternoon' | 'night' | 'whole_day') =>
                onChange({ ...value, timeOfDay: time })
              }
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder={t('frequency.selectTimeOfDay')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whole_day">{t('frequency.wholeDay')}</SelectItem>
                <SelectItem value="morning">{t('frequency.morning')}</SelectItem>
                <SelectItem value="afternoon">{t('frequency.afternoon')}</SelectItem>
                <SelectItem value="night">{t('frequency.night')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
};
