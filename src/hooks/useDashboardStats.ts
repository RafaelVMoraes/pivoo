import { useState, useEffect, useMemo, useCallback } from 'react';
import { startOfWeek, format as dateFnsFormat } from 'date-fns';
import { useGoals, Goal } from './useGoals';
import { useCheckIns } from './useCheckIns';
import { useSelfDiscovery } from './useSelfDiscovery';
import { useAuth } from '@/contexts/AuthContext';
import { useAllActivities, ActivityWithGoal } from './useAllActivities';
import { isActivityCompletedForWindow, isActivityCompletedForDate, isActivityLate, getActivityTimePeriod } from '@/lib/taskUtils';
import { deriveScoreValue, isCheckInDone } from '@/lib/checkInStatus';

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

export interface TodaysFocusData {
  task: ActivityWithGoal | null;
  relatedValue: string | null;
  overdueCount: number;
  todayTasksCount: number;
}

export interface GoalWithProgress extends Goal {
  progress: number;
  activityCount: number;
  completedActivities: number;
  isOverdue: boolean;
  isStalled: boolean;
}

export interface HabitsData {
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
  currentStreak: number;
  longestStreak: number;
  consistencyTrend: 'improving' | 'declining' | 'stable';
  weekdayAverage: number;
  weekendAverage: number;
  insightText: string;
}

export interface SelfDiscoveryPanelData {
  topValues: string[];
  focusAreas: string[];
  growthAreas: string[];
  visionWord: string | null;
  visionPhrase: string | null;
}

// New interfaces for redesigned dashboard
export interface YearProgressData {
  tasksCompleted: number;
  totalTasks: number;
  goalsCompleted: number;
  totalGoals: number;
  yearProgress: number;
}

export interface SelfDiscoveryLinearData {
  wordOfYear: string | null;
  phraseOfYear: string | null;
  lifeWheelCurrentAvg: number;
  lifeWheelDesiredAvg: number;
  focusAreas: string[];
  selectedValues: string[];
  hasData: boolean;
}

export interface TodaysFocusCardData {
  tasks: Array<{
    id: string;
    activityId: string;
    name: string;
    priority: 'gold' | 'silver' | 'bronze';
    goalTitle: string;
    goalId: string;
    isOverdue: boolean;
  }>;
  overdueCount: number;
  totalTodayCount: number;
}

export interface WeeklyOverviewData {
  days: Record<string, {
    morning: number;
    afternoon: number;
    night: number;
    wholeDay: number;
    morningCompleted: number;
    afternoonCompleted: number;
    nightCompleted: number;
    wholeDayCompleted: number;
  }>;
  weeklyCompletionRate: number;
  monthlyCompletionRate: number;
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
  const { user, isGuest } = useAuth();
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

  // Calculate today's focus data
  const todaysFocusData = useMemo((): TodaysFocusData => {
    const now = new Date();
    const hour = now.getHours();
    const currentTimeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'night';

    // Filter activities for today
    const todayActivities = activities.filter(activity => {
      const period = getActivityTimePeriod(activity, now);
      if (period === 'today') {
        // Check if not already completed
        return !isActivityCompletedForWindow(activity, activityCheckIns, now);
      }
      return false;
    });

    // Sort by priority and time of day relevance
    const priorityOrder = { gold: 0, silver: 1, bronze: 2 };
    const timeRelevance = (a: ActivityWithGoal) => {
      if (a.time_of_day === currentTimeOfDay) return 0;
      return 1;
    };

    const sortedActivities = [...todayActivities].sort((a, b) => {
      const timeDiff = timeRelevance(a) - timeRelevance(b);
      if (timeDiff !== 0) return timeDiff;
      return priorityOrder[a.goal.priority] - priorityOrder[b.goal.priority];
    });

    // Count overdue
    const overdueCount = activities.filter(a => isActivityLate(a, activityCheckIns, now)).length;

    // Get related value for the focus task
    const focusTask = sortedActivities[0] || null;
    const selectedValues = valuesData.filter(v => v.selected).map(v => v.value_name);
    const relatedValue = selectedValues.length > 0 ? selectedValues[0] : null;

    return {
      task: focusTask,
      relatedValue,
      overdueCount,
      todayTasksCount: todayActivities.length + 1,
    };
  }, [activities, activityCheckIns, valuesData]);

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

