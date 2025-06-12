
# Vista Platform - Development Guide

This guide provides comprehensive information for developers working on the Vista platform, following Document-driven Test-driven Development (DTDD) principles.

## Overview

Vista is built using modern web technologies with a focus on AI-powered content personalization, privacy-first design, and seamless user experience. The platform follows DTDD methodology where documentation drives test creation, which in turn drives implementation.

## Technology Stack

### Frontend
- **React 18** - Component-based UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Component library
- **React Router DOM** - Client-side routing
- **Framer Motion** - Animation library
- **React Query (@tanstack/react-query)** - Data fetching and state management

### Backend & Infrastructure
- **Supabase** - Backend-as-a-Service (Database, Auth, Storage, Edge Functions)
- **PostgreSQL** - Primary database
- **Edge Functions** - Serverless functions for API endpoints

### AI & Content Processing
- **OpenAI API** - Embeddings and translations
- **Vector Search** - Semantic content discovery
- **Notion API** - Content synchronization

### Testing & Development
- **Vitest** - Unit testing framework
- **Jest DOM** - DOM testing utilities
- **GitHub Actions** - CI/CD pipeline
- **Husky** - Git hooks
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Architecture Principles

### Document-driven Test-driven Development (DTDD)

1. **Documentation First**: All features begin with documentation updates
2. **Test Creation**: Tests are written based on documentation requirements
3. **Implementation**: Code is written to pass the tests
4. **Validation**: Features are validated against original documentation

### Component Architecture

- **Atomic Design**: Components organized by complexity (atoms, molecules, organisms)
- **Separation of Concerns**: Business logic separated from presentation
- **Reusability**: Components designed for maximum reuse
- **Type Safety**: Full TypeScript coverage

### Data Flow

- **Unidirectional Data Flow**: Props down, events up
- **State Management**: React Query for server state, React hooks for local state
- **Real-time Updates**: Supabase real-time subscriptions
- **Caching**: Intelligent caching with React Query

## Testing Strategy

### Automated Testing Setup

The project uses Vitest as the primary testing framework with the following configuration:

#### Test Scripts
```bash
npm test          # Run all tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ui       # Run tests with Vitest UI
```

#### CI/CD Integration
- **GitHub Actions**: Automated testing on push and pull requests
- **Pre-commit Hooks**: Tests run before commits via Husky
- **Coverage Reporting**: Minimum 80% coverage threshold
- **Quality Gates**: Tests must pass before merge

#### Test Organization
```
src/
├── utils/
│   └── __tests__/          # Utility function tests
├── components/
│   └── __tests__/          # Component tests
├── services/
│   └── __tests__/          # Service layer tests
└── test/
    ├── setup.ts            # Test configuration
    └── helpers/            # Test utilities
```

### Test Categories

#### 1. Unit Tests
- Individual component functionality
- Utility function behavior
- Service method validation
- State management logic

#### 2. Integration Tests
- Component interaction
- API integration
- Authentication flows
- Data persistence

#### 3. Feature Tests
- End-to-end user workflows
- Business logic validation
- Cross-component functionality
- Performance requirements

### DTDD Test Methodology

#### Test Naming Convention
Tests are named to reflect the feature or requirement they validate:

```javascript
describe('Notion Webhook Syncing Feature', () => {
  test('should display Notion template link', () => {
    // Test implementation
  });
  
  test('should save Notion settings correctly', () => {
    // Test implementation
  });
});
```

#### Test-Driven Development Flow
1. **Red**: Write failing test based on documentation
2. **Green**: Write minimal code to pass test
3. **Refactor**: Improve code while keeping tests green
4. **Document**: Update documentation if needed

## Project Structure

```
vista/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (shadcn)
│   │   ├── content/        # Content-specific components
│   │   └── notion/         # Notion rendering components
│   ├── pages/              # Route components
│   │   ├── admin/          # Admin dashboard pages
│   │   └── auth/           # Authentication pages
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API and business logic
│   ├── utils/              # Utility functions
│   ├── integrations/       # Third-party integrations
│   └── test/               # Test configuration and utilities
├── docs/                   # Documentation
├── supabase/               # Database and edge functions
├── public/                 # Static assets
└── __tests__/              # Global test files
```

## Feature Development Workflow

### 1. Documentation Update
- Update relevant documentation (PRD, technical specs)
- Define user stories and acceptance criteria
- Create or update class diagrams if needed

### 2. Test Creation
- Write tests based on documentation requirements
- Ensure tests cover all specified functionality
- Run tests to confirm they fail (Red phase)

### 3. Implementation
- Write minimal code to make tests pass (Green phase)
- Implement full functionality iteratively
- Refactor code for maintainability (Refactor phase)

### 4. Integration
- Test integration with existing features
- Update related components if necessary
- Ensure all existing tests still pass

### 5. Documentation Review
- Update implementation documentation
- Review and update class diagrams
- Validate against original requirements

## Core Features

### 1. Content Management
- **Notion Integration**: Seamless content synchronization
- **Rich Media Support**: Images, videos, documents
- **Version Control**: Content versioning and history
- **Translation**: Multi-language content support

