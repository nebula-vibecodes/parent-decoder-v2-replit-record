import { ArrowLeft, Search } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return <div className="mx-auto flex min-h-[65dvh] max-w-xl flex-col items-center justify-center px-5 text-center"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary"><Search size={22} /></div><div className="mt-6 font-mono-custom text-[10px] uppercase tracking-[.18em] text-muted-foreground">Page not found</div><h1 className="mt-3 font-display text-5xl font-semibold tracking-[-.04em]">Let’s find our way back.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">That page isn’t in this field guide.</p><Link href="/" className="focus-ring mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground" data-testid="link-not-found-home"><ArrowLeft size={15} /> Return home</Link></div>;
}
