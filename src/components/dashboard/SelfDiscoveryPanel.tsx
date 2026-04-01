import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Compass, Heart, Star, Sparkles, ArrowRight, Quote } from 'lucide-react';
import { SelfDiscoveryPanelData } from '@/hooks/useDashboardStats';
import { useNavigate } from 'react-router-dom';
interface SelfDiscoveryPanelProps {
  data: SelfDiscoveryPanelData;
  isLoading: boolean;
  isGuest: boolean;
}
export const SelfDiscoveryPanel = ({
  data,
  isLoading,
  isGuest
}: SelfDiscoveryPanelProps) => {
  const navigate = useNavigate();
  if (isLoading) {
    return <Card className="glass-card shadow-card">
        <CardHeader className="pb-3">
          <div className="h-6 bg-muted/50 rounded animate-pulse w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            <div className="h-12 bg-muted/50 rounded-lg animate-pulse" />
          </div>
        </CardContent>
      </Card>;
  }
  const hasData = data.topValues.length > 0 || data.focusAreas.length > 0 || data.visionWord;
  if (isGuest || !hasData) {
    return <Card className="glass-card shadow-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            Self-Discovery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-medium">Discover Yourself</p>
              <p className="text-sm text-muted-foreground mt-1">
                Explore your values, life areas, and create your vision for growth.
              </p>
            </div>
            <Button onClick={() => navigate('/self-discovery')}>
              Start Discovery
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="glass-card shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            Self-Discovery
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/self-discovery')}>
            Edit
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vision word/phrase */}
        {(data.visionWord || data.visionPhrase) && <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/5 border border-primary/10">
            <div className="flex items-start gap-3">
              <Quote className="w-5 h-5 text-primary mt-0.5" />
              <div>
                {data.visionWord && <p className="font-bold text-lg text-primary">{data.visionWord}</p>}
                {data.visionPhrase && <p className="text-sm text-muted-foreground mt-1 italic">
                    "{data.visionPhrase}"
                  </p>}
              </div>
            </div>
          </div>}

        {/* Core Values */}
        {data.topValues.length > 0 && <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium">Core Values</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.topValues.map(value => <Badge key={value} variant="outline" className="bg-destructive/5 border-destructive/20 text-foreground">
                  {value}
                </Badge>)}
            </div>
          </div>}

        {/* Focus Areas */}
        {data.focusAreas.length > 0 && <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium">Focus Areas</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.focusAreas.map(area => <Badge key={area} variant="outline" className="bg-warning/5 border-warning/20 text-foreground">
                  {area}
                </Badge>)}
            </div>
          </div>}

        {/* Growth Areas */}
        {data.growthAreas.length > 0 && <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium">Growth Opportunities</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.growthAreas.map(area => <Badge key={area} variant="secondary" className="text-xs bg-slate-300 text-primary-foreground">
                  {area}
                </Badge>)}
            </div>
          </div>}
      </CardContent>
    </Card>;
};