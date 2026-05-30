import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/presentation")({
  head: () => ({
    meta: [
      { title: "Presentation — Berlin Compass Collective" },
      { name: "description", content: "The connective tissue of Berlin's startup ecosystem." },
    ],
  }),
  component: PresentationPage,
});

function PresentationPage() {
  return (
    <div className="min-h-screen bg-surface selection:bg-primary selection:text-primary-foreground">
      {/* Navigation / Progress */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b-2 border-outline px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="font-display font-black text-xl tracking-tighter hover:text-primary transition-colors">
            BERLIN COMPASS <span className="text-primary">COLLECTIVE</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:block">Hackathon Pitch 2026</span>
            <Link to="/" className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold border-2 border-outline shadow-brutal-sm hover:translate-y-[-1px] transition-all">
              Live Demo
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-16 space-y-32 pb-32">
        {/* Slide 1: The Hook */}
        <section className="space-y-6">
          <header>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground border-2 border-outline text-[11px] font-bold uppercase tracking-widest shadow-brutal-sm">
              01 / The Problem
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-bold mt-6 leading-[0.95] tracking-tighter text-balance">
              Berlin is full of <span className="bg-primary text-primary-foreground px-2">hidden</span> infrastructure.
            </h1>
          </header>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                The resources exist. The lawyers, the desks, the housing, the angels. But they live in 
                <span className="text-foreground font-bold"> informal networks </span> 
                and closed WhatsApp groups.
              </p>
              <div className="p-4 rounded-xl border-l-4 border-primary bg-surface-container font-medium text-sm">
                Talking Point: "Information asymmetry is the #1 killer of founder velocity in Berlin. If you don't know the 'secret' WhatsApp group, you're 6 months behind."
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-surface-container border-2 border-outline shadow-brutal-sm italic text-lg relative">
               <span className="absolute -top-4 -left-4 size-10 rounded-full bg-accent border-2 border-outline grid place-items-center not-italic font-black text-xs shadow-brutal-sm">!</span>
              "Every founder starts from scratch because the ecosystem's connective tissue is invisible to the newcomer."
            </div>
          </div>
        </section>

        {/* Slide 2: The Vision */}
        <section className="space-y-8">
          <header>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground border-2 border-outline text-[11px] font-bold uppercase tracking-widest shadow-brutal-sm">
              02 / The Solution
            </span>
            <h2 className="font-display text-5xl md:text-6xl font-bold mt-6 leading-[0.95] tracking-tighter text-balance">
              A digital layer for a <span className="underline decoration-accent decoration-8 underline-offset-4">physical</span> ecosystem.
            </h2>
          </header>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            We built a persistent, trusted layer of structured knowledge. Not just a directory—a 
            <span className="text-foreground font-bold"> living organism </span> 
            that maps founders to the right resource in 10 seconds.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <FeatureCard 
              icon="map" 
              title="The Physical Map" 
              desc="150+ curated coworking spaces, hubs, and universities with peer-validated reviews."
            />
            <FeatureCard 
              icon="auto_awesome" 
              title="AI Concierge" 
              desc="Natural language matchmaking that reads the entire catalog to solve your exact situation."
            />
            <FeatureCard 
              icon="bolt" 
              title="Live Scraping" 
              desc="Automated ingestion from 230+ sources (Lu.ma, Silicon Allee) to ensure the data never rots."
            />
          </div>
          <div className="p-4 rounded-xl border-l-4 border-accent bg-surface-container font-medium text-sm">
            Talking Point: "We don't just ask people to 'add' their event. Our AI-powered cron jobs scrape the ecosystem daily, structure the unstructured web, and verify it against our peer-database."
          </div>
        </section>

        {/* Slide 3: The Growth Loop */}
        <section className="space-y-8">
          <header>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground border-2 border-outline text-[11px] font-bold uppercase tracking-widest shadow-brutal-sm">
              03 / The Growth Loop
            </span>
            <h2 className="font-display text-5xl md:text-6xl font-bold mt-6 leading-[0.95] tracking-tighter text-balance">
               Intelligence that <span className="italic">compounds</span>.
            </h2>
          </header>
          <div className="grid md:grid-cols-[1fr_300px] gap-8 items-center">
            <div className="space-y-6">
               <p className="text-xl text-muted-foreground leading-relaxed">
                The platform follows a "pay-it-forward" model. Every review, every RSVP, and every message between founders strengthens the metadata of the entire ecosystem.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <li className="p-4 rounded-xl bg-surface border-2 border-outline/20">
                  <div className="font-bold text-primary text-sm uppercase mb-1">Peer Validation</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">Founders rate service providers (lawyers, accountants) so the bad actors are filtered out by the community.</div>
                </li>
                <li className="p-4 rounded-xl bg-surface border-2 border-outline/20">
                  <div className="font-bold text-primary text-sm uppercase mb-1">Human Signal</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">Our AI weights "founder-attended" events higher, creating a heat-map of where the real value is happening.</div>
                </li>
              </ul>
            </div>
            <div className="aspect-square rounded-full border-4 border-dashed border-outline/30 flex items-center justify-center p-8 text-center bg-accent/5">
              <div className="space-y-2">
                <div className="font-black text-4xl text-primary leading-none">LOOP</div>
                <div className="text-[10px] font-bold uppercase tracking-widest">Input → AI → Peer Signal → Improved Output</div>
              </div>
            </div>
          </div>
        </section>

        {/* Slide 4: The "Urban Sports Club" Model */}
        <section className="space-y-6">
          <header>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground border-2 border-outline text-[11px] font-bold uppercase tracking-widest shadow-brutal-sm">
              04 / The Business Model
            </span>
            <h2 className="font-display text-5xl md:text-6xl font-bold mt-6 leading-[0.95] tracking-tighter text-balance">
              The Ecosystem <span className="bg-accent text-accent-foreground px-2">Membership</span>.
            </h2>
          </header>
          <div className="relative p-8 rounded-3xl bg-primary text-primary-foreground border-2 border-outline shadow-brutal overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <span className="material-symbols-rounded" style={{ fontSize: 160 }}>cycle</span>
            </div>
            <div className="relative z-10 space-y-6">
              <p className="text-2xl font-medium leading-snug max-w-xl">
                One membership. Access to mentors, coworking, legal services, and community in one structured place.
              </p>
              <div className="grid sm:grid-cols-3 gap-6 pt-4">
                <div className="space-y-2">
                   <div className="size-10 rounded-lg bg-accent border-2 border-outline grid place-items-center text-accent-foreground">
                    <span className="material-symbols-rounded">groups</span>
                   </div>
                   <div className="font-bold">Ecosystem Access</div>
                   <div className="text-xs opacity-80">Discounted coworking & expert credits across the whole city.</div>
                </div>
                <div className="space-y-2">
                   <div className="size-10 rounded-lg bg-accent border-2 border-outline grid place-items-center text-accent-foreground">
                    <span className="material-symbols-rounded">verified</span>
                   </div>
                   <div className="font-bold">Trusted Network</div>
                   <div className="text-xs opacity-80">Verified founder identities only. No cold sales, just peer-to-peer.</div>
                </div>
                <div className="space-y-2">
                   <div className="size-10 rounded-lg bg-accent border-2 border-outline grid place-items-center text-accent-foreground">
                    <span className="material-symbols-rounded">dashboard</span>
                   </div>
                   <div className="font-bold">Founder Hub</div>
                   <div className="text-xs opacity-80">A personalized dashboard for RSVPs, matches, and direct messaging.</div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl border-l-4 border-primary bg-surface-container font-medium text-sm">
            Talking Point: "We solve the monetization problem by becoming the B2B SaaS for the city. Companies pay to be 'on the map', but founders control the ranking through peer-reviews."
          </div>
        </section>

        {/* Slide 5: Real-time Data */}
        <section className="space-y-8">
          <header className="text-center">
             <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tighter">Live & Structured</h2>
             <p className="text-muted-foreground mt-2">The system is already running with real-world data.</p>
          </header>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label="Locations" value="153" color="bg-surface-container" />
            <StatBox label="Live Events" value="56" color="bg-accent" />
            <StatBox label="Open Calls" value="25" color="bg-surface-container" />
            <StatBox label="Match Time" value="<10s" color="bg-primary text-primary-foreground" />
          </div>
        </section>

        {/* Slide 6: The Impact */}
        <section className="text-center space-y-10 py-10">
          <h2 className="font-display text-5xl md:text-8xl font-bold tracking-tighter leading-tight">
            The next founder arrives with a <span className="bg-accent text-accent-foreground px-3 inline-block rotate-1">shortcut.</span>
          </h2>
          <div className="space-y-6 max-w-xl mx-auto">
            <p className="text-xl text-muted-foreground">
              Success for us is when the 1,000th founder arriving in Berlin has a meaningfully better starting point than the 1st.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/match" className="h-16 px-10 rounded-full bg-primary text-primary-foreground font-bold text-xl border-2 border-outline shadow-brutal hover:translate-y-[-4px] hover:shadow-brutal-lg transition-all flex items-center gap-3">
                <span className="material-symbols-rounded">auto_awesome</span>
                Start the Demo
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t-2 border-outline py-10 bg-surface-container/30">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Berlin Compass Collective — Hackathon Track: Informal Networks & Hidden Infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-6 rounded-2xl border-2 border-outline bg-surface-container shadow-brutal-sm">
      <span className="material-symbols-rounded text-primary" style={{ fontSize: 32 }}>{icon}</span>
      <h3 className="font-display font-bold text-xl mt-3">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{desc}</p>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`p-6 rounded-2xl border-2 border-outline ${color} shadow-brutal-sm text-center`}>
      <div className="text-3xl md:text-4xl font-display font-black leading-none">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">{label}</div>
    </div>
  );
}
