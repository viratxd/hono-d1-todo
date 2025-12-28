# Cloudflare D1 Content Management REST API

A lightweight, edge-optimized REST API for storing and managing structured content using Cloudflare Workers and D1 (SQLite). Perfect for storing media, project prompts, and other content with soft delete support and advanced search capabilities.

## 🎯 Quick Start

### Prerequisites
- Node.js 18+
- Cloudflare Account with D1 access
- `wrangler` CLI installed

### Installation

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

The API will be available at `http://localhost:8787`

### Deployment

```bash
npm run deploy
```

## 📚 API Overview

All endpoints require `x-api-key: sdv147` header.

### Core Features

- **4 Content Categories**: Image, Project Prompt, Video, Audio
- **Full CRUD**: Create, Read, Update, Delete operations
- **Soft Delete**: Move records to recycle bin instead of permanent deletion
- **Search & Filter**: LIKE search on content + type filtering
- **Pagination**: Latest N records or all active records
- **Recycle Bin**: View, restore, or permanently purge deleted records

### Quick Examples

**Create a record:**
```bash
curl -X POST http://localhost:8787/project-prompt \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "json",
    "data": "{\"title\":\"My Project\"}"
  }'
```

**List records with search:**
```bash
curl http://localhost:8787/project-prompt/list?search=project&type=json \
  -H "x-api-key: sdv147"
```

**Soft delete a record:**
```bash
curl -X DELETE http://localhost:8787/image/550e8400-e29b-41d4-a716-446655440000 \
  -H "x-api-key: sdv147"
```

**Restore from recycle bin:**
```bash
curl -X POST http://localhost:8787/recyclebin/image/restore/550e8400-e29b-41d4-a716-446655440000 \
  -H "x-api-key: sdv147"
```

## 🔧 Technology Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Cloudflare Workers |
| Framework | Hono (TypeScript) |
| Database | Cloudflare D1 (SQLite) |
| ORM | Drizzle ORM |
| Validation | Zod |

## 📖 Documentation

For complete API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

### Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/{category}` | Create record |
| `GET` | `/{category}/{id}` | Read record |
| `PUT` | `/{category}/{id}` | Update record |
| `DELETE` | `/{category}/{id}` | Soft delete record |
| `GET` | `/{category}/list` | List with search & filter |
| `GET` | `/recyclebin/{category}` | List deleted records |
| `POST` | `/recyclebin/{category}/restore/{id}` | Restore deleted record |
| `DELETE` | `/recyclebin/{category}/purge/{id}` | Permanent delete |

## 🗂️ Project Structure

```
.
├── src/
│   ├── index.ts              # Main API endpoints
│   ├── middleware/
│   │   └── auth.ts          # API key validation
│   ├── utils/
│   │   └── helpers.ts       # Utilities & constants
│   └── db/
│       └── schema.ts        # Database schema (Drizzle)
├── drizzle/                 # Database migrations
├── wrangler.jsonc           # Cloudflare config
├── tsconfig.json            # TypeScript config
└── package.json
```

## 🗄️ Database Schema

All four categories use the same uniform schema:

```sql
CREATE TABLE {category} (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,         -- json | raw | base64 | url
  data        TEXT NOT NULL,         -- content payload
  created_at  INTEGER NOT NULL,      -- unix timestamp
  deleted_at  INTEGER NULL           -- NULL = active, timestamp = deleted
);
```

**Categories:**
- `image` - Base64/URL image references
- `project_prompt` - Project briefs and prompts
- `video` - Base64/URL video references
- `audio` - Base64/URL audio references

## 🔐 Authentication

All endpoints require:
```
x-api-key: sdv147
```

Missing or invalid API key returns `401 Unauthorized`

To change the API key, edit [src/middleware/auth.ts](src/middleware/auth.ts)

## 🧪 Testing & Examples

### 1. Health Check

**Request:**
```bash
curl http://localhost:8787
```

**Response:**
```json
{
  "message": "Cloudflare D1 REST API",
  "version": "1.0.0",
  "description": "Lightweight backend for storing and managing structured content"
}
```

