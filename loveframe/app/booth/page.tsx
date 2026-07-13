import Link from "next/link";
import Photobooth from "@/components/Photobooth";

export default function BoothPage() {
  return (
    <main className="min-h-screen bg-night-sky">
      <header className="max-w-6xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-paper">
          LoveFrame
        </Link>
        <div className="signal-line w-24 text-teal hidden sm:block" />
        <span className="font-mono text-xs text-white/40">the booth</span>
      </header>
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <Photobooth />
      </div>
    </main>
  );
}
