import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSelfDiscovery } from '@/hooks/useSelfDiscovery';
import { Goal } from '@/hooks/useGoals';
import { X } from 'lucide-react';

interface GoalFiltersProps {
  goals: Goal[];
  selectedFilters: string[];
  onFilterChange: (filters: string[]) => void;
}

export const GoalFilters = ({ goals, selectedFilters, onFilterChange }: GoalFiltersProps) => {
  const { lifeWheelData, valuesData } = useSelfDiscovery();

  const lifeAreas = lifeWheelData.map(item => item.area_name);
  const selectedValues = valuesData.filter(v => v.selected).map(v => v.value_name);

  // Count goals per life area
  const areaCount = (area: string) => {
    return goals.filter(goal => 
      Array.isArray(goal.life_wheel_area) 
        ? goal.life_wheel_area.includes(area)
        : goal.life_wheel_area === area
    ).length;
  };

  // Count goals per value
  const valueCount = (value: string) => {
    return goals.filter(goal => 
      goal.related_values?.includes(value)
    ).length;
  };

  // Sort life areas by count (descending)
  const sortedLifeAreas = [...lifeAreas].sort((a, b) => areaCount(b) - areaCount(a));

  // Sort values by count (descending)
  const sortedValues = [...selectedValues].sort((a, b) => valueCount(b) - valueCount(a));

  const toggleFilter = (filter: string) => {
    if (selectedFilters.includes(filter)) {
      onFilterChange(selectedFilters.filter(f => f !== filter));
    } else {
      onFilterChange([...selectedFilters, filter]);
    }
  };

  const clearFilters = () => {
    onFilterChange([]);
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filter by Life Areas & Values</h3>
        {selectedFilters.length > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            aria-label="Clear all filters"
          >
            <X size={14} />
            Clear filters
          </button>
        )}
      </div>

      {/* Life Areas */}
      {sortedLifeAreas.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Life Areas</p>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {sortedLifeAreas.map(area => {
                const count = areaCount(area);
                const isSelected = selectedFilters.includes(area);
                return (
                  <Badge
                    key={area}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer hover:scale-105 transition-transform min-h-[44px] px-4 text-sm font-medium"
                    onClick={() => toggleFilter(area)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onKeyDown={(e) => e.key === 'Enter' && toggleFilter(area)}
                  >
                    {area} ({count})
                  </Badge>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Values */}
      {sortedValues.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Values</p>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {sortedValues.map(value => {
                const count = valueCount(value);
                const isSelected = selectedFilters.includes(value);
                return (
                  <Badge
                    key={value}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer hover:scale-105 transition-transform min-h-[44px] px-4 text-sm font-medium bg-background border-2"
                    onClick={() => toggleFilter(value)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onKeyDown={(e) => e.key === 'Enter' && toggleFilter(value)}
                  >
                    {value} ({count})
                  </Badge>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
};