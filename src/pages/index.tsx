import React, { useState } from "react";
import { createBooklet } from "../util/booklet";

const Index: React.FC = () => {
  const [status, setStatus] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const input = document.getElementById("pdfInput") as HTMLInputElement;

    if (!input?.files || input.files.length === 0) {
      setStatus("Please select a PDF file.");
      return;
    }

    const file = input.files[0];

    setStatus("Processing...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);

      const bookletBytes = await createBooklet(pdfBytes);

      const blob = new Blob([bookletBytes], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download =
        file.name.replace(/\.pdf$/i, "") + " booklet.pdf";

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);

      setStatus("Download started!");
    } catch (err) {
      console.error("❌ Error creating booklet:", err);
      setStatus("Failed to create booklet.");
    }
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        PDF Booklet Maker
      </h1>

      <form
        id="uploadForm"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <input
          type="file"
          id="pdfInput"
          accept="application/pdf"
          required
          className="block"
        />

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Booklet
        </button>
      </form>

      <p id="status" className="mt-4 text-gray-700">
        {status}
      </p>
    </main>
  );
};

export default Index;
