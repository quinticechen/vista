
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { 
  HomePageSettings, 
  OptionButton, 
  DEFAULT_HOME_PAGE_SETTINGS, 
  getHomePageSettingsByProfileId, 
  saveHomePageSettings 
} from "@/services/homePageService";

// Define schema for validation
const optionButtonSchema = z.object({
  id: z.number(),
  text: z.string().min(1, "Button text is required"),
  defaultText: z.string().min(1, "Default text is required")
});

const homePageFormSchema = z.object({
  heroTitle: z.string().min(1, "Title is required"),
  heroSubtitle: z.string().min(1, "Subtitle is required"),
  heroDescription: z.string().min(1, "Description is required"),
  interactiveTitle: z.string().min(1, "Interactive section title is required"),
  interactiveSubtitle: z.string(),
  customInputPlaceholder: z.string(),
  submitButtonText: z.string().min(1, "Submit button text is required"),
  footerName: z.string().min(1, "Footer name is required"),
  optionButtons: z.array(optionButtonSchema).max(6, "Maximum 6 option buttons allowed")
});

type FormValues = z.infer<typeof homePageFormSchema>;

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(homePageFormSchema),
    defaultValues: {
      ...DEFAULT_HOME_PAGE_SETTINGS,
      optionButtons: DEFAULT_HOME_PAGE_SETTINGS.optionButtons.map((button, index) => ({
        ...button,
        id: index + 1
      }))
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "optionButtons"
  });

  // Fetch user ID and home page settings on component mount
  useEffect(() => {
    const fetchUserAndSettings = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);
          
          // Fetch existing settings
          const settings = await getHomePageSettingsByProfileId(user.id);
          
          if (settings) {
            // Update form values with existing settings
            form.reset({
              heroTitle: settings.heroTitle,
              heroSubtitle: settings.heroSubtitle,
              heroDescription: settings.heroDescription,
              interactiveTitle: settings.interactiveTitle,
              interactiveSubtitle: settings.interactiveSubtitle,
              customInputPlaceholder: settings.customInputPlaceholder,
              submitButtonText: settings.submitButtonText,
              footerName: settings.footerName,
              optionButtons: settings.optionButtons
            });
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching user data:", error);
        }
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserAndSettings();
  }, [form]);

  const onSubmit = async (data: FormValues) => {
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Ensure all optionButtons have required fields with proper types
      const validOptionButtons: OptionButton[] = data.optionButtons.map((button, index) => ({
        id: button.id ?? index + 1,
        text: button.text ?? '',
        defaultText: button.defaultText ?? ''
      }));
      
      // Prepare settings object with all required fields
      const settings: HomePageSettings = {
        profileId: userId,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        heroDescription: data.heroDescription,
        interactiveTitle: data.interactiveTitle,
        interactiveSubtitle: data.interactiveSubtitle || '',
        customInputPlaceholder: data.customInputPlaceholder || '',
        submitButtonText: data.submitButtonText,
        footerName: data.footerName,
        optionButtons: validOptionButtons
      };
      
      const result = await saveHomePageSettings(settings);
      
      if (result) {
        toast.success("Home page settings saved successfully");
      } else {
        toast.error("Failed to save home page settings");
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error saving home page settings:", error);
      }
      toast.error("An error occurred while saving");
    } finally {
      setIsLoading(false);
    }
  };

  const addOptionButton = () => {
    const optionButtons = form.getValues("optionButtons") || [];
    
    if (optionButtons.length >= 6) {
      toast.error("Maximum 6 options allowed");
      return;
    }
    
    append({
      id: optionButtons.length + 1,
      text: "",
      defaultText: ""
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Home Page Settings</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>
                Customize the main heading and description on your home page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="heroTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Chen Quintice" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="heroSubtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtitle</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="AI Product Management Expert & Consultant" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="heroDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Specialized in AI implementation strategies..." 
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Interactive Section</CardTitle>
              <CardDescription>
                Configure the interactive search section of your home page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="interactiveTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="How Can I Help You Today?" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="interactiveSubtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Subtitle</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Select a purpose or enter your own to see the most relevant information." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customInputPlaceholder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Input Placeholder</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Tell me why you're visiting this website..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="submitButtonText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Submit Button Text</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Submit" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-lg font-medium">Option Buttons ({fields.length}/6)</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addOptionButton}
                    disabled={fields.length >= 6}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Option
                  </Button>
                </div>
                
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground italic mb-4">
                    No option buttons defined. Add up to 6 buttons to provide quick selection options.
                  </p>
                )}
                
                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border p-4 rounded-md relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name={`optionButtons.${index}.text`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Button Text</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="HR" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`optionButtons.${index}.defaultText`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Search Text</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="I'm an HR professional in [___] field company, seeking an AI Product Manager expert in the latest technology" 
                                  className="min-h-[80px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Footer</CardTitle>
              <CardDescription>
                Customize the footer of your home page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="footerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Footer Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Chen Quintice" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default HomePage;
