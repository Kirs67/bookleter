import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createBooklet } from "./api/booklet.ts";
import { extname, join } from "https://deno.land/std@0.203.0/path/mod.ts";

const PUBLIC_DIR = "./public";

console.log("🚀 Bookleter running on http://localhost:8000");

serve(async (req) => {
  const url = new URL(req.url);

  // Serve static files (frontend)
  if (req.method === "GET") {
    let pathname = url.pathname;
    if (pathname === "/") pathname = "/index.html";

    const filePath = join(PUBLIC_DIR, pathname);
    try {
      const fileExt = extname(filePath);
      const file = await Deno.readFile(filePath);
      const contentType = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
      }[fileExt] ?? "application/octet-stream";

      return new Response(file, {
        headers: { "Content-Type": contentType },
      });
    } catch {
      return new Response("Not Found", { status: 404 });
    }
  }

  // API POST /api/booklet endpoint
  if (req.method === "POST" && url.pathname === "/api/booklet") {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/pdf")) {
      return new Response("Please POST a PDF file", { status: 400 });
    }

    try {
      const pdfBytes = new Uint8Array(await req.arrayBuffer());
      const bookletBytes = await createBooklet(pdfBytes);

      return new Response(bookletBytes, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=booklet.pdf",
        },
      });
    } catch (err) {
      console.error("❌ Error creating booklet:", err);
      return new Response("Failed to create booklet", { status: 500 });
    }
  }

  return new Response("Not Found", { status: 404 });
});
