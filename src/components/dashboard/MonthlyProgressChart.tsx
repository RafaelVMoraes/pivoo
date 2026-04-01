import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface MonthlyProgressData {
  month: string;
  progress: number;
}

interface MonthlyProgressChartProps {
  data: MonthlyProgressData[];
  isLoading: boolean;
}

export const MonthlyProgressChart = ({ data, isLoading }: MonthlyProgressChartProps) => {
  const chartConfig = {
    progress: {
      label: "Progress",
      color: "hsl(var(--secondary))",
    },
  };

  if (isLoading) {
    return (
      <Card className="glass-card shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp size={20} className="text-secondary" />
            Monthly Progress
          </CardTitle>
          <CardDescription>Loading progress data...</CardDescription>
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
          <TrendingUp size={20} className="text-secondary" />
          Monthly Progress
        </CardTitle>
        <CardDescription>Your overall progress trend over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] bg-muted/50 rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No progress data available yet</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="month" 
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
                  formatter={(value) => [`${value}%`, "Progress"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="progress" 
                  stroke="hsl(var(--secondary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--secondary))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};