  // Calculate habits consistency data
  const habitsData = useMemo((): HabitsData => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const dailyActivities = activities.filter(a => a.status === 'active' && a.frequency_type === 'daily');

    // Calculate weekly completion rate - count expected vs actual for the current week
    let weeklyExpected = 0;
    let weeklyCompleted = 0;

    activities.forEach(activity => {
      if (activity.status !== 'active') return;

      // Count expected executions for this week
      if (activity.frequency_type === 'daily') {
        const daysInWeek = Math.min(7, Math.floor((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        weeklyExpected += daysInWeek;
      } else if (activity.frequency_type === 'weekly') {
        // Count scheduled days in this week that have passed
        const daysInWeek = Math.floor((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const scheduledDays = activity.days_of_week || [];
        const dayNamesLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let scheduledThisWeek = 0;
        const scheduledLower = scheduledDays.map(d => d.toLowerCase());
        for (let i = 0; i < daysInWeek; i++) {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + i);
          const idx = day.getDay();
          if (scheduledLower.includes(dayNamesLong[idx].toLowerCase()) || scheduledLower.includes(dayNamesShort[idx].toLowerCase())) {
            scheduledThisWeek++;
          }
        }
        weeklyExpected += scheduledThisWeek;
      } else if (activity.frequency_type === 'monthly') {
        // Check if the scheduled day falls in this week and has passed
        if (activity.day_of_month) {
          const scheduledDate = new Date(now.getFullYear(), now.getMonth(), activity.day_of_month);
          if (scheduledDate >= weekStart && scheduledDate <= now) {
            weeklyExpected += 1;
          }
        }
      }

      // Count completed check-ins for this week
      const weekCheckIns = activityCheckIns.filter(c => {
        if (c.activity_id !== activity.id) return false;
        const checkInDate = new Date(c.date);
        return checkInDate >= weekStart && 
               checkInDate <= now &&
               isCheckInDone(c);
      });

      // For daily/weekly, count unique days
      if (activity.frequency_type === 'daily' || activity.frequency_type === 'weekly') {
        const uniqueDays = new Set(weekCheckIns.map(ci => new Date(ci.date).toISOString().split('T')[0]));
        weeklyCompleted += uniqueDays.size;
      } else if (activity.frequency_type === 'monthly') {
        weeklyCompleted += weekCheckIns.length > 0 ? 1 : 0;
      }
    });

    const weeklyCompletionRate = weeklyExpected > 0 
      ? Math.round((weeklyCompleted / weeklyExpected) * 100)
      : 0;

    // Calculate monthly completion rate - count expected vs actual for the current month
    let monthlyExpected = 0;
    let monthlyCompleted = 0;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();

    activities.forEach(activity => {
      if (activity.status !== 'active') return;

      // Count expected executions for this month
      if (activity.frequency_type === 'daily') {
        monthlyExpected += daysPassed;
      } else if (activity.frequency_type === 'weekly') {
        // Count scheduled days that have passed this month
        const weeksElapsed = Math.ceil(daysPassed / 7);
        const daysPerWeek = activity.days_of_week?.length || 1;
        monthlyExpected += weeksElapsed * daysPerWeek;
      } else if (activity.frequency_type === 'monthly') {
        // If the scheduled day has passed, expect 1 completion
        if (activity.day_of_month && activity.day_of_month <= daysPassed) {
          monthlyExpected += 1;
        }
      }

      // Count completed check-ins for this month
      const monthCheckIns = activityCheckIns.filter(c => {
        if (c.activity_id !== activity.id) return false;
        const checkInDate = new Date(c.date);
        return checkInDate >= monthStart && 
               checkInDate <= now &&
               isCheckInDone(c);
      });

      // For daily/weekly, count unique days
      if (activity.frequency_type === 'daily' || activity.frequency_type === 'weekly') {
        const uniqueDays = new Set(monthCheckIns.map(ci => new Date(ci.date).toISOString().split('T')[0]));
        monthlyCompleted += uniqueDays.size;
      } else if (activity.frequency_type === 'monthly') {
        monthlyCompleted += monthCheckIns.length > 0 ? 1 : 0;
      }
    });

    const monthlyCompletionRate = monthlyExpected > 0 
      ? Math.round((monthlyCompleted / monthlyExpected) * 100)
      : 0;

    // Get monthly check-ins for streak and analysis
    const monthlyCheckIns = activityCheckIns.filter(c => {
      const checkInDate = new Date(c.date);
      return checkInDate >= monthStart && 
             checkInDate <= now &&
             isCheckInDone(c);
    });

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    if (activityCheckIns.length > 0) {
      const sortedCheckIns = [...activityCheckIns].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      let lastDate: Date | null = null;
      for (const checkIn of sortedCheckIns) {
        const checkInDate = new Date(checkIn.date);
        checkInDate.setHours(0, 0, 0, 0);

        if (!lastDate || checkInDate.getTime() - lastDate.getTime() === 86400000) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else if (checkInDate.getTime() - lastDate.getTime() > 86400000) {
          tempStreak = 1;
        }
        lastDate = checkInDate;
      }
      currentStreak = tempStreak;
    }

    // Weekday vs Weekend analysis
    const weekdayCheckIns = monthlyCheckIns.filter(c => {
      const day = new Date(c.date).getDay();
      return day !== 0 && day !== 6;
    });
    const weekendCheckIns = monthlyCheckIns.filter(c => {
      const day = new Date(c.date).getDay();
      return day === 0 || day === 6;
    });

    const weekdayAverage = dailyActivities.length > 0 
      ? Math.round((weekdayCheckIns.length / (dailyActivities.length * 22)) * 100) // ~22 weekdays
      : 0;
    const weekendAverage = dailyActivities.length > 0 
      ? Math.round((weekendCheckIns.length / (dailyActivities.length * 8)) * 100) // ~8 weekend days
      : 0;

    // Determine trend
    const firstHalfCheckIns = monthlyCheckIns.filter(c => new Date(c.date) < new Date(now.getTime() - 15 * 86400000));
    const secondHalfCheckIns = monthlyCheckIns.filter(c => new Date(c.date) >= new Date(now.getTime() - 15 * 86400000));
    let consistencyTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalfCheckIns.length > firstHalfCheckIns.length * 1.2) {
      consistencyTrend = 'improving';
    } else if (secondHalfCheckIns.length < firstHalfCheckIns.length * 0.8) {
      consistencyTrend = 'declining';
    }

    // Generate insight
    let insightText = "Start building habits by adding activities to your goals.";
    if (dailyActivities.length > 0) {
      if (weekendAverage < weekdayAverage * 0.6) {
        insightText = "Your weekday consistency is strong, but weekends could use more attention.";
      } else if (consistencyTrend === 'improving') {
        insightText = `Great momentum! Your consistency has improved over the past 2 weeks.`;
      } else if (consistencyTrend === 'declining') {
        insightText = "Your routine needs a boost. Try starting with just one habit today.";
      } else if (currentStreak >= 7) {
        insightText = `Amazing! You're on a ${currentStreak}-day streak. Keep it going!`;
      } else {
        insightText = `You're completing ${weeklyCompletionRate}% of your daily habits. Small improvements compound!`;
      }
    }

    return {
      weeklyCompletionRate: Math.min(100, weeklyCompletionRate),
      monthlyCompletionRate: Math.min(100, monthlyCompletionRate),
      currentStreak,
      longestStreak,
      consistencyTrend,
      weekdayAverage: Math.min(100, weekdayAverage),
      weekendAverage: Math.min(100, weekendAverage),
      insightText,
    };
  }, [activities, activityCheckIns]);

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

  // NEW: Year Progress Data
  const yearProgressData = useMemo((): YearProgressData => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    const yearProgress = Math.round(((now.getTime() - startOfYear.getTime()) / (endOfYear.getTime() - startOfYear.getTime())) * 100);

    // Tasks completed in the year (unique check-ins)
    const yearCheckIns = activityCheckIns.filter(c => new Date(c.date).getFullYear() === now.getFullYear());
    const tasksCompleted = yearCheckIns.length;
    
    // Calculate total expected tasks based on each activity's frequency since its creation or year start
    let totalTasks = 0;
    
    activities.forEach(activity => {
      const createdAt = new Date(activity.created_at);
      const activityStart = createdAt.getFullYear() === now.getFullYear() ? createdAt : startOfYear;
      const daysSinceStart = Math.floor((now.getTime() - activityStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (activity.frequency_type === 'daily') {
        totalTasks += daysSinceStart;
      } else if (activity.frequency_type === 'weekly') {
        // Count based on days_of_week array length or default to 1 per week
        const daysPerWeek = activity.days_of_week?.length || 1;
        totalTasks += Math.ceil(daysSinceStart / 7) * daysPerWeek;
      } else if (activity.frequency_type === 'monthly') {
        // Count months since start
        const monthsSinceStart = (now.getFullYear() - activityStart.getFullYear()) * 12 + 
                                 (now.getMonth() - activityStart.getMonth()) + 1;
        totalTasks += monthsSinceStart;
      }
    });

    // Goals
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalGoals = goals.length;

    return {
      tasksCompleted,
      totalTasks: Math.max(1, totalTasks),
      goalsCompleted: completedGoals,
      totalGoals,
      yearProgress,
    };
  }, [activities, activityCheckIns, goals]);

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

  // NEW: Today's Focus Card Data
  const todaysFocusCardData = useMemo((): TodaysFocusCardData => {
    const now = new Date();
    
    // Get today's tasks and overdue tasks
    const todayTasks = activities.filter(activity => {
      const period = getActivityTimePeriod(activity, now);
      return period === 'today' && !isActivityCompletedForDate(activity, activityCheckIns, now);
    });

    const overdueTasks = activities.filter(activity => isActivityLate(activity, activityCheckIns, now));

    const allTasks = [...overdueTasks, ...todayTasks];
    const uniqueTasks = allTasks.filter((task, index, self) => 
      index === self.findIndex(t => t.id === task.id)
    );

    const tasks = uniqueTasks.map(activity => ({
      id: `${activity.id}-${now.toDateString()}`,
      activityId: activity.id,
      name: activity.title,
      priority: activity.goal.priority as 'gold' | 'silver' | 'bronze',
      goalTitle: activity.goal.title,
      goalId: activity.goal_id,
      isOverdue: isActivityLate(activity, activityCheckIns, now),
    }));

    // Sort: overdue first, then by priority
    const priorityOrder = { gold: 0, silver: 1, bronze: 2 };
    tasks.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return {
      tasks,
      overdueCount: overdueTasks.length,
      totalTodayCount: todayTasks.length,
    };
  }, [activities, activityCheckIns]);

  // NEW: Weekly Overview Data
  const weeklyOverviewData = useMemo((): WeeklyOverviewData => {
    const now = new Date();
    const weekStartDate = startOfWeek(now, { weekStartsOn: 1 });
    weekStartDate.setHours(0, 0, 0, 0);

    const days: WeeklyOverviewData['days'] = {};

    // Day name mapping for matching with days_of_week
    const dayNameMap: Record<number, string> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStartDate);
      day.setDate(weekStartDate.getDate() + i);
      const dateKey = dateFnsFormat(day, 'yyyy-MM-dd');
      const dayOfWeekIndex = day.getDay();
      const dayName = dayNameMap[dayOfWeekIndex];
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);

      // Count activities for each time slot that are scheduled for this day
      const dayActivities = activities.filter(activity => {
        if (activity.status !== 'active') return false;

        // Skip activities whose goal hasn't started yet
        if (activity.goal.start_date) {
          const goalStartDate = new Date(activity.goal.start_date);
          goalStartDate.setHours(0, 0, 0, 0);
          if (dayStart < goalStartDate) return false;
        }

        // Skip activities that have ended
        if (activity.end_date) {
          const activityEndDate = new Date(activity.end_date);
          activityEndDate.setHours(23, 59, 59, 999);
          if (dayStart > activityEndDate) return false;
        }

      // Check if activity is scheduled for this day based on frequency
        if (activity.frequency_type === 'daily') {
          return true;
        } else if (activity.frequency_type === 'weekly') {
          // Check if this day is in the scheduled days (support both short and long names)
          const scheduledDays = activity.days_of_week || [];
          const dayNamesLong = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayNamesShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          const dayLong = dayNamesLong[dayOfWeekIndex];
          const dayShort = dayNamesShort[dayOfWeekIndex];
          return scheduledDays.some(d => {
            const lower = d.toLowerCase();
            return lower === dayLong || lower === dayShort;
          });
        } else if (activity.frequency_type === 'monthly') {
          // Check if this is the scheduled day of the month
          return activity.day_of_month === day.getDate();
        }
        return false;
      });

      const timeSlotCount = {
        morning: dayActivities.filter(a => a.time_of_day === 'morning').length,
        afternoon: dayActivities.filter(a => a.time_of_day === 'afternoon').length,
        night: dayActivities.filter(a => a.time_of_day === 'night').length,
        wholeDay: dayActivities.filter(a => !a.time_of_day || a.time_of_day === 'whole_day').length,
      };

      // Count completed check-ins for this specific day
      // Only count check-ins that are marked as completed
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayCheckIns = activityCheckIns.filter(c => {
        const checkInDate = new Date(c.date);
        // Check if check-in is on this day
        if (checkInDate < dayStart || checkInDate > dayEnd) return false;
        // Only count completed check-ins
        return isCheckInDone(c);
      });

      // Group completed check-ins by time slot
      const completedBySlot = {
        morningCompleted: dayCheckIns.filter(c => {
          const activity = activities.find(a => a.id === c.activity_id);
          return activity?.time_of_day === 'morning';
        }).length,
        afternoonCompleted: dayCheckIns.filter(c => {
          const activity = activities.find(a => a.id === c.activity_id);
          return activity?.time_of_day === 'afternoon';
        }).length,
        nightCompleted: dayCheckIns.filter(c => {
          const activity = activities.find(a => a.id === c.activity_id);
          return activity?.time_of_day === 'night';
        }).length,
        wholeDayCompleted: dayCheckIns.filter(c => {
          const activity = activities.find(a => a.id === c.activity_id);
          return !activity?.time_of_day || activity?.time_of_day === 'whole_day';
        }).length,
      };

      days[dateKey] = {
        ...timeSlotCount,
        ...completedBySlot,
      };
    }

    return { 
      days,
      weeklyCompletionRate: habitsData.weeklyCompletionRate,
      monthlyCompletionRate: habitsData.monthlyCompletionRate,
    };
  }, [activities, activityCheckIns, habitsData]);

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
