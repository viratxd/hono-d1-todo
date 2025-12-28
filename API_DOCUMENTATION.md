# Cloudflare D1 Content Management REST API

A lightweight, edge-optimized REST API for storing and managing structured content using Cloudflare Workers and D1 (SQLite).

## 🎯 Features

- **Four Fixed Content Categories**: Image, Project Prompt, Video, Audio
- **Full CRUD Operations**: Create, Read, Update, Delete
- **Soft Delete with Recycle Bin**: Restore deleted records or permanently purge them
- **Advanced Search & Filtering**: Text search with type filtering
- **Flexible Pagination**: Return latest N records or all active records
- **Edge-Compatible**: Runs fully on Cloudflare's edge network
- **Authentication**: Static API key validation on all endpoints
- **Type-Safe**: Built with TypeScript and Zod validation

## 🏗️ Architecture

### Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **Validation**: Zod
- **ORM**: Drizzle ORM

### Database Schema

All four content tables follow the same uniform schema:

```sql
CREATE TABLE {category} (
  id          TEXT PRIMARY KEY,      -- UUID
  type        TEXT NOT NULL,         -- json | raw | base64 | url
  data        TEXT NOT NULL,         -- actual content
  created_at  INTEGER NOT NULL,      -- unix timestamp
  deleted_at  INTEGER NULL           -- NULL for active, timestamp for deleted
);
```

**Categories**: `image`, `project_prompt`, `video`, `audio`

## 🔐 Authentication

All endpoints require the `x-api-key` header:

```bash
x-api-key: sdv147
```

**Missing or invalid API key returns `401 Unauthorized`**

## 📡 API Endpoints

### CRUD Operations

#### Create Record
```bash
POST /{category}
Content-Type: application/json
x-api-key: sdv147

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "json",
  "data": "{\"title\":\"My Project\",\"description\":\"...\"}"
}
```

**Response (201):**
```json
{
  "message": "Record created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "json",
    "data": "{\"title\":\"My Project\",\"description\":\"...\"}",
    "created_at": 1703808000,
    "deleted_at": null
  }
}
```

#### Read Record
```bash
GET /{category}/{id}
x-api-key: sdv147
```

**Response (200):**
```json
{
  "message": "Record retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "json",
    "data": "{\"title\":\"My Project\",\"description\":\"...\"}",
    "created_at": 1703808000,
    "deleted_at": null
  }
}
```

#### Update Record
```bash
PUT /{category}/{id}
Content-Type: application/json
x-api-key: sdv147

{
  "type": "json",
  "data": "{\"title\":\"Updated Title\",\"description\":\"...\"}"
}
```

**Notes:**
- All update fields are optional
- Cannot update deleted records (returns 404)
- Only active records can be updated

**Response (200):**
```json
{
  "message": "Record updated successfully",
  "data": { /* updated record */ }
}
```

#### Soft Delete Record
```bash
DELETE /{category}/{id}
x-api-key: sdv147
```

**Response (200):**
```json
{
  "message": "Record moved to recycle bin"
}
```

### List & Search

#### List Records
```bash
GET /{category}/list?[full][&n=50][&search=keyword][&type=json]
x-api-key: sdv147
```

**Query Parameters:**

| Parameter | Description | Default | Example |
|-----------|-------------|---------|---------|
| `full` | Return all active records (no limit) | 20 | `?full` |
| `n` | Return latest N records | 20 | `?n=50` |
| `search` | LIKE search on data column | - | `?search=AI%20model` |
| `type` | Filter by type | - | `?type=json` |

**Examples:**

```bash
# Get latest 20 records
GET /project-prompt/list

# Get all records
GET /project-prompt/list?full

# Get latest 50 records
GET /project-prompt/list?n=50

# Search with keyword
GET /project-prompt/list?search=landing%20page

# Filter by type
GET /image/list?type=url

# Combined filters
GET /project-prompt/list?n=50&search=AI&type=json
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
  "data": [ /* records */ ]
}
```

### Recycle Bin

#### List Deleted Records
```bash
GET /recyclebin/{category}
x-api-key: sdv147
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
      "data": "{...}",
      "created_at": 1703808000,
      "deleted_at": 1703808900
    }
  ]
}
```

#### Restore Record
```bash
POST /recyclebin/{category}/restore/{id}
x-api-key: sdv147
```

**Response (200):**
```json
{
  "message": "Record restored successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "json",
    "data": "{...}",
    "created_at": 1703808000,
    "deleted_at": null
  }
}
```

#### Permanent Delete
```bash
DELETE /recyclebin/{category}/purge/{id}
x-api-key: sdv147
```

**Response (200):**
```json
{
  "message": "Record permanently deleted"
}
```

## 🚀 Deployment

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# The API will be available at http://localhost:8787
```

### Production Deployment

```bash
# Deploy to Cloudflare
npm run deploy
```

## 📝 Example Usage

### Create a Project Prompt

```bash
curl -X POST https://api.example.com/project-prompt \
  -H "Content-Type: application/json" \
  -H "x-api-key: sdv147" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "json",
    "data": "{\"title\":\"Landing Page Design\",\"description\":\"Design a modern landing page\",\"tags\":[\"design\",\"web\"]}"
  }'
```

### Search Project Prompts

```bash
curl -X GET "https://api.example.com/project-prompt/list?search=landing&type=json" \
  -H "x-api-key: sdv147"
```

### Soft Delete a Record

```bash
curl -X DELETE https://api.example.com/image/550e8400-e29b-41d4-a716-446655440000 \
  -H "x-api-key: sdv147"
```

### Restore from Recycle Bin

```bash
curl -X POST https://api.example.com/recyclebin/image/restore/550e8400-e29b-41d4-a716-446655440000 \
  -H "x-api-key: sdv147"
```

## 🔄 Data Types

The `type` field supports four flexible content formats:

- **`json`**: Structured data as JSON string
- **`raw`**: Plain text or unformatted data
- **`base64`**: Binary data encoded as base64
- **`url`**: External URL reference

## ✅ Error Responses

All errors return appropriate HTTP status codes:

```json
{
  "error": "Error message"
}
```

| Status | Scenario |
|--------|----------|
| `400` | Invalid request, missing fields, or validation error |
| `401` | Missing or invalid API key |
| `404` | Record not found or operation not allowed |
| `500` | Server error |

## 🛠️ Manual Extension

Adding new categories in the future:

1. Update [src/db/schema.ts](src/db/schema.ts) to add new table definition
2. Run `npm run generate` to create migration
3. Update [src/utils/helpers.ts](src/utils/helpers.ts) `CATEGORIES` constant
4. No endpoint code changes needed - they work dynamically

## 📦 Project Structure

```
src/
├── index.ts              # Main API with all endpoints
├── middleware/
│   └── auth.ts          # Authentication middleware
├── utils/
│   └── helpers.ts       # Utilities and constants
└── db/
    └── schema.ts        # Drizzle ORM schema definitions
```

## 📖 API Documentation

### Base URL

```
https://api.example.com
```

### Response Format

All successful responses include:
- `message`: Human-readable description
- `data` (optional): Response payload
- `count` (optional): Number of records returned
- `filters` (optional): Applied filters for list endpoints

## 🔒 Security Considerations

- API key is validated on every request
- Soft delete prevents accidental data loss
- No direct SQL injection - parameterized queries via ORM
- All timestamps are unix timestamps (UTC)

## 📄 License

MIT
