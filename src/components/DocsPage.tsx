import {
  Book,
  CheckCircle,
  Code,
  Info,
  RefreshCcw,
  Terminal,
  Zap,
} from "lucide-react";
import type { FC } from "react";

export const DocsPage: FC<{ origin: string }> = ({ origin }) => {
  const jsExample = `
/**
 * Fetches a screenshot and handles the asynchronous processing 
 * by respecting the 'Refresh' header.
 * 
 * @param {string} url - The URL to capture 
 * @param {HTMLImageElement} imgElement - The image element to update
 */
async function captureWithPolling(url, imgElement) {
  const apiEndpoint = \`\${origin}/api/screenshot?url=\${encodeURIComponent(url)}\`;
  
  // Initial request to trigger capture
  imgElement.src = apiEndpoint;
  
  // Polling function
  const poll = async () => {
    try {
      const response = await fetch(apiEndpoint, { method: 'HEAD' });
      
      // Check for the 'Refresh' header (usually set to '5' for 5 seconds)
      const refreshHeader = response.headers.get('Refresh');
      
      if (refreshHeader) {
        console.log(\`Screenshot processing... retrying in \${refreshHeader}s\`);
        setTimeout(poll, parseInt(refreshHeader) * 1000);
      } else {
        console.log("Screenshot ready!");
        imgElement.src = apiEndpoint;
      }
    } catch (err) {
      console.error("Polling failed:", err);
    }
  };

  // Start polling if needed (initially it might already be 200 or 202)
  // We'll wait a bit before first poll to let the initial request settle
  setTimeout(poll, 2000);
}
  `.trim();

  return (
    <div className="flex flex-col gap-16 py-12">
      {/* Header */}
      <section className="container">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-primary mb-4">
            <Book className="h-5 w-5" />
            <span className="font-semibold uppercase tracking-wider text-sm">
              Documentation
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
            Getting Started with{" "}
            <span className="text-primary italic">SnapService</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Learn how to integrate our automated screenshot API into your
            applications. SnapService provides high-fidelity previews with
            intelligent caching.
          </p>
        </div>
      </section>

      {/* API Reference */}
      <section className="container scroll-mt-24" id="api-reference">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Terminal className="h-6 w-6 text-primary" />
                API Endpoints
              </h2>
              <div className="bg-muted/50 rounded-2xl p-6 border border-border/50 font-mono text-sm overflow-x-auto">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-primary/20 text-primary px-2 py-0.5 rounded font-bold text-xs uppercase">
                    GET
                  </span>
                  <span className="text-foreground/80">
                    {origin}/api/screenshot
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4 ml-14">
                  Returns PNG image bytes directly when cached.
                </p>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-primary/20 text-primary px-2 py-0.5 rounded font-bold text-xs uppercase">
                    GET
                  </span>
                  <span className="text-foreground/80">{origin}/api/raw</span>
                </div>
                <p className="text-xs text-muted-foreground ml-14">
                  Returns HTTP 302 redirect to the cached static image path.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Info className="h-6 w-6 text-primary" />
                Query Parameters
              </h2>
              <div className="border rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 border-b font-medium">
                    <tr>
                      <th className="px-6 py-4">Parameter</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-6 py-4 font-mono text-primary">url</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        string
                      </td>
                      <td className="px-6 py-4">
                        The target URL (must start with{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded">
                          https://
                        </code>
                        )
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-mono text-primary">
                        width
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        number
                      </td>
                      <td className="px-6 py-4">
                        Viewport width (default: 387)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-mono text-primary">
                        height
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        number
                      </td>
                      <td className="px-6 py-4">
                        Viewport height (default: 217)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-primary" />
                Response Behavior
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4 p-5 rounded-2xl bg-card border shadow-sm">
                  <div className="bg-green-500/10 text-green-600 h-10 w-10 shrink-0 flex items-center justify-center rounded-xl font-bold">
                    200
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Success</h4>
                    <p className="text-sm text-muted-foreground">
                      Returns the PNG image binary directly from cache on{" "}
                      <code className="bg-muted px-1.5 py-0.5 rounded">
                        /api/screenshot
                      </code>
                      .
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-5 rounded-2xl bg-card border shadow-sm">
                  <div className="bg-amber-500/10 text-amber-600 h-10 w-10 shrink-0 flex items-center justify-center rounded-xl font-bold">
                    302
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Redirect</h4>
                    <p className="text-sm text-muted-foreground">
                      On{" "}
                      <code className="bg-muted px-1.5 py-0.5 rounded">
                        /api/raw
                      </code>
                      , cached images are returned as a redirect to a static PNG
                      URL.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-5 rounded-2xl bg-card border shadow-sm">
                  <div className="bg-blue-500/10 text-blue-600 h-10 w-10 shrink-0 flex items-center justify-center rounded-xl font-bold">
                    202
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">
                      Accepted (Processing)
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      The screenshot is being generated in the background. A
                      placeholder image is returned with a
                      <code className="bg-muted px-1.5 py-0.5 rounded text-primary mx-1">
                        Refresh
                      </code>{" "}
                      header.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/5 px-3 py-2 rounded-lg border border-primary/10">
                      <RefreshCcw className="h-3 w-3 animate-spin" />
                      Tip: Respect the Refresh header to automatically poll for
                      completion.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="sticky top-24">
              <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 shadow-xl shadow-primary/5">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Quick Example
                </h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  The most efficient way to use the API is to check if the
                  response contains a{" "}
                  <code className="text-primary font-mono">Refresh</code>{" "}
                  header.
                </p>
                <div className="space-y-4">
                  <div className="bg-card p-4 rounded-xl border">
                    <p className="text-xs font-mono text-muted-foreground break-all whitespace-pre-wrap">
                      HTTP/1.1 202 Accepted
                      {"\n"}Content-Type: image/png
                      {"\n"}Refresh: 5
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="container">
        <div className="bg-[#1e1e1e] rounded-3xl overflow-hidden shadow-2xl border border-white/5">
          <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-white/90">
                JavaScript Implementation
              </span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
          </div>
          <div className="p-6 md:p-8 overflow-x-auto text-sm md:text-base">
            <pre className="text-blue-300 font-mono leading-relaxed">
              <code>{jsExample}</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
};
