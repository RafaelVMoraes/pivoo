import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useInitialOnboarding } from '@/hooks/useInitialOnboarding';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { trackOnboardingMetricEvent } from '@/lib/onboardingMetrics';

export const InitialOnboarding = () => {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { onboardingState, valuesOptions, currentStep, shouldShowOnboarding, saveOnboardingState, refreshOnboarding } = useInitialOnboarding();

  const [saving, setSaving] = useState(false);
  const [goalTitle, setGoalTitle] = useState(onboardingState.goalTitle || '');
  const [activityTitle, setActivityTitle] = useState(onboardingState.activityTitle || '');

  const selectedValues = onboardingState.selectedValues;

  const canContinueStep1 = selectedValues.length >= 1 && selectedValues.length <= 2;
  const canContinueStep2 = goalTitle.trim().length >= 3;
  const canContinueStep3 = activityTitle.trim().length >= 3;

  const stepTitle = useMemo(() => {
    if (currentStep === 1) return 'Passo 1/4 · Escolha 1-2 valores';
    if (currentStep === 2) return 'Passo 2/4 · Crie seu primeiro goal';
    if (currentStep === 3) return 'Passo 3/4 · Crie sua primeira activity';
    if (currentStep === 4) return 'Passo 4/4 · Registre o primeiro check-in';
    return 'Onboarding finalizado';
  }, [currentStep]);

  if (!user || isGuest) {
    return <Navigate to="/auth" replace />;
  }

  if (!shouldShowOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  const toggleValue = (valueName: string) => {
    const exists = selectedValues.includes(valueName);
    if (exists) {
      saveOnboardingState({ selectedValues: selectedValues.filter((item) => item !== valueName) });
      return;
    }

    if (selectedValues.length >= 2) {
      toast({ title: 'Limite atingido', description: 'Selecione no máximo 2 valores.', variant: 'destructive' });
      return;
    }

    saveOnboardingState({ selectedValues: [...selectedValues, valueName] });
  };

  const saveValues = async () => {
    if (!canContinueStep1) return;
    setSaving(true);
    try {
      const upserts = selectedValues.map((value) => ({ user_id: user.id, value_name: value, selected: true }));
      const { error } = await supabase.from('values').upsert(upserts, { onConflict: 'user_id,value_name' });
      if (error) throw error;
      await refreshOnboarding();
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Não foi possível salvar os valores.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const createGoal = async () => {
    if (!canContinueStep2) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: goalTitle,
          description: goalTitle,
          type: 'habit',
          status: 'active',
          priority: 'silver',
          related_values: selectedValues,
        })
        .select('id,title')
        .single();

      if (error) throw error;
      saveOnboardingState({ goalId: data.id, goalTitle: data.title });
      await refreshOnboarding();
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Não foi possível criar o goal.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const createActivity = async () => {
    if (!canContinueStep3 || !onboardingState.goalId) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          goal_id: onboardingState.goalId,
          title: activityTitle,
          description: activityTitle,
          activity_type: 'habit',
          status: 'active',
          frequency_type: 'daily',
          time_of_day: 'whole_day',
        })
        .select('id,title')
        .single();

      if (error) throw error;
      saveOnboardingState({ activityId: data.id, activityTitle: data.title });
      await refreshOnboarding();
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Não foi possível criar a activity.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const registerFirstCheckIn = async () => {
    if (!onboardingState.goalId || !onboardingState.activityId || !onboardingState.startedAt) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from('check_ins').insert({
        user_id: user.id,
        goal_id: onboardingState.goalId,
        activity_id: onboardingState.activityId,
        date: now.split('T')[0],
        progress_value: 'done',
        input_type: 'checkbox',
      });

      if (error) throw error;

      const completedAt = now;
      const durationMs = new Date(completedAt).getTime() - new Date(onboardingState.startedAt).getTime();

      saveOnboardingState({
        completed: true,
        completedAt,
        firstTaskCompletedAt: completedAt,
      });

      trackOnboardingMetricEvent({
        event: 'onboarding_completed',
        userId: user.id,
        startedAt: onboardingState.startedAt,
        completedAt,
        durationMs,
      });

      trackOnboardingMetricEvent({
        event: 'first_task_completed',
        userId: user.id,
        startedAt: onboardingState.startedAt,
        completedAt,
        timeToFirstTaskMs: durationMs,
      });

      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Não foi possível registrar o check-in.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Onboarding inicial obrigatório</CardTitle>
          <CardDescription>{stepTitle}. O progresso parcial é salvo automaticamente para você retomar depois.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-3">
              <Label>Selecione 1 a 2 valores:</Label>
              <div className="grid grid-cols-2 gap-2">
                {valuesOptions.map((value) => {
                  const selected = selectedValues.includes(value);
                  return (
                    <Button key={value} type="button" variant={selected ? 'default' : 'outline'} onClick={() => toggleValue(value)}>
                      {value}
                    </Button>
                  );
                })}
              </div>
              <Button onClick={saveValues} disabled={!canContinueStep1 || saving}>Continuar</Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3">
              <Label htmlFor="onboarding-goal-title">Nome do goal</Label>
              <Input id="onboarding-goal-title" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Ex.: Cuidar melhor da saúde" />
              <Button onClick={createGoal} disabled={!canContinueStep2 || saving}>Criar goal</Button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-3">
              <Label htmlFor="onboarding-activity-title">Nome da activity</Label>
              <Input id="onboarding-activity-title" value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} placeholder="Ex.: Caminhar 20 minutos" />
              <Button onClick={createActivity} disabled={!canContinueStep3 || saving}>Criar activity</Button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Registre o primeiro check-in da sua activity para finalizar o onboarding.</p>
              <Button onClick={registerFirstCheckIn} disabled={saving}>Registrar check-in e ir para o dashboard</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InitialOnboarding;
