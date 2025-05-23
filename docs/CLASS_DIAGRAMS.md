
# Vista Platform - Class Diagrams

This document provides comprehensive class diagrams for the Vista platform, supporting the Document-driven Test-driven Development (DTDD) approach.

## 1. Core Domain Models

```mermaid
classDiagram
    class ContentItem {
        +UUID id
        +String title
        +String description
        +String category
        +String[] tags
        +Date createdAt
        +Date updatedAt
        +Date startDate
        +Date endDate
        +JsonB content
        +Vector embedding
        +UUID userId
        +String notionPageId
        +String notionUrl
        +String notionPageStatus
        +String translationStatus
        +String[] translatedLanguages
        +JsonB titleTranslations
        +JsonB descriptionTranslations
        +JsonB contentTranslations
        +search(query: String): ContentItem[]
        +translate(language: String): boolean
        +generateEmbedding(): Vector
    }

    class Profile {
        +UUID id
        +Date createdAt
        +Boolean isAdmin
        +String urlParam
        +String[] supportedAiLanguages
        +String defaultLanguage
        +String notionApiKey
        +String notionDatabaseId
        +getPreferences(): UserPreferences
        +updateLanguageSettings(settings: LanguageSettings): boolean
        +hasNotionIntegration(): boolean
    }

    class TextContent {
        +UUID id
        +UUID contentId
        +String body
        +String format
        +render(): RenderResult
    }

    class ImageContent {
        +UUID id
        +UUID contentId
        +String imageUrl
        +String altText
        +String caption
        +detectOrientation(): Orientation
        +isHeic(): boolean
    }

    class VideoContent {
        +UUID id
        +UUID contentId
        +String videoUrl
        +String thumbnailUrl
        +String provider
        +getEmbedUrl(): String
    }

    class ProductService {
        +UUID id
        +UUID contentId
        +String name
        +String details
        +String imageUrl
        +Number price
        +format(): FormattedProduct
    }

    class Testimonial {
        +UUID id
        +UUID contentId
        +String quote
        +String authorName
        +String authorTitle
        +String authorAvatar
        +Number rating
        +formatRating(): String
    }

    class EmbeddingJob {
        +UUID id
        +Date startedAt
        +Date completedAt
        +Number itemsProcessed
        +Number totalItems
        +UUID createdBy
        +Date updatedAt
        +String error
        +String status
        +startJob(): boolean
        +updateProgress(count: Number): boolean
        +completeJob(): boolean
        +failJob(error: String): boolean
    }

    ContentItem "1" -- "0..n" TextContent: contains
    ContentItem "1" -- "0..n" ImageContent: contains
    ContentItem "1" -- "0..n" VideoContent: contains
    ContentItem "1" -- "0..n" ProductService: contains
    ContentItem "1" -- "0..n" Testimonial: contains
    ContentItem "*" -- "1" Profile: owned by
    EmbeddingJob "*" -- "1" Profile: created by
```

## 2. Frontend Component Architecture

