import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Settings, FileText, Zap, Link, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  isCompleted: boolean;
  isOptional?: boolean;
}

interface UserOnboardingGuideProps {
  user: any;
  profile: any;
}

const UserOnboardingGuide = ({ user, profile }: UserOnboardingGuideProps) => {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      checkCompletionStatus();
    }
  }, [user, profile]);

  const checkCompletionStatus = async () => {
    try {
      setLoading(true);
      
      // Check home page settings
      const { data: homePageSettings } = await supabase
        .from('home_page_settings')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      // Check if content exists
      const { data: contentItems } = await supabase
        .from('content_items')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // Check if embeddings exist
      const { data: embeddingJobs } = await supabase
        .from('embedding_jobs')
        .select('*')
        .eq('created_by', user.id)
        .eq('status', 'completed')
        .limit(1);

      const onboardingSteps: OnboardingStep[] = [
        {
          id: 'home-page',
          title: 'Home Page Settings',
          description: 'Configure your custom home page content and branding',
          icon: Settings,
          path: '/admin/home-page',
          isCompleted: !!homePageSettings
        },
        {
          id: 'notion-sync',
          title: 'Sync Notion Content',
          description: 'Connect your Notion workspace to sync content',
          icon: FileText,
          path: '/admin/content',
          isCompleted: !!contentItems && contentItems.length > 0
        },
        {
          id: 'embeddings',
          title: 'Generate Embeddings',
          description: 'Create AI embeddings for content search and discovery',
          icon: Zap,
          path: '/admin/embedding',
          isCompleted: !!embeddingJobs && embeddingJobs.length > 0
        },
        {
          id: 'url-param',
          title: 'Custom URL Parameter',
          description: 'Set up your custom URL for personalized branding',
          icon: Link,
          path: '/admin/url-settings',
          isCompleted: !!profile?.url_param
        },
        {
          id: 'language',
          title: 'Language Settings',
          description: 'Configure multi-language support and translations',
          icon: Globe,
          path: '/admin/language-settings',
          isCompleted: profile?.supported_ai_languages && profile.supported_ai_languages.length > 1,
          isOptional: true
        }
      ];

      setSteps(onboardingSteps);
    } catch (error) {
      console.error('Error checking completion status:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedSteps = steps.filter(step => step.isCompleted).length;
  const totalSteps = steps.filter(step => !step.isOptional).length;
  const optionalSteps = steps.filter(step => step.isOptional).length;

  const handleStepClick = (path: string) => {
    navigate(path);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Loading your onboarding progress...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Getting Started
          <Badge variant={completedSteps === totalSteps ? "default" : "secondary"}>
            {completedSteps}/{totalSteps} Required Steps Complete
          </Badge>
        </CardTitle>
        <CardDescription>
          Complete these steps to set up your Vista platform. Optional steps can enhance your experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                step.isCompleted 
                  ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                  : 'bg-muted/50 hover:bg-muted'
              }`}
              onClick={() => handleStepClick(step.path)}
            >
              <div className="flex items-center justify-center w-8 h-8">
                {step.isCompleted ? (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-muted-foreground/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                  </div>
                )}
              </div>
              
              <step.icon className="w-5 h-5 text-muted-foreground" />
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">{step.title}</h4>
                  {step.isOptional && (
                    <Badge variant="outline" className="text-xs">
                      Optional
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              
              <Button variant="outline" size="sm">
                {step.isCompleted ? 'Review' : 'Setup'}
              </Button>
            </div>
          ))}
        </div>
        
        {completedSteps === totalSteps && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-800">
              <Check className="w-5 h-5" />
              <span className="font-medium">Great job! You've completed all required setup steps.</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Your Vista platform is ready to use. Don't forget to complete the optional language settings if needed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserOnboardingGuide;