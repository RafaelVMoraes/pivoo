/**
 * Weekly Overview Calendar Card
 * Shows condensed view of week with tasks by time of day
 * Status: Not Done (red), Pending (grey), Done (green)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, CalendarDays, Sunrise, Sun, Moon, Clock } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { format, startOfWeek, addDays, isToday, isBefore, startOfDay } from 'date-fns';

interface DaySchedule {
  morning: number;
  afternoon: number;
  night: number;
  wholeDay: number;
  morningCompleted: number;
  afternoonCompleted: number;
  nightCompleted: number;
  wholeDayCompleted: number;
}

interface WeeklyOverviewData {
  days: Record<string, DaySchedule>;
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
}

interface WeeklyOverviewCardProps {
  data: WeeklyOverviewData;
  isLoading: boolean;
  isGuest: boolean;
}

const timeSlots = ['whole_day', 'morning', 'afternoon', 'night'] as const;
const timeSlotIcons = {
  whole_day: Clock,
  morning: Sunrise,
  afternoon: Sun,
  night: Moon,
};

export const WeeklyOverviewCard = ({ data, isLoading, isGuest }: WeeklyOverviewCardProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-44" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  // Generate week days starting from Monday
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const now = new Date();
  const todayStart = startOfDay(now);

  /**
   * Determine cell status class based on completion state and date
   * - Not Done (red): past date with incomplete tasks
   * - Pending (grey): future date or today with incomplete tasks
   * - Done (green): all tasks completed for that slot
   * - Empty (muted): no tasks scheduled
   */
  const getStatusClass = (day: Date, count: number, completed: number) => {
    if (count === 0) return 'bg-muted/30';
    
    const dayStart = startOfDay(day);
    const isPast = isBefore(dayStart, todayStart);
    const isComplete = completed >= count;
    
    if (isComplete) {
      // Done - green
      return 'bg-green-500/60';
    } else if (isPast) {
      // Not Done (overdue) - red
      return 'bg-destructive/50';
    } else {
      // Pending (today or future) - grey
      return 'bg-muted/50';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-card border-border overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {t('dashboard.weeklyOverview')}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{t('dashboard.weeklyProgress')}:</span>
                    <span className="font-semibold text-foreground">{data.weeklyCompletionRate}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{t('dashboard.monthlyProgress')}:</span>
                    <span className="font-semibold text-foreground">{data.monthlyCompletionRate}%</span>
                  </div>
                </div>
              </div>
              <ChevronDown 
                className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Overflow container for horizontal table scrolling (for small screens) */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr>
                    {/* Empty left-aligned cell for time slot icons */}
                    <th className="w-12"></th>
                    {/* Render header for each day of the week */}
                    {weekDays.map((day) => {
                      const isTodayDate = isToday(day);
                      return (
                        <th 
                          key={day.toISOString()} 
                          className={`text-center p-2 text-xs font-medium ${
                            isTodayDate 
                              ? 'text-primary' 
                              : 'text-muted-foreground'
                          }`}
                        >
                          <div className={`${isTodayDate ? 'bg-primary/20 rounded-lg px-2 py-1' : ''}`}>
                            {/* Day short name (e.g., Mon, Tue) */}
                            <div>{format(day, 'EEE')}</div>
                            {/* Day number */}
                            <div className={`text-sm ${isTodayDate ? 'font-bold' : ''}`}>
                              {format(day, 'd')}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Render a row for each time slot (morning, afternoon, night, whole day) */}
                  {timeSlots.map((slot) => {
                    const Icon = timeSlotIcons[slot];
                    return (
                      <tr key={slot}>
                        {/* Icon cell for the time slot */}
                        <td className="text-center py-2">
                          <Icon 
                            className="h-4 w-4 text-muted-foreground mx-auto" 
                            aria-label={slot === 'whole_day' ? t('frequency.wholeDay') : t(`dashboard.${slot}`)}
                          />
                        </td>
                        {/* Render a cell for each day in the week for the current slot */}
                        {weekDays.map((day) => {
                          // Get the key for the date (ex: "2024-06-16")
                          const dateKey = format(day, 'yyyy-MM-dd');
                          // Lookup scheduled/complete habit data for this day, fallback to 0s
                          const dayData = data.days[dateKey] || {
                            morning: 0, afternoon: 0, night: 0, wholeDay: 0,
                            morningCompleted: 0, afternoonCompleted: 0, nightCompleted: 0, wholeDayCompleted: 0
                          };
                          // Map slot name to data key (whole_day -> wholeDay)
                          const slotKeyMap: Record<string, keyof DaySchedule> = {
                            whole_day: 'wholeDay',
                            morning: 'morning',
                            afternoon: 'afternoon',
                            night: 'night',
                          };
                          const completedKeyMap: Record<string, keyof DaySchedule> = {
                            whole_day: 'wholeDayCompleted',
                            morning: 'morningCompleted',
                            afternoon: 'afternoonCompleted',
                            night: 'nightCompleted',
                          };
                          // The number of scheduled habits for this slot
                          const count = dayData[slotKeyMap[slot]] as number;
                          // The number of completed habits for this slot
                          const completed = dayData[completedKeyMap[slot]] as number;
                          
                          return (
                            <td key={dateKey} className="p-1">
                              <div 
                                className={`
                                  h-8 rounded-md flex items-center justify-center text-xs font-medium
                                  ${getStatusClass(day, count, completed)}
                                  ${isToday(day) ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                                `}
                                // Shows "x/y completed" on hover
                                title={`${completed}/${count} ${t('dashboard.completed')}`}
                              >
                                {/* Show the count if there's at least one habit scheduled */}
                                {count > 0 && (
                                  <span className="text-foreground/80">{count}</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 
              Legend section: explains what each color means
              Red = not done/overdue, grey = pending/today/future, green = done
            */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-destructive/50" />
                <span>{t('dashboard.notDone')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-muted/50" />
                <span>{t('dashboard.pending')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500/60" />
                <span>{t('dashboard.done')}</span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
