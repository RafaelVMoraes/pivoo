import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MONTHLY_EVAL_OPTIONS,
  MONTHLY_EVAL_LABELS,
  SENTIMENT_SCALE,
  WEEKLY_SENTIMENT_CATEGORY,
  getMonthName,
  type WeeklyEvaluation,
  type MonthlyReflection,
} from '@/hooks/useJournaling';
import { useTranslation } from '@/hooks/useTranslation';

interface JournalingSummaryProps {
  year: number;
  weeklyEvals: WeeklyEvaluation[];
  monthlyReflections: MonthlyReflection[];
}

export const JournalingSummary = ({ year, weeklyEvals, monthlyReflections }: JournalingSummaryProps) => {
  const { language } = useTranslation();
  const lang = language as 'en' | 'pt' | 'fr';

  const monthLabels = {
    en: 'Monthly resume',
    pt: 'Resumo mensal',
    fr: 'Résumé mensuel',
  };

  const noDataText = {
    en: 'No journaling data yet',
    pt: 'Nenhum dado de journaling ainda',
    fr: 'Aucune donnée de journal encore',
  };

  const evalFields: Array<'goal_progress' | 'consistency' | 'personal_evolution'> = [
    'goal_progress',
    'consistency',
    'personal_evolution',
  ];


  const getSentimentByValue = (value?: number | null) => SENTIMENT_SCALE.find((item) => item.value === value);

  const fieldTitles: Record<'goal_progress' | 'consistency' | 'personal_evolution', Record<'en' | 'pt' | 'fr', string>> = {
    goal_progress: {
      en: 'Goal evolution',
      pt: 'Evolução dos objetivos',
      fr: 'Évolution des objectifs',
    },
    consistency: {
      en: 'Effort made',
      pt: 'Esforço realizado',
      fr: 'Effort fourni',
    },
    personal_evolution: {
      en: 'Personal improvement',
      pt: 'Melhoria pessoal',
      fr: 'Amélioration personnelle',
    },
  };


  const getWeeklyAverage = (month: number): number | null => {
    const entries = weeklyEvals.filter(
      (e) => e.month === month && e.scale_category === WEEKLY_SENTIMENT_CATEGORY,
    );
    if (entries.length === 0) return null;
    const sum = entries.reduce((acc, entry) => acc + entry.scale_value, 0);
    return Number((sum / entries.length).toFixed(1));
  };

  const hasAnyData = weeklyEvals.length > 0 || monthlyReflections.length > 0;

  if (!hasAnyData) {
    return (
      <Card className="gradient-card shadow-soft">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">{noDataText[lang]}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="font-semibold">{monthLabels[lang]}</h3>
        <div className="space-y-3">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
            const monthReflection = monthlyReflections.find((r) => r.month === month);
            const monthlySentiment = getSentimentByValue(monthReflection?.overall_sentiment);
            const weeklyAverage = getWeeklyAverage(month);
            const hasMonthData = Boolean(monthReflection || weeklyAverage !== null);

            if (!hasMonthData) return null;

            return (
              <div key={month} className="rounded-lg border p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <h4 className="font-medium capitalize text-sm">
                    {getMonthName(month, lang)} {year}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline">
                      {lang === 'pt' ? 'Média semanal' : lang === 'fr' ? 'Moyenne hebdo' : 'Weekly avg'}:{' '}
                      {weeklyAverage ?? '-'}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {monthlySentiment ? (
                        <>
                          <span>{monthlySentiment.emoji}</span>
                          <span>{monthlySentiment.word[lang]} ({monthlySentiment.value}/10)</span>
                        </>
                      ) : (
                        <span>{lang === 'pt' ? 'Sem sentimento mensal' : lang === 'fr' ? 'Sans sentiment mensuel' : 'No monthly sentiment'}</span>
                      )}
                    </Badge>
                  </div>
                </div>

                {monthReflection && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {evalFields.map((field) => {
                      const value = monthReflection[field];
                      if (!value) return null;
                      const opt = MONTHLY_EVAL_OPTIONS[field]?.find((o) => o.value === value);
                      const label = MONTHLY_EVAL_LABELS[field]?.[value]?.[lang] || value;
                      return (
                        <Badge key={field} variant="secondary" className="text-xs flex items-center gap-1">
                          {opt && <span className={`w-2 h-2 rounded-full ${opt.color} shrink-0`} />}
                          {fieldTitles[field][lang]}: {label}
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {monthReflection?.reflection_text && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{monthReflection.reflection_text}</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
