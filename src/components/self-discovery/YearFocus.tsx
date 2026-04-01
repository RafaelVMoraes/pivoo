import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Quote, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useYear } from '@/contexts/YearContext';
import { Badge } from '@/components/ui/badge';

interface VisionData {
  word_year?: string;
  phrase_year?: string;
}

interface YearFocusProps {
  visionData: VisionData;
  onUpdate: (updates: Partial<VisionData>) => void;
  saving: boolean;
  selectedValues?: { value_name: string; selected: boolean }[];
}

export const YearFocus = ({ visionData, onUpdate, saving, selectedValues = [] }: YearFocusProps) => {
  const { t } = useTranslation();
  const { selectedYear } = useYear();
  const [localData, setLocalData] = useState<VisionData>(visionData);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalData(visionData);
    setHasChanges(false);
  }, [visionData]);

  const handleChange = (field: keyof VisionData, value: string) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(localData);
    setHasChanges(false);
  };

  const coreValues = selectedValues.filter(v => v.selected);

  return (
    <div className="space-y-4">
      <Card className="gradient-card shadow-soft border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Quote size={20} className="text-primary" />
            {t('selfDiscovery.yearFocus')} — {selectedYear}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('selfDiscovery.guidingTheme')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Word of the Year */}
          <div className="space-y-1.5">
            <Label htmlFor="word-year" className="text-sm font-medium">
              {t('selfDiscovery.wordOfYear')}
            </Label>
            <Input
              id="word-year"
              placeholder={t('selfDiscovery.wordPlaceholder')}
              value={localData.word_year || ''}
              onChange={(e) => handleChange('word_year', e.target.value)}
              disabled={saving}
              className="text-center text-lg font-medium bg-background/50"
            />
          </div>

          {/* Phrase of the Year */}
          <div className="space-y-1.5">
            <Label htmlFor="phrase-year" className="text-sm font-medium">
              {t('selfDiscovery.phraseOfYear')}
            </Label>
            <Input
              id="phrase-year"
              placeholder={t('selfDiscovery.phrasePlaceholder')}
              value={localData.phrase_year || ''}
              onChange={(e) => handleChange('phrase_year', e.target.value)}
              disabled={saving}
              className="text-center text-lg font-medium bg-background/50"
            />
          </div>

          {/* Display Quote Style */}
          {(localData.word_year || localData.phrase_year) && (
            <div className="p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
              <div className="text-center space-y-1">
                {localData.word_year && (
                  <div className="text-2xl font-bold text-primary">
                    {localData.word_year}
                  </div>
                )}
                {localData.phrase_year && (
                  <div className="text-base font-medium text-muted-foreground italic">
                    "{localData.phrase_year}"
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save Button */}
          {hasChanges && (
            <div className="pt-2">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full"
              >
                <Save size={16} className="mr-2" />
                {saving ? t('profile.saving') : t('profile.save')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Core Values Display */}
      {coreValues.length > 0 && (
        <Card className="gradient-card shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('selfDiscovery.coreValues')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1.5">
              {coreValues.map(v => (
                <Badge key={v.value_name} variant="secondary" className="text-xs">
                  {v.value_name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