```mermaid
classDiagram
    class App {
        +render(): JSX.Element
    }

    class Router {
        +routes: Route[]
        +renderRoutes(): JSX.Element
    }

    class AuthGuard {
        +children: ReactNode
        +redirectTo: string
        +checkAuth(): boolean
        +render(): JSX.Element
    }

    class AdminGuard {
        +children: ReactNode
        +redirectTo: string
        +checkAdminStatus(): boolean
        +render(): JSX.Element
    }

    class AdminLayout {
        +children: ReactNode
        +render(): JSX.Element
    }

    class ContentDisplay {
        +contentId: string
        +language: string
        +loadContent(): void
        +render(): JSX.Element
    }

    class ContentBody {
        +content: ContentItem
        +language: string
        +render(): JSX.Element
    }

    class ContentMetadata {
        +content: ContentItem
        +showCategory: boolean
        +showDate: boolean
        +formatDate(date: Date): string
        +render(): JSX.Element
    }

    class ContentCoverImage {
        +content: ContentItem
        +aspectRatio: number
        +priority: boolean
        +render(): JSX.Element
    }

    class NotionRenderer {
        +blocks: Block[]
        +renderBlock(block: Block): JSX.Element
        +groupListItems(blocks: Block[]): Block[]
        +fixNumberedLists(blocks: Block[]): Block[]
        +render(): JSX.Element
    }

    class MediaRenderer {
        +block: MediaBlock
        +handleImageError(): void
        +render(): JSX.Element
    }

    class ListRenderer {
        +items: ListItem[]
        +listType: string
        +renderItems(): JSX.Element
    }

    class PurposeInput {
        +onSubmit: Function
        +placeholder: string
        +defaultValue: string
        +handleSubmit(): void
        +render(): JSX.Element
    }

    class LanguageSwitcher {
        +languages: string[]
        +currentLanguage: string
        +onLanguageChange: Function
        +render(): JSX.Element
    }

    App *-- Router
    Router *-- AuthGuard
    Router *-- AdminGuard
    AdminGuard *-- AdminLayout
    Router *-- ContentDisplay
    ContentDisplay *-- ContentBody
    ContentDisplay *-- ContentMetadata
    ContentDisplay *-- ContentCoverImage
    ContentBody *-- NotionRenderer
    NotionRenderer *-- MediaRenderer
    NotionRenderer *-- ListRenderer
    AdminLayout *-- PurposeInput
    AdminLayout *-- LanguageSwitcher
```

## 3. Backend Service Architecture

```mermaid
classDiagram
    class SupabaseClient {
        +auth: AuthClient
        +storage: StorageClient
        +realtimeClient: RealtimeClient
        +initialize(): boolean
        +handleAuthStateChange(): void
    }

    class NotionSyncService {
        +apiKey: string
        +databaseId: string
        +syncDatabase(): Promise<SyncResult>
        +processPageBlocks(pageId: string): Promise<ProcessedBlocks>
        +handleWebhook(payload: WebhookPayload): Promise<boolean>
        +backupImages(blocks: Block[]): Promise<ProcessedBlocks>
        +detectHeicImages(blocks: Block[]): Block[]
    }

    class TranslationService {
        +supportedLanguages: string[]
        +defaultLanguage: string
        +translateContent(content: ContentItem, targetLanguage: string): Promise<TranslatedContent>
        +extractTranslatableText(blocks: Block[]): string[]
        +reconstructWithTranslations(blocks: Block[], translations: Translation[]): Block[]
        +updateTranslationStatus(contentId: string, status: string): Promise<boolean>
    }

    class EmbeddingService {
        +generateEmbeddings(items: ContentItem[]): Promise<EmbeddingResult[]>
        +generateQueryEmbedding(query: string): Promise<Vector>
        +semanticSearch(query: string): Promise<SearchResult[]>
        +createEmbeddingJob(userId: string): Promise<EmbeddingJob>
        +updateJobProgress(jobId: string, progress: number): Promise<boolean>
    }

    class AdminService {
        +getUserProfile(userId: string): Promise<Profile>
        +updateProfile(userId: string, profile: ProfileUpdate): Promise<Profile>
        +getContentItems(userId: string): Promise<ContentItem[]>
        +syncNotionContent(userId: string, notionConfig: NotionConfig): Promise<SyncResult>
        +generateAllEmbeddings(userId: string): Promise<EmbeddingJob>
    }

    class UrlParamService {
        +getContentByUrlParam(param: string): Promise<ContentItem[]>
        +getProfileByUrlParam(param: string): Promise<Profile>
        +validateUrlParam(param: string): boolean
        +createUrlParam(userId: string, param: string): Promise<boolean>
    }

    SupabaseClient <-- NotionSyncService
    SupabaseClient <-- TranslationService
    SupabaseClient <-- EmbeddingService
    SupabaseClient <-- AdminService
    SupabaseClient <-- UrlParamService
    NotionSyncService --> EmbeddingService
    TranslationService --> NotionSyncService
    AdminService --> NotionSyncService
    AdminService --> EmbeddingService
    AdminService --> TranslationService
    UrlParamService --> AdminService
```

