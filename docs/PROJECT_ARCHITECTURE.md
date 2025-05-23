# Vista Platform - Project Architecture Documentation

This document provides a comprehensive overview of the Vista platform's architecture, codebase organization, and design decisions.

## Table of Contents
1. [Project Structure](#project-structure)
2. [Core Architecture](#core-architecture)
3. [Component Organization](#component-organization)
4. [Service Layer Architecture](#service-layer-architecture)
5. [Database & Backend Architecture](#database--backend-architecture)
6. [External Dependencies](#external-dependencies)
7. [Design Patterns](#design-patterns)
8. [Integration Points](#integration-points)
9. [Media Handling Architecture](#media-handling-architecture)

## Project Structure

### Root Level Organization
```
vista/
├── docs/                           # Documentation
│   ├── PRD.md                     # Product Requirements Document
│   ├── SEQUENCE_DIAGRAMS.md       # System interaction flows
│   ├── CLASS_DIAGRAMS.md          # Component relationships
│   ├── DEVELOPMENT_GUIDE.md       # DTDD workflow guide
│   └── PROJECT_ARCHITECTURE.md    # This document
├── src/                           # Frontend application source
├── supabase/                      # Backend configuration and functions
├── public/                        # Static assets
└── configuration files            # Build and config files
```

### Frontend Structure (`src/`)
```
src/
├── components/                    # Reusable UI components
│   ├── ui/                       # Shadcn/UI base components
│   ├── notion/                   # Notion content rendering
│   ├── content/                  # Content-specific components
│   └── [feature-components].tsx  # Feature-specific components
├── pages/                        # Route-level page components
│   └── admin/                    # Admin panel pages
├── hooks/                        # Custom React hooks
├── services/                     # Business logic and API services
├── integrations/                 # External service integrations
│   └── supabase/                # Supabase client and types
├── lib/                         # Utility functions
└── App.tsx                      # Main application component
```

### Backend Structure (`supabase/`)
```
supabase/
├── functions/                    # Edge functions (serverless)
│   ├── sync-notion-database/    # Notion synchronization
│   ├── notion-webhook/          # Notion webhook handler
│   ├── generate-embeddings/     # AI embedding generation
│   ├── generate-query-embedding/# Search query processing
│   └── get-translation-key/     # Translation API access
├── migrations/                  # Database schema migrations
└── config.toml                 # Supabase configuration
```

## Core Architecture

### Architecture Pattern: JAMstack + Serverless
The Vista platform follows a modern JAMstack architecture with serverless backend functions:

- **Frontend**: React SPA with static generation capabilities
- **API Layer**: Supabase Edge Functions (Deno runtime)
- **Database**: PostgreSQL with vector extensions (pgvector)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for media files

### Data Flow Architecture
```
Notion CMS → Edge Functions → PostgreSQL → React Frontend
     ↑                                           ↓
     └── Webhooks ←── User Actions ←── UI Events
```

## Component Organization

### 1. Core UI Components (`src/components/ui/`)
**Purpose**: Consistent design system components
**Architecture**: Based on Radix UI primitives with Tailwind styling

Key components:
- `button.tsx`, `card.tsx`, `input.tsx` - Basic UI elements
- `dialog.tsx`, `dropdown-menu.tsx` - Interactive components
- `toast.tsx`, `sonner.tsx` - Notification system

**Design Pattern**: Compound component pattern with forwarded refs

### 2. Notion Content System (`src/components/notion/`)
**Purpose**: Render Notion content blocks in React

Core files:
- `index.tsx` - Main export interface
- `types.ts` - TypeScript definitions for Notion blocks
- `components/NotionRenderer.tsx` - Main rendering orchestrator
- `components/MediaRenderer.tsx` - Handles images, videos, embeds
- `components/ListRenderer.tsx` - Manages nested lists
- `components/BlockRenderers.tsx` - Individual block type renderers
- `utils/text-renderer.tsx` - Rich text annotation handling

**Architecture Decisions**:
- Simplified block format for consistent rendering
- Recursive rendering for nested content
- Modular renderers for each content type
- Annotation system for text formatting

### 3. Content Display System (`src/components/content/`)
**Purpose**: High-level content presentation components

- `ContentBody.tsx` - Main content renderer with language support
- `ContentCoverImage.tsx` - Feature image display with aspect ratio handling
- `ContentMetadata.tsx` - Title, description, and metadata display

### 4. Admin Components
**Purpose**: Administrative interface components

- `AdminGuard.tsx` - Route protection for admin access
- `AdminLayout.tsx` - Consistent admin panel layout
- `UrlParamSetting.tsx` - Custom URL parameter management

### 5. Feature Components
**Purpose**: Application-specific functionality

- `LanguageSwitcher.tsx` - Multi-language interface
- `PurposeInput.tsx` - Semantic search input
- `TranslatedText.tsx` - Dynamic text translation
- `ImageAspectRatio.tsx` - Responsive image handling

## Service Layer Architecture

### 1. Admin Service (`src/services/adminService.ts`)
**Responsibilities**:
- User profile management
- Notion integration configuration
- Content synchronization orchestration
- Embedding generation management

### 2. Translation Service (`src/services/translationService.ts`)
**Responsibilities**:
- Google Translate API integration
- Translation caching
- Language preference management
- Multi-language content delivery

**Design Pattern**: Service layer with caching strategy

### 3. URL Parameter Service (`src/services/urlParamService.ts`)
**Responsibilities**:
- Custom URL routing
- Profile-based content filtering
- Public content access

## Database & Backend Architecture

### 1. Edge Functions Architecture
**Pattern**: Serverless functions with shared utilities

#### Sync Notion Database (`supabase/functions/sync-notion-database/`)
**Purpose**: Synchronize content from Notion to Supabase
**Architecture**:
- `index.ts` - Main function handler
- `notion-processor.ts` - Content processing logic
- `utils.ts` - Shared utility functions
- `types.ts` - TypeScript definitions

**Key Features**:
- Image backup to Supabase Storage
- HEIC image format detection
- Recursive block processing
- Error handling and recovery

#### Notion Webhook (`supabase/functions/notion-webhook/`)
**Purpose**: Handle real-time updates from Notion
**Responsibilities**:
- Process Notion webhook payloads
- Update existing content items
- Maintain content synchronization

#### AI Integration Functions
- `generate-embeddings/` - Create vector embeddings for semantic search
- `generate-query-embedding/` - Process search queries
- `get-translation-key/` - Secure API key management

### 2. Database Schema Architecture
**Pattern**: PostgreSQL with extensions

Key tables (inferred from codebase):
- `profiles` - User profiles and preferences
- `content_items` - Notion content storage
- `embedding_jobs` - AI processing job tracking

**Extensions**:
- `pgvector` - Vector similarity search
- Standard PostgreSQL features for JSONB storage

## Content Processing Pipeline

### Image Extraction and Processing
- **Location**: `src/utils/notionContentProcessor.ts`
- **Purpose**: Consistent processing of content items to extract preview images, detect orientation, and handle HEIC formats
- **Key Functions**:
  - `processNotionContent()`: Main processing function that handles all content transformation
  - `extractFirstImageUrl()`: Recursively searches content blocks for first image
  - `isHeicImage()`: Detects HEIC image format for proper fallback handling

### Search Result Processing
- **Updated Flow**: `semanticSearch()` now automatically processes all results through `processNotionContent()`
- **Consistency**: All three search use cases now use the same processing pipeline:
  1. **PurposeInput → Vista**: Results processed in `semanticSearch()`
  2. **Vista "View All"**: Results processed via `getUserContentItems()` → `processNotionContent()`
  3. **Vista Search**: Results processed in `semanticSearch()` → filtered by user

### Image Display Logic
```typescript
// Centralized image detection in ContentDisplay.tsx
const mediaUrl = hasCoverImage ? 
  normalizedContent.cover_image : 
  (mediaBlock?.media_url || null);
```

## External Dependencies

### Core Framework Dependencies
```typescript
// React ecosystem
"react": "^18.3.1"                    // Core React library
"react-dom": "^18.3.1"                // React DOM renderer
"react-router-dom": "^6.26.2"         // Client-side routing

// State management & data fetching
"@tanstack/react-query": "^5.56.2"    // Server state management
```

### UI & Styling Dependencies
```typescript
// Design system
"@radix-ui/*": "various"               // Accessible UI primitives
"tailwindcss": "configured"            // Utility-first CSS
"lucide-react": "^0.462.0"            // Icon library
"framer-motion": "^12.9.4"            // Animation library

// UI enhancements
"sonner": "^1.5.0"                     // Toast notifications
"vaul": "^0.9.3"                      // Drawer component
"cmdk": "^1.0.0"                      // Command palette
```

### Backend & Integration Dependencies
```typescript
// Supabase ecosystem
"@supabase/supabase-js": "^2.49.4"    // Supabase client

// Utility libraries
"date-fns": "^3.6.0"                  // Date manipulation
"zod": "^3.23.8"                      // Schema validation
"clsx": "^2.1.1"                      // Conditional classes
"class-variance-authority": "^0.7.1"   // Component variants
```

### Development Dependencies
```typescript
// TypeScript & build tools
"typescript": "configured"             // Type system
"vite": "configured"                   // Build tool
"eslint": "configured"                 // Code linting
```

## Design Patterns

### 1. Compound Component Pattern
**Used in**: UI components, Notion renderers
**Purpose**: Flexible, composable components
```typescript
// Example: NotionRenderer with sub-components
<NotionRenderer>
  <MediaRenderer />
  <ListRenderer />
  <TextRenderer />
</NotionRenderer>
```

### 2. Service Layer Pattern
**Used in**: Business logic separation
**Purpose**: Centralized API interactions and business rules
```typescript
// Services handle external integrations
adminService.syncNotionContent()
translationService.translateText()
```

### 3. Provider Pattern
**Used in**: React context for state management
**Purpose**: Global state without prop drilling
```typescript
// Query client, auth state, theme context
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

### 4. Factory Pattern
**Used in**: Block renderer selection
**Purpose**: Dynamic component rendering based on content type
```typescript
// NotionRenderer selects appropriate renderer based on block type
const renderer = getBlockRenderer(block.type);
```

### 5. Observer Pattern
**Used in**: Real-time updates, webhook handling
**Purpose**: Event-driven architecture
```typescript
// Supabase real-time subscriptions
supabase.channel().on('INSERT', callback)
```

### 6. Repository Pattern
**Used in**: Data access layer
**Purpose**: Abstracted database operations
```typescript
// Service methods abstract Supabase operations
async function getContentItems(userId: string)
```

## Integration Points

### 1. Notion API Integration
**Method**: REST API with official SDK
**Authentication**: API tokens stored as secrets
**Data Flow**: Notion → Edge Functions → Database
**Error Handling**: Retry logic, webhook fallbacks

### 2. AI Service Integration
**Provider**: OpenAI/VertexAI for embeddings
**Method**: HTTP API calls from Edge Functions
**Purpose**: Semantic search capabilities
**Data Flow**: Content → Embeddings → Vector Database

### 3. Translation Service Integration
**Provider**: Google Translate API
**Method**: REST API calls
**Caching**: Client-side translation cache
**Authentication**: API key via Edge Function

### 4. Authentication Integration
**Provider**: Supabase Auth
**Method**: JWT tokens
**Features**: Email/password, social logins
**Security**: Row-level security policies

### 5. Storage Integration
**Provider**: Supabase Storage
**Purpose**: Media file backup and CDN
**Features**: Image processing, HEIC support
**Security**: Public buckets with access controls

## Performance Considerations

### 1. Code Splitting
- Route-based splitting via React Router
- Lazy loading for admin components
- Dynamic imports for heavy features

### 2. Caching Strategies
- Translation results cached in localStorage
- React Query for API response caching
- CDN for static assets

### 3. Database Optimization
- Vector indexes for semantic search
- JSONB indexing for content queries
- Connection pooling for Edge Functions

### 4. Bundle Optimization
- Tree shaking for unused code
- Compression for assets
- Preloading for critical resources

## Security Architecture

### 1. Authentication Flow
- JWT tokens for API access
- Refresh token rotation
- Secure cookie storage

### 2. Authorization
- Role-based access control
- Row-level security in database
- Admin route protection

### 3. Data Protection
- API keys stored as environment secrets
- Input validation and sanitization
- CORS configuration for API access

### 4. Privacy Compliance
- No third-party tracking
- Explicit user consent
- Data minimization principles

## Scalability Considerations

### 1. Horizontal Scaling
- Serverless Edge Functions auto-scale
- Database connection pooling
- CDN for global distribution

### 2. Vertical Scaling
- Vector database optimization
- Memory-efficient content processing
- Incremental data loading

### 3. Monitoring & Observability
- Error tracking via console logs
- Performance metrics collection
- Real-time status monitoring

## Media Handling Architecture

### 1. Image Processing Flow
**Purpose**: Correctly handle and display various image formats across the platform

#### Key Components:
- `ImageAspectRatio`: Core component for responsive image rendering with proper aspect ratios
- `isHeicImage()`: Utility for detecting HEIC format images that need special handling
- `extractFirstImageUrl()`: Helper function to find preview images in content
- `ContentCoverImage`: Component that renders cover images with proper orientation

#### Image Data Flow:
1. Notion API returns image URLs during content sync
2. Images are backed up to Supabase Storage if they're expiring Notion URLs
3. Format detection identifies HEIC and other specialized image types
4. Dimension analysis determines proper orientation (portrait/landscape)
5. Preview images are extracted from content blocks if no cover image exists
6. UI components render with appropriate aspect ratios and fallbacks

#### Image Error Recovery:
- HEIC detection prevents browser rendering errors
- Image loading errors provide graceful fallbacks
- Backup URLs ensure long-term image availability

### 2. Image Orientation Management 
**Purpose**: Ensure visually appealing presentation of images with diverse aspect ratios

#### Orientation Detection Logic:
- Default: 16:9 landscape aspect ratio when dimensions are unknown
- Portrait detection: height > width (3:4 aspect ratio)
- Landscape detection: width > height (16:9 aspect ratio) 
- Square detection: width = height (1:1 aspect ratio)

#### Responsive Behavior:
- Fluid container widths with fixed aspect ratios
- Proper object-fit properties for different content types
- Loading states and smooth transitions

#### First Image Priority:
- Content processing extracts the first image found in content
- First image orientation influences content card presentation
- Preview images serve as fallback cover images when needed

This architecture documentation serves as a foundation for the DTDD approach, providing clear understanding of system boundaries, responsibilities, and integration points for effective testing and development.
