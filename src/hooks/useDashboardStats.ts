import { useMemo } from 'react';
import { useGoals, Goal } from './useGoals';
import { useCheckIns } from './useCheckIns';
import { useSelfDiscovery } from './useSelfDiscovery';
import { useAuth } from '@/contexts/AuthContext';
import { isActivityCompletedForWindow } from '@/lib/taskUtils';
import { useAllActivities } from './useAllActivities';
import { deriveScoreValue, isCheckInDone } from '@/lib/checkInStatus';
import { useYearProgress } from './dashboard/useYearProgress';
import { useTodaysFocus } from './dashboard/useTodaysFocus';
import { useWeeklyOverview } from './dashboard/useWeeklyOverview';
import { useHabitsConsistency } from './dashboard/useHabitsConsistency';

interface WeeklyHabitData {
  week: string;
  completionRate: number;
}

interface MonthlyProgressData {
  month: string;
  progress: number;
}

interface KPIData {
  goalsCompletedPercentage: number;
  longestStreak: number;
  strongestLifeArea: string;
  weakestLifeArea: string;
}

export interface LifeSnapshotData {
  overallProgressScore: number;
  dominantArea: { name: string; score: number };
  weakestArea: { name: string; score: number };
  insightText: string;
  activeGoalsCount: number;
  completedGoalsCount: number;
  currentStreak: number;
}

export type HabitsData = ReturnType<typeof useHabitsConsistency>;
export type YearProgressData = ReturnType<typeof useYearProgress>;
export type TodaysFocusData = import('./dashboard/useTodaysFocus').TodaysFocusData;
export type TodaysFocusCardData = import('./dashboard/useTodaysFocus').TodaysFocusCardData;
export type WeeklyOverviewData = import('./dashboard/useWeeklyOverview').WeeklyOverviewData;

export interface GoalWithProgress extends Goal {
  progress: number;
  activityCount: number;
  completedActivities: number;
  isOverdue: boolean;
  isStalled: boolean;
}

export interface SelfDiscoveryPanelData {
  topValues: string[];
  focusAreas: string[];
  growthAreas: string[];
  visionWord: string | null;
  visionPhrase: string | null;
}

// New interfaces for redesigned dashboard
export interface SelfDiscoveryLinearData {
  wordOfYear: string | null;
  phraseOfYear: string | null;
  lifeWheelCurrentAvg: number;
  lifeWheelDesiredAvg: number;
  focusAreas: string[];
  selectedValues: string[];
  hasData: boolean;
}

export interface GoalsHabitsCardData {
  activeGoals: number;
  completedGoals: number;
  goldGoals: number;
  silverGoals: number;
  bronzeGoals: number;
  weeklyProgress: number;
  monthlyProgress: number;
  hasData: boolean;
}

