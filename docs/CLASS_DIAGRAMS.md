
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
        +String verificationToken
        +JsonB websiteSettings
        +String selectedTheme
        +JsonB customStyles
        +getPreferences(): UserPreferences
        +updateLanguageSettings(settings: LanguageSettings): boolean
        +hasNotionIntegration(): boolean
        +updateWebsiteSettings(settings: WebsiteSettings): boolean
        +applyTheme(themeId: String): boolean
    }

    class WebsiteSettings {
        +UUID id
        +UUID profileId
        +String heroTitle
        +String heroSubtitle
        +String aboutText
        +String contactEmail
        +String logoUrl
        +String primaryColor
        +String secondaryColor
        +String fontFamily
        +JsonB customCss
        +Date updatedAt
        +validate(): boolean
        +generatePreview(): PreviewData
    }

    class StyleTemplate {
        +UUID id
        +String name
        +String description
        +String category
        +JsonB styles
        +String previewImageUrl
        +Boolean isActive
        +Date createdAt
        +apply(profileId: UUID): boolean
        +generateCss(): String
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

    class NotionWebhookVerification {
        +UUID id
        +UUID userId
        +String token
        +Date createdAt
        +Date updatedAt
        +Boolean isActive
        +generateToken(): String
        +validateToken(token: String): boolean
    }

    ContentItem "1" -- "0..n" TextContent: contains
    ContentItem "1" -- "0..n" ImageContent: contains
    ContentItem "1" -- "0..n" VideoContent: contains
    ContentItem "1" -- "0..n" ProductService: contains
    ContentItem "1" -- "0..n" Testimonial: contains
    ContentItem "*" -- "1" Profile: owned by
    EmbeddingJob "*" -- "1" Profile: created by
    Profile "1" -- "0..1" WebsiteSettings: has
    Profile "*" -- "0..1" StyleTemplate: uses
    NotionWebhookVerification "*" -- "1" Profile: belongs to
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

    class PublicRoute {
        +children: ReactNode
        +render(): JSX.Element
    }

    class AdminLayout {
        +children: ReactNode
        +collapsed: boolean
        +toggleSidebar(): void
        +handleLogout(): void
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

    class TranslatedText {
        +children: ReactNode
        +keyword: string
        +className: string
        +translate(): Promise<string>
        +render(): JSX.Element
    }

    class WebhookDebugger {
        +webhookEvents: WebhookEvent[]
        +loadEvents(): void
        +refreshEvents(): void
        +render(): JSX.Element
    }

    class ContentPreview {
        +content: ContentItem[]
        +searchQuery: string
        +currentLanguage: string
        +loadContent(): void
        +handleSearch(): void
        +render(): JSX.Element
    }

    class StyleEditor {
        +selectedTemplate: StyleTemplate
        +customStyles: JsonB
        +previewMode: boolean
        +applyTemplate(template: StyleTemplate): void
        +updateCustomStyles(styles: JsonB): void
        +generatePreview(): void
        +render(): JSX.Element
    }

    class WebsiteEditor {
        +websiteSettings: WebsiteSettings
        +isEditing: boolean
        +pendingChanges: JsonB
        +saveSettings(): void
        +resetChanges(): void
        +previewChanges(): void
        +render(): JSX.Element
    }

    App *-- Router
    Router *-- AuthGuard
    Router *-- AdminGuard
    Router *-- PublicRoute
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
    AdminLayout *-- TranslatedText
    AdminLayout *-- WebhookDebugger
    AdminLayout *-- ContentPreview
    AdminLayout *-- StyleEditor
    AdminLayout *-- WebsiteEditor
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
        +updateContentEmbeddings(contentId: string): Promise<boolean>
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
        +checkAdminStatus(userId: string): Promise<boolean>
    }

    class UrlParamService {
        +getContentByUrlParam(param: string): Promise<ContentItem[]>
        +getProfileByUrlParam(param: string): Promise<Profile>
        +validateUrlParam(param: string): boolean
        +createUrlParam(userId: string, param: string): Promise<boolean>
        +setUrlParam(userId: string, param: string): Promise<boolean>
    }

    class WebhookVerificationService {
        +getUserSpecificWebhookUrl(): Promise<string>
        +getUserVerificationToken(): Promise<string>
        +refreshVerificationToken(userId: string): Promise<string>
        +validateWebhookToken(token: string, userId: string): Promise<boolean>
    }

    class StyleService {
        +getAvailableTemplates(): Promise<StyleTemplate[]>
        +applyTemplate(userId: string, templateId: string): Promise<boolean>
        +updateCustomStyles(userId: string, styles: JsonB): Promise<boolean>
        +generateStylePreview(styles: JsonB): Promise<PreviewData>
        +validateStyles(styles: JsonB): boolean
    }

    class WebsiteService {
        +getWebsiteSettings(userId: string): Promise<WebsiteSettings>
        +updateWebsiteSettings(userId: string, settings: WebsiteSettings): Promise<boolean>
        +generateSitePreview(settings: WebsiteSettings): Promise<PreviewData>
        +validateSettings(settings: WebsiteSettings): boolean
    }

    SupabaseClient <-- NotionSyncService
    SupabaseClient <-- TranslationService
    SupabaseClient <-- EmbeddingService
    SupabaseClient <-- AdminService
    SupabaseClient <-- UrlParamService
    SupabaseClient <-- WebhookVerificationService
    SupabaseClient <-- StyleService
    SupabaseClient <-- WebsiteService
    NotionSyncService --> EmbeddingService
    TranslationService --> NotionSyncService
    AdminService --> NotionSyncService
    AdminService --> EmbeddingService
    AdminService --> TranslationService
    UrlParamService --> AdminService
    StyleService --> WebsiteService
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
        +updateEmbeddings(contentItems: ContentItem[]): Promise<boolean>
    }

    class NotionWebhook {
        +handleEvent(payload: WebhookPayload): Promise<Response>
        +extractPageId(payload: WebhookPayload): string
        +findContentItem(pageId: string): Promise<ContentItem|null>
        +updateContent(contentItem: ContentItem, pageId: string): Promise<boolean>
        +validateUserToken(token: string, userId: string): Promise<boolean>
        +handlePageDeletion(pageId: string): Promise<boolean>
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

## 5. Authentication and Authorization Flow

```mermaid
classDiagram
    class AuthenticationFlow {
        +login(credentials: Credentials): Promise<Session>
        +logout(): Promise<void>
        +validateSession(): Promise<boolean>
        +refreshToken(): Promise<string>
    }

    class AuthGuard {
        +checkAuthentication(): Promise<boolean>
        +redirectToLogin(): void
        +handleAuthStateChange(): void
    }

    class AdminGuard {
        +checkAdminStatus(userId: string): Promise<boolean>
        +redirectToHome(): void
        +validateAdminAccess(): Promise<boolean>
    }

    class PublicRoute {
        +allowAnonymousAccess(): boolean
        +handlePublicContent(): void
    }

    class RoleBasedAccess {
        +userRoles: string[]
        +requiredRole: string
        +checkPermission(action: string): boolean
        +enforceAccess(): boolean
    }

    AuthenticationFlow --> AuthGuard
    AuthGuard --> AdminGuard
    AdminGuard --> RoleBasedAccess
    AuthenticationFlow --> PublicRoute
```

## 6. Testing Architecture

```mermaid
classDiagram
    class TestRunner {
        +framework: "Vitest"
        +configFile: "vite.config.ts"
        +runTests(): Promise<TestResult>
        +runCoverage(): Promise<CoverageReport>
        +watchMode(): void
    }

    class CIWorkflow {
        +name: "CI/CD Pipeline"
        +triggers: string[]
        +runOn: "ubuntu-latest"
        +steps: WorkflowStep[]
        +execute(): Promise<WorkflowResult>
    }

    class PreCommitHooks {
        +huskyConfig: Object
        +lintStaged: Object
        +runLinting(): Promise<boolean>
        +runTests(): Promise<boolean>
        +preventBadCommits(): boolean
    }

    class TestSuite {
        +unitTests: Test[]
        +integrationTests: Test[]
        +e2eTests: Test[]
        +runSuite(type: string): Promise<TestResult[]>
    }

    class CodeQuality {
        +eslintConfig: Object
        +prettierConfig: Object
        +coverageThreshold: number
        +checkQuality(): Promise<QualityReport>
    }

    TestRunner --> TestSuite
    CIWorkflow --> TestRunner
    PreCommitHooks --> TestRunner
    PreCommitHooks --> CodeQuality
    CIWorkflow --> CodeQuality
```

These class diagrams provide a comprehensive view of the Vista platform architecture, including the new website customization features, updated authentication flows, testing infrastructure, and webhook verification system. They serve as a foundation for the Document-driven Test-driven Development (DTDD) approach, guiding implementation and testing efforts.
