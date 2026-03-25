import Link from "next/link";

const helpLinks = [
  { href: "/help", label: "Overview" },
  { href: "/help/executive", label: "FAQ ejecutiva" },
  { href: "/help/functional", label: "Guia funcional" },
  { href: "/help/positioning", label: "Posicionamiento" },
  { href: "/help/platforms", label: "Medallion y ELT" },
];

type HelpNavProps = {
  currentPath: string;
};

export function HelpNav({ currentPath }: HelpNavProps) {
  return (
    <nav className="help-nav" aria-label="Secciones Help">
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