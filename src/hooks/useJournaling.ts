import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryKeys';

export const SENTIMENT_SCALE = [
  { value: 1, emoji: '😭', word: { en: 'Awful', pt: 'Péssimo', fr: 'Horrible' } },
  { value: 2, emoji: '😞', word: { en: 'Low', pt: 'Baixo', fr: 'Bas' } },
  { value: 3, emoji: '😟', word: { en: 'Down', pt: 'Desanimado', fr: 'Morose' } },
  { value: 4, emoji: '😕', word: { en: 'Uneasy', pt: 'Inquieto', fr: 'Inquiet' } },
  { value: 5, emoji: '😐', word: { en: 'Neutral', pt: 'Neutro', fr: 'Neutre' } },
  { value: 6, emoji: '🙂', word: { en: 'Okay', pt: 'Ok', fr: 'Correct' } },
  { value: 7, emoji: '😊', word: { en: 'Good', pt: 'Bom', fr: 'Bien' } },
  { value: 8, emoji: '😄', word: { en: 'Great', pt: 'Ótimo', fr: 'Super' } },
  { value: 9, emoji: '😁', word: { en: 'Excellent', pt: 'Excelente', fr: 'Excellent' } },
  { value: 10, emoji: '🤩', word: { en: 'Amazing', pt: 'Incrível', fr: 'Incroyable' } },
] as const;

export const WEEKLY_SENTIMENT_CATEGORY = 'overall_sentiment';

export const MONTHLY_EVAL_OPTIONS = {
  goal_progress: [
    { value: 'strong_progress', color: 'bg-green-500' },
    { value: 'moderate_progress', color: 'bg-blue-500' },
    { value: 'slight_progress', color: 'bg-yellow-500' },
    { value: 'stagnation', color: 'bg-orange-500' },
    { value: 'regression', color: 'bg-red-500' },
  ],
  consistency: [
    { value: 'highly_consistent', color: 'bg-green-500' },
    { value: 'generally_consistent', color: 'bg-blue-500' },
    { value: 'somewhat_consistent', color: 'bg-yellow-500' },
    { value: 'inconsistent', color: 'bg-orange-500' },
    { value: 'rarely_engaged', color: 'bg-red-500' },
  ],
  personal_evolution: [
    { value: 'strong_evolution', color: 'bg-green-500' },
    { value: 'moderate_evolution', color: 'bg-blue-500' },
    { value: 'slight_evolution', color: 'bg-yellow-500' },
    { value: 'no_evolution', color: 'bg-orange-500' },
    { value: 'regression', color: 'bg-red-500' },
  ],
};

export const MONTHLY_EVAL_LABELS: Record<string, Record<string, { en: string; pt: string; fr: string }>> = {
  goal_progress: {
    strong_progress: { en: 'Strong progress', pt: 'Forte progresso', fr: 'Fort progrès' },
    moderate_progress: { en: 'Moderate progress', pt: 'Progresso moderado', fr: 'Progrès modéré' },
    slight_progress: { en: 'Slight progress', pt: 'Leve progresso', fr: 'Léger progrès' },
    stagnation: { en: 'Stagnation', pt: 'Estagnação', fr: 'Stagnation' },
    regression: { en: 'Regression', pt: 'Regressão', fr: 'Régression' },
  },
  consistency: {
    highly_consistent: { en: 'Highly consistent', pt: 'Muito consistente', fr: 'Très régulier' },
    generally_consistent: { en: 'Generally consistent', pt: 'Geralmente consistente', fr: 'Généralement régulier' },
    somewhat_consistent: { en: 'Somewhat consistent', pt: 'Algo consistente', fr: 'Assez régulier' },
    inconsistent: { en: 'Inconsistent', pt: 'Inconsistente', fr: 'Irrégulier' },
    rarely_engaged: { en: 'Rarely engaged', pt: 'Raramente engajado', fr: 'Rarement engagé' },
  },
  personal_evolution: {
    strong_evolution: { en: 'Strong evolution', pt: 'Forte evolução', fr: 'Forte évolution' },
    moderate_evolution: { en: 'Moderate evolution', pt: 'Evolução moderada', fr: 'Évolution modérée' },
    slight_evolution: { en: 'Slight evolution', pt: 'Leve evolução', fr: 'Légère évolution' },
    no_evolution: { en: 'No evolution', pt: 'Sem evolução', fr: 'Aucune évolution' },
    regression: { en: 'Regression', pt: 'Regressão', fr: 'Régression' },
  },
};

