import Link from "next/link";

import { getCopy } from "@/lib/copy";
import { getRequestPreferences } from "@/lib/request-preferences";

type HelpNavProps = {
  currentPath: string;
};

export async function HelpNav({ currentPath }: HelpNavProps) {
  const { language } = await getRequestPreferences();
  const t = getCopy(language).helpNav;
  const helpLinks = [
    { href: "/help", label: t.links.overview },
    { href: "/help/demo", label: t.links.demo },
    { href: "/help/executive", label: t.links.executive },
    { href: "/help/functional", label: t.links.functional },
    { href: "/help/positioning", label: t.links.positioning },
    { href: "/help/platforms", label: t.links.platforms },
  ];

  return (
    <nav className="help-nav" aria-label={t.ariaLabel}>
      {helpLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={currentPath === link.href ? "help-nav__link help-nav__link--active" : "help-nav__link"}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}