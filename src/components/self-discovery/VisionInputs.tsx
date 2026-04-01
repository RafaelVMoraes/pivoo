import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useYear } from '@/contexts/YearContext';

interface VisionData {
  vision_1y?: string;
  vision_3y?: string;
  vision_5y?: string;
}

interface VisionInputsProps {
  visionData: VisionData;
  onUpdate: (updates: Partial<VisionData>) => void;
  saving: boolean;
}

export const VisionInputs = ({ visionData, onUpdate, saving }: VisionInputsProps) => {
  const { t } = useTranslation();
  const { selectedYear } = useYear();
  const [expanded, setExpanded] = useState<{vision1y: boolean, vision3y: boolean, vision5y: boolean}>({
    vision1y: true,
    vision3y: true,
    vision5y: true
  });
  const [localData, setLocalData] = useState<VisionData>(visionData);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalData(visionData);
    setHasChanges(false);
  }, [visionData]);

  const handleExpand = (type: 'vision1y' | 'vision3y' | 'vision5y') => {
    setExpanded(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleChange = (field: keyof VisionData, value: string) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(localData);
    setHasChanges(false);
  };

  const targetYear1 = selectedYear + 1;
  const targetYear3 = selectedYear + 3;
  const targetYear5 = selectedYear + 5;

  return (
    <Card className="gradient-card shadow-soft">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{t('selfDiscovery.futureVision')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('selfDiscovery.visionDescription')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 1 Year Vision */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => handleExpand('vision1y')}
            className="w-full justify-between p-0 h-auto font-medium text-base hover:bg-transparent"
          >
            <Label htmlFor="vision-1y" className="cursor-pointer">
              {t('selfDiscovery.vision1Year')} ({targetYear1})
            </Label>
            {expanded.vision1y ? (
              <ChevronUp size={18} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={18} className="text-muted-foreground" />
            )}
          </Button>
          
          {expanded.vision1y && (
            <div className="animate-fade-in">
              <Textarea
                id="vision-1y"
                placeholder={t('selfDiscovery.vision1YearPlaceholder')}
                value={localData.vision_1y || ''}
                onChange={(e) => handleChange('vision_1y', e.target.value)}
                disabled={saving}
                className="min-h-[100px] resize-none"
              />
            </div>
          )}
        </div>

        {/* 3 Year Vision */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => handleExpand('vision3y')}
            className="w-full justify-between p-0 h-auto font-medium text-base hover:bg-transparent"
          >
            <Label htmlFor="vision-3y" className="cursor-pointer">
              {t('selfDiscovery.vision3Years')} ({targetYear3})
            </Label>
            {expanded.vision3y ? (
              <ChevronUp size={18} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={18} className="text-muted-foreground" />
            )}
          </Button>
          
          {expanded.vision3y && (
            <div className="animate-fade-in">
              <Textarea
                id="vision-3y"
                placeholder={t('selfDiscovery.vision3YearPlaceholder')}
                value={localData.vision_3y || ''}
                onChange={(e) => handleChange('vision_3y', e.target.value)}
                disabled={saving}
                className="min-h-[100px] resize-none"
              />
            </div>
          )}
        </div>

        {/* 5 Year Vision */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => handleExpand('vision5y')}
            className="w-full justify-between p-0 h-auto font-medium text-base hover:bg-transparent"
          >
            <Label htmlFor="vision-5y" className="cursor-pointer">
              {t('selfDiscovery.vision5Years')} ({targetYear5})
            </Label>
            {expanded.vision5y ? (
              <ChevronUp size={18} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={18} className="text-muted-foreground" />
            )}
          </Button>
          
          {expanded.vision5y && (
            <div className="animate-fade-in">
              <Textarea
                id="vision-5y"
                placeholder={t('selfDiscovery.vision5YearPlaceholder')}
                value={localData.vision_5y || ''}
                onChange={(e) => handleChange('vision_5y', e.target.value)}
                disabled={saving}
                className="min-h-[100px] resize-none"
              />
            </div>
          )}
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="pt-4">
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
  );
};
