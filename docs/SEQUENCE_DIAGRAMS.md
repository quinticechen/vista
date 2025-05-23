# Vista Platform - Sequence Diagrams

This document contains detailed sequence diagrams for the main functional flows in the Vista platform, supporting the Document-driven Test-driven Development (DTDD) approach.

## 1. Notion Content Synchronization Flow

```mermaid
sequenceDiagram
    participant Admin as Content Creator/Admin
    participant Dashboard as Admin Dashboard
    participant SyncAPI as sync-notion-database Function
    participant NotionAPI as Notion API
    participant Processor as notion-processor
    participant Storage as Supabase Storage
    participant DB as Supabase Database

    Admin->>Dashboard: Initiate Notion sync
    Dashboard->>Dashboard: Validate Notion API key & database ID
    
    Dashboard->>SyncAPI: POST /functions/v1/sync-notion-database
    Note over Dashboard,SyncAPI: {notionApiKey, notionDatabaseId, userId}
    
    SyncAPI->>SyncAPI: Authenticate user via JWT
    SyncAPI->>NotionAPI: Initialize client with API key
    SyncAPI->>NotionAPI: Query database pages
    NotionAPI-->>SyncAPI: Return page list with metadata
    
    SyncAPI->>Storage: Check/create notion-images bucket
    Storage-->>SyncAPI: Bucket ready
    
    loop For each Notion page
        SyncAPI->>NotionAPI: Fetch page blocks
        NotionAPI-->>SyncAPI: Return block content
        
        SyncAPI->>Processor: processBlocksSimplifiedWithImageBackup()
        
        loop For each block
            alt Block is image
                Processor->>Processor: Check if HEIC format
                alt Image URL is expiring
                    Processor->>Storage: Backup image to bucket
                    Storage-->>Processor: Return permanent URL
                else Image URL is permanent
                    Processor->>Processor: Keep original URL
                end
            else Block has rich text
                Processor->>Processor: Extract text and annotations
            else Block has children
                Processor->>NotionAPI: Fetch child blocks
                NotionAPI-->>Processor: Return child content
                Processor->>Processor: Process children recursively
            end
        end
        
        Processor-->>SyncAPI: Return processed blocks
        
        SyncAPI->>DB: Upsert content_items
        Note over SyncAPI,DB: Insert new or update existing content
        
        DB-->>SyncAPI: Confirm content saved
    end
    
    SyncAPI->>DB: Mark removed pages as inactive
    SyncAPI-->>Dashboard: Return sync results
    Dashboard-->>Admin: Display sync summary
    
    Note over Admin,DB: Error handling at each step<br/>with rollback capabilities
```

## 2. Real-time Content Updates via Webhooks

```mermaid
sequenceDiagram
    participant Notion as Notion Platform
    participant Webhook as notion-webhook Function
    participant DB as Supabase Database
    participant NotionAPI as Notion API Client
    participant Processor as Content Processor
    participant Storage as Supabase Storage

    Notion->>Webhook: POST webhook notification
    Note over Notion,Webhook: Page updated in Notion

    alt OPTIONS preflight request
        Webhook-->>Notion: 200 OK with CORS headers
    else POST webhook event
        Webhook->>Webhook: Extract page ID from payload
        
        Webhook->>DB: Find content_item by notion_page_id
        
        alt Content item not found
            Webhook-->>Notion: 200 OK (no matching content)
        else Content item found
            Webhook->>DB: Get user's Notion API key
            
            alt API key not configured
                Webhook-->>Notion: 200 OK (API key missing)
            else API key available
                Webhook->>NotionAPI: Initialize with user's API key
                Webhook->>NotionAPI: Fetch updated page details
                NotionAPI-->>Webhook: Return page properties
                
                Webhook->>NotionAPI: Fetch page blocks
                NotionAPI-->>Webhook: Return block content
                
                Webhook->>Processor: Process blocks with image backup
                
                loop For each block with media
                    alt Block is image and URL is expiring
                        Processor->>Storage: Backup to permanent storage
                        Storage-->>Processor: Return permanent URL
                    end
                    
                    Processor->>Processor: Extract and clean content
                end
                
                Processor-->>Webhook: Return processed content
                
                Webhook->>DB: Update content_item
                DB-->>Webhook: Confirm update
                
                Webhook-->>Notion: 200 OK (update successful)
            end
        end
    end
    
    Note over Webhook,Storage: Maintains content freshness<br/>and media availability
```

## 3. Semantic Search and Content Discovery

