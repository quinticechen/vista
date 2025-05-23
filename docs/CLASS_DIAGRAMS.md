
# Vista Platform - Class Diagrams

This document contains comprehensive class diagrams for the Vista platform architecture, supporting the Document-driven Test-driven Development (DTDD) approach.

## 1. Core Domain Models

```mermaid
classDiagram
    class User {
        +UUID id
        +String email
        +DateTime created_at
        +Boolean is_admin
        +String url_param
        +String[] supported_ai_languages
        +String default_language
        +String notion_api_key
        +String notion_database_id
        +authenticate()
        +updatePreferences()
        +getPersonalizationSettings()
    }

    class ContentItem {
        +UUID id
        +String title
        +String description
        +String category
        +String[] tags
        +JSON content
        +DateTime created_at
        +DateTime updated_at
        +Date start_date
        +Date end_date
        +UUID user_id
        +String notion_page_id
        +String notion_url
        +String notion_page_status
        +Vector embedding
        +JSON content_translations
        +JSON description_translations
        +JSON title_translations
        +String cover_image
        +Boolean is_heic_cover
        +String orientation
        +generateEmbedding()
        +translateContent()
        +processNotionBlocks()
        +validateContent()
    }

    class NotionBlock {
        +String type
        +String text
        +NotionAnnotation[] annotations
        +String media_type
        +String media_url
        +String caption
        +Boolean is_heic
        +String orientation
        +NotionBlock[] children
        +Boolean is_list_item
        +String list_type
        +Boolean checked
        +String language
        +Object icon
        +render()
        +processChildren()
        +extractText()
    }

    class NotionAnnotation {
        +String text
        +Integer start
        +Integer end
        +Boolean bold
        +Boolean italic
        +Boolean underline
        +Boolean strikethrough
        +Boolean code
        +String color
        +String href
        +applyFormatting()
        +validateRange()
    }

    class Analytics {
        +UUID id
        +String event_type
        +UUID content_id
        +UUID user_id
        +DateTime timestamp
        +JSON metadata
        +String session_id
        +track()
        +aggregate()
        +generateReport()
    }

    User ||--o{ ContentItem : owns
    ContentItem ||--o{ NotionBlock : contains
    NotionBlock ||--o{ NotionAnnotation : has
    ContentItem ||--o{ Analytics : generates
    User ||--o{ Analytics : performs
```

## 2. Content Management System Architecture

```mermaid
classDiagram
    class ContentManager {
        +syncFromNotion(apiKey, databaseId)
        +processContent(content)
        +validateContent(content)
        +updateContent(contentId, updates)
        +deleteContent(contentId)
        +getContent(filters)
    }

    class NotionSyncService {
        +Client notionClient
        +String apiKey
        +String databaseId
        +connect()
        +queryDatabase()
        +fetchPageBlocks(pageId)
        +processWebhook(payload)
        +handleSyncErrors()
    }

    class ContentProcessor {
        +processBlocksSimplified(blocks)
        +extractRichText(richText)
        +extractAnnotations(richText)
        +handleMediaBlocks(block)
        +processChildBlocks(block)
        +fixNumberedLists(content)
    }

    class MediaHandler {
        +processImage(imageBlock)
        +processVideo(videoBlock)
        +processEmbed(embedBlock)
        +backupImageToStorage(imageUrl, options)
        +detectHeicFormat(url)
        +generateImageFilename(url, pageId, index)
    }

    class StorageService {
        +String bucketName
        +uploadFile(file, path)
        +getPublicUrl(path)
        +deleteFile(path)
        +checkFileExists(path)
        +createBucket(name, options)
    }

    ContentManager --> NotionSyncService : uses
    ContentManager --> ContentProcessor : uses
    ContentProcessor --> MediaHandler : uses
    MediaHandler --> StorageService : uses
    NotionSyncService --> ContentProcessor : delegates
```

## 3. Search and Personalization Engine

