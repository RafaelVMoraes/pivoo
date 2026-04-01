import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Goal } from '@/hooks/useGoals';

export type GoalsViewMode = 'high-level' | 'tasks';
export type GoalsStatusFilter = 'active' | 'completed' | 'archived';

export const useGoalsPageState = (goals: Goal[]) => {
  const [searchParams] = useSearchParams();
  const initialView = searchParams.get('view') === 'tasks' ? 'tasks' : 'high-level';
  const [viewMode, setViewMode] = useState<GoalsViewMode>(initialView);
  const [statusFilter, setStatusFilter] = useState<GoalsStatusFilter>('active');

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      if (statusFilter === 'active') return goal.status === 'active' || goal.status === 'in_progress';
      if (statusFilter === 'completed') return goal.status === 'completed';
      return goal.status === 'archived';
    });
  }, [goals, statusFilter]);

  return {
    viewMode,
    setViewMode,
    statusFilter,
    setStatusFilter,
    filteredGoals,
  };
};