```mermaid
sequenceDiagram
    participant User as End User
    participant UI as Vista Interface
    participant SearchService as Semantic Search Service
    participant EmbedAPI as generate-query-embedding Function
    participant AI as OpenAI/VertexAI
    participant DB as Supabase Database
    participant Processor as Content Processor
    participant Media as Media Handler

    User->>UI: Enter search query or purpose
    UI->>UI: Validate and clean query input
    
    UI->>SearchService: semanticSearch(query)
    SearchService->>EmbedAPI: Generate embedding for query
    
    EmbedAPI->>AI: Request embedding vector
    Note over EmbedAPI,AI: Using text-embedding-ada-002 or equivalent
    
    AI-->>EmbedAPI: Return query embedding vector
    EmbedAPI-->>SearchService: Return query embedding
    
    SearchService->>DB: Execute match_content_items function
    Note over SearchService,DB: Vector similarity search with cosine distance
    
    DB-->>SearchService: Return matching content with similarity scores
    
    SearchService->>SearchService: Filter by similarity threshold (>0.7)
    SearchService->>SearchService: Sort by relevance score
    
    SearchService-->>UI: Return search results
    
    UI->>Processor: Process each result for display
    loop For each search result
        Processor->>Processor: Ensure proper content structure
        Processor->>Processor: Extract first image for preview
        Processor->>Media: Detect image format (HEIC, etc.)
        Processor->>Media: Determine image orientation
        Processor->>Processor: Set appropriate aspect ratio
        Processor->>Processor: Process annotations and formatting
    end
    
    Processor-->>UI: Return processed results with preview images
    
    UI->>UI: Render search results with images and similarity indicators
    UI-->>User: Display personalized, relevant content with proper media
    
    alt No results found
        UI->>UI: Show "no results" with suggestions
        UI->>UI: Offer to browse all content
        UI-->>User: Display fallback options
    end
    
    Note over User,DB: Privacy-first: no tracking,<br/>only explicit user preferences
```

## 4. Content Personalization and Recommendation Engine

```mermaid
sequenceDiagram
    participant User as Content Consumer
    participant UI as Vista Interface
    participant PersonalizationEngine as Personalization Engine
    participant ProfileService as User Profile Service
    participant DB as Supabase Database
    participant AI as AI Services
    participant Analytics as Analytics Service

    User->>UI: Access Vista-powered content
    UI->>ProfileService: Get user preferences (if signed in)
    
    alt User is anonymous
        ProfileService-->>UI: Return default preferences
        UI->>UI: Show purpose input prompt
        User->>UI: State content purpose/goal
        UI->>PersonalizationEngine: Generate recommendations for stated purpose
    else User is signed in
        ProfileService->>DB: Fetch user profile and explicit preferences
        DB-->>ProfileService: Return user preferences
        ProfileService-->>UI: Return user preferences
        UI->>PersonalizationEngine: Generate personalized recommendations
    end
    
    PersonalizationEngine->>DB: Query content based on preferences/purpose
    PersonalizationEngine->>AI: Generate embedding for user intent
    AI-->>PersonalizationEngine: Return intent embedding
    
    PersonalizationEngine->>DB: Vector similarity search for content
    DB-->>PersonalizationEngine: Return ranked content matches
    
    PersonalizationEngine->>PersonalizationEngine: Apply business rules and segments
    PersonalizationEngine->>PersonalizationEngine: Ensure content diversity
    
    PersonalizationEngine-->>UI: Return personalized content feed
    
    UI->>UI: Render content with personalization indicators
    UI-->>User: Display tailored content experience
    
    User->>UI: Interact with content (view, click, save)
    UI->>Analytics: Track explicit user actions
    
    alt User updates preferences
        User->>UI: Modify language/content preferences
        UI->>ProfileService: Update user profile
        ProfileService->>DB: Save updated preferences
        DB-->>ProfileService: Confirm update
        UI->>PersonalizationEngine: Refresh recommendations
        PersonalizationEngine-->>UI: Return updated content feed
    end
    
    Note over User,Analytics: GDPR/CCPA compliant:<br/>explicit consent for all data usage
```

## 5. Multi-language Content Translation Flow

```mermaid
sequenceDiagram
    participant Creator as Content Creator
    participant Admin as Admin Dashboard
    participant TranslationAPI as Translation Service
    participant GoogleTranslate as Google Translate API
    participant DB as Supabase Database
    participant ContentProcessor as Content Processor

    Creator->>Admin: Request content translation
    Admin->>Admin: Select target languages
    Admin->>DB: Fetch content items for translation
    DB-->>Admin: Return content with current translations
    
    loop For each content item
        Admin->>TranslationAPI: Initiate translation job
        
        TranslationAPI->>ContentProcessor: Extract translatable text
        ContentProcessor->>ContentProcessor: Identify text blocks, annotations
        ContentProcessor-->>TranslationAPI: Return text segments
        
        loop For each target language
            TranslationAPI->>GoogleTranslate: Translate text segments
            Note over TranslationAPI,GoogleTranslate: Preserve formatting and context
            
            GoogleTranslate-->>TranslationAPI: Return translated segments
            
            TranslationAPI->>ContentProcessor: Reconstruct content with translations
            ContentProcessor->>ContentProcessor: Maintain original structure
            ContentProcessor->>ContentProcessor: Preserve annotations and formatting
            ContentProcessor-->>TranslationAPI: Return translated content blocks
        end
        
        TranslationAPI->>DB: Store translations in content_translations
        DB-->>TranslationAPI: Confirm translation storage
        
        TranslationAPI->>DB: Update translation_status and translated_languages
        DB-->>TranslationAPI: Confirm status update
    end
    
    TranslationAPI-->>Admin: Return translation job results
    Admin-->>Creator: Display translation completion status
    
    Note over Creator,DB: Translations maintain<br/>semantic meaning and formatting
```

