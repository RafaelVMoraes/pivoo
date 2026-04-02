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
import { OnboardingContextCard } from '@/components/dashboard/OnboardingContextCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

export const Dashboard = () => {
  const { isGuest } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('chatbot.dashboardModeTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3">
          <Button className="md:flex-1" onClick={() => navigate('/ai-chatbot?mode=assistant_quick')}>
            {t('chatbot.modeAssistantQuick')}
          </Button>
          <Button variant="secondary" className="md:flex-1" onClick={() => navigate('/ai-chatbot?mode=analysis_modules')}>
            {t('chatbot.modeAnalysisModules')}
          </Button>
        </CardContent>
      </Card>

      <OnboardingContextCard />

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
