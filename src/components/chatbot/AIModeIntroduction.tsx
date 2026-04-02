import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ModuleId } from './types';

const MODULE_EXAMPLES: Array<{ id: ModuleId; key: string }> = [
  { id: 'capacity-load', key: 'capacityLoad' },
  { id: 'life-areas-coherence', key: 'lifeAreasCoherence' },
  { id: 'goal-viability', key: 'goalViability' },
  { id: 'monthly-execution', key: 'monthlyExecution' },
  { id: 'self-discovery-coherence', key: 'selfDiscoveryCoherence' },
];

interface AIModeIntroductionProps {
  t: (key: string) => string;
}

export const AIModeIntroduction: React.FC<AIModeIntroductionProps> = ({ t }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base">{t('chatbot.intro.title')}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('chatbot.intro.description')}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {MODULE_EXAMPLES.map((module) => (
          <div key={module.id} className="rounded-md border p-3 space-y-1">
            <p className="text-sm font-medium">{t(`chatbot.modules.${module.id}.title`)}</p>
            <p className="text-xs text-muted-foreground">{t(`chatbot.intro.examples.${module.key}`)}</p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default AIModeIntroduction;
