import Link from "next/link";
import { TEMPLATES } from "@/lib/templates";

const STEPS = [
  { n: 1, title: "Pick a frame", body: "Six frames built around one idea: two places, stitched into one." },
  { n: 2, title: "Capture your side", body: "Use your camera with a countdown, or upload a photo you already have." },
  { n: 3, title: "Add their photo", body: "Drop in the photo they sent you — no account, no server, it never leaves your browser." },
  { n: 4, title: "Download your frame", body: "Names, cities, a message, a filter. Export a keepsake PNG in seconds." },
];

export default function Home() {
  return (
    <main className="bg-night-sky min-h-screen">
      {/* nav */}
      <header className="max-w-6xl mx-auto px-6 pt-8 flex items-center justify-between">
        <span className="font-display text-xl text-paper">LoveFrame</span>
        <Link
          href="/booth"
          className="focus-ring rounded-full bg-gold text-ink text-sm font-semibold px-5 py-2 hover:brightness-105 transition"
        >
          Open the booth
        </Link>
      </header>

      {/* hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <p className="font-mono text-xs tracking-widest text-teal uppercase mb-4">
            a photobooth for two cities
          </p>
          <h1 className="font-display text-5xl sm:text-6xl leading-[1.05] text-paper">
            One frame,
            <br />
            <span className="italic text-gold">stitched</span> across
            <br />
            the distance.
          </h1>
          <p className="text-white/60 mt-6 max-w-md leading-relaxed">
            Take your photo. Add the one they sent you. LoveFrame lays them into a
            single keepsake — a shared photobooth strip for a couple who can&rsquo;t
            stand in front of the same camera.
          </p>
          <div className="flex items-center gap-4 mt-8">
            <Link
              href="/booth"
              className="focus-ring rounded-full bg-gold text-ink font-semibold px-7 py-3 hover:brightness-105 active:scale-[0.98] transition"
            >
              Start your frame
            </Link>
            <span className="text-white/40 text-sm">no sign up · runs in your browser</span>
          </div>
        </div>

        {/* signature visual: two windows joined by a pulsing signal line */}
        <div className="flex items-center justify-center gap-0">
          <div className="w-40 h-52 sm:w-48 sm:h-64 rounded-2xl bg-dusk ring-1 ring-white/10 shadow-2xl shadow-black/40 animate-drift flex items-end p-4">
            <span className="font-mono text-[10px] text-white/40">YOUR CITY</span>
          </div>
          <div className="w-16 sm:w-24 flex flex-col items-center gap-2 px-1">
            <div className="signal-line w-full text-teal animate-pulseLine" />
            <span className="text-teal text-lg">✦</span>
          </div>
          <div
            className="w-40 h-52 sm:w-48 sm:h-64 rounded-2xl bg-dusk2 ring-1 ring-white/10 shadow-2xl shadow-black/40 animate-drift flex items-end p-4"
            style={{ animationDelay: "1.2s" }}
          >
            <span className="font-mono text-[10px] text-white/40">THEIR CITY</span>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-white/10">
        <h2 className="font-display text-3xl text-paper mb-12">How a frame comes together</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-xs text-ink bg-gold rounded-full w-7 h-7 flex items-center justify-center">
                  {s.n}
                </span>
                {i < STEPS.length - 1 && (
                  <div className="signal-line flex-1 text-white/20 hidden lg:block" />
                )}
              </div>
              <h3 className="font-display text-lg text-paper mb-1">{s.title}</h3>
              <p className="text-sm text-white/55 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* templates */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-white/10">
        <h2 className="font-display text-3xl text-paper mb-2">Six frames, one idea</h2>
        <p className="text-white/55 mb-12 max-w-lg">
          Every frame carries the same signature: a line connecting two photos that
          were never taken in the same room.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="rounded-2xl overflow-hidden ring-1 ring-white/10">
              <div className="h-40" style={{ background: t.swatch }} />
              <div className="p-5 bg-white/5">
                <h3 className="font-display text-lg text-paper">{t.name}</h3>
                <p className="text-sm text-white/55 mt-1">{t.tagline}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* closing cta */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-white/10 text-center">
        <h2 className="font-display text-4xl text-paper mb-4">
          Same sky. Different city.
          <br />
          <span className="italic text-gold">One frame.</span>
        </h2>
        <Link
          href="/booth"
          className="focus-ring inline-block mt-6 rounded-full bg-gold text-ink font-semibold px-8 py-3 hover:brightness-105 active:scale-[0.98] transition"
        >
          Open the booth
        </Link>
      </section>

      <footer className="max-w-6xl mx-auto px-6 pb-10 text-center text-white/30 text-xs font-mono">
        LoveFrame · everything renders in your browser, nothing is uploaded
      </footer>
    </main>
  );
}
