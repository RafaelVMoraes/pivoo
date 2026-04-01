import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SENTIMENT_SCALE,
  WEEKLY_SENTIMENT_CATEGORY,
  getWeeksInMonth,
  type WeeklyEvaluation as WeeklyEvalType,
} from '@/hooks/useJournaling';
import { useTranslation } from '@/hooks/useTranslation';

interface WeeklyEvaluationProps {
  year: number;
  month: number;
  weeklyEvals: WeeklyEvalType[];
  onSelect: (weekNumber: number, scaleCategory: string, scaleValue: number) => void;
}

export const WeeklyEvaluation = ({ year, month, weeklyEvals, onSelect }: WeeklyEvaluationProps) => {
  const { language } = useTranslation();
  const weeksCount = getWeeksInMonth(year, month);
  const [openWeek, setOpenWeek] = useState<number | null>(null);

  const getEvalValue = (week: number): number | undefined => {
    const found = weeklyEvals.find(
      (e) => e.week_number === week && e.scale_category === WEEKLY_SENTIMENT_CATEGORY,
    );
    return found?.scale_value;
  };

  const labelByLang = {
    en: 'Overall sentiment',
    pt: 'Sentimento geral',
    fr: 'Sentiment global',
  } as const;


  const getSentimentLabel = (value?: number) => {
    if (!value) return '-';
    const item = SENTIMENT_SCALE.find((entry) => entry.value === value);
    return item ? `${item.emoji} ${item.word[language as 'en' | 'pt' | 'fr']}` : '-';
  };

  return (
    <div className="space-y-2">
      {Array.from({ length: weeksCount }, (_, i) => i + 1).map((week) => {
        const selectedValue = getEvalValue(week);
        const isComplete = selectedValue !== undefined;
        const isOpen = openWeek === week;

        return (
          <Collapsible
            key={week}
            open={isOpen}
            onOpenChange={(open) => setOpenWeek(open ? week : null)}
          >
            <Card className="overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                        isComplete ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {isComplete ? <Check size={16} /> : week}
                    </div>
                    <span className="font-medium text-sm">
                      {language === 'pt' ? `Semana ${week}` : language === 'fr' ? `Semaine ${week}` : `Week ${week}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{getSentimentLabel(selectedValue)}</span>
                    <ChevronDown
                      size={16}
                      className={cn('transition-transform text-muted-foreground', isOpen && 'rotate-180')}
                    />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-4 px-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">{labelByLang[language as 'en' | 'pt' | 'fr']}</p>
                  <div className="grid grid-cols-5 gap-1 sm:grid-cols-10 sm:gap-2 pb-1">
                    {SENTIMENT_SCALE.map((item) => {
                      const isSelected = selectedValue === item.value;

                      return (
                        <button
                          key={item.value}
                          onClick={() => onSelect(week, WEEKLY_SENTIMENT_CATEGORY, item.value)}
                          className={cn(
                            'rounded-lg border px-1 py-2 text-center transition-all duration-200 min-h-[60px] flex flex-col items-center justify-center',
                            isSelected
                              ? 'bg-primary/15 border-primary shadow-sm'
                              : 'bg-muted/20 border-transparent hover:bg-muted/40',
                          )}
                          aria-label={`${labelByLang[language as 'en' | 'pt' | 'fr']} - ${item.value}/10`}
                        >
                          <p className="text-lg leading-none">{item.emoji}</p>
                          <p className="text-[11px] mt-1 font-medium leading-tight">{item.word[language as 'en' | 'pt' | 'fr']}</p>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
};
