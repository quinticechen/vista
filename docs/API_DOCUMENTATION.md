
# Vista Platform - API Documentation

This document provides comprehensive API documentation for the Vista platform, including REST endpoints, Edge Functions, and integration patterns.

## Overview

The Vista API is built on Supabase and provides:
- RESTful endpoints for data operations
- Serverless Edge Functions for complex operations
- Real-time subscriptions for live updates
- Authentication and authorization
- Rate limiting and security features

## Authentication

### Authentication Methods

#### JWT Tokens
```http
Authorization: Bearer <jwt_token>
```

#### API Keys (Admin only)
```http
Authorization: Bearer <api_key>
X-API-Key: <service_key>
```

### Session Management
- Token expiration: 1 hour
- Refresh token rotation: Automatic
- Session timeout: 24 hours inactive

## REST API Endpoints

### Content Management

#### List Content Items
```http
GET /rest/v1/content_items
```

**Parameters:**
- `limit` (number): Maximum items to return (default: 10, max: 100)
- `offset` (number): Number of items to skip
- `search` (string): Search query for content
- `category` (string): Filter by category
- `tags` (array): Filter by tags
- `language` (string): Filter by language

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Content Title",
      "description": "Content description",
      "category": "blog",
      "tags": ["ai", "technology"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "start_date": "2024-01-01",
      "end_date": "2024-12-31",
      "user_id": "uuid",
      "notion_page_id": "notion_id",
      "notion_url": "https://notion.so/page",
      "translation_status": "completed",
      "translated_languages": ["en", "es", "fr"]
    }
  ],
  "count": 25,
  "has_more": true
}
```

#### Get Content Item
```http
GET /rest/v1/content_items/{id}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Content Title",
  "description": "Content description",
  "content": {
    "blocks": [...],
    "version": "1.0"
  },
  "embedding": [0.1, 0.2, ...],
  "text_content": [...],
  "image_content": [...],
  "video_content": [...],
  "product_services": [...],
  "testimonials": [...]
}
```

#### Create Content Item
```http
POST /rest/v1/content_items
```

**Request Body:**
```json
{
  "title": "New Content",
  "description": "Content description",
  "category": "blog",
  "tags": ["tag1", "tag2"],
  "content": {
    "blocks": [...],
    "version": "1.0"
  },
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

#### Update Content Item
```http
PUT /rest/v1/content_items/{id}
```

#### Delete Content Item
```http
DELETE /rest/v1/content_items/{id}
```

### User Management

#### Get User Profile
```http
GET /rest/v1/profiles/{user_id}
```

**Response:**
```json
{
  "id": "uuid",
  "created_at": "2024-01-01T00:00:00Z",
  "is_admin": false,
  "url_param": "user-brand",
  "supported_ai_languages": ["en", "es", "fr"],
  "default_language": "en",
  "notion_api_key": "encrypted_key",
  "notion_database_id": "notion_db_id",
  "verification_token": "webhook_token",
  "website_settings": {
    "hero_title": "Welcome",
    "hero_subtitle": "Subtitle",
    "primary_color": "#3B82F6"
  },
  "selected_theme": "professional"
}
```

#### Update User Profile
```http
PUT /rest/v1/profiles/{user_id}
```

### Website Customization

#### Get Website Settings
```http
GET /rest/v1/website_settings?profile_id=eq.{user_id}
```

**Response:**
```json
{
  "id": "uuid",
  "profile_id": "uuid",
  "hero_title": "Welcome to My Site",
  "hero_subtitle": "Professional services",
  "about_text": "About us content",
  "contact_email": "contact@example.com",
  "logo_url": "https://storage.url/logo.png",
  "primary_color": "#3B82F6",
  "secondary_color": "#10B981",
  "font_family": "Inter",
  "custom_css": {
    "header": {
      "background": "linear-gradient(...)"
    }
  },
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Update Website Settings
```http
PUT /rest/v1/website_settings/{id}
```

#### Get Style Templates
```http
GET /rest/v1/style_templates?is_active=eq.true
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Professional",
      "description": "Clean corporate design",
      "category": "business",
      "styles": {
        "colors": {
          "primary": "#1F2937",
          "secondary": "#3B82F6"
        },
        "typography": {
          "heading": "Playfair Display",
          "body": "Inter"
        }
      },
      "preview_image_url": "https://storage.url/preview.jpg",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Search and Discovery

#### Semantic Search
```http
POST /rest/v1/rpc/semantic_search
```

**Request Body:**
```json
{
  "query": "AI technology trends",
  "user_id": "uuid",
  "limit": 10,
  "similarity_threshold": 0.7,
  "language": "en"
}
```

**Response:**
```json
{
  "results": [
    {
      "content_item": {
        "id": "uuid",
        "title": "AI Technology Trends 2024",
        "description": "Latest trends in AI",
        "similarity_score": 0.95
      }
    }
  ]
}
```

## Edge Functions

### Notion Synchronization

#### Sync Notion Database
```http
POST /functions/v1/sync-notion-database
```

**Request Body:**
```json
{
  "userId": "uuid",
  "notionApiKey": "secret_key",
  "notionDatabaseId": "database_id",
  "forceSync": false
}
```

**Response:**
```json
{
  "success": true,
  "processedCount": 15,
  "addedCount": 3,
  "updatedCount": 8,
  "removedCount": 1,
  "errors": [],
  "jobId": "uuid"
}
```

#### Notion Webhook Handler
```http
POST /functions/v1/notion-webhook?user_id={user_id}
```

**Request Headers:**
```http
X-Notion-Signature: sha256=signature
Content-Type: application/json
```

**Request Body:**
```json
{
  "event_id": "uuid",
  "event_type": "page.updated",
  "page": {
    "id": "notion_page_id",
    "properties": {...}
  }
}
```

### AI Services

#### Generate Embeddings
```http
POST /functions/v1/generate-embeddings
```

**Request Body:**
```json
{
  "userId": "uuid",
  "contentIds": ["uuid1", "uuid2"],
  "forceRegenerate": false
}
```

**Response:**
```json
{
  "jobId": "uuid",
  "status": "started",
  "totalItems": 10,
  "estimatedDuration": "5 minutes"
}
```

#### Generate Query Embedding
```http
POST /functions/v1/generate-query-embedding
```

**Request Body:**
```json
{
  "query": "search query text",
  "language": "en"
}
```

**Response:**
```json
{
  "embedding": [0.1, 0.2, 0.3, ...],
  "dimension": 1536,
  "model": "text-embedding-ada-002"
}
```

#### Get Translation Key
```http
POST /functions/v1/get-translation-key
```

**Request Body:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "translationKey": "api_key",
  "provider": "openai",
  "supportedLanguages": ["en", "es", "fr", "de", "it"]
}
```

## Real-time Subscriptions

### Content Updates
```javascript
const subscription = supabase
  .channel('content_changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'content_items',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Content updated:', payload);
    }
  )
  .subscribe();
