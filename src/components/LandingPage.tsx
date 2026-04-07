import type { FC } from "react";
import { Camera, Search, ShieldCheck, Zap, ArrowRight, Image as ImageIcon } from "lucide-react";

export interface ScreenshotRecord {
  id: number;
  url: string;
  domain: string;
  status: number;
  image_path: string | null;
  created_at: string;
}

export const LandingPage: FC<{ latest: ScreenshotRecord[]; origin: string }> = ({ latest, origin }) => {
  return (
    <div className="flex flex-col gap-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-12">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container relative z-10 text-center flex flex-col items-center">
          <div className="mb-6 flex animate-fade-in items-center rounded-full bg-muted px-4 py-1.5 text-sm font-medium">
            <span className="bg-primary px-2 py-0.5 rounded-full text-primary-foreground mr-2 text-[10px] uppercase font-bold tracking-widest">New</span>
            <span>Instant domain-level screenshot caching enabled</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl text-balance bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
            Web Screenshots, <br /> Delivered <span className="text-primary italic">Instantly</span>.
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl text-pretty leading-relaxed">
            The fastest screenshot service built for developers. Automatic domain-level caching,
            safety checks, and high-fidelity captures.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center mb-16">
            <a href="#demo" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-xl text-lg font-semibold shadow-xl shadow-primary/25 transition-all hover:scale-105 inline-flex items-center gap-2 group">
              Try the Demo <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="https://github.com/FDiskas/screenshot" className="bg-muted text-muted-foreground hover:bg-muted/80 px-8 py-4 rounded-xl text-lg font-semibold border border-border/50 transition-all hover:scale-105 inline-flex items-center gap-2">
              <ImageIcon className="h-5 w-5" /> View on GitHub
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl w-full">
            {[
              { icon: Zap, label: "Lightning Fast", sub: "Domain-level caching" },
              { icon: ShieldCheck, label: "Safe to Use", sub: "Built-in safety API" },
              { icon: Camera, label: "High Fidelity", sub: "Headless Chrome engine" },
              { icon: Search, label: "Smart Redirects", sub: "Complete browser flow" }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border shadow-sm">
                <div className="bg-primary/10 p-3 rounded-xl mb-2">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{feature.label}</h3>
                <p className="text-xs text-muted-foreground">{feature.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="container scroll-mt-24">
        <div className="bg-card border rounded-3xl p-8 md:p-12 shadow-2xl shadow-primary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-bold mb-4">Try it for yourself</h2>
            <p className="text-muted-foreground">
              Enter any URL starting with <code className="bg-muted px-1.5 py-0.5 rounded text-primary">https://</code> to generate
              a 387x217 px screenshot.
            </p>
          </div>

          <form id="demo-form" className="flex flex-col md:flex-row gap-4 mb-12">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground transition-colors group-focus-within:text-primary">
                <Search className="h-5 w-5" />
              </div>
              <input
                id="demo-url"
                type="url"
                name="url"
                required
                placeholder="https://example.com"
                className="w-full bg-muted/30 border-2 border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-2xl pl-12 pr-4 py-4 text-lg outline-none transition-all placeholder:text-muted-foreground/50"
              />
            </div>
            <button type="submit" className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              Capture Now
            </button>
          </form>

          <div className="bg-muted/30 rounded-2xl p-6 border border-dashed text-center">
            <p className="text-sm text-muted-foreground mb-4">API Preview</p>
            <code className="block bg-background/50 p-4 rounded-lg text-xs md:text-sm text-primary overflow-x-auto whitespace-nowrap">
              GET {origin}/api/screenshot?url=https://yoursite.com
            </code>
          </div>

          {/* Result Area */}
          <div id="demo-result" className="mt-12 hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-sm text-center text-muted-foreground mb-4 font-medium uppercase tracking-wider italic">Snapshot Result</p>
            <div className="mx-auto max-w-[387px] bg-muted aspect-[387/217] rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-black ring-1 ring-primary/20">
              <img id="result-img" alt="Screenshot Preview" className="w-full h-full object-cover" />
            </div>
            <p className="text-center mt-4 text-xs text-muted-foreground">Refreshing every few seconds until captured...</p>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{
          __html: `
          const form = document.getElementById('demo-form');
          const input = document.getElementById('demo-url');
          const resultArea = document.getElementById('demo-result');
          const resultImg = document.getElementById('result-img');
          let pollInterval;

          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = input.value;
            if (!url) return;

            const apiBase = '/api/screenshot?url=' + encodeURIComponent(url);
            
            // Show result area and load initial placeholder
            resultArea.classList.remove('hidden');
            resultImg.src = apiBase + '&t=' + Date.now();
            resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });

            if (pollInterval) clearInterval(pollInterval);
            
            // Poll for completion
            pollInterval = setInterval(async () => {
              try {
                // Use fetch with cache buster to check the status accurately
                const response = await fetch(apiBase + '&t=' + Date.now(), { 
                  method: 'HEAD',
                  cache: 'no-store'
                });
                
                // If it's no longer 202 (Accepted/Processing), it's either 200 (Done) or an error (Cached)
                // In both cases, the 'Refresh' header will be missing.
                const refreshHeader = response.headers.get('Refresh');
                
                if (!refreshHeader) {
                  console.log("Screenshot ready! Stopping poll.");
                  clearInterval(pollInterval);
                  resultImg.src = apiBase + '&t=' + Date.now();
                }
              } catch (err) {
                console.error("Polling error:", err);
                clearInterval(pollInterval);
              }
            }, 5000);
          });
        `}} />
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="container scroll-mt-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold mb-2">Recent Captures</h2>
            <p className="text-muted-foreground text-sm">Real-time feed of screenshots being generated across our platform.</p>
          </div>
          <p className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full font-mono">LIVE FEED • UPDATED JUST NOW</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latest.length > 0 ? (
            latest.map((shot) => (
              <div key={shot.id} className="group bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all hover:border-primary/20">
                <div className="aspect-[387/217] relative overflow-hidden bg-muted">
                  {shot.image_path ? (
                    <img src={shot.image_path} alt={shot.domain} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground italic text-xs">
                      No Image Available
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur rounded px-2 py-0.5 text-[8px] font-mono text-white/80">
                    {shot.created_at.split(' ')[0]}
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm truncate max-w-[200px]">{shot.domain}</h3>
                    <p className="text-xs text-muted-foreground">{new URL(shot.url).protocol}//{new URL(shot.url).hostname}</p>
                  </div>
                  <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-green-500/20">
                    {shot.status}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl">
              <div className="mx-auto w-12 h-12 bg-muted flex items-center justify-center rounded-xl mb-4">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No screenshots taken yet. Be the first!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
