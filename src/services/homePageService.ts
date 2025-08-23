import { supabase } from "@/integrations/supabase/client";

export interface OptionButton {
  id: number;
  text: string;
  defaultText: string;
}

export interface HomePageSettings {
  id?: string;
  profileId: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  interactiveTitle: string;
  interactiveSubtitle: string;
  customInputPlaceholder: string;
  submitButtonText: string;
  footerName: string;
  optionButtons: OptionButton[];
  updatedAt?: string;
}

export const DEFAULT_HOME_PAGE_SETTINGS: Omit<HomePageSettings, 'id' | 'profileId' | 'updatedAt'> = {
  heroTitle: 'Chen Quintice',
  heroSubtitle: 'AI Product Management Expert & Consultant',
  heroDescription: 'Specialized in AI implementation strategies, team training, and product development with over 10 years of experience helping businesses integrate cutting-edge technologies.',
  interactiveTitle: 'How Can I Help You Today?',
  interactiveSubtitle: 'Select a purpose or enter your own to see the most relevant information.',
  customInputPlaceholder: 'Tell me why you\'re visiting this website...',
  submitButtonText: 'Submit',
  footerName: 'Chen Quintice',
  optionButtons: [
    {
      id: 1,
      text: 'HR',
      defaultText: 'I\'m an HR professional in [___] field company, seeking an AI Product Manager expert in the latest technology'
    },
    {
      id: 2,
      text: 'Company Owner',
      defaultText: 'I\'m a company owner, I\'m seeking a consultant to help with AI implementation and team training'
    }
  ]
};

function isValidOptionButton(obj: any): obj is OptionButton {
  return obj && 
         typeof obj === 'object' && 
         (typeof obj.id === 'number' || typeof obj.id === 'string') && 
         typeof obj.text === 'string' && 
         typeof obj.defaultText === 'string' &&
         // Filter out corrupted data with 'lv' field
         !obj.lv;
}

function transformToOptionButtons(data: any): OptionButton[] {
  if (!Array.isArray(data)) {
    return [];
  }
  
  return data
    .filter(isValidOptionButton)
    .map((button, index) => ({
      id: typeof button.id === 'string' ? parseInt(button.id) || (index + 1) : button.id,
      text: button.text,
      defaultText: button.defaultText
    }));
}

export async function getHomePageSettingsByProfileId(profileId: string): Promise<HomePageSettings | null> {
  try {
    console.log(`Fetching home page settings for profile ID: ${profileId}`);
    
    const { data, error } = await supabase
      .from('home_page_settings')
      .select('*')
      .eq('profile_id', profileId)
      .single();
    
    if (error) {
      console.error('Error fetching home page settings:', error);
      return null;
    }
    
    // Transform from snake_case to camelCase and ensure proper typing
    const optionButtons = transformToOptionButtons(data.option_buttons);
    
    return {
      id: data.id,
      profileId: data.profile_id,
      heroTitle: data.hero_title,
      heroSubtitle: data.hero_subtitle,
      heroDescription: data.hero_description,
      interactiveTitle: data.interactive_title,
      interactiveSubtitle: data.interactive_subtitle,
      customInputPlaceholder: data.custom_input_placeholder,
      submitButtonText: data.submit_button_text,
      footerName: data.footer_name,
      optionButtons: optionButtons,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Exception fetching home page settings:', error);
    return null;
  }
}

export async function saveHomePageSettings(settings: HomePageSettings): Promise<HomePageSettings | null> {
  try {
    console.log(`Saving home page settings for profile ID: ${settings.profileId}`);
    
    // Transform from camelCase to snake_case and ensure JSONB compatibility
    const formattedSettings = {
      profile_id: settings.profileId,
      hero_title: settings.heroTitle,
      hero_subtitle: settings.heroSubtitle,
      hero_description: settings.heroDescription,
      interactive_title: settings.interactiveTitle,
      interactive_subtitle: settings.interactiveSubtitle,
      custom_input_placeholder: settings.customInputPlaceholder,
      submit_button_text: settings.submitButtonText,
      footer_name: settings.footerName,
      option_buttons: settings.optionButtons.map(button => ({
        id: button.id,
        text: button.text,
        defaultText: button.defaultText
      })),
      updated_at: new Date().toISOString()
    };

    const { data: existingSettings } = await supabase
      .from('home_page_settings')
      .select('id')
      .eq('profile_id', settings.profileId)
      .single();

    let result;
    
    if (existingSettings) {
      // Update existing settings
      result = await supabase
        .from('home_page_settings')
        .update(formattedSettings)
        .eq('profile_id', settings.profileId)
        .select();
    } else {
      // Insert new settings
      result = await supabase
        .from('home_page_settings')
        .insert(formattedSettings)
        .select();
    }

    const { data, error } = result;
    
    if (error) {
      console.error('Error saving home page settings:', error);
      return null;
    }
    
    // Transform back to camelCase
    return getHomePageSettingsByProfileId(settings.profileId);
  } catch (error) {
    console.error('Exception saving home page settings:', error);
    return null;
  }
}

export async function getHomePageSettingsByUrlParam(urlParam: string): Promise<HomePageSettings | null> {
  try {
    console.log(`Fetching home page settings for URL parameter: ${urlParam}`);
    
    // First get the profile ID for this URL parameter
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('url_param', urlParam)
      .single();
    
    if (profileError || !profile) {
      console.error('Error fetching profile by URL parameter:', profileError);
      return null;
    }
    
    const settings = await getHomePageSettingsByProfileId(profile.id);
    return settings;
  } catch (error) {
    console.error('Exception fetching home page settings by URL parameter:', error);
    return null;
  }
}
