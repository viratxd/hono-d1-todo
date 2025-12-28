export function generateUUID(): string {
	// Use Web Crypto API available in Cloudflare Workers (and modern runtimes).
	// Fallback to a simple UUIDv4 generator when not available (dev/node).
	try {
		if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") {
			return (crypto as any).randomUUID();
		}
	} catch (e) {
		// ignore and fallback
	}
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
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
