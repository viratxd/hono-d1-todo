import { createMiddleware } from "hono/factory";

const API_KEY = "sdv147";

export const authMiddleware = createMiddleware(async (c, next) => {
	const apiKey = c.req.header("x-api-key");

	if (!apiKey || apiKey !== API_KEY) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	await next();
});
