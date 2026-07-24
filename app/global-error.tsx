"use client";

/**
 * Global Error Boundary - Catches errors in the root layout itself.
 * This replaces the entire page (including <html>/<body>) when triggered.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>Error | ScholarMe</title>
      </head>
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <main>
          <h1>Something went wrong</h1>
          <p style={{ color: "#666" }}>{error.message || "An unexpected error occurred."}</p>
          <button
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              border: "1px solid #ccc",
              borderRadius: "0.375rem",
              cursor: "pointer",
              background: "white",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
