"""
FastAPI example project for Interactive Studio.
Run this file from the editor to launch a local FastAPI server in the preview pane.
"""

import os

import uvicorn
from fastapi import FastAPI
from fastapi.responses import HTMLResponse


app = FastAPI(title="Interactive Studio FastAPI Demo")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/", response_class=HTMLResponse)
def home() -> str:
    return """
    <html>
      <head>
        <meta charset='utf-8' />
        <title>Interactive Studio FastAPI Demo</title>
        <style>
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
            background: #f8fafc;
            color: #0f172a;
          }
          main {
            max-width: 760px;
            margin: 48px auto;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          }
          code {
            background: #e2e8f0;
            padding: 2px 6px;
            border-radius: 6px;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>FastAPI is running</h1>
          <p>This page is served by a local Python backend in Interactive Studio.</p>
          <p>API health endpoint: <code>/api/health</code></p>
        </main>
      </body>
    </html>
    """


if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8050"))
    print(f"Starting FastAPI server on http://{host}:{port}/")
    uvicorn.run(app, host=host, port=port, log_level="info")