```mermaid
classDiagram
    class SearchEngine {
        +semanticSearch(query, filters)
        +generateQueryEmbedding(query)
        +vectorSimilaritySearch(embedding, threshold)
        +rankResults(results)
        +filterResults(results, criteria)
    }

    class PersonalizationEngine {
        +generateRecommendations(userId, context)
        +applyUserPreferences(content, preferences)
        +segmentContent(content, segments)
        +personalizeContent(content, user)
        +trackPersonalizationEffectiveness()
    }

    class EmbeddingService {
        +generateEmbedding(text)
        +generateQueryEmbedding(query)
        +batchGenerateEmbeddings(textArray)
        +validateEmbedding(vector)
        +storeEmbedding(contentId, vector)
    }

    class RecommendationEngine {
        +Map<String, Rule> rules
        +generateContentFeed(user, context)
        +applyBusinessRules(content)
        +ensureContentDiversity(feed)
        +filterByUserSegment(content, segment)
        +calculateRelevanceScore(content, user)
    }

    class UserSegment {
        +String id
        +String name
        +Map<String, Object> criteria
        +String[] targetLanguages
        +String[] contentTypes
        +matchesUser(user)
        +getSegmentCriteria()
    }

    SearchEngine --> EmbeddingService : uses
    PersonalizationEngine --> RecommendationEngine : uses
    PersonalizationEngine --> UserSegment : applies
    RecommendationEngine --> SearchEngine : leverages
```

## 4. User Interface and Component Architecture

```mermaid
classDiagram
    class NotionRenderer {
        +NotionBlock[] blocks
        +render()
        +groupListItems(blocks)
        +fixNumberedLists(blocks)
        +renderNestedContent(block, index, depth)
        +trackRenderedBlocks(blockId)
    }

    class MediaRenderer {
        +renderImage(props)
        +renderVideo(props)
        +renderEmbed(props)
        +handleImageError()
        +detectHeicImage(url)
    }

    class TextRenderer {
        +renderAnnotatedText(text, annotations)
        +createStyledNode(text, annotation)
        +getColorClass(color)
        +getBackgroundColorClass(color)
        +renderTextWithLineBreaks(block)
    }

    class ListRenderer {
        +renderList(listType, items, depth)
        +createListCounters()
        +getNextCount(listId)
        +resetCounter(listId)
    }

    class BlockRenderers {
        +renderHeading(block)
        +renderParagraph(block)
        +renderQuote(block)
        +renderTodo(block)
        +renderCallout(block)
        +renderCode(block)
        +renderToggle(block)
        +renderTable(block)
    }

    class ContentDisplay {
        +ContentItem content
        +displayContent()
        +renderMetadata()
        +renderCoverImage()
        +renderContentBody()
        +handleContentError()
    }

    NotionRenderer --> MediaRenderer : uses
    NotionRenderer --> TextRenderer : uses
    NotionRenderer --> ListRenderer : uses
    NotionRenderer --> BlockRenderers : uses
    ContentDisplay --> NotionRenderer : contains
```

## 5. Analytics and Reporting System

```mermaid
classDiagram
    class AnalyticsService {
        +trackEvent(event)
        +generateReport(criteria)
        +getEngagementMetrics(timeframe)
        +getUserSegmentAnalytics(segment)
        +getContentPerformance(contentId)
        +trackConversion(userId, goalId)
    }

    class MetricsCalculator {
        +calculateEngagementRate(events)
        +calculateTimeToContent(sessions)
        +calculateConversionRate(events)
        +calculateUserSatisfaction(feedback)
        +generateTrendAnalysis(historical)
    }

    class ReportingEngine {
        +generateDashboard(userId)
        +createPerformanceReport(criteria)
        +generateABTestReport(testId)
        +exportAnalytics(format, criteria)
        +scheduleReports(schedule)
    }

    class ABTestManager {
        +String testId
        +String[] variants
        +Map<String, Object> config
        +createTest(config)
        +assignVariant(userId)
        +trackTestEvent(event)
        +calculateSignificance()
        +determineWinner()
    }

    class DashboardComponent {
        +Map<String, Metric> metrics
        +renderMetrics()
        +updateRealTimeData()
        +filterByDateRange(start, end)
        +drillDown(metric, dimension)
    }

    AnalyticsService --> MetricsCalculator : uses
    AnalyticsService --> ReportingEngine : feeds
    ReportingEngine --> ABTestManager : includes
    DashboardComponent --> AnalyticsService : consumes
```

## 6. Translation and Internationalization

