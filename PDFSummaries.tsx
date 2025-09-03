'use client';
import { useState } from "react";
import UploadHeader from "../upload/upload-header";

interface PDFSummariesProps {
  type: "short" | "detail";
}

export default function PDFSummaries({ type }: PDFSummariesProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return alert("Please upload a PDF file.");
    setLoading(true);
    setResult("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64PDF = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64PDF, outputType: type }),
      });

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      console.error(err);
      setResult("Error generating summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">
        {type === "short" ? "Short PDF Summary" : "Detailed PDF Summary"}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            id={`pdf-upload-${type}`}
            onChange={handleFileChange}
          />
          <label htmlFor={`pdf-upload-${type}`} className="cursor-pointer">
            <div className="text-sm font-medium">
              {fileName ? fileName : "Click to upload PDF"}
            </div>
          </label>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
          disabled={loading || !file}
        >
          {loading ? "Generating..." : "Generate Summary"}
        </button>
      </form>

      {result && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-2">Summary</h3>
          <p className="text-sm text-gray-700">{result}</p>
        </div>
      )}
    </div>
  );
}