---

### 2. CREATE (POST) - Comprehensive Examples

#### 2a. Create Project Prompt (JSON Type)

**Request:**
```bash
curl -X POST http://localhost:8787/project-prompt \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "json",
    "data": "{\"title\":\"Landing Page Redesign\",\"description\":\"Create a modern landing page with dark mode support\",\"priority\":\"high\",\"deadline\":\"2024-02-15\",\"budget\":3000}"
  }'
```

**Response (201):**
```json
{
  "message": "Record created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "json",
    "data": "{\"title\":\"Landing Page Redesign\",\"description\":\"Create a modern landing page with dark mode support\",\"priority\":\"high\",\"deadline\":\"2024-02-15\",\"budget\":3000}",
    "created_at": 1703808000,
    "deleted_at": null
  }
}
```

#### 2b. Create Image (URL Type)

**Request:**
```bash
curl -X POST http://localhost:8787/image \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "660f9411-f30c-42e5-b717-557766551111",
    "type": "url",
    "data": "https://images.unsplash.com/photo-1611532736000-db6b96bef9da?w=1200&h=800"
  }'
```

**Response (201):**
```json
{
  "message": "Record created successfully",
  "data": {
    "id": "660f9411-f30c-42e5-b717-557766551111",
    "type": "url",
    "data": "https://images.unsplash.com/photo-1611532736000-db6b96bef9da?w=1200&h=800",
    "created_at": 1703808100,
    "deleted_at": null
  }
}
```

#### 2c. Create Audio (Base64 Type)

**Request:**
```bash
curl -X POST http://localhost:8787/audio \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "770f9511-f30c-42e5-b717-557766552222",
    "type": "base64",
    "data": "SUQzBAAAAAAAI1NUEQAZAAAAEQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
  }'
```

#### 2d. Create Video (URL Type)

**Request:**
```bash
curl -X POST http://localhost:8787/video \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "880f9611-f30c-42e5-b717-557766553333",
    "type": "url",
    "data": "https://example.com/videos/product-demo.mp4"
  }'
```

#### 2e. Create Project Prompt (Raw Text Type)

**Request:**
```bash
curl -X POST http://localhost:8787/project-prompt \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "990f9711-f30c-42e5-b717-557766554444",
    "type": "raw",
    "data": "Design a responsive dashboard for a SaaS analytics platform. Include real-time charts, user management interface, and export functionality."
  }'
```

---

### 3. READ (GET) - Get Single Record

#### 3a. Retrieve a Project Prompt

**Request:**
```bash
curl http://localhost:8787/project-prompt/550e8400-e29b-41d4-a716-446655440000 \
  -H "x-api-key: sdv147"
```

**Response (200):**
```json
{
  "message": "Record retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "json",
    "data": "{\"title\":\"Landing Page Redesign\",\"description\":\"Create a modern landing page with dark mode support\",\"priority\":\"high\",\"deadline\":\"2024-02-15\",\"budget\":3000}",
    "created_at": 1703808000,
    "deleted_at": null
  }
}
```

#### 3b. Retrieve an Image

**Request:**
```bash
curl http://localhost:8787/image/660f9411-f30c-42e5-b717-557766551111 \
  -H "x-api-key: sdv147"
```

**Response (200):**
```json
{
  "message": "Record retrieved successfully",
  "data": {
    "id": "660f9411-f30c-42e5-b717-557766551111",
    "type": "url",
    "data": "https://images.unsplash.com/photo-1611532736000-db6b96bef9da?w=1200&h=800",
    "created_at": 1703808100,
    "deleted_at": null
  }
}
```

#### 3c. Attempt to Read Non-existent Record

**Request:**
```bash
curl http://localhost:8787/project-prompt/nonexistent-id \
  -H "x-api-key: sdv147"
```

**Response (404):**
```json
{
  "error": "Record not found"
}
```

---

### 4. UPDATE (PUT) - Modify Records

