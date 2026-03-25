import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/mappings", label: "Equivalencias" },
  { href: "/groups", label: "Agrupaciones" },
  { href: "/parameters", label: "Parametros" },
  { href: "/imports", label: "Importacion" },
  { href: "/help", label: "Help" },
  { href: "/api/health/db", label: "DB Health" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-brand">
          <span className="site-brand__mark">MDM</span>
          <span className="site-brand__text">Lite</span>
        </Link>

        <nav className="site-nav" aria-label="Principal">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="site-nav__link">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}