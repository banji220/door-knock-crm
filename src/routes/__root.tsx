import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md w-full border-brutal-thick bg-card p-6 text-center">
        <div className="inline-block border-brutal-thick bg-ink text-cream px-3 py-1 text-xs font-mono uppercase tracking-wider mb-4">
          404
        </div>
        <h1 className="text-4xl font-display uppercase">No such door</h1>
        <p className="mt-2 text-sm font-mono text-muted-foreground">
          That page doesn't exist or has moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="press-brutal inline-block border-brutal-thick bg-amber px-6 py-3 text-sm font-display uppercase text-ink"
          >
            Back to knock
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Giraffe CRM — Field Sales for Window Cleaners" },
      { name: "description", content: "Brutalist field CRM for door-knocking window cleaners. Knock, quote, schedule — one hand, in the sun." },
      { name: "author", content: "Holy Giraffe" },
      { name: "theme-color", content: "#f5e9c8" },
      { property: "og:title", content: "Giraffe CRM" },
      { property: "og:description", content: "A field weapon for window cleaners. Knock. Quote. Book." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
