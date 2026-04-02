import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useYear } from '@/contexts/YearContext';
import { queryKeys } from '@/lib/queryKeys';

export interface LifeWheelData {
  area_name: string;
  current_score: number;
  desired_score: number;
  achieved_score?: number | null;
  is_focus_area?: boolean;
  evolution_description?: string;
}

export interface ValuesData {
  value_name: string;
  selected: boolean;
}

export interface VisionData {
  vision_1y?: string;
  vision_3y?: string;
  vision_5y?: string;
  word_year?: string;
  phrase_year?: string;
}

const LIFE_AREAS_BY_CATEGORY = {
  'Life Quality': ['Hobbies', 'Fulfillment', 'Spirituality'],
  Personal: ['Health', 'Intellectual', 'Emotional'],
  Professional: ['Engagement', 'Finances', 'Impact'],
  Relationships: ['Colleagues', 'Partner', 'Family'],
};

const LIFE_AREAS = Object.values(LIFE_AREAS_BY_CATEGORY).flat();

const PREDEFINED_VALUES = {
  'Identity & Integrity': ['Authenticity', 'Responsibility', 'Honesty', 'Discipline', 'Courage', 'Reliability'],
  'Growth & Mastery': ['Learning', 'Curiosity', 'Excellence', 'Innovation', 'Resilience', 'Ambition'],
  'Connection & Community': ['Empathy', 'Belonging', 'Collaboration', 'Diversity', 'Family', 'Generosity'],
  'Well-being & Balance': ['Health', 'Stability', 'Mindfulness', 'Joy', 'Simplicity', 'Peace'],
  'Purpose & Impact': ['Freedom', 'Contribution', 'Creativity', 'Sustainability', 'Leadership', 'Vision'],
};

const VISION_YEAR_MAPPINGS: Array<{ key: 'vision_3y' | 'vision_5y'; offset: number; label: string }> = [
  { key: 'vision_3y', offset: 3, label: '3y vision' },
  { key: 'vision_5y', offset: 5, label: '5y vision' },
];

const appendVisionReference = (existing: string | null | undefined, label: string, sourceYear: number, text: string) => {
  const trimmedText = text.trim();
  if (!trimmedText) return existing || null;

  const block = `${label} from ${sourceYear}: ${trimmedText}`;
  if (!existing || existing.trim().length === 0) return block;
  if (existing.includes(block)) return existing;
  return `${existing.trim()}\n\n${block}`;
};

interface SelfDiscoveryPayload {
  lifeWheelData: LifeWheelData[];
  previousYearLifeWheel: LifeWheelData[];
  valuesData: ValuesData[];
  visionData: VisionData;
}

const defaultLifeWheel = (): LifeWheelData[] =>
  LIFE_AREAS.map((area) => ({
    area_name: area,
    current_score: 5,
    desired_score: 8,
    achieved_score: null,
    is_focus_area: false,
  }));

const defaultValues = (): ValuesData[] =>
  Object.values(PREDEFINED_VALUES)
    .flat()
    .map((value_name) => ({ value_name, selected: false }));

