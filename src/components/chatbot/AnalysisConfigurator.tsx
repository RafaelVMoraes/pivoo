import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Play } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ModuleId, AnalysisInputs, CapacityScope, SelfDiscoveryScope, LifeAreaWithStats } from './types';

interface Goal {
  id: string;
  title: string;
  priority: string;
}


interface AnalysisConfiguratorProps {
  moduleId: ModuleId;
  inputs: AnalysisInputs;
  onInputChange: <K extends keyof AnalysisInputs>(key: K, value: Partial<AnalysisInputs[K]>) => void;
  onStart: () => void;
  isLoading: boolean;
  lifeAreas: LifeAreaWithStats[];
  goals: Goal[];
  canStart: boolean;
}

export const AnalysisConfigurator: React.FC<AnalysisConfiguratorProps> = ({
  moduleId,
  inputs,
  onInputChange,
  onStart,
  isLoading,
  lifeAreas,
  goals,
  canStart,
}) => {
  const { t } = useTranslation();

  const renderCapacityInputs = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="scope">{t('chatbot.analysisScope')}</Label>
        <Select
          value={inputs.capacityLoad.scope}
          onValueChange={(v) => onInputChange('capacityLoad', { scope: v as CapacityScope })}
        >
          <SelectTrigger id="scope">
            <SelectValue placeholder={t('chatbot.selectScope')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">{t('chatbot.weeklyCapacity')}</SelectItem>
            <SelectItem value="monthly">{t('chatbot.monthlyCapacity')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="workHours">{t('chatbot.workHoursPerWeek')}</Label>
          <Input
            id="workHours"
            type="number"
            min="0"
            max="80"
            value={inputs.capacityLoad.workHoursPerWeek}
            onChange={(e) => onInputChange('capacityLoad', { workHoursPerWeek: e.target.value })}
            placeholder="40"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sleepHours">{t('chatbot.sleepHoursPerDay')}</Label>
          <Input
            id="sleepHours"
            type="number"
            min="4"
            max="12"
            value={inputs.capacityLoad.sleepHoursPerDay}
            onChange={(e) => onInputChange('capacityLoad', { sleepHoursPerDay: e.target.value })}
            placeholder="8"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {t('chatbot.discretionaryHoursFormula')}
      </p>
    </div>
  );

  const renderLifeAreasInputs = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="lifeArea">{t('chatbot.selectLifeArea')}</Label>
        <Select
          value={inputs.lifeAreasCoherence.selectedArea}
          onValueChange={(v) => onInputChange('lifeAreasCoherence', { selectedArea: v })}
        >
          <SelectTrigger id="lifeArea">
            <SelectValue placeholder={t('chatbot.chooseLifeArea')} />
          </SelectTrigger>
          <SelectContent>
            {lifeAreas.map((area) => (
              <SelectItem key={area.area_name} value={area.area_name}>
                <div className="flex items-center justify-between w-full gap-3">
                  <span>{area.area_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {area.current_score.toFixed(1)} → {area.desired_score.toFixed(1)} · {area.goalCount} {area.goalCount === 1 ? t('chatbot.goalSingular') : t('chatbot.goalPlural')}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {lifeAreas.length === 0 && (
        <p className="text-xs text-muted-foreground">
          {t('chatbot.noLifeAreasDefined')}
        </p>
      )}
    </div>
  );

  const renderGoalViabilityInputs = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="goal">{t('chatbot.selectGoalToReview')}</Label>
        <Select
          value={inputs.goalViability.goalId}
          onValueChange={(v) => onInputChange('goalViability', { goalId: v })}
        >
          <SelectTrigger id="goal">
            <SelectValue placeholder={t('chatbot.chooseGoal')} />
          </SelectTrigger>
          <SelectContent>
            {goals.map((goal) => (
              <SelectItem key={goal.id} value={goal.id}>
                {goal.title} ({goal.priority})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {goals.length === 0 && (
        <p className="text-xs text-muted-foreground">
          {t('chatbot.noGoalsDefined')}
        </p>
      )}
    </div>
  );

  const renderMonthlyExecutionInputs = () => (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {t('chatbot.monthlyExecutionAuto')}
      </p>
      <p className="text-xs text-muted-foreground">
        {t('chatbot.monthlyExecutionData')}
      </p>
    </div>
  );

  const renderSelfDiscoveryInputs = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sdScope">{t('chatbot.analysisScope')}</Label>
        <Select
          value={inputs.selfDiscoveryCoherence.scope}
          onValueChange={(v) => onInputChange('selfDiscoveryCoherence', { scope: v as SelfDiscoveryScope })}
        >
          <SelectTrigger id="sdScope">
            <SelectValue placeholder={t('chatbot.selectScope')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overall">{t('chatbot.scope.overall')}</SelectItem>
            <SelectItem value="life-wheel">{t('chatbot.scope.lifeWheel')}</SelectItem>
            <SelectItem value="values">{t('chatbot.scope.values')}</SelectItem>
            <SelectItem value="vision">{t('chatbot.scope.vision')}</SelectItem>
            <SelectItem value="word-phrase">{t('chatbot.scope.wordPhrase')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderInputs = () => {
    switch (moduleId) {
      case 'capacity-load':
        return renderCapacityInputs();
      case 'life-areas-coherence':
        return renderLifeAreasInputs();
      case 'goal-viability':
        return renderGoalViabilityInputs();
      case 'monthly-execution':
        return renderMonthlyExecutionInputs();
      case 'self-discovery-coherence':
        return renderSelfDiscoveryInputs();
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{t('chatbot.configureAnalysis')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 border rounded-md p-3" data-tutorial-id="ai-analysis-config-panel">
          <p className="text-xs font-medium text-foreground">{t('chatbot.analysisConfigurationTitle')}</p>
          <div className="space-y-2">
            <Label htmlFor="depth">{t('chatbot.depthOfThinking')}</Label>
            <Select
              value={inputs.analysisConfiguration.depth}
              onValueChange={(v) => onInputChange('analysisConfiguration', { depth: v as AnalysisInputs['analysisConfiguration']['depth'] })}
            >
              <SelectTrigger id="depth">
                <SelectValue placeholder={t('chatbot.selectDepth')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick-insight">{t('chatbot.depth.quickInsight')}</SelectItem>
                <SelectItem value="structured-analysis">{t('chatbot.depth.structuredAnalysis')}</SelectItem>
                <SelectItem value="deep-dive">{t('chatbot.depth.deepDive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tone">{t('chatbot.toneOfFeedback')}</Label>
            <Select
              value={inputs.analysisConfiguration.tone}
              onValueChange={(v) => onInputChange('analysisConfiguration', { tone: v as AnalysisInputs['analysisConfiguration']['tone'] })}
            >
              <SelectTrigger id="tone">
                <SelectValue placeholder={t('chatbot.selectTone')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supportive">{t('chatbot.tone.supportive')}</SelectItem>
                <SelectItem value="neutral">{t('chatbot.tone.neutral')}</SelectItem>
                <SelectItem value="direct-challenging">{t('chatbot.tone.directChallenging')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="thinkingMode">{t('chatbot.thinkingMode')}</Label>
            <Select
              value={inputs.analysisConfiguration.thinkingMode}
              onValueChange={(v) => onInputChange('analysisConfiguration', { thinkingMode: v as AnalysisInputs['analysisConfiguration']['thinkingMode'] })}
            >
              <SelectTrigger id="thinkingMode">
                <SelectValue placeholder={t('chatbot.selectThinkingMode')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="practical">{t('chatbot.mode.practical')}</SelectItem>
                <SelectItem value="strategic">{t('chatbot.mode.strategic')}</SelectItem>
                <SelectItem value="creative">{t('chatbot.mode.creative')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {renderInputs()}
        <Button 
          onClick={onStart} 
          disabled={isLoading || !canStart}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('chatbot.analyzing')}
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {t('chatbot.startAnalysis')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AnalysisConfigurator;
