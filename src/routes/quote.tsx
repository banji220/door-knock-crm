import { createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { CaptureFlow, type CaptureData } from "@/components/CaptureFlow";

const searchSchema = z.object({
  address: z.string().trim().max(200).optional(),
  mode: z.enum(["quote", "follow-up"]).optional(),
});

export const Route = createFileRoute("/quote")({
  validateSearch: (s) => searchSchema.parse(s),
  component: QuotePage,
});

function QuotePage() {
  const router = useRouter();
  const { address, mode } = Route.useSearch();

  const handleSave = (step: number, data: CaptureData) => {
    /* Each card is a save point — in a real app this calls the backend.
       For now we trace it so the UX intent is visible. */
    if (typeof console !== "undefined") {
      console.info(`[capture] step ${step + 1} saved`, { address, mode, ...data });
    }
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleClose = () => {
    // Return to the previous page in history (Clients, Deals, Map, etc.)
    // Fall back to home only if there's no history (e.g. deep-linked entry).
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      router.navigate({ to: "/" });
    }
  };

  return (
    <CaptureFlow
      address={address || "New address"}
      mode={mode ?? "quote"}
      onSave={handleSave}
      onClose={handleClose}
    />
  );
}
