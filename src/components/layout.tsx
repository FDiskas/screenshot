import { Moon, Sun } from "lucide-react";
import type { FC, PropsWithChildren } from "react";

export const Layout: FC<PropsWithChildren<{ title?: string }>> = ({
  children,
  title = "SnapService - Quick URL Screenshots",
}) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="stylesheet" href="/index.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <script>{`
          (function() {
            try {
              const savedTheme = localStorage.getItem('theme');
              const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              const theme = savedTheme || systemTheme;
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch {}
          })();
        `}</script>
        <style>{`
          body { font-family: 'Inter', sans-serif; }
          h1, h2, h3 { font-family: 'Outfit', sans-serif; }
        `}</style>
      </head>
      <body className="bg-background min-h-screen text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
          {/* Subtle gradient line at top of header */}
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
          <div className="container flex h-16 items-center justify-between">
            {/* Logo */}
            <a
              href="/"
              className="flex items-center gap-2.5 group"
              aria-label="Go to home page"
            >
              <img
                src="/favicon.svg"
                alt="SnapService logo"
                className="h-8 w-8 rounded-xl shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow"
              />
              <span className="text-xl font-bold tracking-tight">
                Snap<span className="text-primary">Service</span>
              </span>
            </a>

            {/* Nav */}
            <nav className="flex items-center gap-2">
              <a
                href="/docs"
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/60"
              >
                Docs
              </a>
              <a
                href="https://github.com/FDiskas/screenshot"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/60"
              >
                GitHub
              </a>
              <button
                type="button"
                id="theme-toggle"
                className="p-2 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Toggle theme"
              >
                <Sun className="h-4 w-4 dark:hidden" />
                <Moon className="h-4 w-4 hidden dark:block" />
              </button>
              <a
                href="#demo"
                className="ml-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105"
              >
                Try Demo
              </a>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t border-border/40 py-12 mt-8">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="" className="h-5 w-5 rounded-md opacity-70" />
              <p className="text-sm text-muted-foreground">
                © 2026 SnapService. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="/privacy" className="hover:text-primary transition-colors">
                Privacy & Terms
              </a>
              <span className="text-border">·</span>
              <a
                href="https://is.coders.lt"
                className="hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                Safety API
              </a>
              <span className="text-border">·</span>
              <a
                href="https://github.com/FDiskas/screenshot"
                className="hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>

        <script>{`
          document.getElementById('theme-toggle').addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
          });
        `}</script>
      </body>
    </html>
  );
};
