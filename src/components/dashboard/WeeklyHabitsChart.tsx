import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';

interface WeeklyHabitData {
  week: string;
  completionRate: number;
}

interface WeeklyHabitsChartProps {
  data: WeeklyHabitData[];
  isLoading: boolean;
}

export const WeeklyHabitsChart = ({ data, isLoading }: WeeklyHabitsChartProps) => {
  const chartConfig = {
    completionRate: {
      label: "Completion Rate",
      color: "hsl(var(--primary))",
    },
  };

  if (isLoading) {
    return (
      <Card className="glass-card shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Weekly Habits
          </CardTitle>
          <CardDescription>Loading habit completion data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] bg-muted/50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card shadow-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar size={20} className="text-primary" />
          Weekly Habits
        </CardTitle>
        <CardDescription>Completion rate of your habit goals over the last 8 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] bg-muted/50 rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No habit data available yet</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="week" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  domain={[0, 100]}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value) => [`${value}%`, "Completion Rate"]}
                />
                <Bar 
                  dataKey="completionRate" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};