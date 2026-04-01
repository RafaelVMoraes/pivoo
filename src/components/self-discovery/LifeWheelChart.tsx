import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import { Star } from 'lucide-react';
interface LifeWheelData {
  area_name: string;
  current_score: number;
  desired_score: number;
  achieved_score?: number | null;
  is_focus_area?: boolean;
}
interface LifeWheelChartProps {
  data: LifeWheelData[];
  showFocusAreas?: boolean;
}

// Category mapping with CSS variables
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

// Get computed color from CSS variable
const getCategoryColor = (areaName: string): string => {
  const colorVar = CATEGORY_MAP[areaName]?.colorVar || '--primary';
  return `hsl(var(${colorVar}))`;
};
export const LifeWheelChart = ({
  data,
  showFocusAreas = true
}: LifeWheelChartProps) => {
  const {
    t
  } = useTranslation();
  const focusAreas = data.filter(area => area.is_focus_area);
  const chartData = data.map(item => ({
    area: t(`selfDiscovery.lifeWheel.areas.${item.area_name}`),
    fullName: item.area_name,
    current: item.current_score,
    desired: item.desired_score,
    achieved: item.achieved_score || 0,
    fill: getCategoryColor(item.area_name)
  }));
  const hasAchievedData = data.some(d => d.achieved_score != null && d.achieved_score > 0);
  const currentAverage = data.length > 0 ? (data.reduce((s, a) => s + a.current_score, 0) / data.length).toFixed(1) : '0';
  const desiredAverage = data.length > 0 ? (data.reduce((s, a) => s + a.desired_score, 0) / data.length).toFixed(1) : '0';
  const achievedAreas = data.filter(a => a.achieved_score != null && a.achieved_score > 0);
  const achievedAverage = achievedAreas.length > 0 ? (achievedAreas.reduce((s, a) => s + (a.achieved_score || 0), 0) / achievedAreas.length).toFixed(1) : null;
  const averageDifference = Math.abs(parseFloat(desiredAverage) - parseFloat(currentAverage));
  const totalDesired = data.reduce((s, a) => s + a.desired_score, 0);
  const showOverloadAlert = averageDifference > 1.5;
  const showHighExpectationsAlert = totalDesired > 50;
  const categories = [{
    key: 'lifeQuality',
    colorVar: '--category-life-quality'
  }, {
    key: 'personal',
    colorVar: '--category-personal'
  }, {
    key: 'professional',
    colorVar: '--category-professional'
  }, {
    key: 'relationships',
    colorVar: '--category-relationships'
  }];

  // Custom tick to render area labels with category colors
  const CustomTick = ({
    x,
    y,
    cx,
    cy,
    payload
  }: any) => {
    const areaData = chartData.find(d => d.area === payload.value);
    const color = areaData?.fill || 'hsl(var(--foreground))';
  
    // Vector from center
    const dx = x - cx;
    const dy = y - cy;
  
    // Push label outward
    const offset = 16;
    const factor = (Math.sqrt(dx * dx + dy * dy) + offset) / Math.sqrt(dx * dx + dy * dy);
  
    const newX = cx + dx * factor;
    const newY = cy + dy * factor;
  
    // Smart anchor depending on side
    let textAnchor: 'start' | 'middle' | 'end' = 'middle';
    if (Math.abs(dx) > 10) {
      textAnchor = dx > 0 ? 'start' : 'end';
    }
  
    return (
      <text
        x={newX}
        y={newY}
        textAnchor={textAnchor}
        fill={color}
        fontSize={11}
        fontWeight={500}
        dominantBaseline="middle"
      >
        {payload.value}
      </text>
    );
  };
  return <div className="space-y-4">
      {/* Main Chart Card */}
      <Card className="gradient-card shadow-soft">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            {t('selfDiscovery.lifeWheel.title')}
          </CardTitle>

          {/* Category Legend */}
          <div className="flex flex-wrap gap-2 mt-3">
            {categories.map(cat => <Badge key={cat.key} className="text-xs px-2 py-1" style={{
            backgroundColor: `hsl(var(${cat.colorVar}))`,
            color: 'white'
          }}>
                {t(`selfDiscovery.lifeWheel.categories.${cat.key}`)}
              </Badge>)}
          </div>

          {/* Averages */}
            <div className="flex gap-4 mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {t('selfDiscovery.lifeWheel.currentAverage')}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {currentAverage}
                </p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {t('selfDiscovery.lifeWheel.desiredAverage')}
                </p>
                <p className="text-2xl font-bold text-secondary">
                  {desiredAverage}
                </p>
              </div>
              {achievedAverage && (
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Achieved Avg</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{achievedAverage}</p>
                </div>
              )}
            </div>

          {/* Alerts */}
          {showOverloadAlert && <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                {t('selfDiscovery.lifeWheel.alerts.overload')}
              </p>
            </div>}

          {showHighExpectationsAlert && <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-sm font-medium text-warning">
                {t('selfDiscovery.lifeWheel.alerts.highExpectations')}
              </p>
            </div>}
        </CardHeader>

        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="area" tick={<CustomTick />} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{
                fontSize: 10
              }} />

                <Radar name={t('selfDiscovery.lifeWheel.current')} dataKey="current" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                <Radar name={t('selfDiscovery.lifeWheel.desired')} dataKey="desired" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.2} strokeWidth={2} strokeDasharray="5 5" />
                {hasAchievedData && (
                  <Radar name="Achieved" dataKey="achieved" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.15} strokeWidth={2} strokeDasharray="3 3" />
                )}
                <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '10px', paddingTop: 20 }}
                    iconType="line" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Focus Areas - Displayed beside the chart, not overlaid */}
      {showFocusAreas && focusAreas.length > 0 && <Card className="gradient-card shadow-soft border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star size={16} className="text-primary fill-primary" />
              {t('selfDiscovery.focusAreas')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {focusAreas.map(area => {
            const colorVar = CATEGORY_MAP[area.area_name]?.colorVar || '--primary';
            return <Badge key={area.area_name} className="text-sm px-3 py-1.5 font-medium" style={{
              backgroundColor: `hsl(var(${colorVar}) / 0.2)`,
              color: `hsl(var(${colorVar}))`,
              borderColor: `hsl(var(${colorVar}) / 0.4)`,
              border: '1px solid'
            }}>
                    {area.area_name}
                    <span className="ml-2 text-xs opacity-75">
                      {area.current_score} → {area.desired_score}
                    </span>
                  </Badge>;
          })}
            </div>
          </CardContent>
        </Card>}
    </div>;
};