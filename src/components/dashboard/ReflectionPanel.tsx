import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  PenLine,
  Sparkles,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReflectionPanelProps {
  isLoading: boolean;
  isGuest: boolean;
  currentStreak: number;
}

export const ReflectionPanel = ({ isLoading, isGuest, currentStreak }: ReflectionPanelProps) => {
  const navigate = useNavigate();
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  if (isLoading) {
    return (
      <Card className="glass-card shadow-card">
        <CardHeader className="pb-3">
          <div className="h-6 bg-muted/50 rounded animate-pulse w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-muted/50 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  // Get a reflection prompt based on the day
  const getReflectionPrompt = () => {
    const prompts = [
      "What's one thing you're grateful for today?",
      "What made you smile recently?",
      "What's something you learned this week?",
      "What challenge are you proud of overcoming?",
      "What intention do you set for today?",
      "What's something you're looking forward to?",
      "How are you feeling right now?",
    ];
    return prompts[today.getDay()];
  };

  return (
    <Card className="glass-card shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Daily Reflection
          </CardTitle>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {dayOfWeek}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's date and prompt */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border border-border/50">
          <p className="text-xs text-muted-foreground mb-2">{dateStr}</p>
          <p className="text-sm font-medium leading-relaxed">
            {getReflectionPrompt()}
          </p>
        </div>

        {/* Quick insight */}
        {currentStreak > 0 && !isGuest && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/5 border border-secondary/10">
            <Sparkles className="w-4 h-4 text-secondary" />
            <p className="text-sm text-muted-foreground">
              You've been consistent for <span className="font-medium text-foreground">{currentStreak} days</span>. 
              Keep up the great work!
            </p>
          </div>
        )}

        {/* CTA */}
        {isGuest ? (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground mb-3">
              Sign in to track your reflections and build a journaling habit.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
          </div>
        ) : (
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => navigate('/ai-chatbot')}
          >
            <PenLine className="w-4 h-4 mr-2" />
            Talk to Pivoo
          </Button>
        )}

        {/* Mindfulness tip */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            💡 <span className="italic">Taking just 2 minutes to reflect can improve your mood and clarity.</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
