import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  cta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

/**
 * A consistent empty state placeholder for list pages.
 *
 * @example
 * <EmptyState
 *   icon={Calendar}
 *   title="No sessions yet"
 *   description="Book your first tutoring session to get started."
 *   cta={{ label: 'Browse Tutors', href: '/dashboard/tutors' }}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-20 px-6 text-center space-y-4 ${className ?? ""}`}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-secondary/60 flex items-center justify-center">
          <Icon className="h-8 w-8 text-muted-foreground/60" />
        </div>
      )}
      <div className="space-y-1.5 max-w-xs">
        <h3 className="font-semibold text-base text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {cta && (
        <>
          {cta.href ? (
            <Button asChild size="sm" className="mt-2">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          ) : (
            <Button size="sm" className="mt-2" onClick={cta.onClick}>
              {cta.label}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
