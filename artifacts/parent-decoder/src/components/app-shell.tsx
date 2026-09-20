import { BookOpen, Compass, Flag, LockKeyhole, Menu, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { RouteQuality } from '@/components/route-quality';

type AppShellProps = { children: React.ReactNode };

const navItems = [
  { href: '/', label: 'Home', icon: Compass },
  { href: '/dictionary', label: 'Dictionary', icon: BookOpen },
  { href: '/decoder', label: 'Decode + ask', icon: Sparkles },
  { href: '/feedback', label: 'Feedback', icon: Flag },
  { href: '/privacy', label: 'Privacy & use', icon: LockKeyhole },
];

function isNavActive(href: string, location: string) {
  if (href === '/') return location === '/' || location === '/discover';
  if (href === '/dictionary') return location === '/dictionary' || location === '/library' || location.startsWith('/library/');
  if (href === '/privacy') return location === '/privacy' || location === '/approach';
  return location.startsWith(href);
}

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);
  return (
    <div className="paper-grain min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-[74px] max-w-[1320px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="focus-ring flex items-center gap-3" data-testid="link-brand">
            <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-primary text-primary-foreground shadow-sm">
              <Search size={19} strokeWidth={2.4} />
            </span>
            <span className="leading-none">
              <span className="font-display text-[22px] font-semibold tracking-[-0.03em] text-foreground">Parent Decoder</span>
              <span className="mt-1 block font-mono-custom text-[9px] uppercase tracking-[0.19em] text-muted-foreground">context, not conclusions</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isNavActive(href, location);
              return (
                <Link key={href} href={href} className={`focus-ring flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium transition-colors ${active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <button ref={menuButtonRef} type="button" onClick={() => setMenuOpen((open) => !open)} className="focus-ring min-h-11 min-w-11 rounded-lg p-2 text-foreground md:hidden" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="mobile-navigation" data-testid="button-mobile-menu">
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        {menuOpen && (
          <nav id="mobile-navigation" className="border-t border-border bg-card px-5 py-3 md:hidden" aria-label="Mobile navigation">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)} aria-current={isNavActive(href, location) ? 'page' : undefined} className="focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm text-foreground hover:bg-secondary" data-testid={`link-mobile-${label.toLowerCase().replaceAll(' ', '-')}`}>
                <Icon size={17} className="text-primary" /> {label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <RouteQuality location={location} />
      <main id="main-content" tabIndex={-1} className="route-focus-target">{children}</main>
      <footer className="border-t border-border/80 bg-secondary/30">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={16} className="text-primary" /> Built for calmer conversations.</div>
            <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">A local reference tool for understanding language before responding to it.</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground" aria-label="Footer navigation">
            <Link href="/dictionary" className="focus-ring hover:text-foreground" data-testid="link-footer-dictionary">Browse dictionary</Link>
            <Link href="/decoder" className="focus-ring hover:text-foreground" data-testid="link-footer-decoder">Decode a message</Link>
            <Link href="/privacy" className="focus-ring hover:text-foreground" data-testid="link-footer-privacy">Privacy & responsible use</Link>
            <Link href="/conversation-starters" className="focus-ring hover:text-foreground" data-testid="link-footer-conversation-starters">Conversation starters</Link>
            <Link href="/saved" className="focus-ring hover:text-foreground" data-testid="link-footer-saved">Saved prompts</Link>
            <Link href="/editorial-review" className="focus-ring hover:text-foreground" data-testid="link-footer-editorial-review">Editorial review</Link>
            <Link href="/feedback" className="focus-ring hover:text-foreground" data-testid="link-footer-feedback">Feedback</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function PageKicker({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 flex items-center gap-2 font-mono-custom text-[10px] font-medium uppercase tracking-[0.19em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{children}</div>;
}

export function LocalNote({ children = 'Local reference · illustrative context · not independently verified' }: { children?: React.ReactNode }) {
  return <p className="font-mono-custom text-[10px] uppercase leading-5 tracking-[0.12em] text-muted-foreground">{children}</p>;
}

export function SectionRule() {
  return <div className="my-8 h-px w-full bg-border/80" />;
}