export const useSelfDiscovery = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { selectedYear } = useYear();
  const queryClient = useQueryClient();
  const [guestLifeWheelData, setGuestLifeWheelData] = useState<LifeWheelData[]>(defaultLifeWheel);
  const [guestValuesData, setGuestValuesData] = useState<ValuesData[]>(defaultValues);
  const [guestVisionData, setGuestVisionData] = useState<VisionData>({});

  const key = queryKeys.selfDiscovery.byYear(user?.id, selectedYear);

  const dataQuery = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<SelfDiscoveryPayload> => {
      const [lifeRes, prevLifeRes, valuesRes, visionRes] = await Promise.all([
        supabase
          .from('life_wheel')
          .select('area_name, current_score, desired_score, achieved_score, is_focus_area')
          .eq('user_id', user!.id)
          .eq('year', selectedYear),
        supabase
          .from('life_wheel')
          .select('area_name, current_score, desired_score, achieved_score, is_focus_area')
          .eq('user_id', user!.id)
          .eq('year', selectedYear - 1),
        supabase.from('values').select('value_name, selected').eq('user_id', user!.id),
        supabase
          .from('vision')
          .select('vision_1y, vision_3y, vision_5y, word_year, phrase_year')
          .eq('user_id', user!.id)
          .eq('year', selectedYear)
          .maybeSingle(),
      ]);

      if (lifeRes.error) throw lifeRes.error;
      if (prevLifeRes.error) throw prevLifeRes.error;
      if (valuesRes.error) throw valuesRes.error;
      if (visionRes.error) throw visionRes.error;

      const mergedLifeWheel = defaultLifeWheel().map((defaultArea) => {
        const existing = lifeRes.data?.find((d) => d.area_name === defaultArea.area_name);
        return existing ? { ...existing, is_focus_area: existing.is_focus_area || false } : defaultArea;
      });

      const allValues: ValuesData[] = [];
      const predefined = Object.values(PREDEFINED_VALUES).flat();
      predefined.forEach((value) => {
        const existing = valuesRes.data?.find((d) => d.value_name === value);
        allValues.push({ value_name: value, selected: existing?.selected || false });
      });

      valuesRes.data?.forEach((d) => {
        if (!predefined.includes(d.value_name)) {
          allValues.push({ value_name: d.value_name, selected: d.selected });
        }
      });

      let visionData: VisionData = visionRes.data || {};
      if (!visionRes.data) {
        const { data: pastVisions, error } = await supabase
          .from('vision')
          .select('year, vision_1y, vision_3y, vision_5y')
          .eq('user_id', user!.id)
          .lt('year', selectedYear)
          .order('year', { ascending: false });

        if (error) throw error;

        const populated: VisionData = {};
        for (const pv of pastVisions || []) {
          if (pv.year + 1 === selectedYear && pv.vision_1y && !populated.vision_1y) populated.vision_1y = pv.vision_1y;
          if (pv.year + 3 === selectedYear && pv.vision_3y && !populated.vision_1y) populated.vision_1y = pv.vision_3y;
          if (pv.year + 5 === selectedYear && pv.vision_5y && !populated.vision_1y) populated.vision_1y = pv.vision_5y;
        }
        visionData = populated;
      }

      return {
        lifeWheelData: mergedLifeWheel,
        previousYearLifeWheel: prevLifeRes.data || [],
        valuesData: allValues,
        visionData,
      };
    },
  });

  const applyPatch = (patch: Partial<SelfDiscoveryPayload>) => {
    queryClient.setQueryData<SelfDiscoveryPayload>(key, (previous) => {
      if (!previous) return previous;
      return { ...previous, ...patch };
    });
  };

  const handleError = (description: string, error: unknown) => {
    console.error(description, error);
    toast({ title: 'Error', description, variant: 'destructive' });
  };

  const updateLifeWheelMutation = useMutation({
    mutationFn: async ({ areaName, updates }: { areaName: string; updates: Partial<LifeWheelData> }) => {
      if (!user) return;
      const currentData = (dataQuery.data?.lifeWheelData || []).find((d) => d.area_name === areaName);
      const mergedData = { ...currentData, ...updates };
      const { error } = await supabase.from('life_wheel').upsert(
        {
          user_id: user.id,
          area_name: areaName,
          year: selectedYear,
          current_score: mergedData.current_score || 5,
          desired_score: mergedData.desired_score || 8,
          is_focus_area: mergedData.is_focus_area ?? false,
          achieved_score: mergedData.achieved_score ?? null,
        },
        { onConflict: 'user_id,area_name,year' }
      );
      if (error) throw error;
    },
    onMutate: async ({ areaName, updates }) => {
      applyPatch({
        lifeWheelData: (dataQuery.data?.lifeWheelData || []).map((item) =>
          item.area_name === areaName ? { ...item, ...updates } : item
        ),
      });
    },
    onSuccess: () => {
      toast({ title: 'Saved', description: 'Life wheel updated successfully', duration: 2000 });
    },
    onError: (error) => {
      handleError("Couldn't save changes, please retry", error);
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const updateValuesMutation = useMutation({
    mutationFn: async ({ valueName, selected }: { valueName: string; selected: boolean }) => {
      if (!user) return;
      const { error } = await supabase
        .from('values')
        .upsert({ user_id: user.id, value_name: valueName, selected }, { onConflict: 'user_id,value_name' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Saved', description: 'Values updated successfully', duration: 2000 });
    },
    onError: (error) => {
      handleError("Couldn't save changes, please retry", error);
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const updateVisionMutation = useMutation({
    mutationFn: async (updates: Partial<VisionData>) => {
      if (!user) return;
      const nextVision = { ...(dataQuery.data?.visionData || {}), ...updates };
      const { error } = await supabase
        .from('vision')
        .upsert({ user_id: user.id, year: selectedYear, ...nextVision }, { onConflict: 'user_id,year' });
      if (error) throw error;

      for (const mapping of VISION_YEAR_MAPPINGS) {
        const visionText = nextVision[mapping.key];
        if (!visionText || !visionText.trim()) continue;

        const targetYear = selectedYear + mapping.offset;
        const { data: targetRow, error: targetFetchError } = await supabase
          .from('vision')
          .select('vision_1y')
          .eq('user_id', user.id)
          .eq('year', targetYear)
          .maybeSingle();

        if (targetFetchError) throw targetFetchError;

        const mergedVision1y = appendVisionReference(targetRow?.vision_1y, mapping.label, selectedYear, visionText);
        const { error: targetUpsertError } = await supabase
          .from('vision')
          .upsert({ user_id: user.id, year: targetYear, vision_1y: mergedVision1y }, { onConflict: 'user_id,year' });

        if (targetUpsertError) throw targetUpsertError;
      }
    },
    onSuccess: () => {
      toast({ title: 'Saved', description: 'Vision updated successfully', duration: 2000 });
      queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (error) => {
      handleError("Couldn't save changes, please retry", error);
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const lifeWheelData = user ? dataQuery.data?.lifeWheelData || [] : guestLifeWheelData;
  const previousYearLifeWheel = user ? dataQuery.data?.previousYearLifeWheel || [] : [];
  const valuesData = user ? dataQuery.data?.valuesData || [] : guestValuesData;
  const visionData = user ? dataQuery.data?.visionData || {} : guestVisionData;

  const updateLifeWheel = async (areaName: string, updates: Partial<LifeWheelData>) => {
    if (!user) {
      setGuestLifeWheelData((previous) =>
        previous.map((item) => (item.area_name === areaName ? { ...item, ...updates } : item))
      );
      return;
    }
    await updateLifeWheelMutation.mutateAsync({ areaName, updates });
  };

  const updateValues = async (valueName: string, selected: boolean) => {
    const sourceValues = user ? dataQuery.data?.valuesData || [] : valuesData;
    const currentSelected = sourceValues.filter((v) => v.selected).length;
    if (selected && currentSelected >= 7) {
      toast({ title: 'Maximum reached', description: 'You can select up to 7 values only', variant: 'destructive' });
      return;
    }

    if (!user) {
      setGuestValuesData((previous) =>
        previous.map((item) => (item.value_name === valueName ? { ...item, selected } : item))
      );
      return;
    }

    applyPatch({
      valuesData: sourceValues.map((item) => (item.value_name === valueName ? { ...item, selected } : item)),
    });

    await updateValuesMutation.mutateAsync({ valueName, selected });
  };

  const updateVision = async (updates: Partial<VisionData>) => {
    if (!user) {
      setGuestVisionData((previous) => ({ ...previous, ...updates }));
      return;
    }
    applyPatch({ visionData: { ...(dataQuery.data?.visionData || {}), ...updates } });
    await updateVisionMutation.mutateAsync(updates);
  };

  const selectedValuesCount = valuesData.filter((v) => v.selected).length;

  return {
    loading: user ? dataQuery.isLoading : false,
    saving:
      updateLifeWheelMutation.isPending ||
      updateValuesMutation.isPending ||
      updateVisionMutation.isPending,
    lifeWheelData,
    previousYearLifeWheel,
    valuesData,
    visionData,
    selectedValuesCount,
    updateLifeWheel,
    updateValues,
    updateVision,
    PREDEFINED_VALUES,
    LIFE_AREAS,
    LIFE_AREAS_BY_CATEGORY,
  };
};
