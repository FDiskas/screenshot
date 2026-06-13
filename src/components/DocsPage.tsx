import {
  ArrowRight,
  Book,
  CheckCircle,
  Code,
  Info,
  RefreshCcw,
  Terminal,
  Zap,
} from "lucide-react";
import type { FC } from "react";
import { CONFIG } from "../config";

export const DocsPage: FC<{ origin: string }> = ({ origin }) => {
  const jsExample = `/**
 * Fetches a screenshot and handles async processing
 * by respecting the 'Refresh' header.
 *
 * @param {string} url - The URL to capture
 * @param {HTMLImageElement} imgElement - Image element to update
 */
async function captureWithPolling(url, imgElement) {
  const apiEndpoint = \`${origin}/api/screenshot?url=\${encodeURIComponent(url)}\`;

  // Initial request — triggers capture or returns cached image
  imgElement.src = apiEndpoint;

  const poll = async () => {
    try {
      const response = await fetch(apiEndpoint, { method: 'HEAD' });
      const refreshHeader = response.headers.get('Refresh');

      if (refreshHeader) {
        // Still processing — retry after the suggested delay
        setTimeout(poll, parseInt(refreshHeader) * 1000);
      } else {
        // Ready — reload the image
        imgElement.src = apiEndpoint;
      }
    } catch (err) {
      console.error("Polling failed:", err);
    }
  };

  setTimeout(poll, 2000);
}`.trim();

  return (
    <div className="flex flex-col">
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-16">
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid pointer-events-none" />
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[60%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-primary mb-4">
              <div className="bg-primary/10 p-1.5 rounded-lg">
                <Book className="h-4 w-4" />
              </div>
              <span className="font-semibold uppercase tracking-widest text-xs font-mono">
                Documentation
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.05]">
              <span className="bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/60">
                API Reference
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-linear-to-r from-primary via-violet-500 to-primary">
                SnapService
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Integrate pixel-perfect screenshots into your app with a single GET
              request. Domain-level caching, async processing, and intelligent
              polling built in.
            </p>

            {/* Quick jump links */}
            <div className="flex flex-wrap gap-2 mt-8">
              {[
                { href: "#api-reference", label: "Endpoints" },
                { href: "#parameters", label: "Parameters" },
                { href: "#responses", label: "Responses" },
                { href: "#code-example", label: "Code Example" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-card/60 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card transition-all"
                >
                  {link.label}
                  <ArrowRight className="h-3 w-3 opacity-50" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── MAIN CONTENT ─────────────────────────────────────────────── */}
      <section className="container pb-24 scroll-mt-24" id="api-reference">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Left column — API docs */}
          <div className="lg:col-span-2 space-y-16">

            {/* Endpoints */}
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                Endpoints
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                All endpoints accept GET requests and are publicly accessible.
              </p>
              <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                {/* Terminal chrome */}
                <div className="flex items-center gap-3 px-5 py-3.5 bg-muted/60 border-b border-border/40">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">endpoints</span>
                </div>

                <div className="divide-y divide-border/40">
                  {[
                    {
                      method: "GET",
                      path: `${origin}/api/screenshot`,
                      desc: "Returns PNG image bytes. Serves from cache instantly, or triggers async capture and returns a placeholder with a Refresh header.",
                    },
                    {
                      method: "GET",
                      path: `${origin}/api/raw`,
                      desc: "Returns HTTP 302 redirect to the static cached image path. Useful when you need a stable CDN-style URL.",
                    },
                  ].map((ep) => (
                    <div key={ep.path} className="px-5 py-5">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-primary/15 text-primary px-2.5 py-0.5 rounded-md font-bold text-xs font-mono uppercase shrink-0">
                          {ep.method}
                        </span>
                        <code className="text-sm font-mono text-foreground/80 truncate">
                          {ep.path}
                        </code>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed pl-16">
                        {ep.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Parameters */}
            <div id="parameters">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Query Parameters
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                All parameters are passed as URL query strings.
              </p>
              <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 border-b border-border/40">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        Parameter
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        Type
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {[
                      {
                        param: "url",
                        type: "string",
                        required: true,
                        desc: (
                          <>
                            Target URL (must start with{" "}
                            <code className="bg-muted px-1.5 py-0.5 rounded text-primary text-xs font-mono">
                              https://
                            </code>
                            )
                          </>
                        ),
                      },
                      {
                        param: "width",
                        type: "number",
                        required: false,
                        desc: `Viewport width (default: ${CONFIG.screenshot.defaultWidth})`,
                      },
                      {
                        param: "height",
                        type: "number",
                        required: false,
                        desc: `Viewport height (default: ${CONFIG.screenshot.defaultHeight})`,
                      },
                    ].map((row) => (
                      <tr key={row.param} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-primary text-sm">
                              {row.param}
                            </code>
                            {row.required && (
                              <span className="text-[10px] font-bold uppercase text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                                required
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <code className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded font-mono">
                            {row.type}
                          </code>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {row.desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Allowed resolutions */}
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Allowed Resolutions
              </h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Only specific viewport resolutions are supported for security and
                performance. If one dimension is provided, the other is inferred.
                Defaults to{" "}
                <strong>
                  {CONFIG.screenshot.defaultWidth}×{CONFIG.screenshot.defaultHeight}
                </strong>{" "}
                when no match is found.
              </p>
              <div className="flex flex-wrap gap-2">
                {CONFIG.screenshot.allowedResolutions.map((res) => (
                  <span
                    key={`${res.width}x${res.height}`}
                    className="px-3 py-1.5 bg-card border border-border/60 text-muted-foreground rounded-xl font-mono text-xs hover:border-primary/30 hover:text-foreground transition-all"
                  >
                    {res.width} × {res.height}
                  </span>
                ))}
              </div>
            </div>

            {/* Response codes */}
            <div id="responses">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Response Behavior
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                The API uses standard HTTP status codes to communicate capture state.
              </p>
              <div className="space-y-4">
                {[
                  {
                    code: "200",
                    label: "OK",
                    color: "emerald",
                    iconBg: "bg-emerald-500/10",
                    iconText: "text-emerald-600 dark:text-emerald-400",
                    border: "border-emerald-500/20 hover:border-emerald-500/40",
                    title: "Success",
                    body: (
                      <>
                        Returns the PNG image binary directly from cache on{" "}
                        <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                          /api/screenshot
                        </code>
                        . This is the fast path — no waiting.
                      </>
                    ),
                    extra: null,
                  },
                  {
                    code: "302",
                    label: "REDIRECT",
                    color: "amber",
                    iconBg: "bg-amber-500/10",
                    iconText: "text-amber-600 dark:text-amber-400",
                    border: "border-amber-500/20 hover:border-amber-500/40",
                    title: "Redirect",
                    body: (
                      <>
                        On{" "}
                        <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                          /api/raw
                        </code>
                        , cached images redirect to a stable static PNG URL. Use
                        this for embed contexts that need a persistent image URL.
                      </>
                    ),
                    extra: null,
                  },
                  {
                    code: "202",
                    label: "PROCESSING",
                    color: "blue",
                    iconBg: "bg-blue-500/10",
                    iconText: "text-blue-600 dark:text-blue-400",
                    border: "border-blue-500/20 hover:border-blue-500/40",
                    title: "Accepted — generating in background",
                    body: (
                      <>
                        The capture is queued. A placeholder image is returned
                        immediately with a{" "}
                        <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-primary">
                          Refresh: 5
                        </code>{" "}
                        header. Poll using HEAD requests until the header disappears.
                      </>
                    ),
                    extra: (
                      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-primary bg-primary/5 px-3 py-2.5 rounded-xl border border-primary/15">
                        <RefreshCcw className="h-3.5 w-3.5 animate-spin shrink-0" />
                        Poll with HEAD requests until{" "}
                        <code className="font-mono">Refresh</code> header is absent
                      </div>
                    ),
                  },
                ].map((r) => (
                  <div
                    key={r.code}
                    className={`flex gap-4 p-5 rounded-2xl bg-card border ${r.border} transition-all`}
                  >
                    <div
                      className={`${r.iconBg} ${r.iconText} h-12 w-12 shrink-0 flex flex-col items-center justify-center rounded-xl font-bold font-mono`}
                    >
                      <span className="text-sm leading-none">{r.code}</span>
                      <span className="text-[8px] opacity-60 mt-0.5">{r.label}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold mb-1.5">{r.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {r.body}
                      </p>
                      {r.extra}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — sticky sidebar */}
          <div>
            <div className="sticky top-24 space-y-6">
              {/* Quick example card */}
              <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-xl shadow-black/5">
                <div className="flex items-center gap-3 px-5 py-3.5 bg-muted/60 border-b border-border/40">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    response-headers
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-base font-bold mb-1 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Polling Pattern
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    Check for the{" "}
                    <code className="text-primary font-mono">Refresh</code> header
                    on HEAD requests to know when the capture is ready.
                  </p>

                  {/* Processing state */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        202 Processing
                      </span>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-xl border border-border/40 font-mono text-xs text-muted-foreground whitespace-pre leading-relaxed">
                      {`HTTP/1.1 202 Accepted\nContent-Type: image/png\nRefresh: 5`}
                    </div>
                  </div>

                  {/* Ready state */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        200 Ready
                      </span>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-xl border border-border/40 font-mono text-xs text-muted-foreground whitespace-pre leading-relaxed">
                      {`HTTP/1.1 200 OK\nContent-Type: image/png\n(no Refresh header)`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Simple URL example */}
              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-3">
                  Simple usage
                </p>
                <code className="text-xs text-primary font-mono break-all leading-relaxed block">
                  {`<img src="${origin}/api/screenshot?url=https://example.com" />`}
                </code>
              </div>

              {/* Back to demo link */}
              <a
                href="/#demo"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl border border-border/60 bg-card text-sm font-medium hover:border-primary/30 hover:bg-card/80 transition-all group"
              >
                Try the live demo
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CODE EXAMPLE ─────────────────────────────────────────────── */}
      <section className="container pb-28 scroll-mt-24" id="code-example">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <Code className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">JavaScript Implementation</h2>
        </div>

        <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/30 bg-[#0d1117]">
          {/* Editor chrome */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-white/3 border-b border-white/6">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 text-xs font-mono text-white/40 bg-white/5 rounded-md border border-white/5">
                captureWithPolling.js
              </div>
            </div>
            <div className="w-16" />
          </div>

          {/* Line numbers + code */}
          <div className="overflow-x-auto">
            <div className="flex min-w-max">
              {/* Line numbers */}
              <pre className="select-none px-4 py-6 text-right text-xs font-mono text-white/20 leading-6 border-r border-white/5 bg-white/1">
                {jsExample.split("\n").map((_, i) => i + 1).join("\n")}
              </pre>
              {/* Code */}
              <pre className="px-6 py-6 text-sm font-mono leading-6 text-[#e6edf3] flex-1">
                <code>{jsExample}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
