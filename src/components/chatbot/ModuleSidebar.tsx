import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { getLocalizedModuleContent, getModuleById } from '@/lib/chatbotModules';
import type { ModuleId, AnalysisInputs, LifeAreaWithStats } from './types';

interface Goal {
  id: string;
  title: string;
  priority: string;
}

interface ModuleSidebarProps {
  moduleId: ModuleId;
  inputs: AnalysisInputs;
  hasStarted: boolean;
  lifeAreas?: LifeAreaWithStats[];
  goals?: Goal[];
}

export const ModuleSidebar: React.FC<ModuleSidebarProps> = ({
  moduleId,
  inputs,
  hasStarted,
  lifeAreas = [],
  goals = [],
}) => {
  const module = getModuleById(moduleId);
  const { t } = useTranslation();
  const localizedModule = getLocalizedModuleContent(moduleId, t);

  if (!module) return null;

  if (!hasStarted) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{localizedModule.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <p>{localizedModule.description}</p>
          <div className="space-y-1">
            <p className="font-medium text-foreground">{t('chatbot.expectedOutputsLabel')}</p>
            <ul className="list-disc ml-4 space-y-0.5">
              {localizedModule.expectedOutputs.map((output, idx) => (
                <li key={idx}>{output}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderSelectedInputs = () => {
    switch (moduleId) {
      case 'capacity-load': {
        const { scope, workHoursPerWeek, sleepHoursPerDay } = inputs.capacityLoad;
        const work = parseInt(workHoursPerWeek) || 40;
        const sleep = parseInt(sleepHoursPerDay) || 8;
        const discretionary = 168 - work - (sleep * 7);

        return (
          <div className="space-y-2">
            <p className="font-medium text-foreground text-xs">{t('chatbot.selectedInputs')}</p>
            <div className="space-y-1 text-xs">
              <p><span className="text-muted-foreground">{t('chatbot.scopeLabel')}</span> {scope === 'weekly' ? t('chatbot.weekly') : t('chatbot.monthly')}</p>
              <p><span className="text-muted-foreground">{t('chatbot.workHoursPerWeekLabel')}</span> {work}h</p>
              <p><span className="text-muted-foreground">{t('chatbot.sleepHoursPerDayLabel')}</span> {sleep}h</p>
              <p className="pt-1 border-t mt-2">
                <span className="text-muted-foreground">{t('chatbot.discretionaryLabel')}</span>
                <span className="font-medium text-primary"> ~{discretionary}h/week</span>
              </p>
            </div>
          </div>
        );
      }

      case 'life-areas-coherence': {
        const { selectedArea } = inputs.lifeAreasCoherence;
        const area = lifeAreas.find(a => a.area_name === selectedArea);

        return (
          <div className="space-y-2">
            <p className="font-medium text-foreground text-xs">{t('chatbot.selectedInputs')}</p>
            <div className="space-y-1 text-xs">
              <p><span className="text-muted-foreground">{t('chatbot.lifeAreaLabel')}</span> {selectedArea}</p>
              {area && (
                <>
                  <p><span className="text-muted-foreground">{t('chatbot.currentDesiredLabel')}</span> {area.current_score.toFixed(1)} → {area.desired_score.toFixed(1)}</p>
                  <p><span className="text-muted-foreground">{t('chatbot.linkedGoalsLabel')}</span> {area.goalCount}</p>
                </>
              )}
            </div>
          </div>
        );
      }

      case 'goal-viability': {
        const { goalId } = inputs.goalViability;
        const goal = goals.find(g => g.id === goalId);

        return (
          <div className="space-y-2">
            <p className="font-medium text-foreground text-xs">{t('chatbot.selectedInputs')}</p>
            <div className="space-y-1 text-xs">
              <p><span className="text-muted-foreground">{t('chatbot.goalLabel')}</span> {goal?.title || t('common.unknown')}</p>
              <p><span className="text-muted-foreground">{t('chatbot.priorityLabel')}</span> {goal?.priority || t('common.notSet')}</p>
            </div>
          </div>
        );
      }

      case 'monthly-execution':
        return (
          <div className="space-y-2">
            <p className="font-medium text-foreground text-xs">{t('chatbot.selectedInputs')}</p>
            <div className="space-y-1 text-xs">
              <p><span className="text-muted-foreground">{t('chatbot.periodLabel')}</span> {t('chatbot.lastThirtyDays')}</p>
              <p><span className="text-muted-foreground">{t('chatbot.dataLabel')}</span> {t('chatbot.activitiesCheckIns')}</p>
            </div>
          </div>
        );

      case 'self-discovery-coherence': {
        const { scope } = inputs.selfDiscoveryCoherence;
        const scopeLabels: Record<string, string> = {
          overall: t('chatbot.scope.overall'),
          'life-wheel': t('chatbot.scope.lifeWheel'),
          values: t('chatbot.scope.values'),
          vision: t('chatbot.scope.vision'),
          'word-phrase': t('chatbot.scope.wordPhrase'),
        };

        return (
          <div className="space-y-2">
            <p className="font-medium text-foreground text-xs">{t('chatbot.selectedInputs')}</p>
            <div className="space-y-1 text-xs">
              <p><span className="text-muted-foreground">{t('chatbot.scopeLabel')}</span> {scopeLabels[scope] || scope}</p>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{t('chatbot.analysisContext')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {renderSelectedInputs()}
        <div className="pt-2 border-t space-y-1">
          <p className="font-medium text-foreground text-xs">{t('chatbot.expectedOutputs')}</p>
          <ul className="list-disc ml-4 space-y-0.5 text-muted-foreground text-xs">
            {module.expectedOutputs.map((output, idx) => (
              <li key={idx}>{output}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModuleSidebar;
