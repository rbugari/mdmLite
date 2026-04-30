import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type ActionTone = "default" | "success" | "danger";

type BaseProps = {
  label: string;
  icon: LucideIcon;
  tone?: ActionTone;
  busy?: boolean;
  className?: string;
};

type TableActionButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;

type TableActionLinkProps = BaseProps & {
  href: string;
};

function buildClassName(tone: ActionTone, className?: string) {
  return ["table-action", tone !== "default" ? `table-action--${tone}` : null, className]
    .filter(Boolean)
    .join(" ");
}

function TableActionInner({ icon: Icon, label, busy }: { icon: LucideIcon; label: string; busy?: boolean }) {
  return (
    <>
      <span className="table-action__icon" aria-hidden="true">
        <Icon size={16} strokeWidth={2} />
      </span>
      <span className="sr-only">{busy ? `${label}...` : label}</span>
    </>
  );
}

export function TableActionButton({
  label,
  icon,
  tone = "default",
  busy = false,
  className,
  type = "button",
  ...props
}: TableActionButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={buildClassName(tone, className)}
      aria-label={busy ? `${label}...` : label}
      title={busy ? `${label}...` : label}
    >
      <TableActionInner icon={icon} label={label} busy={busy} />
    </button>
  );
}

export function TableActionLink({ label, icon, tone = "default", href, className }: TableActionLinkProps) {
  return (
    <Link href={href} className={buildClassName(tone, className)} aria-label={label} title={label}>
      <TableActionInner icon={icon} label={label} />
    </Link>
  );
}

export function TableActionGroup({ children }: { children: ReactNode }) {
  return <div className="table-actions">{children}</div>;
}