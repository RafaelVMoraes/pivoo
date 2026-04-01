import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, ClipboardCheck, Flame, Heart } from 'lucide-react';
import {
  MONTHLY_EVAL_OPTIONS,
  MONTHLY_EVAL_LABELS,
  MONTHLY_EVAL_QUESTIONS,
  SENTIMENT_SCALE,
  type MonthlyReflection as MonthlyReflectionType,
} from '@/hooks/useJournaling';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface MonthlyReflectionProps {
  reflection: MonthlyReflectionType | null;
  onUpdate: (data: Partial<MonthlyReflectionType>) => void;
}

export const MonthlyReflectionBlock = ({ reflection, onUpdate }: MonthlyReflectionProps) => {
  const { language } = useTranslation();
  const [text, setText] = useState(reflection?.reflection_text || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setText(reflection?.reflection_text || '');
  }, [reflection?.reflection_text]);

  const handleTextChange = (value: string) => {
    setText(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate({ reflection_text: value });
    }, 1000);
  };

  const lang = language as 'en' | 'pt' | 'fr';

  const placeholders: Record<string, string> = {
    en: 'How did this month go? What stood out?',
    pt: 'Como foi este mês? O que se destacou?',
    fr: "Comment s'est passé ce mois ? Qu'est-ce qui vous a marqué ?",
  };

  const sentimentTitle = {
    en: 'Monthly overall sentiment',
    pt: 'Sentimento geral do mês',
    fr: 'Sentiment global du mois',
  };

  const icons = [
    <ClipboardCheck key="gp" size={14} className="text-muted-foreground mt-0.5 shrink-0" />,
    <Flame key="c" size={14} className="text-muted-foreground mt-0.5 shrink-0" />,
    <Heart key="pe" size={14} className="text-muted-foreground mt-0.5 shrink-0" />,
  ];

  const fields: Array<{ key: 'goal_progress' | 'consistency' | 'personal_evolution'; icon: React.ReactNode }> = [
    { key: 'goal_progress', icon: icons[0] },
    { key: 'consistency', icon: icons[1] },
    { key: 'personal_evolution', icon: icons[2] },
  ];

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <BookOpen size={16} className="text-primary" />
          {lang === 'pt' ? 'Reflexão Mensal' : lang === 'fr' ? 'Réflexion mensuelle' : 'Monthly Reflection'}
        </h4>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{sentimentTitle[lang]}</p>
          <div className="grid grid-cols-5 gap-1 sm:grid-cols-10 sm:gap-2 pb-1">
            {SENTIMENT_SCALE.map((item) => {
              const isSelected = reflection?.overall_sentiment === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => onUpdate({ overall_sentiment: item.value })}
                  className={cn(
                    'rounded-lg border px-1 py-2 text-center transition-all duration-200 min-h-[60px] flex flex-col items-center justify-center',
                    isSelected ? 'bg-primary/15 border-primary shadow-sm' : 'bg-muted/20 border-transparent hover:bg-muted/40',
                  )}
                  aria-label={`${sentimentTitle[lang]} - ${item.value}/10`}
                >
                  <p className="text-lg leading-none">{item.emoji}</p>
                  <p className="text-[11px] mt-1 font-medium leading-tight">{item.word[lang]}</p>
                </button>
              );
            })}
          </div>
        </div>

        <Textarea
          placeholder={placeholders[lang]}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          className="min-h-[120px]"
        />

        <div className="grid gap-3 md:grid-cols-3">
          {fields.map(({ key, icon }) => {
            const currentValue = reflection?.[key] || '';
            const options = MONTHLY_EVAL_OPTIONS[key];
            const labels = MONTHLY_EVAL_LABELS[key];
            const question = MONTHLY_EVAL_QUESTIONS[key][lang];
            const colorDot = currentValue ? options.find((o) => o.value === currentValue)?.color || '' : '';

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-start gap-2">
                  {icon}
                  <p className="text-sm font-medium leading-tight">{question}</p>
                </div>
                <div className="flex items-center gap-2">
                  {colorDot && <span className={`w-3 h-3 rounded-full ${colorDot} shrink-0`} />}
                  <Select value={currentValue} onValueChange={(v) => onUpdate({ [key]: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={lang === 'pt' ? 'Selecionar...' : lang === 'fr' ? 'Sélectionner...' : 'Select...'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${opt.color} shrink-0`} />
                            {labels[opt.value]?.[lang] || labels[opt.value]?.en}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
