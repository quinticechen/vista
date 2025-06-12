
# Website Customization Documentation

This document outlines the website customization features available in the Vista platform, allowing users to edit basic content and select styling options.

## Overview

The website customization system enables users to:
- Edit basic website content (titles, descriptions, contact information)
- Select from pre-designed style templates
- Apply custom styling with real-time preview
- Maintain brand consistency across all content

## Core Components

### WebsiteSettings Model

```typescript
interface WebsiteSettings {
  id: UUID;
  profileId: UUID;
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  contactEmail: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  customCss: JsonB;
  updatedAt: Date;
}
```

### StyleTemplate Model

```typescript
interface StyleTemplate {
  id: UUID;
  name: string;
  description: string;
  category: string;
  styles: JsonB;
  previewImageUrl: string;
  isActive: boolean;
  createdAt: Date;
}
```

## User Interface Components

### WebsiteEditor Component

The `WebsiteEditor` component provides:
- Form fields for editing basic content
- Color picker for brand colors
- Font selection dropdown
- Logo upload functionality
- Real-time preview pane
- Save/reset functionality

### StyleEditor Component

The `StyleEditor` component offers:
- Grid of available style templates
- Template preview with hover effects
- Custom style override options
- Live preview of changes
- One-click template application

## API Endpoints

### Website Settings

- `GET /api/website-settings/:userId` - Retrieve current settings
- `PUT /api/website-settings/:userId` - Update settings
- `POST /api/website-settings/:userId/preview` - Generate preview

### Style Templates

- `GET /api/style-templates` - List available templates
- `GET /api/style-templates/:id` - Get specific template
- `POST /api/style-templates/:id/apply` - Apply template to user

## Database Schema

### website_settings table

```sql
CREATE TABLE website_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hero_title TEXT,
  hero_subtitle TEXT,
  about_text TEXT,
  contact_email TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#10B981',
  font_family TEXT DEFAULT 'Inter',
  custom_css JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id)
);
```

### style_templates table

```sql
CREATE TABLE style_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  styles JSONB NOT NULL,
  preview_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Style System

### Template Categories

1. **Professional** - Clean, corporate styles
2. **Creative** - Vibrant, artistic designs
3. **Minimal** - Simple, focused layouts
4. **Modern** - Contemporary design trends
5. **Classic** - Timeless, traditional styles

### CSS Variables

Templates use CSS custom properties for easy customization:

```css
:root {
  --primary-color: #3B82F6;
  --secondary-color: #10B981;
  --font-family: 'Inter', sans-serif;
  --header-bg: var(--primary-color);
  --text-color: #1F2937;
  --border-radius: 8px;
}
```

### Responsive Design

All templates include:
- Mobile-first responsive breakpoints
- Flexible grid systems
- Scalable typography
- Touch-friendly interfaces

## Security Considerations

### Input Validation

- Sanitize all user-provided CSS
- Whitelist allowed CSS properties
- Prevent XSS through style injection
- Validate color values and fonts

### Access Control

- Users can only edit their own website settings
- Admin approval required for custom CSS
- Template modifications restricted to admins

## Performance Optimization

### Caching Strategy

- Template styles cached in browser
- Settings cached with 5-minute TTL
- Preview generation throttled
- CSS compilation optimized

### Asset Management

- Logo uploads processed and optimized
- Multiple image sizes generated
- CDN delivery for static assets
- Lazy loading for template previews

## Testing Strategy

### Unit Tests

- Component rendering tests
- Style application validation
- Settings persistence verification
- Preview generation accuracy

### Integration Tests

- End-to-end customization flow
- Template switching scenarios
- Real-time preview functionality
- Mobile responsiveness validation

## Migration Plan

### Phase 1: Basic Editor
- Implement WebsiteSettings model
- Create basic content editing UI
- Add settings persistence

### Phase 2: Style Templates
- Design template system
- Create initial template library
- Implement template application

### Phase 3: Advanced Features
- Custom CSS support
- Advanced color schemes
- Typography options
- Brand asset management

### Phase 4: Enhancement
- Template marketplace
- Advanced preview modes
- Collaboration features
- Version history

## Best Practices

### Content Guidelines

- Keep hero titles under 60 characters
- Ensure high contrast for accessibility
- Use web-safe fonts as fallbacks
- Optimize images for web delivery

### Style Guidelines

- Maintain consistent spacing
- Follow accessibility color ratios
- Use semantic HTML structure
- Test across major browsers

### Performance Guidelines

- Minimize CSS bundle size
- Use efficient selectors
- Optimize image assets
- Monitor loading times

## Troubleshooting

### Common Issues

1. **Styles not applying**: Check CSS validation
2. **Preview not updating**: Clear template cache
3. **Mobile layout broken**: Verify responsive breakpoints
4. **Fonts not loading**: Ensure web font availability

### Debug Tools

- Style validation endpoint
- Preview generation logs
- Template application history
- Performance monitoring
