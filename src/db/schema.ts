import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Define the type options
const typeEnum = z.enum(["json", "raw", "base64", "url"]);

// Base table schema for all content categories
const createContentTable = (tableName: string) =>
	sqliteTable(tableName, {
		id: text().primaryKey(), // UUID
		type: text().notNull(), // json | raw | base64 | url
		data: text().notNull(), // actual content
		created_at: integer().notNull(), // unix timestamp
		deleted_at: integer(), // NULL for active records, unix timestamp for deleted
	});

// Create all four tables
export const imageTable = createContentTable("image");
export const projectPromptTable = createContentTable("project_prompt");
export const videoTable = createContentTable("video");
export const audioTable = createContentTable("audio");

// Export all tables for reference
export const tables = {
	image: imageTable,
	projectPrompt: projectPromptTable,
	video: videoTable,
	audio: audioTable,
} as const;

// Zod schemas for validation
export const contentInsertSchema = z.object({
	id: z.string().uuid(),
	type: typeEnum,
	data: z.string(),
});

export const contentUpdateSchema = z.object({
	type: typeEnum.optional(),
	data: z.string().optional(),
});

export const contentSelectSchema = createSelectSchema(imageTable);

// Export type for easier use
export type Content = z.infer<typeof contentSelectSchema>;
export type ContentInsert = z.infer<typeof contentInsertSchema>;
export type ContentUpdate = z.infer<typeof contentUpdateSchema>;