#### 4a. Update Project Prompt JSON

**Request:**
```bash
curl -X PUT http://localhost:8787/project-prompt/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "data": "{\"title\":\"Landing Page Redesign\",\"description\":\"Create a modern landing page with dark mode and animations\",\"priority\":\"critical\",\"deadline\":\"2024-02-10\",\"budget\":5000,\"status\":\"in-progress\"}"
  }'
```

**Response (200):**
```json
{
  "message": "Record updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "json",
    "data": "{\"title\":\"Landing Page Redesign\",\"description\":\"Create a modern landing page with dark mode and animations\",\"priority\":\"critical\",\"deadline\":\"2024-02-10\",\"budget\":5000,\"status\":\"in-progress\"}",
    "created_at": 1703808000,
    "deleted_at": null
  }
}
```

#### 4b. Update Image URL

**Request:**
```bash
curl -X PUT http://localhost:8787/image/660f9411-f30c-42e5-b717-557766551111 \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "data": "https://images.unsplash.com/photo-1611532736000-db6b96bef9da?w=2000&h=1500&q=high"
  }'
```

#### 4c. Update Type Only

**Request:**
```bash
curl -X PUT http://localhost:8787/project-prompt/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "type": "raw"
  }'
```

#### 4d. Update Deleted Record (Error Case)

**Request:**
```bash
curl -X PUT http://localhost:8787/project-prompt/deleted-record-id \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "data": "Updated content"
  }'
```

**Response (404):**
```json
{
  "error": "Record not found or is deleted"
}
```

---

### 5. DELETE (Soft Delete) - Move to Recycle Bin

#### 5a. Soft Delete a Project Prompt

**Request:**
```bash
curl -X DELETE http://localhost:8787/project-prompt/550e8400-e29b-41d4-a716-446655440000 \
  -H "x-api-key: sdv147"
```

**Response (200):**
```json
{
  "message": "Record moved to recycle bin"
}
```

#### 5b. Soft Delete an Image

**Request:**
```bash
curl -X DELETE http://localhost:8787/image/660f9411-f30c-42e5-b717-557766551111 \
  -H "x-api-key: sdv147"
```

#### 5c. Attempt to Delete Already Deleted Record

**Request:**
```bash
curl -X DELETE http://localhost:8787/project-prompt/550e8400-e29b-41d4-a716-446655440000 \
  -H "x-api-key: sdv147"
```

**Response (404):**
```json
{
  "error": "Record not found or already deleted"
}
```

---

### 6. LIST - Query with Search & Filtering

#### 6a. List Latest 20 Records (Default)

**Request:**
```bash
curl "http://localhost:8787/project-prompt/list" \
  -H "x-api-key: sdv147"
```

**Response (200):**
```json
{
  "message": "Records retrieved successfully",
  "count": 15,
  "filters": {
    "full": false,
    "limit": 20,
    "search": null,
    "type": null
  },
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "json",
      "data": "{...}",
      "created_at": 1703808000,
      "deleted_at": null
    }
  ]
}
```

#### 6b. List Latest 50 Records

**Request:**
```bash
curl "http://localhost:8787/project-prompt/list?n=50" \
  -H "x-api-key: sdv147"
```

**Response (200):**
```json
{
  "message": "Records retrieved successfully",
  "count": 50,
  "filters": {
    "full": false,
    "limit": 50,
    "search": null,
    "type": null
  },
  "data": [ /* 50 records */ ]
}
```

#### 6c. Get ALL Active Records (No Limit)

**Request:**
```bash
curl "http://localhost:8787/image/list?full" \
  -H "x-api-key: sdv147"
```

**Response (200):**
```json
{
  "message": "Records retrieved successfully",
  "count": 127,
  "filters": {
    "full": true,
    "limit": "unlimited",
    "search": null,
    "type": null
  },
  "data": [ /* all 127 records */ ]
}
```

#### 6d. Search by Keyword

**Request:**
```bash
curl "http://localhost:8787/project-prompt/list?search=landing" \
  -H "x-api-key: sdv147"
```

