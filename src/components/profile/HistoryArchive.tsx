import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHistory, YearArchive } from '@/hooks/useHistory';
import { useTranslation } from '@/hooks/useTranslation';
import { useYear } from '@/contexts/YearContext';
import {
  Calendar,
  Target,
  Lightbulb,
  Circle,
  BookOpen,
  ClipboardCheck,
  Flame,
  Heart,
} from 'lucide-react';

// ========== Evaluation Options & Colors ==========

const EVALUATION_OPTIONS = {
  goal_achievement: [
    { value: 'exceeded', label: 'Exceeded key goals', color: 'bg-green-500' },
    { value: 'achieved', label: 'Achieved most priorities', color: 'bg-blue-500' },
    { value: 'partial', label: 'Partially achieved', color: 'bg-yellow-500' },
    { value: 'unmet', label: 'Largely unmet', color: 'bg-red-500' },
  ],
  consistency_engagement: [
    { value: 'highly', label: 'Highly consistent', color: 'bg-green-500' },
    { value: 'generally', label: 'Generally consistent', color: 'bg-blue-500' },
    { value: 'inconsistent', label: 'Inconsistent', color: 'bg-yellow-500' },
    { value: 'rarely', label: 'Rarely engaged', color: 'bg-red-500' },
  ],
  personal_impact: [
    { value: 'strong', label: 'Strong positive evolution', color: 'bg-green-500' },
    { value: 'moderate', label: 'Moderate evolution', color: 'bg-blue-500' },
    { value: 'limited', label: 'Limited evolution', color: 'bg-yellow-500' },
    { value: 'none', label: 'No real evolution', color: 'bg-red-500' },
  ],
};

const getOptionColor = (field: keyof typeof EVALUATION_OPTIONS, value?: string) => {
  if (!value) return '';
  const option = EVALUATION_OPTIONS[field].find(o => o.value === value);
  return option?.color || '';
};

// ========== Evaluation Dropdown ==========

interface EvalDropdownProps {
  icon: React.ReactNode;
  question: string;
  field: keyof typeof EVALUATION_OPTIONS;
  value?: string;
  onChange: (value: string) => void;
}