export const useDashboardStats = () => {
  const { isGuest } = useAuth();
  const { goals, isLoading: goalsLoading } = useGoals();
  const { checkIns, isLoading: checkInsLoading } = useCheckIns();
  const { lifeWheelData, valuesData, visionData, loading: lifeWheelLoading } = useSelfDiscovery();
  const { activities, checkIns: activityCheckIns, isLoading: activitiesLoading, refetch: refetchActivities } = useAllActivities();

  const isLoading = goalsLoading || checkInsLoading || lifeWheelLoading || activitiesLoading;

  // Calculate life snapshot data
  const lifeSnapshotData = useMemo((): LifeSnapshotData => {
    const activeGoals = goals.filter(g => g.status !== 'completed' && g.status !== 'archived');
    const completedGoals = goals.filter(g => g.status === 'completed');
    
    // Calculate overall progress score (average of life wheel + goal completion + habit consistency)
    let overallScore = 50; // Default middle score
    
    if (lifeWheelData.length > 0) {
      const avgLifeScore = lifeWheelData.reduce((sum, d) => sum + d.current_score, 0) / lifeWheelData.length;
      const goalScore = goals.length > 0 ? (completedGoals.length / goals.length) * 10 : 5;
      overallScore = Math.round(((avgLifeScore + goalScore) / 2) * 10);
    }

    // Find dominant and weakest areas
    const sortedAreas = [...lifeWheelData].sort((a, b) => b.current_score - a.current_score);
    const dominantArea = sortedAreas[0] || { area_name: 'Not set', current_score: 0 };
    const weakestArea = sortedAreas[sortedAreas.length - 1] || { area_name: 'Not set', current_score: 0 };

    // Calculate current streak
    let currentStreak = 0;
    if (checkIns.length > 0) {
      const sortedCheckIns = [...checkIns].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (const checkIn of sortedCheckIns) {
        const checkInDate = new Date(checkIn.date);
        checkInDate.setHours(0, 0, 0, 0);
        
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - currentStreak);
        
        if (checkInDate.getTime() === expectedDate.getTime()) {
          currentStreak++;
        } else if (checkInDate.getTime() < expectedDate.getTime()) {
          break;
        }
      }
    }

    // Generate insight text based on data
    let insightText = "Start your growth journey by setting your first goals.";
    if (lifeWheelData.length > 0 && goals.length > 0) {
      const scoreDiff = dominantArea.current_score - weakestArea.current_score;
      if (scoreDiff > 3) {
        insightText = `You're thriving in ${dominantArea.area_name}, but ${weakestArea.area_name} could use some attention. Consider adding goals in this area.`;
      } else if (overallScore >= 70) {
        insightText = `Great balance across your life areas! You're making consistent progress with ${currentStreak} days of check-ins.`;
      } else if (currentStreak >= 7) {
        insightText = `Your ${currentStreak}-day streak shows strong commitment. Keep building momentum!`;
      } else {
        insightText = `Focus on ${weakestArea.area_name} to improve your overall life balance. Small daily actions lead to big changes.`;
      }
    }

    return {
      overallProgressScore: overallScore,
      dominantArea: { name: dominantArea.area_name, score: dominantArea.current_score },
      weakestArea: { name: weakestArea.area_name, score: weakestArea.current_score },
      insightText,
      activeGoalsCount: activeGoals.length,
      completedGoalsCount: completedGoals.length,
      currentStreak,
    };
  }, [goals, lifeWheelData, checkIns]);

  const { todaysFocusData, todaysFocusCardData } = useTodaysFocus({
    activities,
    checkIns: activityCheckIns,
    valuesData,
  });

  // Calculate goals with progress
  const goalsWithProgress = useMemo((): GoalWithProgress[] => {
    const now = new Date();
    return goals
      .filter(g => g.status !== 'archived')
      .map(goal => {
        const goalActivities = activities.filter(a => a.goal_id === goal.id);
        const completedActivities = goalActivities.filter(a => 
          isActivityCompletedForWindow(a, activityCheckIns, now)
        ).length;

        const progress = goalActivities.length > 0 
          ? Math.round((completedActivities / goalActivities.length) * 100)
          : 0;

        const isOverdue = goal.target_date 
          ? new Date(goal.target_date) < now && goal.status !== 'completed'
          : false;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentCheckIns = activityCheckIns.filter(c => {
          const activity = activities.find(a => a.id === c.activity_id);
          return activity?.goal_id === goal.id && new Date(c.date) > sevenDaysAgo;
        });
        const isStalled = goalActivities.length > 0 && recentCheckIns.length === 0;

        return {
          ...goal,
          progress,
          activityCount: goalActivities.length,
          completedActivities,
          isOverdue,
          isStalled,
        };
      })
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.isStalled && !b.isStalled) return -1;
        if (!a.isStalled && b.isStalled) return 1;
        
        const priorityOrder = { gold: 0, silver: 1, bronze: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }, [goals, activities, activityCheckIns]);

  const habitsData = useHabitsConsistency({
    activities,
    checkIns: activityCheckIns,
  });

  // Self-discovery panel data
  const selfDiscoveryPanelData = useMemo((): SelfDiscoveryPanelData => {
    const selectedValues = valuesData.filter(v => v.selected).map(v => v.value_name);
    const focusAreas = lifeWheelData.filter(a => a.is_focus_area).map(a => a.area_name);
    
    // Growth areas: lowest scoring areas not marked as focus
    const growthAreas = [...lifeWheelData]
      .filter(a => !a.is_focus_area)
      .sort((a, b) => a.current_score - b.current_score)
      .slice(0, 3)
      .map(a => a.area_name);

    return {
      topValues: selectedValues.slice(0, 5),
      focusAreas,
      growthAreas,
      visionWord: visionData.word_year || null,
      visionPhrase: visionData.phrase_year || null,
    };
  }, [valuesData, lifeWheelData, visionData]);

  const yearProgressData = useYearProgress({
    activities,
    checkIns: activityCheckIns,
    goals,
  });

  // NEW: Self-Discovery Linear Data
  const selfDiscoveryLinearData = useMemo((): SelfDiscoveryLinearData => {
    const currentAvg = lifeWheelData.length > 0
      ? lifeWheelData.reduce((sum, d) => sum + d.current_score, 0) / lifeWheelData.length
      : 0;
    const desiredAvg = lifeWheelData.length > 0
      ? lifeWheelData.reduce((sum, d) => sum + d.desired_score, 0) / lifeWheelData.length
      : 0;
    
    const focusAreas = lifeWheelData.filter(a => a.is_focus_area).map(a => a.area_name);
    const selectedValues = valuesData.filter(v => v.selected).map(v => v.value_name);
    const hasData = lifeWheelData.length > 0 || !!visionData.word_year || !!visionData.phrase_year;

    return {
      wordOfYear: visionData.word_year || null,
      phraseOfYear: visionData.phrase_year || null,
      lifeWheelCurrentAvg: currentAvg,
      lifeWheelDesiredAvg: desiredAvg,
      focusAreas,
      selectedValues,
      hasData,
    };
  }, [lifeWheelData, visionData, valuesData]);

  // NEW: Weekly Overview Data
  const weeklyOverviewData = useWeeklyOverview({
    activities,
    checkIns: activityCheckIns,
    weeklyCompletionRate: habitsData.weeklyCompletionRate,
    monthlyCompletionRate: habitsData.monthlyCompletionRate,
  });

  // NEW: Goals + Habits Card Data
  const goalsHabitsCardData = useMemo((): GoalsHabitsCardData => {
    const activeGoals = goals.filter(g => g.status === 'active' || g.status === 'in_progress');
    const completedGoals = goals.filter(g => g.status === 'completed');
    
    const goldGoals = activeGoals.filter(g => g.priority === 'gold').length;
    const silverGoals = activeGoals.filter(g => g.priority === 'silver').length;
    const bronzeGoals = activeGoals.filter(g => g.priority === 'bronze').length;

    return {
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      goldGoals,
      silverGoals,
      bronzeGoals,
      weeklyProgress: habitsData.weeklyCompletionRate,
      monthlyProgress: habitsData.monthlyCompletionRate,
      hasData: goals.length > 0,
    };
  }, [goals, habitsData]);

  // Legacy data for backward compatibility
  const weeklyHabitsData = useMemo(() => {
    if (isGuest || !checkIns.length) return [];

    const weeksData: WeeklyHabitData[] = [];
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekCheckIns = checkIns.filter(checkIn => {
        const checkInDate = new Date(checkIn.date);
        return checkInDate >= weekStart && checkInDate <= weekEnd;
      });

      const processGoals = goals.filter(goal => goal.type === 'habit');
      
      let completionRate = 0;
      if (processGoals.length > 0) {
        const completedHabits = weekCheckIns.filter(checkIn => 
          isCheckInDone(checkIn) ||
          (checkIn.input_type === 'percentage' && Number(checkIn.progress_value) > 50) ||
          (checkIn.input_type === 'numeric' && Number(checkIn.progress_value) > 0)
        ).length;
        
        completionRate = Math.round((completedHabits / (processGoals.length * 7)) * 100);
      }

      weeksData.push({
        week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completionRate: Math.min(100, completionRate)
      });
    }

    return weeksData;
  }, [checkIns, goals, isGuest]);

  const monthlyProgressData = useMemo(() => {
    if (isGuest || !checkIns.length) return [];

    const monthsData: MonthlyProgressData[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthCheckIns = checkIns.filter(checkIn => {
        const checkInDate = new Date(checkIn.date);
        return checkInDate >= monthStart && checkInDate <= monthEnd;
      });

      let averageProgress = 0;
      if (monthCheckIns.length > 0) {
        const totalProgress = monthCheckIns.reduce((sum, checkIn) => {
          if (checkIn.input_type === 'percentage') {
            return sum + (deriveScoreValue(checkIn) ?? 0);
          } else if (checkIn.input_type === 'checkbox') {
            return sum + (isCheckInDone(checkIn) ? 100 : 0);
          } else if (checkIn.input_type === 'numeric') {
            return sum + Math.min(100, (deriveScoreValue(checkIn) ?? 0) * 10);
          }
          return sum;
        }, 0);
        
        averageProgress = Math.round(totalProgress / monthCheckIns.length);
      }

      monthsData.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        progress: averageProgress
      });
    }

    return monthsData;
  }, [checkIns, isGuest]);

  const kpiData = useMemo((): KPIData => {
    if (isGuest) {
      return {
        goalsCompletedPercentage: 0,
        longestStreak: 0,
        strongestLifeArea: 'Health',
        weakestLifeArea: 'Career'
      };
    }

    const completedGoals = goals.filter(goal => goal.status === 'completed').length;
    const goalsCompletedPercentage = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;

    return {
      goalsCompletedPercentage,
      longestStreak: habitsData.longestStreak,
      strongestLifeArea: lifeSnapshotData.dominantArea.name,
      weakestLifeArea: lifeSnapshotData.weakestArea.name
    };
  }, [goals, habitsData, lifeSnapshotData, isGuest]);

  return {
    isLoading,
    weeklyHabitsData,
    monthlyProgressData,
    kpiData,
    // Legacy data
    lifeSnapshotData,
    todaysFocusData,
    goalsWithProgress,
    habitsData,
    selfDiscoveryPanelData,
    activities,
    activityCheckIns,
    // New redesigned dashboard data
    yearProgressData,
    selfDiscoveryLinearData,
    todaysFocusCardData,
    weeklyOverviewData,
    goalsHabitsCardData,
    refetchActivities,
  };
};