**Response (200):**
```json
{
  "message": "Records retrieved successfully",
  "count": 3,
  "filters": {
    "full": false,
    "limit": 20,
    "search": "landing",
    "type": null
  },
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "json",
      "data": "{\"title\":\"Landing Page Redesign\",\"description\":\"Create a modern landing page with dark mode support\",\"priority\":\"high\",\"deadline\":\"2024-02-15\",\"budget\":3000}",
      "created_at": 1703808000,
      "deleted_at": null
    }
  ]
}
```

#### 6e. Filter by Type

**Request:**
```bash
curl "http://localhost:8787/image/list?type=url" \
  -H "x-api-key: sdv147"
```

**Response (200):**
```json
{
  "message": "Records retrieved successfully",
  "count": 8,
  "filters": {
    "full": false,
    "limit": 20,
    "search": null,
    "type": "url"
  },
  "data": [ /* 8 URL-type image records */ ]
}
```

#### 6f. Filter by Type (JSON)

**Request:**
```bash
curl "http://localhost:8787/project-prompt/list?type=json" \
  -H "x-api-key: sdv147"
```

#### 6g. Combine Multiple Filters

**Request:**
```bash
curl "http://localhost:8787/project-prompt/list?n=50&search=mobile&type=json" \
  -H "x-api-key: sdv147"
```

**Response (200):**
```json
{
  "message": "Records retrieved successfully",
  "count": 12,
  "filters": {
    "full": false,
    "limit": 50,
    "search": "mobile",
    "type": "json"
  },
  "data": [ /* records matching all filters */ ]
}
```

#### 6h. Case-Insensitive Search

**Request:**
```bash
curl "http://localhost:8787/project-prompt/list?search=DASHBOARD" \
  -H "x-api-key: sdv147"
```

**Note:** SQLite LIKE search is case-insensitive by default

#### 6i. Search with Special Characters (URL Encoded)

**Request:**
```bash
curl "http://localhost:8787/project-prompt/list?search=mobile%20app%20redesign" \
  -H "x-api-key: sdv147"
```

**Response:** Will find records containing "mobile app redesign"

---

### 7. RECYCLE BIN - View & Manage Deleted Records

#### 7a. List All Deleted Records

**Request:**
```bash
curl "http://localhost:8787/recyclebin/project-prompt" \
  -H "x-api-key: sdv147"
```

**Response (200):**
```json
{
  "message": "Deleted records retrieved from recycle bin",
  "count": 3,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "json",
      "data": "{\"title\":\"Landing Page Redesign\",...}",
      "created_at": 1703808000,
      "deleted_at": 1703808500
    },
    {
      "id": "aa1f9412-f30c-42e5-b717-557766552222",
      "type": "raw",
      "data": "Old design notes...",
      "created_at": 1703807000,
      "deleted_at": 1703808200
    }
  ]
}
```

#### 7b. List Deleted Images

**Request:**
```bash
curl "http://localhost:8787/recyclebin/image" \
  -H "x-api-key: sdv147"
```

#### 7c. Empty Recycle Bin (No Deleted Records)

**Request:**
```bash
curl "http://localhost:8787/recyclebin/audio" \
  -H "x-api-key: sdv147"
```

**Response (200):**
```json
{
  "message": "Deleted records retrieved from recycle bin",
  "count": 0,
  "data": []
}
```

---

### 8. RESTORE - Restore Deleted Records

#### 8a. Restore a Project Prompt

**Request:**
```bash
curl -X POST "http://localhost:8787/recyclebin/project-prompt/restore/550e8400-e29b-41d4-a716-446655440000" \
  -H "x-api-key: sdv147"
```

**Response (200):**
```json
{
  "message": "Record restored successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "json",
    "data": "{\"title\":\"Landing Page Redesign\",...}",
    "created_at": 1703808000,
    "deleted_at": null
  }
}
```

#### 8b. Restore an Image

