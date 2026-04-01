import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Plus } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';

interface ValuesData {
  value_name: string;
  selected: boolean;
}

interface ValuesSelectionProps {
  valuesData: ValuesData[];
  selectedCount: number;
  onUpdate: (valueName: string, selected: boolean) => void;
  categories: Record<string, string[]>;
  saving: boolean;
}

export const ValuesSelection = ({
  valuesData,
  selectedCount,
  onUpdate,
  categories,
  saving,
}: ValuesSelectionProps) => {
  const { t } = useTranslation();
  const [customValue, setCustomValue] = useState('');

  const selectedValues = valuesData.filter(v => v.selected);
  const unselectedValues = valuesData.filter(v => !v.selected);

  // Get list of all predefined values
  const predefinedValues = Object.values(categories).flat();
  const customValues = valuesData.filter(v => !predefinedValues.includes(v.value_name));

  const handleAddCustomValue = () => {
    if (customValue.trim() && !valuesData.find(v => v.value_name === customValue.trim())) {
      onUpdate(customValue.trim(), true);
      setCustomValue('');
    }
  };

  // Colors per category
  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    'Identity & Integrity': { bg: 'bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
    'Growth & Mastery': { bg: 'bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
    'Connection & Community': { bg: 'bg-pink-500/20', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/30' },
    'Well-being & Balance': { bg: 'bg-green-500/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/30' },
    'Purpose & Impact': { bg: 'bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
  };

  // Category translation keys
  const categoryTranslationKeys: Record<string, string> = {
    'Identity & Integrity': 'selfDiscovery.categories.identityIntegrity',
    'Growth & Mastery': 'selfDiscovery.categories.growthMastery',
    'Connection & Community': 'selfDiscovery.categories.connectionCommunity',
    'Well-being & Balance': 'selfDiscovery.categories.wellBeingBalance',
    'Purpose & Impact': 'selfDiscovery.categories.purposeImpact',
  };

  const getCategoryForValue = (valueName: string): string => {
    for (const [category, values] of Object.entries(categories)) {
      if (values.includes(valueName)) return category;
    }
    return 'Identity & Integrity'; // fallback
  };

  const handleValueClick = (valueName: string, currentSelected: boolean) => {
    onUpdate(valueName, !currentSelected);
  };

  return (
    <Card className="gradient-card shadow-soft">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{t('selfDiscovery.coreValues')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('selfDiscovery.selectValues')}</p>
        <div className="text-sm font-medium text-primary">
          {t('selfDiscovery.selectedCount').replace('{count}', selectedCount.toString())}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selected Values */}
        {selectedValues.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-base flex items-center gap-2">
              <Check size={16} className="text-primary" />
              {t('selfDiscovery.selectedValues')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedValues.map(value => {
                const category = getCategoryForValue(value.value_name);
                const colors = categoryColors[category];
                return (
                  <Button
                    key={value.value_name}
                    variant="outline"
                    size="sm"
                    onClick={() => handleValueClick(value.value_name, value.selected)}
                    disabled={saving}
                    className={`animate-scale-in hover:animate-none ${colors.bg} ${colors.text} ${colors.border} border-2 font-medium`}
                  >
                    {predefinedValues.includes(value.value_name)
                      ? t(`selfDiscovery.values.${value.value_name}`)
                      : value.value_name}
                    <Check size={14} className="ml-1" />
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Values by Category */}
        <div className="space-y-4">
          <h4 className="font-medium text-base">{t('selfDiscovery.chooseFromValues')}</h4>
          {Object.entries(categories).map(([category, categoryValues]) => {
            const colors = categoryColors[category];
            return (
              <div key={category} className="space-y-2">
                <h5 className={`text-sm font-semibold ${colors.text}`}>
                  {t(categoryTranslationKeys[category] ?? category)}
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categoryValues.map(valueName => {
                    const valueData = unselectedValues.find(v => v.value_name === valueName);
                    if (!valueData) return null;
                    return (
                      <Button
                        key={valueName}
                        variant="outline"
                        size="sm"
                        onClick={() => handleValueClick(valueName, valueData.selected)}
                        disabled={saving || (selectedCount >= 7 && !valueData.selected)}
                        className={`justify-start text-left h-auto py-2 px-3 ${colors.border} border hover:${colors.bg} transition-all`}
                      >
                        {t(`selfDiscovery.values.${valueName}`)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Values Section */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-medium text-base">{t('selfDiscovery.addCustomValue')}</h4>
          <div className="flex gap-2">
            <Input
              placeholder={t('selfDiscovery.enterCustomValue')}
              value={customValue}
              onChange={e => setCustomValue(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddCustomValue()}
              disabled={saving || selectedCount >= 7}
            />
            <Button
              onClick={handleAddCustomValue}
              disabled={!customValue.trim() || saving || selectedCount >= 7}
              size="icon"
            >
              <Plus size={16} />
            </Button>
          </div>
          {customValues.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t('selfDiscovery.yourCustomValues')}</p>
              <div className="flex flex-wrap gap-2">
                {customValues.map(value => (
                  <Badge
                    key={value.value_name}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleValueClick(value.value_name, value.selected)}
                  >
                    {value.value_name}
                    {value.selected && <Check size={12} className="ml-1" />}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
