import {
  ArrowRight,
  Camera,
  CheckCircle,
  Code2,
  Globe,
  Image as ImageIcon,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import type { FC } from "react";
import type { ScreenshotRecord } from "../types/screenshot";

export const LandingPage: FC<{
  latest: ScreenshotRecord[];
  origin: string;
}> = ({ latest, origin }) => {
  return (
    <div className="flex flex-col">
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-16 min-h-[88vh] flex items-center">
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid pointer-events-none" />

        {/* Gradient orbs */}
        <div className="absolute top-[-15%] left-[-5%] w-[55%] h-[60%] bg-primary/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[50%] bg-violet-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container relative z-10">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
            {/* Live badge */}
            <div className="mb-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-primary/25 bg-primary/5 text-sm font-medium text-primary backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Domain-level caching · Private DNS · Cookie-free
              <ArrowRight className="h-3.5 w-3.5 opacity-60" />
            </div>

            {/* Headline */}
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6 text-balance leading-[1.05]">
              <span className="bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/60">
                Screenshot Any URL.
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-linear-to-r from-primary via-violet-500 to-primary">
                Instantly.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed text-pretty">
              The screenshot API built for developers. One GET request — you get
              a pixel-perfect, ad-blocked, cookie-free capture. Every time.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 items-center mb-16">
              <a
                href="#demo"
                className="group relative px-8 py-4 rounded-2xl text-lg font-semibold inline-flex items-center gap-2 bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 transition-all"
              >
                Try the Demo
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="https://github.com/FDiskas/screenshot"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-2xl text-lg font-semibold inline-flex items-center gap-2 border border-border/60 bg-card/60 backdrop-blur-sm hover:bg-card hover:border-primary/30 hover:scale-105 transition-all"
              >
                <ImageIcon className="h-5 w-5" />
                GitHub
              </a>
            </div>

            {/* Browser chrome mockup */}
            <div className="relative w-full max-w-4xl mx-auto">
              <div className="absolute -inset-x-8 bottom-0 h-24 bg-primary/10 blur-3xl pointer-events-none" />
              <div className="relative bg-card/80 border border-border/60 rounded-2xl overflow-hidden shadow-2xl shadow-black/20 backdrop-blur-sm">
                {/* Traffic lights + URL bar */}
                <div className="flex items-center gap-3 px-5 py-3.5 bg-muted/60 border-b border-border/40">
                  <div className="flex gap-1.5 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-red-400/90" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/90" />
                    <div className="w-3 h-3 rounded-full bg-green-400/90" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 bg-background/70 rounded-lg px-3 py-1.5 border border-border/30">
                    <Lock className="h-3 w-3 text-green-500 shrink-0" />
                    <span className="text-xs text-muted-foreground font-mono truncate">
                      {origin}/api/screenshot?url=https://vercel.com
                    </span>
                  </div>
                  <div className="shrink-0 text-[10px] font-bold font-mono text-green-600 dark:text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                    200 OK
                  </div>
                </div>

                {/* Screenshot grid */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-muted/10">
                  {[
                    {
                      domain: "vercel.com",
                      top: "bg-black",
                      mid: "bg-white/10",
                      acc: "bg-white/20",
                    },
                    {
                      domain: "stripe.com",
                      top: "bg-indigo-950",
                      mid: "bg-violet-800/60",
                      acc: "bg-indigo-400/30",
                    },
                    {
                      domain: "github.com",
                      top: "bg-gray-900",
                      mid: "bg-gray-700/50",
                      acc: "bg-gray-500/30",
                    },
                    {
                      domain: "linear.app",
                      top: "bg-slate-950",
                      mid: "bg-indigo-900/40",
                      acc: "bg-blue-400/20",
                    },
                    {
                      domain: "figma.com",
                      top: "bg-gray-900",
                      mid: "bg-purple-800/40",
                      acc: "bg-pink-400/30",
                    },
                    {
                      domain: "tailwindcss.com",
                      top: "bg-slate-900",
                      mid: "bg-sky-900/50",
                      acc: "bg-cyan-400/30",
                    },
                  ].map((site) => (
                    <div
                      key={site.domain}
                      className={`aspect-video rounded-xl overflow-hidden border border-white/5 relative ${site.top}`}
                    >
                      {/* Simulated page skeleton */}
                      <div className="absolute inset-0 flex flex-col p-2 gap-1.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-3 h-3 rounded-sm ${site.acc}`} />
                          <div className={`h-1.5 w-12 rounded ${site.mid}`} />
                          <div
                            className={`h-1.5 flex-1 rounded ${site.mid} opacity-50`}
                          />
                        </div>
                        <div
                          className={`h-4 w-full rounded ${site.acc} opacity-70`}
                        />
                        <div className={`h-2 w-3/4 rounded ${site.mid}`} />
                        <div
                          className={`h-2 w-1/2 rounded ${site.mid} opacity-60`}
                        />
                        <div className="flex gap-1 mt-auto">
                          <div
                            className={`h-5 flex-1 rounded ${site.acc} opacity-80`}
                          />
                          <div className={`h-5 w-8 rounded ${site.mid}`} />
                        </div>
                      </div>
                      <div className="absolute bottom-1.5 left-2 text-[8px] font-mono text-white/50">
                        {site.domain}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS STRIP ──────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-muted/20">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "< 2s", label: "Average capture time" },
              { value: "99.9%", label: "API uptime" },
              { value: "Zero", label: "Cookie popups in output" },
              { value: "Free", label: "Open source · self-host ready" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <span className="text-2xl md:text-3xl font-bold text-foreground">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BENTO FEATURES ───────────────────────────────────────────── */}
      <section className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Built for developers,{" "}
            <span className="text-primary">obsessed with quality</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every stage of the capture pipeline is tuned to give you the
            cleanest, fastest, most reliable screenshot possible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 max-w-5xl mx-auto">
          {/* Large: Caching */}
          <div className="md:col-span-4 bg-card border border-border/60 rounded-3xl p-8 relative overflow-hidden group hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
            <div className="relative">
              <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">
                Lightning-Fast Caching
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm leading-relaxed">
                Domain-level caching means popular sites are served in
                milliseconds. Your calls never wait for a fresh render when we
                already have a fresh capture.
              </p>
              <div className="flex gap-2 flex-wrap">
                {[
                  "github.com · HIT",
                  "vercel.com · HIT",
                  "stripe.com · HIT",
                  "npm.js · HIT",
                ].map((d) => (
                  <div
                    key={d}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-600 dark:text-green-400 font-mono"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tall: Privacy */}
          <div className="md:col-span-2 bg-card border border-border/60 rounded-3xl p-6 relative overflow-hidden group hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/5 hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl group-hover:bg-violet-500/8 transition-colors pointer-events-none" />
            <div className="relative">
              <div className="bg-violet-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6 text-violet-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Private DNS</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Puppeteer instances use private DNS filtering. Ads and malware
                domains never reach the rendered page.
              </p>
              <div className="space-y-2.5">
                {[
                  "Ad domains blocked",
                  "Malware filtering",
                  "Safety API verified",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-violet-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Small: Cookie-free */}
          <div className="md:col-span-2 bg-card border border-border/60 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/8 transition-colors pointer-events-none" />
            <div className="bg-emerald-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
              <Camera className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Cookie-Free Output</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Autoconsent auto-dismisses GDPR banners and cookie popups before
              every capture.
            </p>
          </div>

          {/* Small: One-line API */}
          <div className="md:col-span-2 bg-card border border-border/60 rounded-3xl p-6 relative overflow-hidden group hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300">
            <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
              <Code2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">One-Line Integration</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              A single GET request. Drop it into any language, any framework,
              zero SDK required.
            </p>
          </div>

          {/* Small: Global */}
          <div className="md:col-span-2 bg-card border border-border/60 rounded-3xl p-6 relative overflow-hidden group hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-0.5 transition-all duration-300">
            <div className="bg-orange-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Any Public URL</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Screenshot anything publicly accessible. Robots.txt-aware and
              polite by default.
            </p>
          </div>
        </div>
      </section>

      {/* ─── DEMO ─────────────────────────────────────────────────────── */}
      <section id="demo" className="container scroll-mt-24 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
            {/* Terminal chrome */}
            <div className="flex items-center gap-3 px-5 py-4 bg-muted/60 border-b border-border/40">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-3 h-3 rounded-full bg-red-400/90" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/90" />
                <div className="w-3 h-3 rounded-full bg-green-400/90" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs text-muted-foreground font-mono">
                  screenshot-api — live demo
                </span>
              </div>
              <Sparkles className="h-4 w-4 text-muted-foreground/60" />
            </div>

            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Try it for yourself</h2>
                <p className="text-muted-foreground">
                  Enter any URL starting with{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-primary text-sm font-mono">
                    https://
                  </code>{" "}
                  to generate a 387×217px screenshot.
                </p>
              </div>

              <form
                id="demo-form"
                className="flex flex-col sm:flex-row gap-3 mb-8"
              >
                <div className="relative flex-1 group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    id="demo-url"
                    name="url"
                    required
                    placeholder="https://example.com"
                    className="w-full bg-muted/40 border border-border focus:border-primary/60 focus:ring-2 focus:ring-primary/10 rounded-xl pl-12 pr-4 py-3.5 text-base outline-none transition-all placeholder:text-muted-foreground/50 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] hover:shadow-primary/30 transition-all whitespace-nowrap"
                >
                  Capture →
                </button>
              </form>

              {/* API preview */}
              <div className="bg-muted/30 rounded-xl p-4 border border-border/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                    GET request
                  </span>
                </div>
                <code
                  id="api-preview-sample"
                  className="block text-xs sm:text-sm text-primary font-mono overflow-x-auto whitespace-nowrap"
                >
                  GET {origin}/api/screenshot?url=https://example.com
                </code>
              </div>

              {/* Result area */}
              <div
                id="demo-result"
                className="mt-8 hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <p className="text-xs text-center text-muted-foreground mb-4 font-mono uppercase tracking-widest">
                  ↓ Snapshot result
                </p>
                <div className="mx-auto max-w-[387px]">
                  {/* Mini browser chrome on result */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/60 rounded-t-xl border border-border/50 border-b-0">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-400/80" />
                      <div className="w-2 h-2 rounded-full bg-yellow-400/80" />
                      <div className="w-2 h-2 rounded-full bg-green-400/80" />
                    </div>
                    <div className="flex-1 h-3.5 bg-background/50 rounded" />
                  </div>
                  <div className="aspect-[387/217] rounded-b-xl overflow-hidden border border-border/50 border-t-0 shadow-2xl">
                    <img
                      id="result-img"
                      alt="Screenshot Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <p className="text-center mt-3 text-xs text-muted-foreground font-mono">
                  Polling for completion every 5s...
                </p>
              </div>
            </div>
          </div>
        </div>

        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: this is how it works
          dangerouslySetInnerHTML={{
            __html: `
          const form = document.getElementById('demo-form');
          const input = document.getElementById('demo-url');
          const resultArea = document.getElementById('demo-result');
          const resultImg = document.getElementById('result-img');
          const apiPreview = document.getElementById('api-preview-sample');
          const previewOrigin = ${JSON.stringify(origin)};
          let pollInterval;

          const updateApiPreview = (rawUrl) => {
            if (!apiPreview) return;
            const normalizedUrl = (rawUrl || '').trim() || 'https://example.com';
            const encodedUrl = encodeURIComponent(normalizedUrl);
            apiPreview.textContent = 'GET ' + previewOrigin + '/api/screenshot?url=' + encodedUrl;
          };

          updateApiPreview(input?.value || '');
          input?.addEventListener('input', () => {
            updateApiPreview(input.value);
          });

          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = input.value;
            if (!url) return;

            updateApiPreview(url);

            const apiBase = '/api/screenshot?url=' + encodeURIComponent(url);

            resultArea.classList.remove('hidden');
            resultImg.src = apiBase;
            resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });

            if (pollInterval) clearInterval(pollInterval);

            pollInterval = setInterval(async () => {
              try {
                const response = await fetch(apiBase, { method: 'HEAD' });
                const refreshHeader = response.headers.get('Refresh');
                if (!refreshHeader) {
                  clearInterval(pollInterval);
                  resultImg.src = apiBase;
                }
              } catch (err) {
                clearInterval(pollInterval);
              }
            }, 5000);
          });
        `,
          }}
        />
      </section>

      {/* ─── GALLERY ──────────────────────────────────────────────────── */}
      <section id="gallery" className="container scroll-mt-24 pb-28">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                Live feed
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-1">Recent Captures</h2>
            <p className="text-muted-foreground text-sm">
              Real-time feed of screenshots generated across the platform.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {latest.length > 0 ? (
            latest.map((shot) => (
              <div
                key={shot.id}
                className="group bg-card border border-border/60 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300"
              >
                {/* Card browser chrome */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border/40">
                  <div className="flex gap-1 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-red-400/70" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400/70" />
                    <div className="w-2 h-2 rounded-full bg-green-400/70" />
                  </div>
                  <div className="flex-1 min-w-0 bg-background/50 rounded px-2 py-0.5 text-[10px] font-mono text-muted-foreground truncate">
                    {shot.url}
                  </div>
                </div>

                <div className="aspect-[387/217] relative overflow-hidden bg-muted">
                  {shot.image_path ? (
                    <img
                      src={shot.image_path}
                      alt={shot.domain}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {shot.domain}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {shot.created_at.split(" ")[0]}
                    </p>
                  </div>
                  <div className="shrink-0 bg-green-500/10 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-green-500/20">
                    {shot.status}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-24 text-center border-2 border-dashed border-border/40 rounded-3xl">
              <div className="mx-auto w-16 h-16 bg-muted/50 flex items-center justify-center rounded-2xl mb-4">
                <Camera className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground font-medium mb-1">
                No screenshots yet
              </p>
              <p className="text-sm text-muted-foreground/60">
                Be the first — try the demo above
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
