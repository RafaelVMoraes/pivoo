import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Info, Star, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';

interface LifeWheelData {
  area_name: string;
  current_score: number;
  desired_score: number;
  achieved_score?: number | null;
  is_focus_area?: boolean;
  evolution_description?: string;
}

interface LifeWheelDropdownsProps {
  data: LifeWheelData[];
  previousYearData?: LifeWheelData[];
  onUpdate: (areaName: string, updates: Partial<LifeWheelData>) => void;
  saving: boolean;
  categories: Record<string, string[]>;
}

const SCORE_LABELS: Record<number, string> = {
  1: 'Not a Concern',
  2: 'Low Relevance',
  3: 'Acknowledged',
  4: 'Developing',
  5: 'Functional',
  6: 'Good',
  7: 'Strong',
  8: 'Excellent',
  9: 'Focused Improvement',
  10: 'Strategic Focus'
};

const SCORE_DESCRIPTIONS: Record<number, string> = {
  1: 'Not a Concern - Very poor or absent, but not relevant right now.',
  2: 'Low Relevance – Below expectations, but no priority or intention to act',
  3: 'Acknowledged – Recognized as weak, but intentionally not prioritized.',
  4: 'Developing – Below desired level, with early signs of improvement.',
  5: 'Functional - Acceptable and usable, but not satisfying.',
  6: 'Good - Healthy and stable. Meets expectations.',
  7: 'Strong - Well developed and clearly satisfying.',
  8: 'Excellent - Exactly where you want it to be. Balanced and fulfilling..',
  9: 'Focused Improvement - Already strong, but intentionally selected for further growth or refinement.',
  10: 'Strategic Focus - Central life priority this year, either to close a critical gap or to sustain peak excellence.'
};

// Category colors using CSS variables
const CATEGORY_STYLES: Record<string, { colorVar: string; textClass: string; borderClass: string }> = {
  'Life Quality': { 
    colorVar: '--category-life-quality', 
    textClass: 'text-[hsl(var(--category-life-quality))]',
    borderClass: 'border-[hsl(var(--category-life-quality)/0.4)]'
  },
  'Personal': { 
    colorVar: '--category-personal', 
    textClass: 'text-[hsl(var(--category-personal))]',
    borderClass: 'border-[hsl(var(--category-personal)/0.4)]'
  },
  'Professional': { 
    colorVar: '--category-professional', 
    textClass: 'text-[hsl(var(--category-professional))]',
    borderClass: 'border-[hsl(var(--category-professional)/0.4)]'
  },
  'Relationships': { 
    colorVar: '--category-relationships', 
    textClass: 'text-[hsl(var(--category-relationships))]',
    borderClass: 'border-[hsl(var(--category-relationships)/0.4)]'
  }
};

const ScaleInfoDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Info size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Life Wheel Scale Guide</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {Object.entries(SCORE_DESCRIPTIONS).map(([score, description]) => {
            const isRestricted = parseInt(score) >= 9;
            return (
              <div key={score} className="flex gap-3">
                <div className={`font-bold min-w-[2rem] ${isRestricted ? 'text-primary' : 'text-foreground'}`}>
                  {score}
                </div>
                <div className="text-sm text-muted-foreground">{description}</div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const LifeWheelDropdowns = ({ data, previousYearData = [], onUpdate, saving, categories }: LifeWheelDropdownsProps) => {
  const { t } = useTranslation();
  const [localData, setLocalData] = useState(data);

  // For evolution descriptions, manage temporary values
  const [editDescriptions, setEditDescriptions] = useState<Record<string, string>>({});

  // Sync with incoming data
  useEffect(() => {
    setLocalData(data);
    // Set editDescriptions to match (do not override if editing, but sync if data changes externally)
    setEditDescriptions(
      data.reduce((acc, area) => {
        acc[area.area_name] = area.evolution_description || "";
        return acc;
      }, {} as Record<string, string>)
    );
  }, [data]);

  const handleFocusToggle = (areaName: string, checked: boolean) => {
    const area = localData.find(a => a.area_name === areaName);
    
    // If unchecking focus and scores are 9 or 10, cap them at 8
    if (!checked && area && (area.current_score > 8 || area.desired_score > 8)) {
      const updates = {
        is_focus_area: checked,
        current_score: area.current_score > 8 ? 8 : area.current_score,
        desired_score: area.desired_score > 8 ? 8 : area.desired_score,
      };
      setLocalData(prev => prev.map(a => 
        a.area_name === areaName ? { ...a, ...updates } : a
      ));
      onUpdate(areaName, updates);
    } else {
      setLocalData(prev => prev.map(area => 
        area.area_name === areaName ? { ...area, is_focus_area: checked } : area
      ));
      onUpdate(areaName, { is_focus_area: checked });
    }
  };

  const handleScoreChange = (areaName: string, type: 'current' | 'desired' | 'achieved', value: string) => {
    const numValue = parseInt(value);
    const area = localData.find(a => a.area_name === areaName);
    
    // Check if trying to set 9 or 10 without focus area (not for achieved)
    if (type !== 'achieved' && (numValue === 9 || numValue === 10) && !area?.is_focus_area) {
      return;
    }

    const updates = type === 'current' 
      ? { current_score: numValue }
      : type === 'desired'
        ? { desired_score: numValue }
        : { achieved_score: numValue };
    
    setLocalData(prev => prev.map(area => 
      area.area_name === areaName ? { ...area, ...updates } : area
    ));
    onUpdate(areaName, updates);
  };

  // Handles only local update for textarea changes
  const handleDescriptionEdit = (areaName: string, value: string) => {
    setEditDescriptions(prev => ({
      ...prev,
      [areaName]: value
    }));
    // Do not call onUpdate here!
    setLocalData(prev =>
      prev.map(area =>
        area.area_name === areaName
          ? { ...area, evolution_description: value }
          : area
      )
    );
  };

  // Called when textarea loses focus or user presses Enter (apart from shift+enter)
  const saveDescriptionEdit = (areaName: string) => {
    // Update parent only if value differs from original data
    const desc = editDescriptions[areaName] ?? '';
    const orig = data.find((a) => a.area_name === areaName)?.evolution_description || '';
    if (desc !== orig) {
      onUpdate(areaName, { evolution_description: desc });
    }
  };

  // Calculate averages
  const currentAverage = localData.length > 0 
    ? (localData.reduce((sum, area) => sum + area.current_score, 0) / localData.length).toFixed(1)
    : '0';
  
  const desiredAverage = localData.length > 0
    ? (localData.reduce((sum, area) => sum + area.desired_score, 0) / localData.length).toFixed(1)
    : '0';

  const achievedAreas = localData.filter(a => a.achieved_score != null && a.achieved_score > 0);
  const achievedAverage = achievedAreas.length > 0
    ? (achievedAreas.reduce((sum, area) => sum + (area.achieved_score || 0), 0) / achievedAreas.length).toFixed(1)
    : null;

  return (
    <Card className="gradient-card shadow-soft">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('selfDiscovery.rateLifeAreas')}</CardTitle>
          <ScaleInfoDialog />
        </div>
        <p className="text-sm text-muted-foreground">
          {t('selfDiscovery.rateDescription')}
        </p>
        
        {/* Averages Display */}
        <div className="flex gap-4 mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground mb-1">Current Average</p>
            <p className="text-2xl font-bold text-primary">{currentAverage}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground mb-1">Target Average</p>
            <p className="text-2xl font-bold text-accent">{desiredAverage}</p>
          </div>
          {achievedAverage && (
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground mb-1">Achieved Average</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{achievedAverage}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {Object.entries(categories).map(([categoryName, areas]) => {
          const categoryStyle = CATEGORY_STYLES[categoryName];
          
          return (
            <div key={categoryName} className="space-y-4">
              {/* Category Header with inherited color */}
              <div 
                className="flex items-center gap-2 pb-2 border-b-2"
                style={{ borderColor: `hsl(var(${categoryStyle?.colorVar || '--primary'}) / 0.4)` }}
              >
                <h3 
                  className="font-semibold text-lg"
                  style={{ color: `hsl(var(${categoryStyle?.colorVar || '--primary'}))` }}
                >
                  {categoryName}
                </h3>
              </div>

              {/* Areas in this category */}
              {areas.map((areaName) => {
                const area = localData.find(a => a.area_name === areaName);
                if (!area) return null;
                const prevYear = previousYearData.find(p => p.area_name === areaName);

                return (
                  <div key={area.area_name} className="space-y-3 pb-4 border-b last:border-b-0">
                    <div className="flex items-center justify-between">
                      <h4 
                        className="font-medium text-base"
                        style={{ color: `hsl(var(${categoryStyle?.colorVar || '--foreground'}))` }}
                      >
                        {area.area_name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`focus-${area.area_name}`}
                          checked={area.is_focus_area || false}
                          onCheckedChange={(checked) => handleFocusToggle(area.area_name, checked as boolean)}
                          disabled={saving}
                        />
                        <Label 
                          htmlFor={`focus-${area.area_name}`}
                          className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1"
                        >
                          <Star size={12} className={area.is_focus_area ? 'fill-primary text-primary' : ''} />
                          Focus Area
                        </Label>
                      </div>
                    </div>

                    {/* Previous year suggestion */}
                    {prevYear && (
                      <div className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
                        Last year: Current {prevYear.current_score} → Target {prevYear.desired_score}
                        {prevYear.achieved_score != null && ` → Achieved ${prevYear.achieved_score}`}
                      </div>
                    )}

                    {/* Score dropdowns - stack on small screens */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Current Level */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Current</Label>
                        <Select
                          value={area.current_score.toString()}
                          onValueChange={(value) => handleScoreChange(area.area_name, 'current', value)}
                          disabled={saving}
                        >
                          <SelectTrigger className="w-full h-9 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((score) => (
                              <SelectItem key={score} value={score.toString()}>
                                {score} – {SCORE_LABELS[score]}
                              </SelectItem>
                            ))}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <SelectItem value="9" disabled={!area.is_focus_area} className={!area.is_focus_area ? 'opacity-50' : ''}>
                                    <span className="flex items-center gap-2">
                                      {!area.is_focus_area && <Lock size={12} className="text-muted-foreground" />}
                                      9 – {SCORE_LABELS[9]}
                                    </span>
                                  </SelectItem>
                                </div>
                              </TooltipTrigger>
                              {!area.is_focus_area && <TooltipContent>Available only for focus areas</TooltipContent>}
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <SelectItem value="10" disabled={!area.is_focus_area} className={!area.is_focus_area ? 'opacity-50' : ''}>
                                    <span className="flex items-center gap-2">
                                      {!area.is_focus_area && <Lock size={12} className="text-muted-foreground" />}
                                      10 – {SCORE_LABELS[10]}
                                    </span>
                                  </SelectItem>
                                </div>
                              </TooltipTrigger>
                              {!area.is_focus_area && <TooltipContent>Available only for focus areas</TooltipContent>}
                            </Tooltip>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Target Level */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Target</Label>
                        <Select
                          value={area.desired_score.toString()}
                          onValueChange={(value) => handleScoreChange(area.area_name, 'desired', value)}
                          disabled={saving}
                        >
                          <SelectTrigger className="w-full h-9 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((score) => (
                              <SelectItem key={score} value={score.toString()}>
                                {score} – {SCORE_LABELS[score]}
                              </SelectItem>
                            ))}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <SelectItem value="9" disabled={!area.is_focus_area} className={!area.is_focus_area ? 'opacity-50' : ''}>
                                    <span className="flex items-center gap-2">
                                      {!area.is_focus_area && <Lock size={12} className="text-muted-foreground" />}
                                      9 – {SCORE_LABELS[9]}
                                    </span>
                                  </SelectItem>
                                </div>
                              </TooltipTrigger>
                              {!area.is_focus_area && <TooltipContent>Available only for focus areas</TooltipContent>}
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <SelectItem value="10" disabled={!area.is_focus_area} className={!area.is_focus_area ? 'opacity-50' : ''}>
                                    <span className="flex items-center gap-2">
                                      {!area.is_focus_area && <Lock size={12} className="text-muted-foreground" />}
                                      10 – {SCORE_LABELS[10]}
                                    </span>
                                  </SelectItem>
                                </div>
                              </TooltipTrigger>
                              {!area.is_focus_area && <TooltipContent>Available only for focus areas</TooltipContent>}
                            </Tooltip>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Achieved Level */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Achieved</Label>
                        <Select
                          value={area.achieved_score != null ? area.achieved_score.toString() : ''}
                          onValueChange={(value) => handleScoreChange(area.area_name, 'achieved', value)}
                          disabled={saving}
                        >
                          <SelectTrigger className="w-full h-9 text-xs sm:text-sm">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                              <SelectItem key={score} value={score.toString()}>
                                {score} – {SCORE_LABELS[score]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Evolution Description */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        What does this evolution mean to you?
                      </Label>
                      <Textarea
                        placeholder="Describe what evolving from your current state to your desired state means for you in this area..."
                        value={editDescriptions[area.area_name] ?? ''}
                        onChange={(e) => handleDescriptionEdit(area.area_name, e.target.value)}
                        onBlur={() => saveDescriptionEdit(area.area_name)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            (e.target as HTMLTextAreaElement).blur();
                          }
                        }}
                        disabled={saving}
                        className="min-h-[30px] resize-none text-sm"
                        rows={1}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
