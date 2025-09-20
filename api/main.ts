import { Application, Router } from "@oak/oak";
import { oakCors } from "@tajpouria/cors";
import routeStaticFilesFrom from "./util/routeStaticFilesFrom.ts";

import { createBooklet } from "./booklet.ts";

export const app = new Application();
const router = new Router();

router.post("/api/booklet", async (context) => {
	const req = context.request;

	const contentType = req.headers.get("content-type") || "";
	if (!contentType.includes("application/pdf")) {
		context.response.status = 400;
		context.response.body = "Please POST a PDF file";
		return;
	}

	try {
		const arrayBuffer = await req.body.arrayBuffer();
		const pdfBytes = new Uint8Array(arrayBuffer);

		const bookletBytes = await createBooklet(pdfBytes);

		context.response.status = 200;
		context.response.headers.set("Content-Type", "application/pdf");
		context.response.headers.set(
		  "Content-Disposition",
		  "attachment; filename=booklet.pdf",
		);
		context.response.body = bookletBytes;
	  } catch (err) {
		console.error("❌ Error creating booklet:", err);
		context.response.status = 500;
		context.response.body = "Failed to create booklet";
	  }
});

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());
app.use(routeStaticFilesFrom([
	`${Deno.cwd()}/dist`,
	`${Deno.cwd()}/public`,
]));

if (import.meta.main) {
	console.log("Server listening on port http://localhost:8000");
	await app.listen({ port: 8000 });
}
