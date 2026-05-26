# YouTube Studio Max

A fully client-side YouTube Video Searcher, Batch Downloader, Audio/Video Converter, and Concatenator.

## Deployment on GitHub Pages (Critical FFmpeg Requirements)

Because `@ffmpeg/ffmpeg` relies on WebAssembly and occasionally `SharedArrayBuffer` for multi-threading (in `core-mt`), the browser requires the page to be in a "cross-origin isolated" state.

To deploy this correctly to GitHub Pages, or any static host, you must configure the server/CDN to send these headers:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### For Vite (Local Development)

Update your `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
```

### For GitHub Pages (coi-serviceworker fallback)

Since GitHub Pages does not allow custom headers, you can use the `coi-serviceworker` library to spoof these headers using a Service Worker.
Add this script to the `<head>` of your `index.html`:

```html
<script src="https://cdn.jsdelivr.net/npm/coi-serviceworker/coi-serviceworker.min.js"></script>
```

### Browsers

If your browser supports standard multi-threading, the app will work efficiently. An in-app banner will warn users if `SharedArrayBuffer` is unsupported or cross-origin isolation is disabled. For maximum compatibility without headers, use the single-threaded `@ffmpeg/core`.