**Request:**
```bash
curl -X POST "http://localhost:8787/recyclebin/image/restore/660f9411-f30c-42e5-b717-557766551111" \
  -H "x-api-key: sdv147"
```

#### 8c. Attempt to Restore Non-Deleted Record (Error)

**Request:**
```bash
curl -X POST "http://localhost:8787/recyclebin/project-prompt/restore/active-record-id" \
  -H "x-api-key: sdv147"
```

**Response (404):**
```json
{
  "error": "Record not found in recycle bin"
}
```

---

### 9. PURGE - Permanently Delete Records

#### 9a. Permanently Delete a Record

**Request:**
```bash
curl -X DELETE "http://localhost:8787/recyclebin/project-prompt/purge/550e8400-e29b-41d4-a716-446655440000" \
  -H "x-api-key: sdv147"
```

**Response (200):**
```json
{
  "message": "Record permanently deleted"
}
```

#### 9b. Attempt to Purge Non-Deleted Record (Error)

**Request:**
```bash
curl -X DELETE "http://localhost:8787/recyclebin/image/purge/active-record-id" \
  -H "x-api-key: sdv147"
```

**Response (404):**
```json
{
  "error": "Record not found in recycle bin"
}
```

---

### 10. Authentication Errors

#### 10a. Missing API Key

**Request:**
```bash
curl http://localhost:8787/project-prompt/list
```

**Response (401):**
```json
{
  "error": "Unauthorized"
}
```

#### 10b. Invalid API Key

**Request:**
```bash
curl "http://localhost:8787/project-prompt/list" \
  -H "x-api-key: wrong-key"
```

**Response (401):**
```json
{
  "error": "Unauthorized"
}
```

#### 10c. Correct API Key

**Request:**
```bash
curl "http://localhost:8787/project-prompt/list" \
  -H "x-api-key: sdv147"
```

**Response (200):**
```json
{
  "message": "Records retrieved successfully",
  "count": 5,
  "filters": { /* ... */ },
  "data": [ /* ... */ ]
}
```

## 🚀 Development Commands

```bash
# Start local development server
npm run dev

# Generate database migrations
npm run generate

# Apply migrations
npm run migrate

# Deploy to Cloudflare
npm run deploy

# Generate Cloudflare types
npm run cf-typegen
```

---

## 📚 Real-World Usage Workflows

### Workflow 1: Content Management System - Create, Update, Delete

**Scenario:** Managing project briefs in a design agency

**Step 1:** Create a new project prompt
```bash
curl -X POST http://localhost:8787/project-prompt \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "proj-001",
    "type": "json",
    "data": "{\"name\":\"E-commerce Redesign\",\"client\":\"TechCorp\",\"timeline\":\"4 weeks\",\"status\":\"pending\"}"
  }'
```

**Step 2:** Update the project as it progresses
```bash
curl -X PUT http://localhost:8787/project-prompt/proj-001 \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "data": "{\"name\":\"E-commerce Redesign\",\"client\":\"TechCorp\",\"timeline\":\"4 weeks\",\"status\":\"in-progress\",\"assignee\":\"John\"}"
  }'
```

**Step 3:** When complete, soft delete
```bash
curl -X DELETE http://localhost:8787/project-prompt/proj-001 \
  -H "x-api-key: sdv147"
```

**Step 4:** Retrieve from recycle bin if needed
```bash
curl http://localhost:8787/recyclebin/project-prompt \
  -H "x-api-key: sdv147"
```

---

### Workflow 2: Media Gallery - Store & Organize Images

**Scenario:** Building an image gallery app

**Step 1:** Store multiple images
```bash
# Image 1
curl -X POST http://localhost:8787/image \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "img-hero-001",
    "type": "url",
    "data": "https://cdn.example.com/hero.jpg"
  }'

# Image 2
curl -X POST http://localhost:8787/image \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "img-feature-001",
    "type": "url",
    "data": "https://cdn.example.com/feature.jpg"
  }'
```

**Step 2:** Search for images containing "hero"
```bash
curl "http://localhost:8787/image/list?search=hero" \
  -H "x-api-key: sdv147"
```