## 4. Edge Function Architecture

```mermaid
classDiagram
    class EdgeFunction {
        +corsHeaders: Object
        +handleOptions(): Response
        +validateAuth(req: Request): User|null
        +handleErrors(error: Error): Response
    }

    class SyncNotionDatabase {
        +notionApiKey: string
        +notionDatabaseId: string
        +userId: string
        +execute(): Promise<SyncResult>
        +queryDatabase(): Promise<NotionPage[]>
        +processPages(pages: NotionPage[]): Promise<ProcessedPage[]>
        +handleRemovedPages(existingPages: string[], processedPages: string[]): Promise<RemovedPage[]>
    }

    class NotionWebhook {
        +handleEvent(payload: WebhookPayload): Promise<Response>
        +extractPageId(payload: WebhookPayload): string
        +findContentItem(pageId: string): Promise<ContentItem|null>
        +updateContent(contentItem: ContentItem, pageId: string): Promise<boolean>
    }

    class GenerateEmbeddings {
        +userId: string
        +execute(): Promise<EmbeddingJobResult>
        +getUnembeddedItems(): Promise<ContentItem[]>
        +createEmbedding(text: string): Promise<Vector>
        +storeEmbedding(contentId: string, embedding: Vector): Promise<boolean>
        +updateJobStatus(jobId: string, status: JobStatus): Promise<boolean>
    }

    class GenerateQueryEmbedding {
        +query: string
        +execute(): Promise<QueryEmbeddingResult>
        +sanitizeQuery(query: string): string
        +createEmbedding(query: string): Promise<Vector>
    }

    class GetTranslationKey {
        +userId: string
        +validateAdmin(userId: string): Promise<boolean>
        +getTranslationApiKey(): Promise<string|null>
        +execute(): Promise<TranslationKeyResult>
    }

    EdgeFunction <|-- SyncNotionDatabase
    EdgeFunction <|-- NotionWebhook
    EdgeFunction <|-- GenerateEmbeddings
    EdgeFunction <|-- GenerateQueryEmbedding
    EdgeFunction <|-- GetTranslationKey
```

## 5. Relationship Between Domain Models and UI Components

```mermaid
classDiagram
    class ContentItem {
        +UUID id
        +String title
        +String description
        +JsonB content
        +getContent(): ProcessedContent
    }

    class NotionBlock {
        +String type
        +String text
        +Object annotations
        +Boolean is_list_item
        +String list_type
        +Boolean is_heic
        +String media_url
        +NotionBlock[] children
    }

    class NotionRenderer {
        +renderBlock(block: NotionBlock): JSX.Element
        +renderNestedContent(block: NotionBlock, depth: number): JSX.Element
    }

    class BlockRenderer {
        +block: NotionBlock
        +render(): JSX.Element
    }

    class MediaRenderer {
        +block: NotionBlock
        +handleHeicImage(): JSX.Element
        +render(): JSX.Element
    }

    class ListRenderer {
        +items: NotionBlock[]
        +listType: string
        +render(): JSX.Element
    }

    class TextRenderer {
        +text: string
        +annotations: Object
        +renderAnnotatedText(): JSX.Element
    }

    ContentItem --> NotionBlock: contains
    NotionRenderer --> BlockRenderer: uses
    BlockRenderer --> MediaRenderer: uses for media
    BlockRenderer --> ListRenderer: uses for lists
    BlockRenderer --> TextRenderer: uses for text
    NotionBlock --> NotionBlock: has children
```

These class diagrams provide a comprehensive view of the Vista platform architecture, covering domain models, frontend components, backend services, edge functions, and their relationships. They serve as a foundation for the Document-driven Test-driven Development (DTDD) approach, guiding implementation and testing efforts.
