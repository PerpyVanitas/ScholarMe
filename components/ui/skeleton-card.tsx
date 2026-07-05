import { cn } from "@/lib/utils";

function SkeletonBlock({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/60", className)}
      {...props}
    />
  );
}

/** Single card skeleton matching a typical stat/info card */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 p-5 space-y-3",
        className,
      )}
    >
      <SkeletonBlock className="h-4 w-1/3" />
      <SkeletonBlock className="h-8 w-1/2" />
      <SkeletonBlock className="h-3 w-2/3" />
    </div>
  );
}

/** Row skeleton for table / list pages */
export function SkeletonRow({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border/30">
      <SkeletonBlock className="h-9 w-9 rounded-full shrink-0" />
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className="h-4 flex-1"
          style={{ maxWidth: `${60 + (i % 3) * 20}%` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/** Full-page list skeleton — renders N rows */
export function SkeletonList({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="rounded-xl border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-secondary/20 border-b border-border/30">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBlock
            key={i}
            className="h-3 flex-1"
            style={{ maxWidth: `${40 + (i % 3) * 20}%` } as React.CSSProperties}
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} />
      ))}
    </div>
  );
}

/** Grid of skeleton cards */
export function SkeletonGrid({
  count = 6,
  cols = 3,
}: {
  count?: number;
  cols?: number;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