**Step 3:** Get all URL-type images
```bash
curl "http://localhost:8787/image/list?type=url&full" \
  -H "x-api-key: sdv147"
```

**Step 4:** Get latest 100 images
```bash
curl "http://localhost:8787/image/list?n=100" \
  -H "x-api-key: sdv147"
```

---

### Workflow 3: Prompt Library - Search & Filter

**Scenario:** AI prompt management system

**Step 1:** Create multiple prompts with different types
```bash
# JSON structured prompt
curl -X POST http://localhost:8787/project-prompt \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "prompt-ai-001",
    "type": "json",
    "data": "{\"category\":\"image-generation\",\"model\":\"dall-e\",\"temperature\":0.7}"
  }'

# Raw text prompt
curl -X POST http://localhost:8787/project-prompt \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "prompt-ai-002",
    "type": "raw",
    "data": "Create a futuristic city landscape with neon lights and flying cars"
  }'
```

**Step 2:** Search for specific prompts
```bash
curl "http://localhost:8787/project-prompt/list?search=futuristic&type=raw" \
  -H "x-api-key: sdv147"
```

**Step 3:** Get only structured (JSON) prompts
```bash
curl "http://localhost:8787/project-prompt/list?type=json&n=50" \
  -H "x-api-key: sdv147"
```

---

### Workflow 4: Audio/Video Library - Base64 & URL Mix

**Scenario:** Digital media asset management

**Step 1:** Store video URLs
```bash
curl -X POST http://localhost:8787/video \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "video-demo-001",
    "type": "url",
    "data": "https://vimeo.com/123456789"
  }'
```

**Step 2:** Store audio files (base64)
```bash
curl -X POST http://localhost:8787/audio \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "audio-intro-001",
    "type": "base64",
    "data": "SUQzBAAAAAAAI1NTRVQAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA"
  }'
```

**Step 3:** Get all audio assets
```bash
curl "http://localhost:8787/audio/list?full" \
  -H "x-api-key: sdv147"
```

**Step 4:** Filter videos by type
```bash
curl "http://localhost:8787/video/list?type=url" \
  -H "x-api-key: sdv147"
```

---

### Workflow 5: Disaster Recovery - Archive & Restore

**Scenario:** Archived content management

**Step 1:** Create important content
```bash
curl -X POST http://localhost:8787/project-prompt \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "critical-brief-001",
    "type": "json",
    "data": "{\"title\":\"Critical Project\",\"archived\":true,\"retention\":\"permanent\"}"
  }'
```

**Step 2:** Soft delete when no longer active
```bash
curl -X DELETE http://localhost:8787/project-prompt/critical-brief-001 \
  -H "x-api-key: sdv147"
```

**Step 3:** View all archived items
```bash
curl http://localhost:8787/recyclebin/project-prompt \
  -H "x-api-key: sdv147"
```

**Step 4:** Restore if client needs it back
```bash
curl -X POST http://localhost:8787/recyclebin/project-prompt/restore/critical-brief-001 \
  -H "x-api-key: sdv147"
```

**Step 5:** After retention period, permanently delete
```bash
curl -X DELETE http://localhost:8787/recyclebin/project-prompt/purge/critical-brief-001 \
  -H "x-api-key: sdv147"
```

---

##  Soft Delete Workflow

1. **Delete**: `DELETE /{category}/{id}` → Record soft deleted (deleted_at set)
2. **View Deleted**: `GET /recyclebin/{category}` → See all deleted records
3. **Restore**: `POST /recyclebin/{category}/restore/{id}` → Restore to active
4. **Purge**: `DELETE /recyclebin/{category}/purge/{id}` → Permanent deletion

## 🔍 Search & Filtering

The `/list` endpoint supports powerful filtering:

```bash
# Get latest 20 records (default)
GET /{category}/list

# Get all active records
GET /{category}/list?full

# Get latest 50 records
GET /{category}/list?n=50

# Search by keyword (LIKE search)
GET /{category}/list?search=myKeyword

# Filter by type
GET /{category}/list?type=json

# Combine filters
GET /{category}/list?n=100&search=test&type=raw
```

