import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Card, SectionHeader } from "./ui-brutal";

type Props = {
  label: string;
  count: number;
  children: ReactNode;
  /** Empty state copy — defaults to the spec line */
  emptyTitle?: string;
};

export function ActionSection({ label, count, children, emptyTitle }: Props) {
  return (
    <section className="mb-5">
      <SectionHeader count={count}>{label}</SectionHeader>
      {count === 0 ? (
        <Card className="border-dashed p-4">
          <p className="font-mono font-bold uppercase text-sm leading-tight">
            {emptyTitle ?? "Nothing urgent."}
          </p>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Go knock some doors.
          </p>
          <Link
            to="/map"
            className="press-brutal mt-3 inline-flex items-center gap-2 px-3 py-2 border-2 border-foreground bg-foreground text-background font-mono font-bold uppercase tracking-wider text-xs"
          >
            Open Map
            <ArrowRight className="size-3.5" strokeWidth={3} />
          </Link>
        </Card>
      ) : (
        <ul className="space-y-2">{children}</ul>
      )}
    </section>
  );
}
