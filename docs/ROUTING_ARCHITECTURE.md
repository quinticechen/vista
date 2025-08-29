# Vista Platform - Routing Architecture Update

## Overview

The Vista platform routing has been restructured to clearly separate four distinct page types with appropriate headers and footers.

## Page Categories

### 1. Product Introduction Pages
**Purpose**: Showcase Vista platform features and capabilities

**Routes**:
- `/` - Vista product homepage
- `/vista` - Global content discovery
- `/vista/:contentId` - Global content detail (deprecated)
- `/about` - About Vista platform  
- `/purpose-input` - Interactive content discovery
- `/auth` - Authentication

**Components**:
- **Header**: Standard product header with branding
- **Footer**: Vista-branded footer with platform navigation

### 2. Personal Pages  
**Purpose**: User-customized websites powered by Vista

**Routes**:
- `/:urlParam` - Personal homepage
- `/:urlParam/vista` - Personal content listing
- `/:urlParam/vista/:contentId` - Personal content detail

**Components**:
- **PersonalHeader**: Background matches vista page, includes:
  - Home button (→ `/:urlParam`)
  - Content button (→ `/:urlParam/vista`)
  - Subscribe button (email signup modal)
- **PersonalFooter**: Customized with:
  - Website name from admin settings
  - Author description from hero subtitle
  - Navigation: Home, Content, Explore, Create
  - Language switcher from user settings

### 3. Admin Pages
**Purpose**: Content and settings management

**Routes**:
- `/admin` - Admin dashboard
- `/admin/home-page` - Homepage customization
- `/admin/url-settings` - URL parameter settings
- `/admin/language-setting` - Language preferences
- `/admin/embedding` - Content embedding management
- `/admin/content` - Content management

**Components**:
- **AdminLayout**: Sidebar navigation with admin-specific UI

### 4. Blog Visitor Pages
**Purpose**: General platform features

**Routes**:
- `/account` - User account management

## New Features

### Subscription System
- Modal-based email subscription on Personal pages
- Database table: `subscriptions`
- RLS policies for secure access
- Toast notifications for user feedback

### Routing Logic
- Reserved routes prevent conflicts: `['admin', 'vista', 'about', 'auth', 'purpose-input']`
- Dynamic URL parameter detection
- Fallback handling for non-existent profiles

## Database Schema Changes

### Subscriptions Table
```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  profile_url_param TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);
```

## Component Architecture

### PersonalHeader
- Responsive navigation
- Dynamic URL parameter detection
- Subscription modal with email validation
- Background styling to match vista theme

### PersonalFooter  
- Fetches settings from home page configuration
- Dynamic website name and description
- Context-aware navigation links
- Integrated language switcher

## Security Considerations

### RLS Policies
- Public subscription creation allowed
- Users can only view subscriptions for their URL parameters
- Proper indexing for performance

### Input Validation
- Email format validation in subscription modal
- XSS protection through React's built-in escaping
- Proper error handling with user feedback

## Performance Optimizations

- Component-level state management
- Efficient database queries with proper indexing
- Lazy loading of settings data
- Optimized re-renders with proper dependency arrays

## Testing Strategy

All functionality covered by comprehensive test suite in:
- `src/utils/__tests__/routingRestructure.test.js`

Test categories:
- Route accessibility verification
- Component separation validation  
- Subscription functionality testing
- Navigation flow verification
- Security policy testing

## Future Enhancements

- Email notification system integration
- Advanced subscription preferences
- Analytics tracking for subscription conversions
- A/B testing for subscription modal placement