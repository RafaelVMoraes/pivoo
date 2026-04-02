import { useCallback, useMemo, useState } from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useSelfDiscovery } from '@/hooks/useSelfDiscovery';
import { useGoals } from '@/hooks/useGoals';
import { useAnalysisChat } from '@/hooks/useAnalysisChat';
import type { AnalysisInputs, LifeAreaWithStats, ModuleId } from '@/components/chatbot/types';
import { trackAIModeEvent } from '@/lib/aiModeEvents';

const defaultInputs: AnalysisInputs = {
  capacityLoad: { scope: '', workHoursPerWeek: '40', sleepHoursPerDay: '8' },
  lifeAreasCoherence: { selectedArea: '' },
  goalViability: { goalId: '' },
  monthlyExecution: {},
  selfDiscoveryCoherence: { scope: '' },
  analysisConfiguration: { depth: '', tone: '', thinkingMode: '' },
};

export const useAIChatbotPage = () => {
  const [activeModule, setActiveModule] = useState<ModuleId | null>(null);
  const [inputs, setInputs] = useState<AnalysisInputs>(defaultInputs);
  const [initialOutput, setInitialOutput] = useState<string | null>(null);
  const [hasTrackedFirstMessage, setHasTrackedFirstMessage] = useState(false);

  const { goals } = useGoals();
  const { goalsWithProgress, activities, activityCheckIns, lifeSnapshotData } = useDashboardStats();
  const { lifeWheelData, valuesData, visionData } = useSelfDiscovery();

  const selfDiscoveryComplete =
    lifeWheelData.length > 0 && valuesData.some((value) => value.selected);

  const lifeAreasWithStats: LifeAreaWithStats[] = useMemo(
    () =>
      lifeWheelData.map((area) => ({
        area_name: area.area_name,
        current_score: area.current_score,
        desired_score: area.desired_score,
        goalCount: goals.filter((goal) =>
          Array.isArray(goal.life_wheel_area)
            ? goal.life_wheel_area.includes(area.area_name)
            : goal.life_wheel_area === area.area_name,
        ).length,
      })),
    [lifeWheelData, goals],
  );

  const buildContext = useCallback(() => {
    if (!activeModule) return '';

    const goalSummary = goalsWithProgress
      .slice(0, 10)
      .map((goal) => {
        const areas = Array.isArray(goal.life_wheel_area)
          ? goal.life_wheel_area.join(', ')
          : goal.life_wheel_area || 'n/a';
        return `• ${goal.title} [${goal.priority}] (${goal.status}) — ${goal.progress}% progress, areas: ${areas}`;
      })
      .join('\n');

    const lifeWheelSummary = lifeWheelData
      .map(
        (area) =>
          `• ${area.area_name}: ${area.current_score}/10 → ${area.desired_score}/10 (gap: ${area.desired_score - area.current_score})`,
      )
      .join('\n');

    const activitySummary = activities
      .slice(0, 10)
      .map((activity) => {
        const frequency = activity.frequency_type
          ? `${activity.frequency_type}${activity.frequency_value ? `:${activity.frequency_value}` : ''}`
          : 'n/a';
        return `• ${activity.description} (${frequency})`;
      })
      .join('\n');

    switch (activeModule) {
      case 'capacity-load': {
        const { scope, workHoursPerWeek, sleepHoursPerDay } = inputs.capacityLoad;
        const work = parseInt(workHoursPerWeek, 10) || 40;
        const sleep = parseInt(sleepHoursPerDay, 10) || 8;
        const weeklyDiscretionary = 168 - work - sleep * 7;
        const periodHours = scope === 'monthly' ? weeklyDiscretionary * 4.3 : weeklyDiscretionary;

        return [
          `# Capacity & Load Analysis - ${scope === 'weekly' ? 'Weekly' : 'Monthly'} Scope`,
          '',
          '## Time Budget',
          `- Work hours per week: ${work}h`,
          `- Sleep hours per day: ${sleep}h (${sleep * 7}h/week)`,
          `- Discretionary hours: ~${Math.round(periodHours)}h/${scope === 'monthly' ? 'month' : 'week'}`,
          '',
          `## Current Goals (${goalsWithProgress.length} total)`,
          goalSummary || 'No goals defined',
          '',
          `## Planned Activities (${activities.length} total)`,
          activitySummary || 'No activities defined',
          '',
          `## Overall Progress Score: ${lifeSnapshotData.overallProgressScore || 0}/100`,
        ].join('\n');
      }
      case 'life-areas-coherence': {
        const { selectedArea } = inputs.lifeAreasCoherence;
        const areaData = lifeWheelData.find((area) => area.area_name === selectedArea);
        const areaGoals = goals
          .filter((goal) =>
            Array.isArray(goal.life_wheel_area)
              ? goal.life_wheel_area.includes(selectedArea)
              : goal.life_wheel_area === selectedArea,
          )
          .map((goal) => `• ${goal.title} (${goal.priority}) - ${goal.status}`)
          .join('\n');

        return [
          `# Life Area Coherence Analysis: ${selectedArea}`,
          '',
          '## Life Area Status',
          areaData ? `- Current Score: ${areaData.current_score}/10` : '',
          areaData ? `- Desired Score: ${areaData.desired_score}/10` : '',
          areaData ? `- Gap to Close: ${areaData.desired_score - areaData.current_score} points` : '',
          '',
          '## Goals Linked to This Area',
          areaGoals || 'No goals linked to this area',
          '',
          '## All Life Areas for Context',
          lifeWheelSummary,
        ]
          .filter(Boolean)
          .join('\n');
      }
      case 'goal-viability': {
        const selectedGoal = goals.find((goal) => goal.id === inputs.goalViability.goalId);
        if (!selectedGoal) return 'No goal selected.';

        const goalActivities = activities
          .filter((activity) => activity.goal_id === selectedGoal.id)
          .map((activity) => `• ${activity.description} (${activity.frequency_type || 'n/a'})`)
          .join('\n');

        return [
          `# Goal Viability Review: ${selectedGoal.title}`,
          '',
          '## Goal Details',
          `- Priority: ${selectedGoal.priority}`,
          `- Status: ${selectedGoal.status}`,
          `- Target Date: ${selectedGoal.target_date || 'Not set'}`,
          `- Type: ${selectedGoal.type || 'Not specified'}`,
          '',
          '## Alignment',
          `- Life Areas: ${Array.isArray(selectedGoal.life_wheel_area) ? selectedGoal.life_wheel_area.join(', ') : selectedGoal.life_wheel_area || 'None'}`,
          `- Related Values: ${Array.isArray(selectedGoal.related_values) ? selectedGoal.related_values.join(', ') : 'None'}`,
          '',
          '## Motivation',
          `- Surface: ${selectedGoal.surface_motivation || 'Not specified'}`,
          `- Deeper: ${selectedGoal.deeper_motivation || 'Not specified'}`,
          `- Identity: ${selectedGoal.identity_motivation || 'Not specified'}`,
          '',
          `## Associated Activities (${activities.filter((activity) => activity.goal_id === selectedGoal.id).length} total)`,
          goalActivities || 'No activities defined',
        ].join('\n');
      }
      case 'monthly-execution': {
        const completedCount = activityCheckIns.length;
        const plannedCount = activities.length;
        const completionRate = plannedCount > 0 ? Math.round((completedCount / plannedCount) * 100) : 0;

        return [
          '# Monthly Execution Review',
          '',
          '## Execution Summary',
          `- Planned activities: ${plannedCount}`,
          `- Check-ins recorded: ${completedCount}`,
          `- Completion rate: ~${completionRate}%`,
          '',
          '## Goal Progress',
          goalSummary || 'No goals to track',
          '',
          '## Activity Breakdown',
          activitySummary || 'No activities defined',
        ].join('\n');
      }
      case 'self-discovery-coherence': {
        const { scope } = inputs.selfDiscoveryCoherence;
        const topValues = valuesData.filter((value) => value.selected).map((value) => value.value_name);

        const sections = [
          '# Self-Discovery Coherence Analysis',
          `## Scope: ${scope.charAt(0).toUpperCase() + scope.slice(1).replace('-', ' ')}`,
          '',
        ];

        if (scope === 'overall' || scope === 'values') {
          sections.push(`## Values (${topValues.length} selected)`);
          sections.push(topValues.length > 0 ? topValues.map((value) => `• ${value}`).join('\n') : 'No values selected');
          sections.push('');
        }

        if (scope === 'overall' || scope === 'vision') {
          sections.push('## Vision');
          sections.push(`- 1-Year Vision: ${visionData.vision_1y || 'Not defined'}`);
          sections.push(`- 3-Year Vision: ${visionData.vision_3y || 'Not defined'}`);
          sections.push('');
        }

        if (scope === 'overall' || scope === 'word-phrase') {
          sections.push('## Theme for the Year');
          sections.push(`- Word of the Year: ${visionData.word_year || 'Not set'}`);
          sections.push(`- Phrase of the Year: ${visionData.phrase_year || 'Not set'}`);
          sections.push('');
        }

        if (scope === 'overall' || scope === 'life-wheel') {
          sections.push('## Life Wheel Balance');
          sections.push(lifeWheelSummary || 'No life wheel data');
          sections.push('');
        }

        sections.push('## Current Goals for Comparison');
        sections.push(goalSummary || 'No goals defined');

        return sections.join('\n');
      }
      default:
        return '';
    }
  }, [activeModule, activities, activityCheckIns, goals, goalsWithProgress, inputs, lifeSnapshotData.overallProgressScore, lifeWheelData, valuesData, visionData]);

  const { messages, isLoading, hasInitialOutput, startAnalysis, sendMessage, clearSession } = useAnalysisChat({
    moduleId: activeModule || 'capacity-load',
    contextBuilder: buildContext,
    analysisConfiguration: inputs.analysisConfiguration,
  });

  const handleInputChange = useCallback(<K extends keyof AnalysisInputs>(key: K, value: Partial<AnalysisInputs[K]>) => {
    setInputs((previous) => ({ ...previous, [key]: { ...previous[key], ...value } }));
  }, []);

  const handleSelectModule = useCallback(
    (moduleId: ModuleId) => {
      setActiveModule(moduleId);
      setInitialOutput(null);
      setHasTrackedFirstMessage(false);
      clearSession();
    },
    [clearSession],
  );

  const handleBackToModules = useCallback(() => {
    setActiveModule(null);
    setInitialOutput(null);
    setInputs(defaultInputs);
    setHasTrackedFirstMessage(false);
    clearSession();
  }, [clearSession]);

  const handleStartAnalysis = useCallback(async () => {
    const result = await startAnalysis();
    if (result) {
      setInitialOutput(result);
      return true;
    }
    return false;
  }, [startAnalysis]);

  const handleRestartAnalysis = useCallback(() => {
    setInitialOutput(null);
    setHasTrackedFirstMessage(false);
    clearSession();
  }, [clearSession]);

  const markFirstAnalysisMessage = useCallback(() => {
    if (hasTrackedFirstMessage || !activeModule) return;
    trackAIModeEvent({
      event: 'first_message',
      mode: 'analysis_modules',
      moduleId: activeModule,
    });
    setHasTrackedFirstMessage(true);
  }, [activeModule, hasTrackedFirstMessage]);

  const markAnalysisCompleted = useCallback(() => {
    if (!activeModule) return;
    trackAIModeEvent({
      event: 'analysis_completed',
      mode: 'analysis_modules',
      moduleId: activeModule,
    });
  }, [activeModule]);

  const canStart = useMemo(() => {
    if (!activeModule) return false;
    const hasAnalysisConfiguration = Boolean(
      inputs.analysisConfiguration.depth
      && inputs.analysisConfiguration.tone
      && inputs.analysisConfiguration.thinkingMode,
    );
    if (!hasAnalysisConfiguration) return false;
    if (activeModule === 'capacity-load') return Boolean(inputs.capacityLoad.scope);
    if (activeModule === 'life-areas-coherence') return Boolean(inputs.lifeAreasCoherence.selectedArea);
    if (activeModule === 'goal-viability') return Boolean(inputs.goalViability.goalId);
    if (activeModule === 'self-discovery-coherence') return selfDiscoveryComplete && Boolean(inputs.selfDiscoveryCoherence.scope);
    return true;
  }, [activeModule, inputs.analysisConfiguration.depth, inputs.analysisConfiguration.thinkingMode, inputs.analysisConfiguration.tone, inputs.capacityLoad.scope, inputs.goalViability.goalId, inputs.lifeAreasCoherence.selectedArea, inputs.selfDiscoveryCoherence.scope, selfDiscoveryComplete]);

  return {
    activeModule,
    inputs,
    initialOutput,
    goals,
    lifeAreasWithStats,
    selfDiscoveryComplete,
    messages,
    isLoading,
    hasInitialOutput,
    canStart,
    handleInputChange,
    handleSelectModule,
    handleBackToModules,
    handleStartAnalysis,
    handleRestartAnalysis,
    sendMessage,
    markFirstAnalysisMessage,
    markAnalysisCompleted,
  };
};
