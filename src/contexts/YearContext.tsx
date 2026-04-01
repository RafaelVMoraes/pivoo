import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface YearContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  isLoadingYears: boolean;
  isCurrentYear: boolean;
  isPastYear: boolean;
  isFutureYear: boolean;
  currentYear: number;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

const CURRENT_YEAR = new Date().getFullYear();

export const YearProvider = ({ children }: { children: ReactNode }) => {
  const { user, isGuest } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [availableYears, setAvailableYears] = useState<number[]>([CURRENT_YEAR]);
  const [isLoadingYears, setIsLoadingYears] = useState(false);

  const fetchAvailableYears = useCallback(async () => {
    if (isGuest || !user) {
      // For guests, only show current year and next year
      setAvailableYears([CURRENT_YEAR, CURRENT_YEAR + 1]);
      return;
    }

    setIsLoadingYears(true);
    try {
      const yearSet = new Set<number>();
      
      // Always include current year and next year
      yearSet.add(CURRENT_YEAR);
      yearSet.add(CURRENT_YEAR + 1);

      // Fetch years from goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('created_at')
        .eq('user_id', user.id);

      goalsData?.forEach(goal => {
        const year = new Date(goal.created_at).getFullYear();
        yearSet.add(year);
      });

      // Fetch years from vision
      const { data: visionData } = await supabase
        .from('vision')
        .select('year')
        .eq('user_id', user.id);

      visionData?.forEach(vision => {
        yearSet.add(vision.year);
      });

      // Fetch years from history
      const { data: historyData } = await supabase
        .from('history')
        .select('year')
        .eq('user_id', user.id);

      historyData?.forEach(history => {
        yearSet.add(history.year);
      });

      // Fetch years from life_wheel (using year column)
      const { data: lifeWheelData } = await supabase
        .from('life_wheel')
        .select('year')
        .eq('user_id', user.id);

      lifeWheelData?.forEach(lw => {
        yearSet.add(lw.year);
      });

      // Sort years descending (most recent first)
      const sortedYears = Array.from(yearSet).sort((a, b) => b - a);
      setAvailableYears(sortedYears);
    } catch (error) {
      console.error('Error fetching available years:', error);
      setAvailableYears([CURRENT_YEAR, CURRENT_YEAR + 1]);
    } finally {
      setIsLoadingYears(false);
    }
  }, [user, isGuest]);

  useEffect(() => {
    fetchAvailableYears();
  }, [fetchAvailableYears]);

  // Reset to current year when user changes
  useEffect(() => {
    setSelectedYear(CURRENT_YEAR);
  }, [user?.id]);

  const isCurrentYear = selectedYear === CURRENT_YEAR;
  const isPastYear = selectedYear < CURRENT_YEAR;
  const isFutureYear = selectedYear > CURRENT_YEAR;

  return (
    <YearContext.Provider
      value={{
        selectedYear,
        setSelectedYear,
        availableYears,
        isLoadingYears,
        isCurrentYear,
        isPastYear,
        isFutureYear,
        currentYear: CURRENT_YEAR,
      }}
    >
      {children}
    </YearContext.Provider>
  );
};

export const useYear = (): YearContextType => {
  const context = useContext(YearContext);
  if (context === undefined) {
    throw new Error('useYear must be used within a YearProvider');
  }
  return context;
};
