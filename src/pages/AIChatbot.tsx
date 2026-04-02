import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ANALYSIS_MODULES } from '@/lib/chatbotModules';
import { getLocalizedModuleContent } from '@/lib/chatbotModules';
import {
  ModuleCard,
  AnalysisConfigurator,
  AnalysisOutput,
  ChatInterface,
  ModuleSidebar,
  AIModeIntroduction,
  QuickAssistantPanel,
} from '@/components/chatbot';
import { useAIChatbotPage } from '@/hooks/useAIChatbotPage';
import { useTranslation } from '@/hooks/useTranslation';
import { trackAIModeEvent, type AIMode } from '@/lib/aiModeEvents';

const AIChatbot = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
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
  } = useAIChatbotPage();

  const mode = useMemo<AIMode>(() => {
    const requestedMode = searchParams.get('mode');
    return requestedMode === 'assistant_quick' ? 'assistant_quick' : 'analysis_modules';
  }, [searchParams]);

  useEffect(() => {
    trackAIModeEvent({ event: 'mode_opened', mode });
  }, [mode]);

  const handleModeChange = (nextMode: AIMode) => {
    setSearchParams({ mode: nextMode });
  };

  const handleQuickFirstMessage = () => {
    trackAIModeEvent({ event: 'first_message', mode: 'assistant_quick' });
  };

  if (!activeModule) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('chatbot.aiAnalysis')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'assistant_quick' ? t('chatbot.quickModeDescription') : t('chatbot.selectModuleDescription')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant={mode === 'assistant_quick' ? 'default' : 'outline'} onClick={() => handleModeChange('assistant_quick')}>
            {t('chatbot.modeAssistantQuick')}
          </Button>
          <Button variant={mode === 'analysis_modules' ? 'default' : 'outline'} onClick={() => handleModeChange('analysis_modules')}>
            {t('chatbot.modeAnalysisModules')}
          </Button>
        </div>

        <AIModeIntroduction t={t} />

        {mode === 'assistant_quick' ? (
          <QuickAssistantPanel onFirstMessage={handleQuickFirstMessage} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-tutorial-id="ai-modules-grid">
            {ANALYSIS_MODULES.map((module) => {
              const isDisabled = module.requiresSelfDiscovery && !selfDiscoveryComplete;
              return (
                <ModuleCard
                  key={module.id}
                  module={module}
                  onSelect={() => handleSelectModule(module.id)}
                  disabled={isDisabled}
                  disabledReason={isDisabled ? t('chatbot.completeSelfDiscoveryFirst') : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (mode !== 'analysis_modules') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBackToModules} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('chatbot.backToModes')}
          </Button>
        </div>
        <QuickAssistantPanel onFirstMessage={handleQuickFirstMessage} />
      </div>
    );
  }

  const currentModule = ANALYSIS_MODULES.find((module) => module.id === activeModule);
  const localizedModuleTitle = currentModule ? getLocalizedModuleContent(currentModule.id, t).title : t('chatbot.analysisResult');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBackToModules} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('chatbot.backToModules')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <div data-tutorial-id="ai-module-sidebar"><ModuleSidebar
            moduleId={activeModule}
            inputs={inputs}
            hasStarted={hasInitialOutput}
            lifeAreas={lifeAreasWithStats}
            goals={goals.map((goal) => ({ id: goal.id, title: goal.title, priority: goal.priority }))}
          />
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {!hasInitialOutput && (
            <div data-tutorial-id="ai-analysis-configurator"><AnalysisConfigurator
              moduleId={activeModule}
              inputs={inputs}
              onInputChange={handleInputChange}
              onStart={async () => {
                const completed = await handleStartAnalysis();
                if (completed) markAnalysisCompleted();
              }}
              isLoading={isLoading}
              lifeAreas={lifeAreasWithStats}
              goals={goals.map((goal) => ({ id: goal.id, title: goal.title, priority: goal.priority }))}
              canStart={canStart}
            />
            </div>
          )}

          {initialOutput && (
            <div data-tutorial-id="ai-analysis-output"><AnalysisOutput
              content={initialOutput}
              title={localizedModuleTitle}
              onRestart={handleRestartAnalysis}
            />
            </div>
          )}

          {hasInitialOutput && (
            <div data-tutorial-id="ai-chat-interface"><ChatInterface messages={messages} isLoading={isLoading} onSendMessage={(message) => {
              markFirstAnalysisMessage();
              void sendMessage(message);
            }} /></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