const EvalDropdown = ({ icon, question, field, value, onChange }: EvalDropdownProps) => {
  const colorDot = getOptionColor(field, value);

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        {icon}
        <p className="text-sm font-medium leading-tight">{question}</p>
      </div>
      <div className="flex items-center gap-2">
        {colorDot && <span className={`w-3 h-3 rounded-full ${colorDot} shrink-0`} />}
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {EVALUATION_OPTIONS[field].map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${opt.color} shrink-0`} />
                  {opt.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// ========== Year Card ==========

interface YearCardProps {
  archive: YearArchive;
  currentYear: number;
  onEvalChange: (year: number, field: string, value: string) => void;
}

const YearCard = ({ archive, currentYear, onEvalChange }: YearCardProps) => {
  const { t } = useTranslation();

  return (
    <Card className="gradient-card shadow-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar size={18} className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {archive.year}
                {archive.year === currentYear && (
                  <Badge variant="secondary" className="ml-2 text-xs">{t('common.current')}</Badge>
                )}
              </CardTitle>
              {archive.goals.total > 0 && (
                <CardDescription>
                  {archive.goals.completed}/{archive.goals.total} {t('goals.completed')}
                </CardDescription>
              )}
            </div>
          </div>
          {archive.goals.total > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Target size={12} />
              {Math.round((archive.goals.completed / archive.goals.total) * 100)}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* A. Goals Overview */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <Target size={16} className="text-primary" />
            {t('nav.goals')}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary">{archive.goals.total}</p>
              <p className="text-xs text-muted-foreground">{t('goals.total')}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-500">{archive.goals.completed}</p>
              <p className="text-xs text-muted-foreground">{t('goals.completed')}</p>
            </div>
          </div>
        </div>

        {/* B. Vision */}
        {(archive.vision?.word_year || archive.vision?.phrase_year || archive.vision?.vision_1y || archive.vision?.vision_3y || archive.vision?.vision_5y) && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-primary" />
              {t('history.visionFor')} {archive.year}
            </h4>
            <div className="space-y-2">
              {archive.vision?.word_year && (
                <div>
                  <span className="text-sm text-muted-foreground">{t('history.word')}: </span>
                  <Badge variant="outline">{archive.vision.word_year}</Badge>
                </div>
              )}
              {archive.vision?.phrase_year && (
                <div>
                  <span className="text-sm text-muted-foreground">{t('history.phrase')}: </span>
                  <span className="text-sm font-medium">{archive.vision.phrase_year}</span>
                </div>
              )}
              {archive.vision?.vision_1y && (
                <div>
                  <span className="text-sm text-muted-foreground">1Y Vision ({archive.year + 1}): </span>
                  <span className="text-sm">{archive.vision.vision_1y}</span>
                </div>
              )}
              {archive.vision?.vision_3y && (
                <div>
                  <span className="text-sm text-muted-foreground">3Y Vision ({archive.year + 3}): </span>
                  <span className="text-sm">{archive.vision.vision_3y}</span>
                </div>
              )}
              {archive.vision?.vision_5y && (
                <div>
                  <span className="text-sm text-muted-foreground">5Y Vision ({archive.year + 5}): </span>
                  <span className="text-sm">{archive.vision.vision_5y}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* C. Life Wheel Summary */}
        {archive.lifeWheel && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium flex items-center gap-2 mb-3">
              <Circle size={16} className="text-primary" />
              {t('selfDiscovery.lifeWheel')}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">{archive.lifeWheel.currentAvg}</p>
                <p className="text-xs text-muted-foreground">{t('selfDiscovery.currentAvg')}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-accent">{archive.lifeWheel.desiredAvg}</p>
                <p className="text-xs text-muted-foreground">{t('selfDiscovery.desiredAvg')}</p>
              </div>
            </div>
            {archive.lifeWheel.focusAreas.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs text-muted-foreground">{t('selfDiscovery.focusAreas')}:</p>
                <div className="flex gap-1 flex-wrap">
                  {archive.lifeWheel.focusAreas.map((area, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">{area}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* D. Year Evaluation */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            Year Evaluation
          </h4>
          <EvalDropdown
            icon={<ClipboardCheck size={14} className="text-muted-foreground mt-0.5 shrink-0" />}
            question="Did you accomplish what truly mattered to you this year?"
            field="goal_achievement"
            value={archive.history?.goal_achievement || undefined}
            onChange={(v) => onEvalChange(archive.year, 'goal_achievement', v)}
          />
          <EvalDropdown
            icon={<Flame size={14} className="text-muted-foreground mt-0.5 shrink-0" />}
            question="How consistently did you invest time and effort toward your goals?"
            field="consistency_engagement"
            value={archive.history?.consistency_engagement || undefined}
            onChange={(v) => onEvalChange(archive.year, 'consistency_engagement', v)}
          />
          <EvalDropdown
            icon={<Heart size={14} className="text-muted-foreground mt-0.5 shrink-0" />}
            question="Did you evolve in the direction you intended this year?"
            field="personal_impact"
            value={archive.history?.personal_impact || undefined}
            onChange={(v) => onEvalChange(archive.year, 'personal_impact', v)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// ========== Main Component ==========

export const HistoryArchive = () => {
  const { yearArchives, loading, createOrUpdateHistory } = useHistory();
  const { t } = useTranslation();
  const { currentYear } = useYear();

  const handleEvalChange = async (year: number, field: string, value: string) => {
    await createOrUpdateHistory(year, { [field]: value } as any);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (yearArchives.length === 0) {
    return (
      <Card className="gradient-card shadow-soft">
        <CardContent className="py-12 text-center">
          <BookOpen size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('history.noData')}</h3>
          <p className="text-muted-foreground text-sm">{t('history.completeGoals')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">{t('history.title')}</h2>
        <p className="text-muted-foreground text-sm">{t('history.subtitle')}</p>
      </div>
      <div className="space-y-4">
        {yearArchives.map((archive) => (
          <YearCard
            key={archive.year}
            archive={archive}
            currentYear={currentYear}
            onEvalChange={handleEvalChange}
          />
        ))}
      </div>
    </div>
  );
};
