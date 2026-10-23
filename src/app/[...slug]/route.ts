// src/app/[...slug]/route.ts
// Recovery route handler for clients with stale browser-cached /:path* redirect.
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const path = (slug || []).join('/');

  // Intercept the stale :path* request
  if (path.includes(':path') || path.includes('%3Apath')) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=/?cache_cleared=1">
  <title>Updating cache...</title>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        for (var i = 0; i < regs.length; i++) { regs[i].unregister(); }
      });
    }
    if ('caches' in window) {
      caches.keys().then(function(keys) {
        for (var i = 0; i < keys.length; i++) { caches.delete(keys[i]); }
      });
    }
    window.location.replace('/?cache_cleared=' + Date.now());
  </script>
</head>
<body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #111827; color: #fff;">
  <p>Updating application cache and redirecting to home...</p>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Clear-Site-Data': '"cache"',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  }

  return new NextResponse('Not Found', { status: 404 });
}
