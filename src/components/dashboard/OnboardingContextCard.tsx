import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useInitialOnboarding } from '@/hooks/useInitialOnboarding';

export const OnboardingContextCard = () => {
  const navigate = useNavigate();
  const { onboardingState, shouldShowOnboarding } = useInitialOnboarding();

  if (shouldShowOnboarding) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Finalize seu onboarding inicial</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Você tem progresso salvo. Continue de onde parou.</p>
          <Button onClick={() => navigate('/onboarding-inicial')}>Retomar</Button>
        </CardContent>
      </Card>
    );
  }

  if (!onboardingState.completed) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Seu setup inicial</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {onboardingState.goalTitle && (
          <p className="text-sm text-muted-foreground">
            🎯 Goal inicial: <span className="text-foreground font-medium">{onboardingState.goalTitle}</span>
          </p>
        )}
        {onboardingState.activityTitle && (
          <p className="text-sm text-muted-foreground">
            ✅ Primeira activity: <span className="text-foreground font-medium">{onboardingState.activityTitle}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