### 2. AI-Powered Features
- **Semantic Search**: Vector-based content discovery
- **Content Personalization**: AI-driven recommendations
- **Automated Translation**: Multi-language support
- **Embedding Generation**: Content vectorization

### 3. User Management
- **Authentication**: Supabase Auth integration
- **Authorization**: Role-based access control
- **Profile Management**: User preferences and settings
- **Admin Dashboard**: Administrative controls

### 4. Website Customization
- **Content Editor**: Basic website content editing
- **Style Templates**: Pre-designed styling options
- **Real-time Preview**: Live preview of changes
- **Brand Consistency**: Logo, colors, and typography management

### 5. Analytics & Reporting
- **Usage Analytics**: Content engagement tracking
- **Performance Metrics**: Search and recommendation analytics
- **User Behavior**: Interaction patterns and preferences

## API Documentation

### REST Endpoints

#### Content Management
- `GET /api/content` - List user content
- `GET /api/content/:id` - Get specific content
- `POST /api/content` - Create new content
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content

#### User Management
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

#### Website Customization
- `GET /api/website-settings` - Get website settings
- `PUT /api/website-settings` - Update website settings
- `GET /api/style-templates` - List available templates
- `POST /api/style-templates/:id/apply` - Apply style template

### Edge Functions
- `sync-notion-database` - Notion content synchronization
- `notion-webhook` - Webhook event handling
- `generate-embeddings` - Content vectorization
- `generate-query-embedding` - Search query vectorization
- `get-translation-key` - Translation service access

## Database Schema

### Core Tables
- `profiles` - User profiles and settings
- `content_items` - Main content storage
- `text_content` - Text-based content
- `image_content` - Image metadata
- `video_content` - Video metadata
- `embedding_jobs` - Background job tracking
- `notion_webhook_verifications` - Webhook security tokens
- `website_settings` - User website customization
- `style_templates` - Available styling options

### Relationships
- One-to-many: Profile → Content Items
- One-to-many: Content Item → Media Content
- One-to-one: Profile → Website Settings
- Many-to-one: Profile → Style Template

## Development Guidelines

### Code Standards
- **TypeScript**: All code must be properly typed
- **ESLint**: Follow configured linting rules
- **Prettier**: Consistent code formatting
- **Naming**: Use descriptive, self-documenting names

### Component Guidelines
- **Single Responsibility**: Each component has one clear purpose
- **Props Interface**: Define clear TypeScript interfaces
- **Error Boundaries**: Handle errors gracefully
- **Accessibility**: Follow WCAG guidelines

### Testing Guidelines
- **Test Coverage**: Minimum 80% coverage required
- **Test Isolation**: Tests should not depend on each other
- **Meaningful Assertions**: Test behavior, not implementation
- **Documentation**: Tests serve as living documentation

### Performance Guidelines
- **Lazy Loading**: Load components and routes as needed
- **Memoization**: Use React.memo and useMemo appropriately
- **Bundle Optimization**: Minimize bundle size
- **Caching**: Implement appropriate caching strategies

## Security Considerations

### Authentication
- JWT tokens for session management
- Refresh token rotation
- Session timeout handling
- Multi-factor authentication support

### Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- API endpoint protection
- Admin privilege separation

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF token validation

### Privacy Compliance
- GDPR compliance features
- Data export capabilities
- Right to deletion
- Consent management

## Deployment & Operations

### Environment Management
- **Development**: Local development environment
- **Staging**: Pre-production testing
- **Production**: Live application environment

### CI/CD Pipeline
1. **Code Push**: Developer pushes to repository
2. **Automated Testing**: All tests run automatically
3. **Build Process**: Application is built and optimized
4. **Deployment**: Automatic deployment to staging/production
5. **Health Checks**: Post-deployment verification

### Monitoring
- Application performance monitoring
- Error tracking and reporting
- User analytics and behavior
- Infrastructure health monitoring

### Backup & Recovery
- Automated database backups
- Content backup strategies
- Disaster recovery procedures
- Data retention policies

## Troubleshooting

### Common Issues
1. **Build Failures**: Check TypeScript errors and dependency versions
2. **Test Failures**: Verify test setup and mock configurations
3. **Authentication Issues**: Check Supabase configuration
4. **Performance Issues**: Profile components and optimize queries

### Debug Tools
- React Developer Tools
- Supabase Dashboard
- Browser Developer Tools
- Application logs and metrics

### Support Resources
- Internal documentation
- Community forums
- Technical support channels
- Code review process

## Contributing

### Code Review Process
1. Create feature branch from main
2. Implement changes following DTDD methodology
3. Ensure all tests pass locally
4. Submit pull request with clear description
5. Address review feedback
6. Merge after approval

### Documentation Updates
- Update relevant documentation for any changes
- Maintain consistency across all docs
- Include examples and use cases
- Review for clarity and completeness

This development guide serves as the primary reference for all developers working on the Vista platform, ensuring consistent practices and high-quality deliverables.
