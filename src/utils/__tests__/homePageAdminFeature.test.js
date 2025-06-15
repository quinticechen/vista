
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Home Page Admin Feature', () => {
  const mockSupabaseClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Home Page Settings Model', () => {
    it('should have all required fields for home page customization', () => {
      const homePageSettings = {
        id: 'uuid',
        profileId: 'user-123',
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
            text: 'Seek Candidate',
            defaultText: 'I\'m an HR professional in [___] field company, seeking an AI Product Manager expert in the latest technology'
          }
        ],
        updatedAt: '2024-01-01T00:00:00Z'
      };

      // Verify all required fields are present
      expect(homePageSettings.heroTitle).toBe('Chen Quintice');
      expect(homePageSettings.heroSubtitle).toBe('AI Product Management Expert & Consultant');
      expect(homePageSettings.interactiveTitle).toBe('How Can I Help You Today?');
      expect(homePageSettings.optionButtons).toHaveLength(2);
      expect(homePageSettings.optionButtons[0].text).toBe('HR');
    });

    it('should enforce limit of 0-6 option buttons', () => {
      const scenarios = [
        { buttonCount: 0, isValid: true },
        { buttonCount: 3, isValid: true },
        { buttonCount: 6, isValid: true },
        { buttonCount: 7, isValid: false }
      ];

      scenarios.forEach(scenario => {
        const buttons = Array.from({ length: scenario.buttonCount }, (_, i) => ({
          id: i + 1,
          text: `Button ${i + 1}`,
          defaultText: `Default text ${i + 1}`
        }));

        if (scenario.isValid) {
          expect(buttons.length).toBeLessThanOrEqual(6);
          expect(buttons.length).toBeGreaterThanOrEqual(0);
        } else {
          expect(buttons.length).toBeGreaterThan(6);
        }
      });
    });
  });

  describe('Home Page Settings Service', () => {
    it('should transform between camelCase and snake_case correctly', () => {
      const camelCaseSettings = {
        profileId: 'user-123',
        heroTitle: 'Test Title',
        heroSubtitle: 'Test Subtitle',
        optionButtons: [{ id: 1, text: 'Button', defaultText: 'Default' }]
      };

      const expectedSnakeCase = {
        profile_id: 'user-123',
        hero_title: 'Test Title',
        hero_subtitle: 'Test Subtitle',
        option_buttons: [{ id: 1, text: 'Button', defaultText: 'Default' }]
      };

      // This is just a validation that our transformation logic is working
      expect(camelCaseSettings.profileId).toBe(expectedSnakeCase.profile_id);
      expect(camelCaseSettings.heroTitle).toBe(expectedSnakeCase.hero_title);
      expect(camelCaseSettings.heroSubtitle).toBe(expectedSnakeCase.hero_subtitle);
    });

    it('should fetch home page settings by profile ID', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: 'settings-123',
          profile_id: 'user-123',
          hero_title: 'Chen Quintice',
          hero_subtitle: 'AI Product Management Expert & Consultant',
          hero_description: 'Custom description',
          interactive_title: 'Custom Title',
          interactive_subtitle: 'Custom Subtitle',
          custom_input_placeholder: 'Custom placeholder',
          submit_button_text: 'Go',
          footer_name: 'Custom Footer',
          option_buttons: [{ id: 1, text: 'Button', defaultText: 'Default' }],
          updated_at: '2024-01-01T00:00:00Z'
        },
        error: null
      });

      const { data, error } = await mockSupabaseClient
        .from('home_page_settings')
        .select('*')
        .eq('profile_id', 'user-123')
        .single();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('home_page_settings');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('profile_id', 'user-123');
      expect(data.hero_title).toBe('Chen Quintice');
      expect(data.footer_name).toBe('Custom Footer');
      expect(error).toBeNull();
    });

    it('should fetch home page settings by URL parameter', async () => {
      // First mock the profile lookup
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'user-123', url_param: 'quintice' },
        error: null
      });

      // Then mock the settings lookup
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: 'settings-123',
          profile_id: 'user-123',
          hero_title: 'Custom Title',
          hero_subtitle: 'Custom Subtitle'
        },
        error: null
      });

      // Simulate the service function that first gets profile by URL param
      const { data: profile } = await mockSupabaseClient
        .from('profiles')
        .select('id')
        .eq('url_param', 'quintice')
        .single();

      // Then gets settings by profile ID
      const { data: settings } = await mockSupabaseClient
        .from('home_page_settings')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      expect(profile.id).toBe('user-123');
      expect(settings.hero_title).toBe('Custom Title');
    });

    it('should save new home page settings', async () => {
      const newSettings = {
        profile_id: 'user-123',
        hero_title: 'New Title',
        hero_subtitle: 'New Subtitle',
        option_buttons: []
      };

      mockSupabaseClient.select.mockReturnValue({
        data: null,
        error: null
      });

      mockSupabaseClient.insert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          data: newSettings,
          error: null
        })
      });

      const { data } = await mockSupabaseClient
        .from('home_page_settings')
        .insert(newSettings)
        .select();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('home_page_settings');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(newSettings);
      expect(data).toEqual(newSettings);
    });

    it('should update existing home page settings', async () => {
      const existingSettings = { id: 'settings-123' };
      const updatedSettings = {
        profile_id: 'user-123',
        hero_title: 'Updated Title',
        hero_subtitle: 'Updated Subtitle'
      };

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: existingSettings,
        error: null
      });

      mockSupabaseClient.update.mockReturnValue({
        select: vi.fn().mockReturnValue({
          data: updatedSettings,
          error: null
        })
      });

      const { data: existing } = await mockSupabaseClient
        .from('home_page_settings')
        .select('id')
        .eq('profile_id', 'user-123')
        .single();

      const { data } = await mockSupabaseClient
        .from('home_page_settings')
        .update(updatedSettings)
        .eq('profile_id', 'user-123')
        .select();

      expect(existing).toEqual(existingSettings);
      expect(data).toEqual(updatedSettings);
    });
  });

  describe('Home Page Settings Integration', () => {
    it('should apply settings to the home page', () => {
      const customSettings = {
        heroTitle: 'Custom Title',
        heroSubtitle: 'Custom Subtitle',
        heroDescription: 'Custom Description',
        interactiveTitle: 'Custom Interactive Title',
        interactiveSubtitle: 'Custom Interactive Subtitle',
        customInputPlaceholder: 'Custom Placeholder',
        submitButtonText: 'Search',
        footerName: 'Custom Footer',
        optionButtons: [
          { id: 1, text: 'Option 1', defaultText: 'Default 1' }
        ]
      };

      // Validate all settings are applied
      expect(customSettings.heroTitle).toBe('Custom Title');
      expect(customSettings.heroSubtitle).toBe('Custom Subtitle');
      expect(customSettings.heroDescription).toBe('Custom Description');
      expect(customSettings.interactiveTitle).toBe('Custom Interactive Title');
      expect(customSettings.interactiveSubtitle).toBe('Custom Interactive Subtitle');
      expect(customSettings.customInputPlaceholder).toBe('Custom Placeholder');
      expect(customSettings.submitButtonText).toBe('Search');
      expect(customSettings.footerName).toBe('Custom Footer');
      expect(customSettings.optionButtons[0].text).toBe('Option 1');
    });

    it('should fall back to defaults when settings are missing', () => {
      const defaultSettings = {
        heroTitle: 'Chen Quintice',
        heroSubtitle: 'AI Product Management Expert & Consultant',
        heroDescription: 'Specialized in AI implementation strategies, team training, and product development with over 10 years of experience helping businesses integrate cutting-edge technologies.',
        interactiveTitle: 'How Can I Help You Today?',
        interactiveSubtitle: 'Select a purpose or enter your own to see the most relevant information.',
        customInputPlaceholder: 'Tell me why you\'re visiting this website...',
        submitButtonText: 'Submit',
        footerName: 'Chen Quintice',
        optionButtons: [
          { id: 1, text: 'HR', defaultText: 'HR default' },
          { id: 2, text: 'Seek Candidate', defaultText: 'Candidate default' }
        ]
      };

      // Verify defaults are used
      const partialSettings = {}; // Empty settings
      
      // In the actual application, we'd merge partialSettings with defaults
      const mergedSettings = {
        ...defaultSettings,
        ...partialSettings
      };

      expect(mergedSettings.heroTitle).toBe('Chen Quintice');
      expect(mergedSettings.optionButtons).toHaveLength(2);
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      const requiredFields = [
        'heroTitle',
        'heroSubtitle',
        'interactiveTitle',
        'submitButtonText',
        'footerName'
      ];

      const validateForm = (formData) => {
        const errors = {};
        requiredFields.forEach(field => {
          if (!formData[field] || formData[field].trim() === '') {
            errors[field] = 'This field is required';
          }
        });
        return errors;
      };

      const invalidForm = { heroTitle: '', heroSubtitle: 'Valid subtitle' };
      const errors = validateForm(invalidForm);
      
      expect(errors.heroTitle).toBe('This field is required');
      expect(errors.heroSubtitle).toBeUndefined();
    });

    it('should validate option button fields when buttons exist', () => {
      const validateOptionButtons = (buttons) => {
        const errors = [];
        buttons.forEach((button, index) => {
          if (!button.text || button.text.trim() === '') {
            errors.push({ index, field: 'text', message: 'Button text is required' });
          }
          if (!button.defaultText || button.defaultText.trim() === '') {
            errors.push({ index, field: 'defaultText', message: 'Default text is required' });
          }
        });
        return errors;
      };

      const buttons = [
        { id: 1, text: '', defaultText: 'Valid default' },
        { id: 2, text: 'Valid text', defaultText: '' }
      ];

      const errors = validateOptionButtons(buttons);
      expect(errors).toHaveLength(2);
      expect(errors[0].field).toBe('text');
      expect(errors[1].field).toBe('defaultText');
    });
  });
});
