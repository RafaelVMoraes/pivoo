import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Star } from 'lucide-react';
import { LifeWheelChart } from './LifeWheelChart';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

interface LifeWheelData {
  area_name: string;
  current_score: number;
  desired_score: number;
  is_focus_area?: boolean;
}

interface ValuesData {
  value_name: string;
  selected: boolean;
}

interface VisionData {
  vision_1y?: string;
  vision_3y?: string;
  vision_5y?: string;
  word_year?: string;
  phrase_year?: string;
}

interface SelfDiscoverySummaryProps {
  lifeWheelData: LifeWheelData[];
  valuesData: ValuesData[];
  visionData: VisionData;
  onEdit: () => void;
}

// Category colors with proper contrast - matching CSS variables
const CATEGORY_MAP: Record<string, { category: string; colorVar: string }> = {
  'Hobbies': { category: 'Life Quality', colorVar: '--category-life-quality' },
  'Fulfillment': { category: 'Life Quality', colorVar: '--category-life-quality' },
  'Spirituality': { category: 'Life Quality', colorVar: '--category-life-quality' },
  'Health': { category: 'Personal', colorVar: '--category-personal' },
  'Intellectual': { category: 'Personal', colorVar: '--category-personal' },
  'Emotional': { category: 'Personal', colorVar: '--category-personal' },
  'Engagement': { category: 'Professional', colorVar: '--category-professional' },
  'Finances': { category: 'Professional', colorVar: '--category-professional' },
  'Impact': { category: 'Professional', colorVar: '--category-professional' },
  'Colleagues': { category: 'Relationships', colorVar: '--category-relationships' },
  'Partner': { category: 'Relationships', colorVar: '--category-relationships' },
  'Family': { category: 'Relationships', colorVar: '--category-relationships' },
};

// Value category colors
const VALUE_CATEGORY_COLORS: Record<string, { bg: string, text: string }> = {
  'Identity & Integrity': { bg: 'bg-purple-500/20 dark:bg-purple-500/30', text: 'text-purple-900 dark:text-purple-100' },
  'Growth & Mastery': { bg: 'bg-blue-500/20 dark:bg-blue-500/30', text: 'text-blue-900 dark:text-blue-100' },
  'Connection & Community': { bg: 'bg-pink-500/20 dark:bg-pink-500/30', text: 'text-pink-900 dark:text-pink-100' },
  'Well-being & Balance': { bg: 'bg-green-500/20 dark:bg-green-500/30', text: 'text-green-900 dark:text-green-100' },
  'Purpose & Impact': { bg: 'bg-orange-500/20 dark:bg-orange-500/30', text: 'text-orange-900 dark:text-orange-100' }
};

const CATEGORY_TRANSLATION_KEY: Record<string, string> = {
  'Identity & Integrity': 'selfDiscovery.categories.identityIntegrity',
  'Growth & Mastery': 'selfDiscovery.categories.growthMastery',
  'Connection & Community': 'selfDiscovery.categories.connectionCommunity',
  'Well-being & Balance': 'selfDiscovery.categories.wellBeingBalance',
  'Purpose & Impact': 'selfDiscovery.categories.purposeImpact',
};

const PREDEFINED_VALUES = {
  'Identity & Integrity': ['Authenticity', 'Responsibility', 'Honesty', 'Discipline', 'Courage', 'Reliability'],
  'Growth & Mastery': ['Learning', 'Curiosity', 'Excellence', 'Innovation', 'Resilience', 'Ambition'],
  'Connection & Community': ['Empathy', 'Belonging', 'Collaboration', 'Diversity', 'Family', 'Generosity'],
  'Well-being & Balance': ['Health', 'Stability', 'Mindfulness', 'Joy', 'Simplicity', 'Peace'],
  'Purpose & Impact': ['Freedom', 'Contribution', 'Creativity', 'Sustainability', 'Leadership', 'Vision']
};

export const SelfDiscoverySummary = ({ 
  lifeWheelData, 
  valuesData, 
  visionData, 
  onEdit 
}: SelfDiscoverySummaryProps) => {
  const { t } = useTranslation();
  const selectedValues = valuesData.filter(v => v.selected);

  const getCategoryForValue = (valueName: string): string => {
    for (const [category, values] of Object.entries(PREDEFINED_VALUES)) {
      if (values.includes(valueName)) return category;
    }
    return 'Identity & Integrity'; // fallback for custom values
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Edit Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('selfDiscovery.summary.title')}</h1>
          <p className="text-muted-foreground">{t('selfDiscovery.summary.subtitle')}</p>
        </div>
        <Button onClick={onEdit} className="gap-2">
          <Edit size={16} />
          {t('common.edit')}
        </Button>
      </div>

      {/* Top Container: Two-Column Layout */}
      {(visionData.word_year || visionData.phrase_year || visionData.vision_1y || visionData.vision_3y || visionData.vision_5y) && (
        <Card className="gradient-card shadow-soft">
          <CardContent className="pt-5">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Left Column: Word and Phrase */}
              <div className="space-y-4">
                {visionData.word_year && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t('selfDiscovery.wordOfYear')}</p>
                    <p className="text-3xl font-bold text-primary">{visionData.word_year}</p>
                  </div>
                )}
                {visionData.phrase_year && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t('selfDiscovery.phraseOfYear')}</p>
                    <p className="text-xl font-medium italic">{visionData.phrase_year}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Vision Statements */}
              <div className="space-y-4">
                {visionData.vision_1y && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-primary">{t('selfDiscovery.vision1y')}</h3>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{visionData.vision_1y}</p>
                  </div>
                )}
                {visionData.vision_3y && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-accent">{t('selfDiscovery.vision3y')}</h3>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{visionData.vision_3y}</p>
                  </div>
                )}
                {visionData.vision_5y && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-secondary">{t('selfDiscovery.vision5y')}</h3>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{visionData.vision_5y}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Values */}
      {selectedValues.length > 0 && (
        <Card className="gradient-card shadow-soft">
          <CardHeader>
            <CardTitle>{t('selfDiscovery.coreValues')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {selectedValues.map((value) => {
                const category = getCategoryForValue(value.value_name);
                const colors = VALUE_CATEGORY_COLORS[category] || VALUE_CATEGORY_COLORS['Identity & Integrity'];
                const isPredefined = Object.values(PREDEFINED_VALUES)
                  .flat()
                  .includes(value.value_name);

                return (
                  <Badge
                    key={value.value_name}
                    className={`text-xs px-2.5 py-1 border ${colors.bg} ${colors.text} border-current/30`}
                  >
                    {isPredefined ? t(`selfDiscovery.values.${value.value_name}`) : value.value_name}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Life Wheel Chart - Focus Areas are displayed beside it via the chart component */}
      <LifeWheelChart data={lifeWheelData} showFocusAreas={true} />
    </div>
  );
};
