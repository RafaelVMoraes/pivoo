import { Target, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface ViewToggleProps {
  value: 'high-level' | 'tasks';
  onChange: (value: 'high-level' | 'tasks') => void;
}

export const ViewToggle = ({ value, onChange }: ViewToggleProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 p-1 bg-accent/30 rounded-lg">
      <Button
        size="sm"
        variant={value === 'high-level' ? 'default' : 'ghost'}
        onClick={() => onChange('high-level')}
        className="gap-2 min-h-[44px]"
      >
        <Target size={16} />
        {t('goals.viewHighLevel')}
      </Button>
      <Button
        size="sm"
        variant={value === 'tasks' ? 'default' : 'ghost'}
        onClick={() => onChange('tasks')}
        className="gap-2 min-h-[44px]"
      >
        <CheckSquare size={16} />
        {t('goals.viewTasks')}
      </Button>
    </div>
  );
};
