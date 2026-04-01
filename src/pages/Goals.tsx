/**
 * Goals Page
 *
 * PURPOSE:
 *   Provide users with a centralized interface to view, manage, and track their goals and associated tasks, with options to filter and toggle views.
 *
 * USER INTENT:
 *   - View all personal goals at a high level or drill down into individual tasks.
 *   - Filter goals by status: active, completed, or archived.
 *   - Add new goals (if not a guest user).
 *   - Refresh or interact with individual goals and tasks.
 *
 * CORE ACTIONS:
 *   - Toggle between "high-level" goals view and "tasks" view.
 *   - Filter goals by status using tabs.
 *   - Add a new goal via dialog.
 *   - Interact with individual goal cards or task views.
 *
 * INPUTS:
 *   - Auth context (user/guest status)
 *   - Goal data fetched via `useGoals` hook
 *   - Local state: viewMode ('high-level' | 'tasks'), statusFilter ('active' | 'completed' | 'archived')
 *
 * OUTPUTS:
 *   - Rendered goal cards or tasks view
 *   - Updated UI based on viewMode and statusFilter
 *   - Trigger goal refreshes when a goal is added or modified
 *
 * STATE & DEPENDENCIES:
 *   - React state: viewMode, statusFilter
 *   - Context: `useAuth` for guest check
 *   - Hooks: `useGoals` for fetching and managing goals
 *   - Components: `EnhancedGoalCard`, `TasksView`, `AddGoalDialog`, `ViewToggle`, `StatusTabs`
 *
 * LOGIC CONSTRAINTS:
 *   - Guests cannot add goals.
 *   - Goals must be filtered correctly by status.
 *   - View toggle must switch between goal-level and task-level views seamlessly.
 *
 * EDGE CASES:
 *   - No goals available (empty state)
 *   - Loading state while fetching goals
 *   - Status filter returns no results
 *   - Guest user attempting to add a goal
 *
 * SUCCESS CRITERIA:
 *   - Goals are displayed correctly based on status filter and view mode
 *   - Adding a goal triggers a refresh and updates the list
 *   - Loading and empty states are handled gracefully
 *   - UI and actions are responsive for both guest and authenticated users
 */


import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus , Target, CheckSquare } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { AddGoalDialog } from '@/components/goals/dialogs/AddGoalDialog';
import { ViewToggle } from '@/components/goals/filters/ViewToggle';
import { StatusTabs } from '@/components/goals/filters/StatusTabs';
import { EnhancedGoalCard } from '@/components/goals/cards/GoalCard';
import { TasksView } from '@/components/goals/views/TasksView';
import { useTranslation } from '@/hooks/useTranslation';
import { useGoalsPageState } from '@/hooks/useGoalsPageState';

export const Goals = () => {
  const { isGuest } = useAuth();
  const { goals, isLoading, refetch } = useGoals();
  const { t } = useTranslation();
  const { viewMode, setViewMode, statusFilter, setStatusFilter, filteredGoals } = useGoalsPageState(goals);

  return (
    <div className="min-h-screen bg-background p-4 pb-20 overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
        {/* Top Section */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4" data-tutorial-id="goals-header">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 min-w-0">
            {viewMode === 'high-level' ? <><Target size={24} className="shrink-0" /> <span className="truncate">{t('goals.title')}</span></> : <><CheckSquare size={24} className="shrink-0" /> <span className="truncate">{t('goals.tasksTitle')}</span></>}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            {!isGuest && (
              <AddGoalDialog onRefresh={refetch}>
                <Button size="sm" className="gap-1.5" data-tutorial-id="goals-add">
                  <Plus size={18} />
                  <span className="hidden sm:inline">{t('addGoalDialog.add')}</span>
                </Button>
              </AddGoalDialog>
            )}
            <div data-tutorial-id="goals-view-toggle"><ViewToggle value={viewMode} onChange={setViewMode} /></div>
          </div>
        </div>

        {/* Status Tabs */}
        {viewMode === 'high-level' && (
          <div data-tutorial-id="goals-status-tabs"><StatusTabs value={statusFilter} onChange={setStatusFilter} goals={goals} /></div>
        )}

        {/* Content Views */}
        <div className="mt-6" data-tutorial-id="goals-content">
          {viewMode === 'high-level' ? (
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredGoals.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">{ t('goals.noGoalsFound')}</p>
                </div>
              ) : (
                filteredGoals.map(goal => (
                  <EnhancedGoalCard key={goal.id} goal={goal} onRefresh={refetch} />
                ))
              )}
            </div>
          ) : (
            <TasksView goals={goals} isLoading={isLoading} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Goals;