```

### Embedding Job Progress
```javascript
const subscription = supabase
  .channel('embedding_jobs')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'embedding_jobs',
      filter: `created_by=eq.${userId}`
    },
    (payload) => {
      console.log('Job progress:', payload.new);
    }
  )
  .subscribe();
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "title",
      "reason": "Title cannot be empty"
    },
    "timestamp": "2024-01-01T00:00:00Z",
    "request_id": "uuid"
  }
}
```

### Error Codes

#### Authentication Errors
- `UNAUTHORIZED` (401): Invalid or missing authentication
- `FORBIDDEN` (403): Insufficient permissions
- `TOKEN_EXPIRED` (401): JWT token has expired

#### Validation Errors
- `VALIDATION_ERROR` (400): Request validation failed
- `INVALID_FORMAT` (400): Invalid data format
- `MISSING_REQUIRED` (400): Required field missing

#### Resource Errors
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource conflict
- `GONE` (410): Resource no longer available

#### Rate Limiting
- `RATE_LIMIT_EXCEEDED` (429): Too many requests

#### Server Errors
- `INTERNAL_ERROR` (500): Internal server error
- `SERVICE_UNAVAILABLE` (503): Service temporarily unavailable

## Rate Limiting

### Limits by Endpoint Type

#### Content Operations
- Read operations: 1000 requests/hour
- Write operations: 100 requests/hour
- Search operations: 500 requests/hour

#### AI Operations
- Embedding generation: 50 requests/hour
- Translation: 200 requests/hour
- Search queries: 500 requests/hour

#### Admin Operations
- Profile updates: 20 requests/hour
- Settings changes: 10 requests/hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1640995200
Retry-After: 3600
```

## Security

### Input Validation
- All inputs are validated and sanitized
- SQL injection prevention
- XSS protection
- File upload restrictions

### CORS Configuration
```http
Access-Control-Allow-Origin: https://app.vista.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-API-Key
Access-Control-Max-Age: 86400
```

### Content Security Policy
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' fonts.gstatic.com;
```

## Webhooks

### Webhook Configuration
Users can configure webhooks to receive notifications about content changes:

```http
POST /rest/v1/webhook_configurations
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["content.created", "content.updated", "content.deleted"],
  "secret": "webhook_secret",
  "active": true
}
```

### Webhook Events

#### Content Events
- `content.created`: New content item created
- `content.updated`: Content item updated
- `content.deleted`: Content item deleted
- `content.published`: Content item published

#### Sync Events
- `sync.started`: Notion sync started
- `sync.completed`: Notion sync completed
- `sync.failed`: Notion sync failed

#### Job Events
- `embedding.started`: Embedding job started
- `embedding.completed`: Embedding job completed
- `embedding.failed`: Embedding job failed

### Webhook Payload
```json
{
  "id": "uuid",
  "event": "content.updated",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "content_item": {
      "id": "uuid",
      "title": "Updated Content",
      "changes": ["title", "description"]
    }
  },
  "user_id": "uuid"
}
```

## SDK and Client Libraries

### JavaScript/TypeScript SDK
```javascript
import { VistaClient } from '@vista/sdk';

const client = new VistaClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.vista.com'
});

// Get content
const content = await client.content.list({
  limit: 10,
  search: 'AI technology'
});

// Search content
const results = await client.search.semantic({
  query: 'machine learning trends',
  limit: 5
});
```

### React Hooks
```javascript
import { useVistaContent, useVistaSearch } from '@vista/react';

function ContentList() {
  const { data, loading, error } = useVistaContent({
    limit: 10,
    category: 'blog'
  });

  const { search, results, searching } = useVistaSearch();

  return (
    <div>
      {/* Render content */}
    </div>
  );
}
```

## Testing

### API Testing
Use the provided test endpoints to validate API functionality:

```http
GET /functions/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "healthy",
    "openai": "healthy",
    "notion": "healthy"
  }
}
```

### Test Data
Test endpoints are available for development and testing:

```http
POST /functions/v1/test/seed-data
```

This documentation provides a comprehensive reference for integrating with the Vista platform API. For additional support, please refer to the development guide or contact the development team.
