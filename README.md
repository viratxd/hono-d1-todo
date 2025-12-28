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

## 🧪 Testing

### Health Check
```bash
curl http://localhost:8787
```

Response:
```json
{
  "message": "Cloudflare D1 REST API",
  "version": "1.0.0",
  "description": "Lightweight backend for storing and managing structured content"
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

## 🔄 Soft Delete Workflow

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

## 📄 License

MIT

---

**Need more details?** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for the complete API reference.
