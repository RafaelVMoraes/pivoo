import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ANALYSIS_MODULES } from '@/lib/chatbotModules';
import { getLocalizedModuleContent } from '@/lib/chatbotModules';
import {
  ModuleCard,
  AnalysisConfigurator,
  AnalysisOutput,
  ChatInterface,
  ModuleSidebar,
} from '@/components/chatbot';
import { useAIChatbotPage } from '@/hooks/useAIChatbotPage';
import { useTranslation } from '@/hooks/useTranslation';

const AIChatbot = () => {
  const { t } = useTranslation();
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

  if (!activeModule) {
    return (
      <div className="space-y-4">
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
