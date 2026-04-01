/**
 * useHistory.ts
 *
 * React hook for managing user historical data, year-by-year summaries, and archiving features.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { useYear } from '@/contexts/YearContext';

// ========== Types & Interfaces ==========

export interface HistoryRecord {
  id: string;
  user_id: string;
  year: number;
  summary?: string;
  achievements?: string[];
  completed_goals_count: number;
  total_goals_count: number;
  goal_achievement?: string;
  consistency_engagement?: string;
  personal_impact?: string;
  created_at: string;
  updated_at: string;
}

export interface YearArchive {
  year: number;
  history?: HistoryRecord;
  vision?: {
    word_year?: string;
    phrase_year?: string;
    vision_1y?: string;
    vision_3y?: string;
    vision_5y?: string;
  };
  goals: {
    completed: number;
    total: number;
    archivedGoals: any[];
  };
  lifeWheel?: {
    currentAvg: number;
    desiredAvg: number;
    focusAreas: string[];
  };
}

// ========== Hook Implementation ==========

export const useHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentYear } = useYear();

  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [yearArchives, setYearArchives] = useState<YearArchive[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false });

      if (error) {
        toast({
          title: 'Error loading history',
          description: getUserFriendlyError(error),
          variant: 'destructive',
        });
        return;
      }
      setHistory(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchYearArchives = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [goalsResponse, visionResponse, historyResponse, lifeWheelResponse] = await Promise.all([
        supabase
          .from('goals')
          .select('created_at, status, title, description')
          .eq('user_id', user.id),
        supabase
          .from('vision')
          .select('year, word_year, phrase_year, vision_1y, vision_3y, vision_5y')
          .eq('user_id', user.id),
        supabase
          .from('history')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('life_wheel')
          .select('area_name, current_score, desired_score, achieved_score, is_focus_area, year')
          .eq('user_id', user.id),
      ]);

      if (goalsResponse.error || visionResponse.error || historyResponse.error || lifeWheelResponse.error) {
        throw new Error('Failed to fetch archive data');
      }

      // Build life wheel summaries per year
      const lifeWheelDataAll = lifeWheelResponse.data || [];
      const buildLifeWheelSummary = (year: number) => {
        const yearData = lifeWheelDataAll.filter(lw => lw.year === year);
        if (yearData.length === 0) return undefined;
        return {
          currentAvg: Math.round((yearData.reduce((s, lw) => s + lw.current_score, 0) / yearData.length) * 10) / 10,
          desiredAvg: Math.round((yearData.reduce((s, lw) => s + lw.desired_score, 0) / yearData.length) * 10) / 10,
          focusAreas: yearData.filter(lw => lw.is_focus_area).map(lw => lw.area_name),
        };
      };

      // Build year set — include current year always
      const yearSet = new Set<number>();
      yearSet.add(currentYear);

      goalsResponse.data?.forEach(goal => {
        yearSet.add(new Date(goal.created_at).getFullYear());
      });
      visionResponse.data?.forEach(vision => {
        yearSet.add(vision.year);
      });
      // Also add years from life wheel
      lifeWheelDataAll.forEach(lw => {
        if (lw.year) yearSet.add(lw.year);
      });

      historyResponse.data?.forEach(hist => {
        yearSet.add(hist.year);
      });

      const archives: YearArchive[] = [];
      for (const year of Array.from(yearSet).sort((a, b) => b - a)) {
        const yearGoals = goalsResponse.data?.filter(goal =>
          new Date(goal.created_at).getFullYear() === year
        ) || [];
        const yearVision = visionResponse.data?.find(v => v.year === year);
        const yearHistory = historyResponse.data?.find(h => h.year === year);
        const completedGoals = yearGoals.filter(g => g.status === 'completed' || g.status === 'archived');

        archives.push({
          year,
          history: yearHistory,
          vision: yearVision,
          goals: {
            completed: completedGoals.length,
            total: yearGoals.length,
            archivedGoals: completedGoals,
          },
          lifeWheel: buildLifeWheelSummary(year),
        });
      }

      setYearArchives(archives);
    } catch (error) {
      console.error('Error fetching year archives:', error);
      toast({
        title: 'Error loading archives',
        description: 'Failed to load historical data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateHistory = async (year: number, data: Partial<HistoryRecord>) => {
    if (!user) return;

    try {
      const { data: result, error } = await supabase
        .from('history')
        .upsert({
          user_id: user.id,
          year,
          ...data,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: 'Error updating history',
          description: getUserFriendlyError(error),
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'History updated',
        description: 'Your yearly evaluation has been saved.',
      });

      fetchHistory();
      fetchYearArchives();
      return result;
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchYearArchives();
  }, [user]);

  return {
    history,
    yearArchives,
    loading,
    createOrUpdateHistory,
    refetchHistory: fetchHistory,
    refetchArchives: fetchYearArchives,
  };
};
