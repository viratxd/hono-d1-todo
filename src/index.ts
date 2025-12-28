import { zValidator } from "@hono/zod-validator";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { eq, isNull, isNotNull, like, sql, and } from "drizzle-orm";
import { z } from "zod";

import { authMiddleware } from "./middleware/auth";
import {
	contentInsertSchema,
	contentUpdateSchema,
	audioTable,
	imageTable,
	projectPromptTable,
	videoTable,
} from "./db/schema";
import {
	generateUUID,
	getCurrentTimestamp,
	CATEGORIES,
	getCategoryTableName,
	type Category,
} from "./utils/helpers";

// Type bindings
type Env = {
	Bindings: {
		DB: D1Database;
	};
};

const app = new Hono<Env>();

// Get table reference based on category
function getTable(
	category: Category
): typeof imageTable | typeof projectPromptTable | typeof videoTable | typeof audioTable {
	const tables = {
		image: imageTable,
		"project-prompt": projectPromptTable,
		video: videoTable,
		audio: audioTable,
	} as const;
	return tables[category];
}

// Health check
app.get("/", (c) => {
	return c.json({
		message: "Cloudflare D1 REST API",
		version: "1.0.0",
		description: "Lightweight backend for storing and managing structured content",
	});
});

// ==================== CRUD ENDPOINTS ====================

// CREATE - POST /{category}
app.post("/:category", authMiddleware, zValidator("json", contentInsertSchema), async (c) => {
	const category = c.req.param("category") as Category;

	// Validate category
	if (!Object.keys(CATEGORIES).includes(category)) {
		return c.json({ error: "Invalid category" }, 400);
	}

	const db = drizzle(c.env.DB);
	const body = c.req.valid("json");

	try {
		const table = getTable(category);
		const result = await db
			.insert(table)
			.values({
				id: body.id,
				type: body.type,
				data: body.data,
				created_at: getCurrentTimestamp(),
				deleted_at: null,
			})
			.returning();

		return c.json(
			{
				message: "Record created successfully",
				data: result[0],
			},
			201
		);
	} catch (error) {
		console.error("Create error:", error);
		return c.json({ error: "Failed to create record" }, 500);
	}
});

// READ - GET /{category}/:id
app.get("/:category/:id", authMiddleware, async (c) => {
	const category = c.req.param("category") as Category;
	const id = c.req.param("id");

	// Validate category
	if (!Object.keys(CATEGORIES).includes(category)) {
		return c.json({ error: "Invalid category" }, 400);
	}

	const db = drizzle(c.env.DB);
	const table = getTable(category);

	try {
		const result = await db
			.select()
			.from(table)
			.where(sql`${table.id} = ${id} AND ${table.deleted_at} IS NULL`)
			.all();

		if (!result.length) {
			return c.json({ error: "Record not found" }, 404);
		}

		return c.json({
			message: "Record retrieved successfully",
			data: result[0],
		});
	} catch (error) {
		console.error("Read error:", error);
		return c.json({ error: "Failed to read record" }, 500);
	}
});

// UPDATE - PUT /{category}/:id
app.put("/:category/:id", authMiddleware, zValidator("json", contentUpdateSchema), async (c) => {
	const category = c.req.param("category") as Category;
	const id = c.req.param("id");

	// Validate category
	if (!Object.keys(CATEGORIES).includes(category)) {
		return c.json({ error: "Invalid category" }, 400);
	}

	const db = drizzle(c.env.DB);
	const body = c.req.valid("json");
	const table = getTable(category);

	try {
		// Check if record exists and is not deleted
		const existing = await db
			.select()
			.from(table)
			.where(sql`${table.id} = ${id} AND ${table.deleted_at} IS NULL`)
			.all();

		if (!existing.length) {
			return c.json({ error: "Record not found or is deleted" }, 404);
		}

		// Build update object with only provided fields
		const updateData: Record<string, any> = {};
		if (body.type !== undefined) updateData.type = body.type;
		if (body.data !== undefined) updateData.data = body.data;

		if (Object.keys(updateData).length === 0) {
			return c.json({ error: "No fields to update" }, 400);
		}

		const result = await db
			.update(table)
			.set(updateData)
			.where(sql`${table.id} = ${id}`)
			.returning();

		return c.json({
			message: "Record updated successfully",
			data: result[0],
		});
	} catch (error) {
		console.error("Update error:", error);
		return c.json({ error: "Failed to update record" }, 500);
	}
});

// SOFT DELETE - DELETE /{category}/:id
app.delete("/:category/:id", authMiddleware, async (c) => {
	const category = c.req.param("category") as Category;
	const id = c.req.param("id");

	// Validate category
	if (!Object.keys(CATEGORIES).includes(category)) {
		return c.json({ error: "Invalid category" }, 400);
	}

	const db = drizzle(c.env.DB);
	const table = getTable(category);

	try {
		// Check if record exists and is not already deleted
		const existing = await db
			.select()
			.from(table)
			.where(sql`${table.id} = ${id} AND ${table.deleted_at} IS NULL`)
			.all();

		if (!existing.length) {
			return c.json({ error: "Record not found or already deleted" }, 404);
		}

		// Soft delete by setting deleted_at
		await db
			.update(table)
			.set({ deleted_at: getCurrentTimestamp() })
			.where(sql`${table.id} = ${id}`)
			.run();

		return c.json({ message: "Record moved to recycle bin" });
	} catch (error) {
		console.error("Delete error:", error);
		return c.json({ error: "Failed to delete record" }, 500);
	}
});

