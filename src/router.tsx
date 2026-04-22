import { createRouter, useRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md w-full border-brutal-thick bg-card p-6">
        <div className="inline-block border-brutal-thick bg-destructive text-destructive-foreground px-3 py-1 text-xs font-mono uppercase tracking-wider mb-4">
          ERROR
        </div>
        <h1 className="text-3xl font-display uppercase text-foreground">
          Something broke
        </h1>
        <p className="mt-2 text-sm font-mono text-muted-foreground">
          Try again, or head back to base.
        </p>
        {import.meta.env.DEV && error.message && (
          <pre className="mt-4 max-h-40 overflow-auto border-brutal bg-muted p-3 text-left font-mono text-xs text-destructive">
            {error.message}
          </pre>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="press-brutal border-brutal-thick bg-amber px-4 py-3 text-sm font-display uppercase text-ink"
          >
            Retry
          </button>
          <a
            href="/"
            className="press-brutal border-brutal-thick bg-cream px-4 py-3 text-sm font-display uppercase text-ink text-center"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });

  return router;
};
