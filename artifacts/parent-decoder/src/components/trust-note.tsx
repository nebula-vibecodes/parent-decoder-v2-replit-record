import { BookOpen, FileText, Info, UsersRound } from 'lucide-react';

export function TrustNote({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`rounded-2xl border border-[#d7cfc2] bg-[#f4efe4] ${compact ? 'p-5' : 'p-6 sm:p-8'}`}>
      <div className="flex items-start gap-3">
        <Info size={18} className="mt-0.5 shrink-0 text-primary" />
        <div>
          <h2 className="font-display text-2xl font-semibold">Why should I trust this?</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Trust Parent Decoder as editorial guidance for starting a calmer conversation—not as an authority that can determine what happened.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 text-sm leading-6 sm:grid-cols-2">
        <TrustPoint icon={BookOpen} title="Editorial guidance">Plain-language framing written to help you ask better questions. It is not independent verification.</TrustPoint>
        <TrustPoint icon={FileText} title="Documented sources">A named dictionary, publication, or other source will be listed when one is actually available. We do not invent citations.</TrustPoint>
        <TrustPoint icon={UsersRound} title="Community observations">Platform or community usage can show how a phrase is used in one setting; it is not universal or proof of intent.</TrustPoint>
        <TrustPoint icon={Info} title="Prototype material">Entries marked prototype or verification in progress carry moderate editorial confidence only. No source or review date is implied.</TrustPoint>
      </div>
    </section>
  );
}

function TrustPoint({ icon: Icon, title, children }: { icon: typeof Info; title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-[#d7cfc2]/80 bg-background/55 p-4"><div className="flex items-center gap-2 font-semibold text-foreground"><Icon size={15} className="text-primary" />{title}</div><p className="mt-2 text-muted-foreground">{children}</p></div>;
}