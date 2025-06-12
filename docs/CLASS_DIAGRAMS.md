
# Class Diagrams

This document outlines the class structure of the Vista platform, showing key relationships between data models and components.

## Data Models

### Profile

```
+------------------+
|     Profile      |
+------------------+
| id: UUID         |
| created_at: Date |
| is_admin: Boolean|
| url_param: String|
| supported_ai_languages: String[]|
| default_language: String |
| notion_api_key: String |
| notion_database_id: String |
| verification_token: String |
+------------------+
```

### ContentItem

```
+-------------------+
|    ContentItem    |
+-------------------+
| id: UUID          |
| user_id: UUID     |
| title: String     |
| description: String |
| content: JSON     |
| category: String  |
| tags: String[]    |
| embedding: Vector |
| notion_page_id: String |
| notion_url: String|
| start_date: Date  |
| end_date: Date    |
| created_at: Date  |
| updated_at: Date  |
| translation_status: String |
| translated_languages: String[] |
| title_translations: JSON |
| description_translations: JSON |
| content_translations: JSON |
+-------------------+
```

### EmbeddingJob

```
+--------------------+
|   EmbeddingJob    |
+--------------------+
| id: UUID          |
| created_by: UUID   |
| status: String    |
| total_items: Number |
| items_processed: Number |
| started_at: Date  |
| completed_at: Date |
| updated_at: Date   |
| error: String      |
+--------------------+
```

### NotionWebhookVerification

```
+---------------------------+
| NotionWebhookVerification |
+---------------------------+
| id: UUID                 |
| verification_token: String |
| challenge_type: String    |
| created_at: Date          |
| received_at: Date         |
| user_id: UUID            |
+---------------------------+
```

### HomePageSettings

```
+-------------------------+
|    HomePageSettings     |
+-------------------------+
| id: UUID                |
| profileId: UUID         |
| heroTitle: String       |
| heroSubtitle: String    |
| heroDescription: String |
| interactiveTitle: String |
| interactiveSubtitle: String |
| customInputPlaceholder: String |
| submitButtonText: String |
| footerName: String      |
| optionButtons: OptionButton[] |
| updatedAt: Date         |
+-------------------------+
```

### OptionButton

```
+-------------------+
|    OptionButton   |
+-------------------+
| id: Number        |
| text: String      |
| defaultText: String |
+-------------------+
```

### StyleTemplate

```
+-------------------+
|   StyleTemplate   |
+-------------------+
| id: UUID          |
| name: String      |
| description: String |
| category: String  |
| styles: JSON      |
| previewImageUrl: String |
| isActive: Boolean |
| createdAt: Date   |
+-------------------+
```

### WebsiteSettings

```
+-------------------+
|  WebsiteSettings  |
+-------------------+
| id: UUID          |
| profileId: UUID   |
| heroTitle: String |
| heroSubtitle: String |
| aboutText: String |
| contactEmail: String |
| logoUrl: String   |
| primaryColor: String |
| secondaryColor: String |
| fontFamily: String |
| customCss: JSON   |
| updatedAt: Date   |
+-------------------+
```

## Component Structure

### Core Components

```
+-------------------+
|       App         |
+-------------------+
| Routes            |
| QueryClient       |
| TooltipProvider   |
| Toaster           |
+-------------------+
        |
        v
+-------------------+
|      Layout       |
+-------------------+
| Header            |
| Main Content      |
| Footer            |
+-------------------+
        |
        v
+------------------------------------------+
|                                          |
|              Page Components             |
|                                          |
+------------+------------+----------------+
|   Index    |    Vista   |  ContentDetail |
+------------+------------+----------------+
       |           |             |
       v           v             v
+------------+------------+----------------+
|    Hero    | PurposeInput| ContentDisplay |
+------------+------------+----------------+
```

### Admin Components

```
+-------------------+
|    AdminLayout    |
+-------------------+
| Navigation        |
| Outlet            |
| Sign Out Button   |
+-------------------+
        |
        v
+---------------------------------------------------------------+
|                                                               |
|                     Admin Page Components                      |
|                                                               |
+---------+----------+-------------+--------------+-------------+
|  Index  |  HomePage | UrlSettings | LanguageSetting| Embedding |
+---------+----------+-------------+--------------+-------------+
     |         |            |              |             |
     v         v            v              v             v
+---------+----------+-------------+--------------+-------------+
| AdminDash|HomePageForm|UrlParamSetting|LanguageSetting|EmbeddingJobs|
+---------+----------+-------------+--------------+-------------+
```

## Service Layer

```
+-------------------+
|  AdminService     |
+-------------------+
| checkAdminStatus()  |
| fetchEmbeddingJobs()|
| createEmbeddingJob()|
| startEmbeddingProcess() |
+-------------------+

+-------------------+
| UrlParamService   |
+-------------------+
| getProfileByUrlParam() |
| setUrlParam()     |
| getContentItemById() |
| getUserContentItems() |
| searchUserContent() |
+-------------------+

+-------------------+
| TranslationService|
+-------------------+
| translateText()   |
| getTranslation()  |
| getLanguageName() |
+-------------------+

+-------------------+
| HomePageService   |
+-------------------+
| getHomePageSettingsByProfileId() |
| saveHomePageSettings() |
| getHomePageSettingsByUrlParam() |
+-------------------+

+----------------------------+
| WebhookVerificationService |
+----------------------------+
| createVerificationToken()   |
| getVerificationToken()     |
| verifyWebhookChallenge()   |
+----------------------------+
```

## Relationships

1. **Profile to ContentItem**: One-to-many relationship. A profile can have multiple content items.

2. **Profile to EmbeddingJob**: One-to-many relationship. A user can create multiple embedding jobs.

3. **Profile to NotionWebhookVerification**: One-to-many relationship. A profile can have multiple webhook verifications.

4. **Profile to HomePageSettings**: One-to-one relationship. Each profile has one set of home page settings.

5. **HomePageSettings to OptionButtons**: One-to-many relationship. A home page settings can have 0-6 option buttons.

6. **Profile to WebsiteSettings**: One-to-one relationship. Each profile has one set of website settings.

## Authentication Flow

```
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
|   Auth Page    | --> | Supabase Auth  | --> |   Redirect     |
|                |     |                |     |                |
+----------------+     +----------------+     +----------------+
        ^                                           |
        |                                           v
+----------------+                         +----------------+
|                |                         |                |
|   Admin Guard  | <---------------------- |  Admin Page    |
|                |                         |                |
+----------------+                         +----------------+
```

## URL Parameter Flow

```
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
|   /:urlParam   | --> | Profile Lookup | --> | Custom Content |
|                |     |                |     |                |
+----------------+     +----------------+     +----------------+
        |                                           |
        v                                           v
+----------------+                         +----------------+
|                |                         |                |
| UrlParamVista  | ----------------------> | User Content   |
|                |                         |                |
+----------------+                         +----------------+
```

## Home Page Customization Flow

```
+------------------+      +------------------+      +------------------+
|                  |      |                  |      |                  |
| Admin HomePage   | ---> | HomePageSettings | ---> | Save to Database |
|                  |      | Form             |      |                  |
+------------------+      +------------------+      +------------------+
         |                                                |
         |                                                v
+------------------+                            +------------------+
|                  |                            |                  |
| URL Parameter    | <------------------------- | Apply Settings   |
| Index Page       |                            | to Frontend      |
+------------------+                            +------------------+
```

These class diagrams provide a high-level overview of the Vista platform's architecture, showing key components, their relationships, and data flows. As the application evolves, these diagrams will be updated to reflect changes in the system design.
