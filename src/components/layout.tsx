import type { FC, PropsWithChildren } from "react";
import { Sun, Moon } from "lucide-react";

export const Layout: FC<PropsWithChildren<{ title?: string }>> = ({ children, title = "SnapService - Quick URL Screenshots" }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="stylesheet" href="/index.css" />
        <script src="https://cdn.tailwindcss.com"></script>
        <script>{`
          tailwind.config = {
            darkMode: 'class',
            theme: {
              container: {
                center: true,
                padding: "2rem",
              },
              extend: {
                colors: {
                  border: "hsl(var(--border))",
                  input: "hsl(var(--input))",
                  ring: "hsl(var(--ring))",
                  background: "hsl(var(--background))",
                  foreground: "hsl(var(--foreground))",
                  primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                  },
                  secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                  },
                  destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                  },
                  muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                  },
                  accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                  },
                  popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                  },
                  card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                  },
                },
                borderRadius: {
                  lg: "var(--radius)",
                  md: "calc(var(--radius) - 2px)",
                  sm: "calc(var(--radius) - 4px)",
                },
              }
            }
          }
        `}</script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap" rel="stylesheet" />
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
            } catch (e) {}
          })();
        `}</script>
        <style>{`
          body { font-family: 'Inter', sans-serif; }
          h1, h2, h3 { font-family: 'Outfit', sans-serif; }
        `}</style>
      </head>
      <body className="bg-background min-h-screen text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground font-bold shadow-lg shadow-primary/20">S</div>
              <span className="text-xl font-bold tracking-tight">SnapService</span>
            </div>
            <nav className="flex items-center gap-6">
              <a href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</a>
              <a href="#demo" className="text-sm font-medium hover:text-primary transition-colors">Demo</a>
              <a href="#gallery" className="text-sm font-medium hover:text-primary transition-colors">Gallery</a>
              <div className="h-8 w-[1px] bg-border mx-2" />
              <button 
                id="theme-toggle"
                className="p-2 rounded-md hover:bg-accent transition-colors"
                aria-label="Toggle theme"
              >
                <Sun className="h-5 w-5 dark:hidden" />
                <Moon className="h-5 w-5 hidden dark:block" />
              </button>
              <a href="/docs" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-all hover:scale-105">Get Started</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t py-12 mt-20">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2026 SnapService. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="https://is.coders.lt" className="hover:text-primary transition-colors">Safety API</a>
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
