import { Link } from "@heroui/link";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* ===== HERO (full viewport) ===== */}
      <section
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #F5A623 0%, #F06418 60%, #E8520D 100%)",
        }}
      >
        {/* Dot pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Ambient floating shapes */}
        <div className="pointer-events-none absolute -left-[60px] -top-[40px] h-[200px] w-[200px] rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute -right-[30px] bottom-[60px] h-[140px] w-[140px] rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute right-[15%] top-[30%] h-[100px] w-[100px] rotate-[30deg] rounded-3xl bg-white/[0.06]" />
        <div className="pointer-events-none absolute bottom-[20%] left-[10%] h-[80px] w-[80px] rounded-full bg-white/[0.06]" />

        {/* Floating card */}
        <div className="animate-float relative z-10 w-[340px] max-w-[90vw] rounded-3xl bg-white p-12 text-center shadow-[0_24px_80px_rgba(0,0,0,0.15),0_4px_20px_rgba(0,0,0,0.08)] max-[480px]:w-[300px] max-[480px]:p-10">
          <span className="mb-3 block text-[52px]">🍬</span>
          <h1 className="mb-1 font-display text-[30px] font-bold tracking-tight text-foreground">
            SugarCoach
          </h1>
          <p className="mb-8 text-[15px] text-default-400">
            Your AI Diabetes Buddy
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              className="block rounded-xl bg-primary px-6 py-3.5 font-display text-base font-bold text-white shadow-[0_4px_16px_rgba(245,166,35,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(245,166,35,0.45)]"
              href="/register"
            >
              Get Started
            </Link>
            <Link
              className="block rounded-xl bg-default-100 px-6 py-3.5 font-display text-base font-semibold text-foreground transition-colors hover:bg-default-200"
              href="/login"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FEATURE STRIP ===== */}
      <section className="border-t border-default-200 bg-white px-6 py-12">
        <div className="mx-auto flex max-w-[640px] justify-center gap-12 max-[480px]:gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-purple-500/10 text-[22px]">
              💬
            </div>
            <span className="font-display text-sm font-semibold text-foreground">
              AI Chat
            </span>
            <span className="max-w-[140px] text-xs text-default-400 max-[480px]:hidden">
              Log meals & insulin with natural language
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-blue-500/10 text-[22px]">
              📊
            </div>
            <span className="font-display text-sm font-semibold text-foreground">
              Track
            </span>
            <span className="max-w-[140px] text-xs text-default-400 max-[480px]:hidden">
              Blood sugar trends & insights at a glance
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-green-500/10 text-[22px]">
              🏆
            </div>
            <span className="font-display text-sm font-semibold text-foreground">
              Gamified
            </span>
            <span className="max-w-[140px] text-xs text-default-400 max-[480px]:hidden">
              Earn XP, streaks & achievements daily
            </span>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-default-200 bg-background px-6 py-6 text-center">
        <p className="text-[13px] text-default-400">
          SugarCoach &copy; {new Date().getFullYear()}
        </p>
        <div className="mt-1.5 flex justify-center gap-4">
          <Link
            className="text-xs text-default-400 transition-colors hover:text-primary"
            href="#"
          >
            Privacy
          </Link>
          <Link
            className="text-xs text-default-400 transition-colors hover:text-primary"
            href="#"
          >
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
