import { randomUUID } from "crypto";

export function generateUUID(): string {
	return randomUUID();
}

export function getCurrentTimestamp(): number {
	return Math.floor(Date.now() / 1000);
}

export const CATEGORIES = {
	image: "image",
	"project-prompt": "projectPrompt",
	video: "video",
	audio: "audio",
} as const;

export type Category = keyof typeof CATEGORIES;

export function getCategoryTableName(
	category: Category
): "image" | "project_prompt" | "video" | "audio" {
	const mapping = {
		image: "image",
		"project-prompt": "project_prompt",
		video: "video",
		audio: "audio",
	} as const;
	return mapping[category];
}
