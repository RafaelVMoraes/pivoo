/**
 * Dashboard Page - Redesigned
 * Prioritizes clarity, progressive disclosure, and actionable insights
 */

import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { YearProgressCard } from '@/components/dashboard/YearProgressCard';
import { SelfDiscoveryLinearCard } from '@/components/dashboard/SelfDiscoveryLinearCard';
import { TodaysFocusCard } from '@/components/dashboard/TodaysFocusCard';
import { WeeklyOverviewCard } from '@/components/dashboard/WeeklyOverviewCard';
import { DailyReflectionCard } from '@/components/dashboard/DailyReflectionCard';

export const Dashboard = () => {
  const { isGuest } = useAuth();
  const { 
    isLoading, 
    yearProgressData,
    selfDiscoveryLinearData,
    todaysFocusCardData,
    weeklyOverviewData,
    goalsHabitsCardData,
  } = useDashboardStats();

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. Year Progress Card */}
      <div data-tutorial-id="dashboard-year-progress">
      <YearProgressCard 
        data={{
          ...yearProgressData,
          lifeWheelCurrentAvg: selfDiscoveryLinearData.lifeWheelCurrentAvg,
          lifeWheelDesiredAvg: selfDiscoveryLinearData.lifeWheelDesiredAvg,
          focusAreasCount: selfDiscoveryLinearData.focusAreas.length,
          todayTasksCount: todaysFocusCardData.tasks.length,
        }} 
        isLoading={isLoading} 
        isGuest={isGuest} 
      />
      </div>

      {/* 2. Self-Discovery Linear Card */}
      <SelfDiscoveryLinearCard 
        data={selfDiscoveryLinearData} 
        isLoading={isLoading} 
        isGuest={isGuest} 
      />

      {/* 3. Today's Focus */}
      <div data-tutorial-id="dashboard-today-focus">
      <TodaysFocusCard 
        data={todaysFocusCardData} 
        isLoading={isLoading} 
        isGuest={isGuest}
      />
      </div>

      {/* 4. Weekly Overview Calendar */}
      <WeeklyOverviewCard 
        data={weeklyOverviewData} 
        isLoading={isLoading} 
        isGuest={isGuest} 
      />

      {/* 5. Daily Reflection */}
      <div id="daily-reflection" data-tutorial-id="dashboard-reflection">
        <DailyReflectionCard 
          isLoading={isLoading} 
          isGuest={isGuest}
        />
      </div>
    </div>
  );
};

export default Dashboard;