// ==================== LIST & SEARCH ENDPOINTS ====================

// LIST - GET /{category}/list
app.get("/:category/list", authMiddleware, async (c) => {
	const category = c.req.param("category") as Category;
	const full = c.req.query("full") !== undefined;
	const limit = c.req.query("n") ? parseInt(c.req.query("n")!) : 20;
	const search = c.req.query("search");
	const type = c.req.query("type");

	// Validate category
	if (!Object.keys(CATEGORIES).includes(category)) {
		return c.json({ error: "Invalid category" }, 400);
	}

	// Validate limit
	if (!full && (isNaN(limit) || limit < 1)) {
		return c.json({ error: "Invalid limit value" }, 400);
	}

	// Validate type
	if (type) {
		const validTypes = ["json", "raw", "base64", "url"];
		if (!validTypes.includes(type)) {
			return c.json({ error: "Invalid type filter" }, 400);
		}
	}

	const db = drizzle(c.env.DB);
	const table = getTable(category);

	try {
		// Build dynamic SQL query
		let whereClause = `${table.id} IS NOT NULL AND ${table.deleted_at} IS NULL`;

		if (search) {
			whereClause += ` AND ${table.data} LIKE '%${search.replace(/'/g, "''")}'%`;
		}

		if (type) {
			whereClause += ` AND ${table.type} = '${type}'`;
		}

		// Execute raw query for better control
		let results: any[] = [];
		if (!full) {
			results = await db
				.select()
				.from(table)
				.where(sql`${sql.raw(whereClause)}`)
				.orderBy(sql`${table.created_at} DESC`)
				.limit(limit)
				.all();
		} else {
			results = await db
				.select()
				.from(table)
				.where(sql`${sql.raw(whereClause)}`)
				.orderBy(sql`${table.created_at} DESC`)
				.all();
		}

		return c.json({
			message: "Records retrieved successfully",
			count: results.length,
			filters: {
				full: full,
				limit: full ? "unlimited" : limit,
				search: search || null,
				type: type || null,
			},
			data: results,
		});
	} catch (error) {
		console.error("List error:", error);
		return c.json({ error: "Failed to list records" }, 500);
	}
});

// ==================== RECYCLE BIN ENDPOINTS ====================

// RECYCLE BIN - LIST DELETED - GET /recyclebin/{category}
app.get("/recyclebin/:category", authMiddleware, async (c) => {
	const category = c.req.param("category") as Category;

	// Validate category
	if (!Object.keys(CATEGORIES).includes(category)) {
		return c.json({ error: "Invalid category" }, 400);
	}

	const db = drizzle(c.env.DB);
	const table = getTable(category);

	try {
		const results = await db
			.select()
			.from(table)
			.where(isNotNull(table.deleted_at))
			.orderBy(sql`${table.deleted_at} DESC`)
			.all();

		return c.json({
			message: "Deleted records retrieved from recycle bin",
			count: results.length,
			data: results,
		});
	} catch (error) {
		console.error("Recycle bin list error:", error);
		return c.json({ error: "Failed to list deleted records" }, 500);
	}
});

// RECYCLE BIN - RESTORE - POST /recyclebin/{category}/restore/:id
app.post("/recyclebin/:category/restore/:id", authMiddleware, async (c) => {
	const category = c.req.param("category") as Category;
	const id = c.req.param("id");

	// Validate category
	if (!Object.keys(CATEGORIES).includes(category)) {
		return c.json({ error: "Invalid category" }, 400);
	}

	const db = drizzle(c.env.DB);
	const table = getTable(category);

	try {
		// Check if record exists and is deleted
		const existing = await db
			.select()
			.from(table)
			.where(sql`${table.id} = ${id} AND ${table.deleted_at} IS NOT NULL`)
			.all();

		if (!existing.length) {
			return c.json({ error: "Record not found in recycle bin" }, 404);
		}

		// Restore by clearing deleted_at
		const result = await db
			.update(table)
			.set({ deleted_at: null })
			.where(sql`${table.id} = ${id}`)
			.returning();

		return c.json({
			message: "Record restored successfully",
			data: result[0],
		});
	} catch (error) {
		console.error("Restore error:", error);
		return c.json({ error: "Failed to restore record" }, 500);
	}
});

// RECYCLE BIN - PERMANENT DELETE - DELETE /recyclebin/{category}/purge/:id
app.delete("/recyclebin/:category/purge/:id", authMiddleware, async (c) => {
	const category = c.req.param("category") as Category;
	const id = c.req.param("id");

	// Validate category
	if (!Object.keys(CATEGORIES).includes(category)) {
		return c.json({ error: "Invalid category" }, 400);
	}

	const db = drizzle(c.env.DB);
	const table = getTable(category);

	try {
		// Check if record exists and is deleted
		const existing = await db
			.select()
			.from(table)
			.where(sql`${table.id} = ${id} AND ${table.deleted_at} IS NOT NULL`)
			.all();

		if (!existing.length) {
			return c.json({ error: "Record not found in recycle bin" }, 404);
		}

		// Permanently delete
		await db.delete(table).where(sql`${table.id} = ${id}`).run();

		return c.json({ message: "Record permanently deleted" });
	} catch (error) {
		console.error("Purge error:", error);
		return c.json({ error: "Failed to permanently delete record" }, 500);
	}
});

export default app;