export const MONTHLY_EVAL_QUESTIONS: Record<string, { en: string; pt: string; fr: string }> = {
  goal_progress: {
    en: 'Did you make meaningful progress toward your goals this month?',
    pt: 'Você fez um progresso significativo em direção aos seus objetivos este mês?',
    fr: 'Avez-vous fait des progrès significatifs vers vos objectifs ce mois-ci ?',
  },
  consistency: {
    en: 'How consistently did you invest effort toward your goals?',
    pt: 'Quão consistentemente você investiu esforço nos seus objetivos?',
    fr: 'Avec quelle régularité avez-vous investi des efforts dans vos objectifs ?',
  },
  personal_evolution: {
    en: 'Did you evolve in the direction you intended this month?',
    pt: 'Você evoluiu na direção que pretendia este mês?',
    fr: 'Avez-vous évolué dans la direction souhaitée ce mois-ci ?',
  },
};

export interface WeeklyEvaluation {
  id: string;
  user_id: string;
  year: number;
  month: number;
  week_number: number;
  scale_category: string;
  scale_value: number;
}

export interface MonthlyReflection {
  id: string;
  user_id: string;
  year: number;
  month: number;
  reflection_text?: string;
  overall_sentiment?: number;
  goal_progress?: string;
  consistency?: string;
  personal_evolution?: string;
}

export const getWeeksInMonth = (year: number, month: number): number => {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const totalDays = lastDay.getDate();
  const firstDayOfWeek = firstDay.getDay();
  return Math.ceil((totalDays + firstDayOfWeek) / 7);
};

export const getMonthName = (month: number, lang: string): string => {
  const date = new Date(2000, month - 1, 1);
  const locale = lang === 'pt' ? 'pt-BR' : lang === 'fr' ? 'fr-FR' : 'en-US';
  return date.toLocaleString(locale, { month: 'long' });
};

interface JournalingPayload {
  weeklyEvals: WeeklyEvaluation[];
  monthlyReflection: MonthlyReflection | null;
}

export const useJournaling = (year: number, month: number) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = queryKeys.journaling.byMonth(user?.id, year, month);

  const dataQuery = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<JournalingPayload> => {
      const [weeklyRes, monthlyRes] = await Promise.all([
        supabase.from('weekly_evaluations').select('*').eq('user_id', user!.id).eq('year', year).eq('month', month),
        supabase
          .from('monthly_reflections')
          .select('*')
          .eq('user_id', user!.id)
          .eq('year', year)
          .eq('month', month)
          .maybeSingle(),
      ]);

      if (weeklyRes.error) throw weeklyRes.error;
      if (monthlyRes.error) throw monthlyRes.error;

      return { weeklyEvals: weeklyRes.data || [], monthlyReflection: monthlyRes.data };
    },
  });

  const upsertWeeklyMutation = useMutation({
    mutationFn: async ({ weekNumber, scaleCategory, scaleValue }: { weekNumber: number; scaleCategory: string; scaleValue: number }) => {
      if (!user) return;
      const { error } = await supabase.from('weekly_evaluations').upsert(
        {
          user_id: user.id,
          year,
          month,
          week_number: weekNumber,
          scale_category: scaleCategory,
          scale_value: scaleValue,
        },
        { onConflict: 'user_id,year,month,week_number,scale_category' }
      );
      if (error) throw error;
    },
    onError: (err) => {
      console.error('Error saving weekly eval:', err);
      toast({ title: 'Error', description: 'Failed to save evaluation', variant: 'destructive' });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const upsertMonthlyMutation = useMutation({
    mutationFn: async (data: Partial<MonthlyReflection>) => {
      if (!user) return;
      const { error } = await supabase
        .from('monthly_reflections')
        .upsert({ user_id: user.id, year, month, ...data }, { onConflict: 'user_id,year,month' });
      if (error) throw error;
    },
    onError: (err) => {
      console.error('Error saving monthly reflection:', err);
      toast({ title: 'Error', description: 'Failed to save reflection', variant: 'destructive' });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return {
    weeklyEvals: user ? dataQuery.data?.weeklyEvals || [] : [],
    monthlyReflection: user ? dataQuery.data?.monthlyReflection || null : null,
    loading: dataQuery.isLoading,
    upsertWeeklyEval: (weekNumber: number, scaleCategory: string, scaleValue: number) =>
      upsertWeeklyMutation.mutateAsync({ weekNumber, scaleCategory, scaleValue }),
    upsertMonthlyReflection: upsertMonthlyMutation.mutateAsync,
    refetch: dataQuery.refetch,
  };
};

export const useJournalingSummary = (year: number) => {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState<{
    weeklyEvals: WeeklyEvaluation[];
    monthlyReflections: MonthlyReflection[];
  }>({ weeklyEvals: [], monthlyReflections: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const [weeklyRes, monthlyRes] = await Promise.all([
          supabase.from('weekly_evaluations').select('*').eq('user_id', user.id).eq('year', year).order('month').order('week_number'),
          supabase.from('monthly_reflections').select('*').eq('user_id', user.id).eq('year', year).order('month'),
        ]);
        setSummaryData({
          weeklyEvals: weeklyRes.data || [],
          monthlyReflections: monthlyRes.data || [],
        });
      } catch (err) {
        console.error('Error fetching summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user, year]);

  return { ...summaryData, loading };
};
