import { Camera } from "lucide-react";
import type { FC } from "react";
import { CONFIG } from "../config";
import type { ScreenshotRecord } from "../types/screenshot";

export const GalleryPage: FC<{ latest: ScreenshotRecord[] }> = ({ latest }) => {
  return (
    <div className="container py-24 min-h-screen">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Screenshot Gallery</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Explore all captured screenshots. Scroll down to seamlessly load more images,
          powered by native CSS virtualization for maximum performance.
        </p>
      </div>

      <div
        id="gallery-grid"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {latest.map((shot) => (
          <GalleryItem key={shot.id} shot={shot} />
        ))}
      </div>

      <div
        id="gallery-error"
        className="hidden mt-10 p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-xl text-center"
      >
        <p className="font-semibold">Failed to load more screenshots.</p>
        <button
          id="gallery-retry-button"
          type="button"
          className="mt-2 text-sm underline hover:text-destructive/80"
        >
          Try again
        </button>
      </div>

      <div
        id="gallery-sentinel"
        className="h-32 flex items-center justify-center mt-10"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary opacity-50" />
      </div>

      <GalleryItemTemplate />

      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: required for client-side functionality without React hydration
        dangerouslySetInnerHTML={{
          __html: `
            const PageConfig = {
              offset: ${latest.length},
              limit: ${CONFIG.server.galleryPageSize},
              hasMore: ${latest.length > 0 ? "true" : "false"},
            };

            const State = {
              loading: false,
              hasError: false,
            };

            const Elements = {
              grid: document.getElementById('gallery-grid'),
              sentinel: document.getElementById('gallery-sentinel'),
              error: document.getElementById('gallery-error'),
              template: document.getElementById('gallery-card-template'),
              retryBtn: document.getElementById('gallery-retry-button')
            };

            if (Elements.retryBtn) {
              Elements.retryBtn.addEventListener('click', () => {
                State.hasError = false;
                fetchNextPage();
              });
            }

            function createCardHtml(shot) {
              const templateHtml = Elements.template.innerHTML;
              const dateStr = shot.created_at.split(' ')[0];
              
              const imageHtml = shot.image_path 
                ? \`<img src="\${shot.image_path}" alt="\${shot.domain}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />\`
                : \`<div class="w-full h-full flex items-center justify-center"><svg class="h-8 w-8 text-muted-foreground/30" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>\`;

              return templateHtml
                .replace(/__URL__/g, shot.url)
                .replace(/__DOMAIN__/g, shot.domain)
                .replace(/__DATE__/g, dateStr)
                .replace(/__STATUS__/g, shot.status)
                .replace('__IMAGE_HTML__', imageHtml);
            }

            function appendCards(items) {
              const fragment = document.createDocumentFragment();
              const container = document.createElement('div');
              
              items.forEach(shot => {
                container.innerHTML = createCardHtml(shot);
                fragment.appendChild(container.firstElementChild);
              });
              
              Elements.grid.appendChild(fragment);
            }

            async function fetchNextPage() {
              State.loading = true;
              Elements.error.style.display = 'none';
              
              try {
                const res = await fetch(\`/api/gallery?offset=\${PageConfig.offset}&limit=\${PageConfig.limit}\`);
                if (!res.ok) throw new Error('Network response was not ok');
                
                const data = await res.json();
                
                if (data.items.length === 0) {
                  PageConfig.hasMore = false;
                  Elements.sentinel.style.display = 'none';
                  return;
                }
                
                appendCards(data.items);
                
                PageConfig.offset += PageConfig.limit;
                if (!data.nextOffset) {
                  PageConfig.hasMore = false;
                  Elements.sentinel.style.display = 'none';
                }
              } catch (e) {
                console.error("Error loading more:", e);
                State.hasError = true;
                Elements.error.style.display = 'block';
              } finally {
                State.loading = false;
              }
            }

            const observer = new IntersectionObserver((entries) => {
              if (entries[0].isIntersecting && !State.loading && !State.hasError && PageConfig.hasMore) {
                fetchNextPage();
              }
            }, { rootMargin: '800px' });
            
            if (Elements.sentinel) observer.observe(Elements.sentinel);
            
            // Expose for the retry button
            window.State = State;
            window.fetchNextPage = fetchNextPage;
          `,
        }}
      />
    </div>
  );
};

const GalleryItemTemplate: FC = () => {
  const templateRecord: ScreenshotRecord = {
    id: 0,
    url: "__URL__",
    domain: "__DOMAIN__",
    status: "__STATUS__" as any,
    image_path: "",
    created_at: "__DATE__ 00:00:00",
    expires_at: "",
  };

  return (
    <template id="gallery-card-template">
      <GalleryItem shot={templateRecord} isTemplate />
    </template>
  );
};

const GalleryItem: FC<{ shot: ScreenshotRecord; isTemplate?: boolean }> = ({
  shot,
  isTemplate,
}) => (
  <div
    className="group bg-card border border-border/60 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300"
    style={{ contentVisibility: "auto", containIntrinsicSize: "auto 340px" }}
  >
    <a
      href={shot.url}
      target="_blank"
      rel="noopener nofollow"
      className="block h-full"
    >
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
        {isTemplate ? (
          <span dangerouslySetInnerHTML={{ __html: "__IMAGE_HTML__" }} />
        ) : shot.image_path ? (
          <img
            src={shot.image_path}
            alt={shot.domain}
            loading="lazy"
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
          <h3 className="font-semibold text-sm truncate">{shot.domain}</h3>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {shot.created_at.split(" ")[0]}
          </p>
        </div>
        <div className="shrink-0 bg-green-500/10 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-green-500/20">
          {shot.status}
        </div>
      </div>
    </a>
  </div>
);