## ✅ Error Handling

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad request / validation error
- `401` - Unauthorized (invalid API key)
- `404` - Not found / operation not allowed
- `500` - Server error

## 🛠️ Extending with New Categories

To add a new content category:

1. Edit [src/db/schema.ts](src/db/schema.ts):
   ```typescript
   export const myNewCategoryTable = createContentTable("my_new_category");
   ```

2. Generate migration:
   ```bash
   npm run generate
   ```

3. Update [src/utils/helpers.ts](src/utils/helpers.ts):
   ```typescript
   export const CATEGORIES = {
     // ... existing categories
     "my-new-category": "myNewCategory",
   } as const;
   ```

4. No endpoint changes needed - they work dynamically!

## 📝 Example Workflows

### Store a Project Brief (JSON)

```bash
curl -X POST http://localhost:8787/project-prompt \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "uuid-here",
    "type": "json",
    "data": "{\"title\":\"Mobile App Redesign\",\"deadline\":\"2024-01-31\",\"budget\":5000}"
  }'
```

### Store an Image URL

```bash
curl -X POST http://localhost:8787/image \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "uuid-here",
    "type": "url",
    "data": "https://example.com/image.jpg"
  }'
```

### Search All Prompts

```bash
curl "http://localhost:8787/project-prompt/list?search=redesign&type=json" \
  -H "x-api-key: sdv147"
```

## 📊 Response Examples

### Create Response (201)
```json
{
  "message": "Record created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "json",
    "data": "{\"title\":\"My Project\"}",
    "created_at": 1703808000,
    "deleted_at": null
  }
}
```

### List Response (200)
```json
{
  "message": "Records retrieved successfully",
  "count": 15,
  "filters": {
    "full": false,
    "limit": 20,
    "search": null,
    "type": null
  },
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "json",
      "data": "{...}",
      "created_at": 1703808000,
      "deleted_at": null
    }
  ]
}
```

## 🤝 Contributing

Contributions welcome! The API is intentionally simple and extensible.

## � Helper Scripts

Create a `test-api.sh` script for quick testing:

```bash
#!/bin/bash
# test-api.sh - Quick API testing helper

API_URL="http://localhost:8787"
API_KEY="sdv147"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== API Test Helper ===${NC}\n"

# Create a test record
echo -e "${GREEN}Creating test project prompt...${NC}"
TEST_ID="test-$(date +%s)"
curl -X POST "$API_URL/project-prompt" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{
    \"id\": \"$TEST_ID\",
    \"type\": \"json\",
    \"data\": \"{\\\"title\\\":\\\"Test Project\\\",\\\"created\\\":\\\"$(date)\\\"}\"}
  }" | jq .

echo ""
echo -e "${GREEN}Listing records...${NC}"
curl "$API_URL/project-prompt/list" \
  -H "x-api-key: $API_KEY" | jq .

echo ""
echo -e "${GREEN}Getting specific record...${NC}"
curl "$API_URL/project-prompt/$TEST_ID" \
  -H "x-api-key: $API_KEY" | jq .

echo ""
echo -e "${GREEN}Updating record...${NC}"
curl -X PUT "$API_URL/project-prompt/$TEST_ID" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"data": "{\"title\":\"Updated Test\",\"status\":\"updated\"}"}' | jq .

echo ""
echo -e "${GREEN}Deleting record (soft delete)...${NC}"
curl -X DELETE "$API_URL/project-prompt/$TEST_ID" \
  -H "x-api-key: $API_KEY" | jq .

echo ""
echo -e "${GREEN}Viewing recycle bin...${NC}"
curl "$API_URL/recyclebin/project-prompt" \
  -H "x-api-key: $API_KEY" | jq .

echo ""
echo -e "${GREEN}Test complete!${NC}"
```

Run it with:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## �📄 License

MIT

---

**Need more details?** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for the complete API reference.
