import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ReflectionLayerProps {
  onSave: (reflection: { surface: string; deeper: string; identity: string }) => void;
  initialValues?: { surface: string; deeper: string; identity: string };
}

export const ReflectionLayer = ({ onSave, initialValues }: ReflectionLayerProps) => {
  const { t } = useTranslation();

  const [surface, setSurface] = useState(initialValues?.surface || '');
  const [deeper, setDeeper] = useState(initialValues?.deeper || '');
  const [identity, setIdentity] = useState(initialValues?.identity || '');

  const handleSave = () => {
    onSave({ surface, deeper, identity });
  };

  return (
    <Card className="p-6 space-y-6 bg-accent/20">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={24} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          {t('reflection.title')}
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="surface" className="text-sm font-medium mb-2 block">
            {t('reflection.surface.label')}
          </Label>
          <Textarea
            id="surface"
            value={surface}
            onChange={(e) => setSurface(e.target.value)}
            placeholder={t('reflection.surface.placeholder')}
            className="min-h-[80px]"
          />
        </div>

        <div>
          <Label htmlFor="deeper" className="text-sm font-medium mb-2 block">
            {t('reflection.deeper.label')}
          </Label>
          <Textarea
            id="deeper"
            value={deeper}
            onChange={(e) => setDeeper(e.target.value)}
            placeholder={t('reflection.deeper.placeholder')}
            className="min-h-[80px]"
          />
        </div>

        <div>
          <Label htmlFor="identity" className="text-sm font-medium mb-2 block">
            {t('reflection.identity.label')}
          </Label>
          <Textarea
            id="identity"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            placeholder={t('reflection.identity.placeholder')}
            className="min-h-[80px]"
          />
        </div>
      </div>

      <Button onClick={handleSave} className="w-full">
        {t('reflection.saveButton')}
      </Button>
    </Card>
  );
};
