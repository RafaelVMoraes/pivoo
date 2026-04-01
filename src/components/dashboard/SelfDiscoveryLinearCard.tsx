/**
 * Self-Discovery Linear Card
 * Shows Word/Phrase of year, Life Wheel avg, and Focus Areas in a linear layout
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, BookHeart, Compass, Sparkles, Target } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

// Category mapping with CSS variables (from LifeWheelChart)
const CATEGORY_MAP: Record<string, {
  name: string;
  colorVar: string;
}> = {
  'Hobbies': {
    name: 'Life Quality',
    colorVar: '--category-life-quality'
  },
  'Fulfillment': {
    name: 'Life Quality',
    colorVar: '--category-life-quality'
  },
  'Spirituality': {
    name: 'Life Quality',
    colorVar: '--category-life-quality'
  },
  'Health': {
    name: 'Personal',
    colorVar: '--category-personal'
  },
  'Intellectual': {
    name: 'Personal',
    colorVar: '--category-personal'
  },
  'Emotional': {
    name: 'Personal',
    colorVar: '--category-personal'
  },
  'Engagement': {
    name: 'Professional',
    colorVar: '--category-professional'
  },
  'Finances': {
    name: 'Professional',
    colorVar: '--category-professional'
  },
  'Impact': {
    name: 'Professional',
    colorVar: '--category-professional'
  },
  'Family': {
    name: 'Relationships',
    colorVar: '--category-relationships'
  },
  'Partner': {
    name: 'Relationships',
    colorVar: '--category-relationships'
  },
  'Colleagues': {
    name: 'Relationships',
    colorVar: '--category-relationships'
  }
};

// Value category colors (from SelfDiscoverySummary)
const VALUE_CATEGORY_COLORS: Record<string, { bg: string, text: string }> = {
  'Identity & Integrity': { bg: 'bg-purple-500/20 dark:bg-purple-500/30', text: 'text-purple-900 dark:text-purple-100' },
  'Growth & Mastery': { bg: 'bg-blue-500/20 dark:bg-blue-500/30', text: 'text-blue-900 dark:text-blue-100' },
  'Connection & Community': { bg: 'bg-pink-500/20 dark:bg-pink-500/30', text: 'text-pink-900 dark:text-pink-100' },
  'Well-being & Balance': { bg: 'bg-green-500/20 dark:bg-green-500/30', text: 'text-green-900 dark:text-green-100' },
  'Purpose & Impact': { bg: 'bg-orange-500/20 dark:bg-orange-500/30', text: 'text-orange-900 dark:text-orange-100' }
};

const PREDEFINED_VALUES = {
  'Identity & Integrity': ['Authenticity', 'Responsibility', 'Honesty', 'Discipline', 'Courage', 'Reliability'],
  'Growth & Mastery': ['Learning', 'Curiosity', 'Excellence', 'Innovation', 'Resilience', 'Ambition'],
  'Connection & Community': ['Empathy', 'Belonging', 'Collaboration', 'Diversity', 'Family', 'Generosity'],
  'Well-being & Balance': ['Health', 'Stability', 'Mindfulness', 'Joy', 'Simplicity', 'Peace'],
  'Purpose & Impact': ['Freedom', 'Contribution', 'Creativity', 'Sustainability', 'Leadership', 'Vision']
};

const getCategoryForValue = (valueName: string): string => {
  for (const [category, values] of Object.entries(PREDEFINED_VALUES)) {
    if (values.includes(valueName)) return category;
  }
  return 'Identity & Integrity'; // fallback for custom values
};

// Get computed color from CSS variable
const getCategoryColor = (areaName: string): string => {
  const colorVar = CATEGORY_MAP[areaName]?.colorVar || '--primary';
  return `hsl(var(${colorVar}))`;
};

interface SelfDiscoveryData {
  wordOfYear: string | null;
  phraseOfYear: string | null;
  lifeWheelCurrentAvg: number;
  lifeWheelDesiredAvg: number;
  focusAreas: string[];
  selectedValues: string[];
  hasData: boolean;
}

interface SelfDiscoveryLinearCardProps {
  data: SelfDiscoveryData;
  isLoading: boolean;
  isGuest: boolean;
}

export const SelfDiscoveryLinearCard = ({ data, isLoading, isGuest }: SelfDiscoveryLinearCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show CTA if guest or no data
  if (isGuest || !data.hasData) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-6">
          <div className="flex flex-col items-center text-center gap-3">
            <Compass className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('dashboard.discoverYourself')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('dashboard.selfDiscoveryPrompt')}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/self-discovery')}
            >
              {t('dashboard.startDiscovery')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-card border-border overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold text-foreground">
                  {t('dashboard.selfDiscovery')}
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                    {data.wordOfYear && (
                      <p className="text-sm text-muted-foreground bold">{data.wordOfYear}</p>
                    )}
                </span>
              </div>
              <ChevronDown 
                className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Word & Phrase of Year */}
              <div className="flex-1 bg-accent/30 rounded-lg p-4 space-y-2 flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t('dashboard.yearFocus')}
                  </span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  {data.wordOfYear || data.phraseOfYear ? (
                    <div>
                      {data.wordOfYear && (
                        <p className="text-lg font-bold text-foreground">{data.wordOfYear}</p>
                      )}
                      {data.phraseOfYear && (
                        <p className="text-sm text-muted-foreground italic">"{data.phraseOfYear}"</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('dashboard.notSet')}</p>
                  )}
                </div>
              </div>

              {/* Focus Areas & Values */}
              <div className="flex-1 bg-accent/30 rounded-lg p-4 flex flex-col justify-between min-h-[120px]">
                {/* Focus Areas */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t('dashboard.focusAreas')}
                    </span>
                  </div>
                  {data.focusAreas.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {data.focusAreas.map((area) => {
                        const categoryColor = getCategoryColor(area);
                        return (
                          <Badge
                            key={area}
                            className="text-xs px-2 py-1 rounded-full border"
                            style={{
                              backgroundColor: `${categoryColor}20`,
                              color: categoryColor,
                              borderColor: `${categoryColor}40`
                            }}
                          >
                            {area}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('dashboard.noFocusAreas')}</p>
                  )}
                </div>

                {/* Selected Values */}
                {data.selectedValues.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookHeart className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {t('selfDiscovery.coreValues')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {data.selectedValues.map((valueName) => {
                        const category = getCategoryForValue(valueName);
                        const colors = VALUE_CATEGORY_COLORS[category];
                        const isPredefined = Object.values(PREDEFINED_VALUES).flat().includes(valueName);
                        return (
                          <Badge
                            key={valueName}
                            className={`text-xs px-2 py-1 rounded-full border ${colors.bg} ${colors.text} border-current/30`}
                            title={isPredefined ? t(`selfDiscovery.values.${valueName}`) : valueName}
                          >
                            {isPredefined ? t(`selfDiscovery.values.${valueName}`) : valueName}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