```mermaid
classDiagram
    class TranslationService {
        +translateContent(content, targetLanguage)
        +batchTranslate(contentArray, languages)
        +preserveFormatting(translation, original)
        +validateTranslation(translation)
        +updateTranslationStatus(contentId, status)
    }

    class LanguageManager {
        +String[] supportedLanguages
        +String defaultLanguage
        +detectUserLanguage()
        +setUserLanguage(userId, language)
        +getLanguagePreferences(userId)
        +validateLanguageCode(code)
    }

    class GoogleTranslateClient {
        +String apiKey
        +translateText(text, target, source)
        +detectLanguage(text)
        +getSupportedLanguages()
        +handleTranslationErrors()
    }

    class I18nProvider {
        +Map<String, Map<String, String>> translations
        +String currentLanguage
        +loadTranslations(language)
        +getTranslation(key, language)
        +interpolateValues(translation, values)
    }

    class ContentLocalizer {
        +localizeContent(content, language)
        +localizeMetadata(metadata, language)
        +formatDatesForLocale(date, locale)
        +formatNumbersForLocale(number, locale)
    }

    TranslationService --> GoogleTranslateClient : uses
    TranslationService --> LanguageManager : coordinates
    I18nProvider --> LanguageManager : uses
    ContentLocalizer --> TranslationService : uses
    ContentLocalizer --> I18nProvider : uses
```

## 7. System Integration and External Services

```mermaid
classDiagram
    class APIGateway {
        +routeRequest(request)
        +authenticateUser(token)
        +rateLimit(userId)
        +logRequest(request)
        +handleCORS(request)
    }

    class NotionWebhookHandler {
        +handleWebhook(payload)
        +validateWebhookSignature(signature)
        +processPageUpdate(pageId)
        +handleWebhookErrors()
    }

    class SupabaseClient {
        +DatabaseClient database
        +AuthClient auth
        +StorageClient storage
        +FunctionsClient functions
        +query(table, criteria)
        +insert(table, data)
        +update(table, id, data)
        +delete(table, id)
    }

    class EdgeFunction {
        +String name
        +execute(request)
        +handleCORS(request)
        +authenticateRequest(request)
        +logExecution(context)
    }

    class AIServiceClient {
        +generateEmbedding(text)
        +translateText(text, targetLang)
        +analyzeContent(content)
        +handleAPIErrors()
        +retryOnFailure(operation)
    }

    class CacheManager {
        +get(key)
        +set(key, value, ttl)
        +invalidate(pattern)
        +clear()
        +getStats()
    }

    APIGateway --> NotionWebhookHandler : routes
    APIGateway --> SupabaseClient : uses
    EdgeFunction --> SupabaseClient : uses
    EdgeFunction --> AIServiceClient : uses
    SupabaseClient --> CacheManager : uses
```

## Key Architectural Principles

### Separation of Concerns
- **Domain Layer**: Core business logic and entities
- **Service Layer**: Application services and orchestration
- **Infrastructure Layer**: External integrations and persistence
- **Presentation Layer**: UI components and user interactions

### Dependency Injection
- Services depend on abstractions, not concrete implementations
- Easy testing and mocking of external dependencies
- Flexible configuration for different environments

### Error Handling Strategy
- **Graceful Degradation**: System continues to function with reduced capabilities
- **Circuit Breaker Pattern**: Prevents cascading failures
- **Retry Logic**: Automatic retry for transient failures
- **Fallback Mechanisms**: Alternative responses when services are unavailable

### Data Flow Patterns
- **Command Query Responsibility Segregation (CQRS)**: Separate read and write operations
- **Event-Driven Architecture**: Loose coupling between components
- **Repository Pattern**: Abstraction layer for data access
- **Observer Pattern**: Real-time updates and notifications

### Scalability Considerations
- **Horizontal Scaling**: Multiple instances of services
- **Database Optimization**: Proper indexing and query optimization
- **Caching Strategy**: Multi-level caching for performance
- **Async Processing**: Non-blocking operations for better throughput

### Security Measures
- **Authentication and Authorization**: JWT-based security
- **Input Validation**: Comprehensive validation at all entry points
- **Data Encryption**: Encryption at rest and in transit
- **API Rate Limiting**: Protection against abuse and overuse