## 6. Real-time Analytics and Performance Tracking

```mermaid
sequenceDiagram
    participant User as Content Consumer
    participant UI as Vista Interface
    participant Analytics as Analytics Service
    participant DB as Supabase Database
    participant Dashboard as Admin Dashboard
    participant Creator as Content Creator

    User->>UI: Interact with content
    UI->>Analytics: Track user event
    Note over UI,Analytics: {event_type, content_id, user_id, timestamp}
    
    Analytics->>Analytics: Validate and enrich event data
    Analytics->>DB: Store analytics event
    DB-->>Analytics: Confirm event storage
    
    Creator->>Dashboard: View performance metrics
    Dashboard->>DB: Query analytics data
    
    loop For each metric request
        alt Real-time metrics
            DB->>DB: Query recent events (last 24h)
            DB-->>Dashboard: Return real-time engagement data
        else Historical analysis
            DB->>DB: Aggregate historical events
            DB-->>Dashboard: Return trend analysis
        else Segmented reporting
            DB->>DB: Filter by user segments/content types
            DB-->>Dashboard: Return segmented metrics
        end
    end
    
    Dashboard->>Dashboard: Generate visualizations
    Dashboard->>Dashboard: Calculate key performance indicators
    
    Dashboard-->>Creator: Display analytics dashboard
    
    Creator->>Dashboard: Set up A/B test
    Dashboard->>DB: Configure test parameters
    
    loop During A/B test
        User->>UI: View content variant
        UI->>Analytics: Track variant performance
        Analytics->>DB: Store test metrics
        
        Dashboard->>DB: Query test results
        DB-->>Dashboard: Return A/B test performance
        Dashboard->>Dashboard: Calculate statistical significance
    end
    
    Dashboard-->>Creator: Display A/B test results
    
    Note over User,Creator: Privacy-compliant analytics<br/>with explicit user consent
```

## 7. Media Processing and Display

```mermaid
sequenceDiagram
    participant Creator as Content Creator
    participant Notion as Notion Platform
    participant Sync as Notion Sync Process
    participant Storage as Supabase Storage
    participant DB as Supabase Database
    participant Processor as Content Processor
    participant UI as Vista Interface
    participant User as End User

    Creator->>Notion: Create content with images
    Notion->>Notion: Store content with expiring URLs
    
    Sync->>Notion: Request content blocks
    Notion-->>Sync: Return blocks with image URLs
    
    loop For each image block
        Sync->>Sync: Detect image format
        alt Is HEIC format
            Sync->>Sync: Flag as HEIC image
            Sync->>Storage: Backup image to permanent storage
            Storage-->>Sync: Return permanent URL
        else Is standard format
            Sync->>Sync: Process normally
            Sync->>Storage: Backup if URL is expiring
            Storage-->>Sync: Return permanent URL
        end
        
        Sync->>Sync: Extract image dimensions
        Sync->>Sync: Calculate aspect ratio
        Sync->>Sync: Determine orientation (portrait/landscape)
    end
    
    Sync->>DB: Store processed content with image metadata
    
    User->>UI: Request content
    UI->>DB: Fetch content
    DB-->>UI: Return content with image data
    
    UI->>Processor: Process content for display
    Processor->>Processor: Extract first image for preview
    Processor->>Processor: Apply orientation and format detection
    
    alt Image is cover image
        Processor->>UI: Use as primary visual
    else No cover but has preview
        Processor->>UI: Use first content image as cover
    end
    
    alt Image is HEIC format
        UI->>UI: Show HEIC format warning
        UI->>UI: Provide direct link to image
    else Image loads normally
        UI->>UI: Display with proper aspect ratio
    end
    
    UI-->>User: Show content with properly formatted images
    
    Note over Creator,User: All media is properly processed,<br/>backed up, and displayed correctly
```

## Key Design Principles

### Error Handling Strategy
- Graceful degradation for external service failures
- Comprehensive logging for debugging and monitoring
- User-friendly error messages with actionable guidance
- Automatic retry mechanisms for transient failures

### Performance Optimization
- Lazy loading for content and media
- Efficient vector similarity searches with indexing
- Caching strategies for frequently accessed content
- Asynchronous processing for non-critical operations

### Privacy and Compliance
- Explicit user consent for all data collection
- No third-party tracking or cookies
- GDPR/CCPA compliant data handling
- User control over personalization preferences

### Scalability Considerations
- Horizontal scaling for high-traffic scenarios
- Efficient database queries with proper indexing
- CDN integration for global content delivery
- Microservice architecture for independent scaling
