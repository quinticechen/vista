
# Project Architecture

This document outlines the high-level architecture of the Vista platform, including its key components, data flow, and technology stack.

## System Overview

Vista is a modern web application built with React, TypeScript, and Supabase, designed to provide AI-powered content personalization with a focus on privacy, accessibility, and seamless user experience.

### Key Features

1. **Content Management** - Synchronize and display content from Notion
2. **AI-Powered Search** - Semantic search using vector embeddings
3. **Multi-Language Support** - Content translation and language switching
4. **URL Parameter Pages** - Custom branded pages for each user
5. **Home Page Customization** - User-configurable landing pages with interactive elements
6. **Website Customization** - Style templates and theme options for personalized branding
7. **User Onboarding System** - Guided setup process with completion tracking

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│                                                             │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐      │
│  │  Public │   │  Admin  │   │  Auth   │   │ Custom  │      │
│  │  Pages  │   │  Pages  │   │ System  │   │ Routes  │      │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘      │
│        │             │            │             │           │
│        v             v            v             v           │
│  ┌─────────────────────────────────────────────────┐       │
│  │           React Query / State Management        │       │
│  └─────────────────────────────────────────────────┘       │
│                           │                                │
└───────────────────────────│───────────────────────────────┘
                            │
┌───────────────────────────│───────────────────────────────┐
│                           v                               │
│  ┌─────────────────────────────────────────────────┐      │
│  │                  Supabase Client                 │      │
│  └─────────────────────────────────────────────────┘      │
│                           │                                │
└───────────────────────────│───────────────────────────────┘
                            │
┌───────────────────────────│───────────────────────────────┐
│                           v                               │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐    │
│  │ Database│   │  Auth   │   │ Storage │   │   Edge  │    │
│  │ (PostgreSQL) │ Services │   │ Services│   │Functions│    │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘    │
│                                                |          │
└────────────────────────────────────────────────│─────────┘
                                                 │
┌───────────────────────────────────────────────────────────┐
│  External Services                             │          │
│                                                v          │
│  ┌─────────┐   ┌─────────┐   ┌─────────────────────────┐ │
│  │ Notion  │   │ OpenAI  │   │     Vector Search       │ │
│  │   API   │   │   API   │   │                         │ │
│  └─────────┘   └─────────┘   └─────────────────────────┘ │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## Frontend Architecture

The React frontend follows a component-based architecture with a clear separation of concerns:

### Layer Structure

1. **Pages Layer** - Top-level route components
2. **Components Layer** - Reusable UI components
3. **Services Layer** - API communication and business logic
4. **Hooks Layer** - Custom React hooks for shared functionality
5. **Utils Layer** - Pure utility functions

### State Management

- **Local Component State** - Using React's `useState` and `useReducer`
- **React Query** - For server state management and caching
- **Context API** - For global state where needed

## Backend Architecture

The backend is built on Supabase with PostgreSQL:

### Database Structure

- **Table Organization** - Normalized schema with appropriate relationships
- **Row-Level Security** - Enforced for all tables
- **Vector Extensions** - For semantic search capabilities
- **Indexes** - Optimized for common queries

### Serverless Functions

Edge Functions handle complex business logic:

1. **Notion Integration** - Synchronize content from Notion
2. **Embedding Generation** - Create vector embeddings for content
3. **Translation Services** - Handle content translation
4. **Webhook Handling** - Process Notion webhooks

## Data Flow

### Content Creation & Synchronization

1. User creates content in Notion
2. Notion webhook triggers synchronization
3. Edge function processes content
4. Content is stored in database
5. Embeddings are generated for search

### Authentication & Admin Access

1. User logs in through authentication system
2. All authenticated users are redirected to admin dashboard
3. Admin dashboard displays user onboarding guide
4. User can navigate to custom site via "Visit Main Site" button

### User Content Access

1. User visits URL parameter page
2. Profile is retrieved by URL parameter
3. User content is retrieved
4. Content is displayed with appropriate styling

### Home Page Customization

1. Admin configures home page settings in Admin Dashboard
2. Settings are saved to `home_page_settings` table
3. URL parameter page loads customized settings
4. Custom home page elements are displayed

### Search & Discovery

1. User enters search query
2. Query is converted to embedding
3. Vector search finds relevant content
4. Results are ranked and returned
5. User can view detailed content

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

- **Supabase** - Backend-as-a-Service
  - PostgreSQL - Primary database
  - PostgREST - RESTful API
  - GoTrue - User authentication
  - Storage - File storage
  - Edge Functions - Serverless functions
- **pgvector** - PostgreSQL extension for vector similarity search

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

## Security Architecture

### Authentication & Authorization

- **JWT-based Authentication** - Secure token-based auth
- **Role-Based Access Control** - Admin vs. regular users
- **Row-Level Security** - Database-enforced access controls

### Data Protection

- **Encrypted Storage** - All sensitive data encrypted
- **API Security** - Protected endpoints with proper authorization
- **Input Validation** - Comprehensive validation to prevent attacks
- **XSS Prevention** - Content sanitization

## Deployment Architecture

### Environments

- **Development** - Local development
- **Staging** - Pre-production testing
- **Production** - Live application

### CI/CD Pipeline

- **Automated Testing** - Tests run on every commit
- **Build Process** - Optimized production builds
- **Deployment** - Automated deployment to production
- **Monitoring** - Performance and error tracking

## Scalability Considerations

- **Edge Functions** - Scale automatically based on demand
- **Database Scaling** - Managed by Supabase
- **Content Caching** - Optimize repeated content access
- **Lazy Loading** - Load components and assets as needed

This architecture documentation provides a high-level overview of the Vista platform design. As the system evolves, this document will be updated to reflect architectural changes and improvements.
