"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { Link } from "@heroui/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiChat02Icon,
  AiVoiceIcon,
  BluetoothIcon,
  Camera01Icon,
  ChampionIcon,
  ChartLineData02Icon,
  FireIcon,
  Medal01Icon,
  Mic01Icon,
  Restaurant01Icon,
  StarsIcon,
  Target01Icon,
  Upload02Icon,
} from "@hugeicons/core-free-icons";

/* ── Scroll-reveal ── */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);

  useEffect(() => {
    const el = ref.current;

    if (!el) return;
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setV(true);
          ob.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    ob.observe(el);

    return () => ob.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${v ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Count-up ── */
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const ran = useRef(false);

  useEffect(() => {
    const el = ref.current;

    if (!el) return;
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !ran.current) {
          ran.current = true;
          const dur = 1200;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - t0) / dur, 1);

            setVal(Math.round((1 - Math.pow(1 - p, 3)) * end));
            if (p < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );

    ob.observe(el);

    return () => ob.disconnect();
  }, [end]);

  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ── Clay button ── */
function ClayButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base =
    "relative block rounded-[20px] px-8 py-4 font-display text-lg font-bold text-center transition-all duration-200 active:scale-[0.97] active:translate-y-0.5";
  const styles =
    variant === "primary"
      ? `${base} bg-[#F5A623] text-white border-[3px] border-[#D98E1B] shadow-[0_6px_0_#C17D15,0_8px_20px_rgba(245,166,35,0.3)] hover:shadow-[0_4px_0_#C17D15,0_6px_16px_rgba(245,166,35,0.35)] hover:translate-y-[2px]`
      : `${base} bg-white text-[#2D2A26] border-[3px] border-[#E8E4DF] shadow-[0_6px_0_#D4CFC8,0_8px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_0_#D4CFC8,0_6px_16px_rgba(0,0,0,0.08)] hover:translate-y-[2px]`;

  return (
    <Link className={styles} href={href}>
      {children}
    </Link>
  );
}

/* ── Clay card ── */
function ClayCard({
  children,
  className = "",
  color = "#FFFFFF",
  borderColor = "#E8E4DF",
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  borderColor?: string;
}) {
  return (
    <div
      className={`rounded-[24px] border-[3px] p-6 transition-all duration-300 hover:-translate-y-1 ${className}`}
      style={{
        background: color,
        borderColor,
        boxShadow: `0 8px 0 ${borderColor}, 0 12px 30px rgba(0,0,0,0.06), inset 0 -2px 6px rgba(0,0,0,0.03)`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Clay icon container ── */
function ClayIcon({
  icon,
  bg,
  border,
  color,
  size = 26,
}: {
  icon: typeof AiChat02Icon;
  bg: string;
  border: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-[16px] border-[3px]"
      style={{
        borderColor: border,
        background: bg,
        boxShadow: `0 3px 0 ${border}`,
      }}
    >
      <HugeiconsIcon color={color} icon={icon} size={size} strokeWidth={2} />
    </div>
  );
}

/* ── Page ── */
export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const blob1 = useRef<HTMLDivElement>(null);
  const blob2 = useRef<HTMLDivElement>(null);
  const blob3 = useRef<HTMLDivElement>(null);

  const handleHeroMouse = useCallback((e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();

    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    if (blob1.current)
      blob1.current.style.transform = `translate(${x * -30}px, ${y * -20}px)`;
    if (blob2.current)
      blob2.current.style.transform = `translate(${x * 20}px, ${y * 25}px)`;
    if (blob3.current)
      blob3.current.style.transform = `translate(${x * -15}px, ${y * 15}px)`;
  }, []);

  return (
    <div className="flex flex-col" style={{ background: "#FFF8F0" }}>
      {/* ═══════════════ HERO ═══════════════ */}
      <section
        ref={heroRef}
        className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-6 py-20"
        style={{ background: "#FFF8F0" }}
        onMouseMove={handleHeroMouse}
      >
        <div
          ref={blob1}
          className="pointer-events-none absolute -left-20 top-10 h-[340px] w-[340px] rounded-full opacity-60 transition-transform duration-[600ms] ease-out"
          style={{ background: "#FFE0B2" }}
        />
        <div
          ref={blob2}
          className="pointer-events-none absolute -right-16 bottom-20 h-[280px] w-[280px] rounded-full opacity-50 transition-transform duration-[600ms] ease-out"
          style={{ background: "#FFCCBC" }}
        />
        <div
          ref={blob3}
          className="pointer-events-none absolute bottom-[40%] left-[55%] h-[200px] w-[200px] rounded-full opacity-40 transition-transform duration-[600ms] ease-out"
          style={{ background: "#C8E6C9" }}
        />
        <div className="pointer-events-none absolute left-[8%] top-[12%] h-8 w-8 rotate-12 rounded-lg border-[3px] border-[#F5A623]/20" />
        <div className="pointer-events-none absolute bottom-[15%] right-[12%] h-6 w-6 rounded-full border-[3px] border-[#E91E63]/15" />
        <div className="pointer-events-none absolute right-[25%] top-[18%] h-5 w-5 rotate-45 border-[3px] border-[#4CAF50]/15" />

        <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-md flex-col items-center text-center lg:items-start lg:text-left">
            <div
              className="mb-6 flex items-center gap-3 rounded-full border-[3px] border-[#F5A623]/30 px-5 py-2.5"
              style={{
                background: "#FFF3E0",
                boxShadow: "0 4px 0 rgba(245,166,35,0.12)",
              }}
            >
              <svg
                className="h-7 w-7 text-[#F5A623]"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <circle
                  cx="9"
                  cy="9.5"
                  fill="currentColor"
                  r="1.5"
                  stroke="none"
                />
                <circle
                  cx="15"
                  cy="9.5"
                  fill="currentColor"
                  r="1.5"
                  stroke="none"
                />
              </svg>
              <span className="font-display text-lg font-bold text-[#2D2A26]">
                SugarCoach
              </span>
            </div>
            <h1 className="mb-4 font-display text-[3.2rem] font-extrabold leading-[1.05] tracking-tight text-[#2D2A26] sm:text-[4rem]">
              Diabetes
              <br />
              management
              <br />
              <span className="text-[#F5A623]">made fun.</span>
            </h1>
            <p className="mb-10 max-w-sm text-lg leading-relaxed text-[#78716C]">
              Talk, snap a photo, or speak — your AI buddy logs everything. Sync
              your glucose meter, earn XP, and actually enjoy tracking.
            </p>
            <div className="flex w-full max-w-xs flex-col gap-3 sm:max-w-sm">
              <ClayButton href="/register">Get Started Free</ClayButton>
              <ClayButton href="/login" variant="secondary">
                Sign In
              </ClayButton>
            </div>
          </div>

          {/* Floating preview cards */}
          <div className="relative hidden h-[460px] w-[400px] lg:block">
            <div
              className="animate-float absolute left-0 top-0 rounded-[20px] border-[3px] border-[#A5D6A7] px-5 py-4"
              style={{
                background: "#F1F8E9",
                boxShadow:
                  "0 6px 0 #C8E6C9, 0 10px 24px rgba(76,175,80,0.1), inset 0 -2px 4px rgba(0,0,0,0.02)",
              }}
            >
              <div className="mb-1 text-xs font-bold text-[#558B2F]">
                Blood Sugar
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-extrabold text-[#2E7D32]">
                  112
                </span>
                <span className="text-sm font-bold text-[#81C784]">mg/dL</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-xs font-bold text-[#43A047]">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  viewBox="0 0 24 24"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                In range
              </div>
            </div>

            <div
              className="animate-float-slow absolute right-0 top-10 rounded-[20px] border-[3px] border-[#CE93D8] px-5 py-4"
              style={{
                background: "#F3E5F5",
                boxShadow:
                  "0 6px 0 #E1BEE7, 0 10px 24px rgba(156,39,176,0.08), inset 0 -2px 4px rgba(0,0,0,0.02)",
                animationDelay: "0.5s",
              }}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#BA68C8] bg-[#E1BEE7]">
                  <HugeiconsIcon
                    className="text-[#7B1FA2]"
                    color="currentColor"
                    icon={AiChat02Icon}
                    size={13}
                    strokeWidth={2.2}
                  />
                </div>
                <span className="text-xs font-bold text-[#4A148C]">
                  AI Coach
                </span>
              </div>
              <p className="max-w-[170px] text-[13px] font-medium leading-snug text-[#7B1FA2]">
                &ldquo;You had 45g carbs — I&apos;d suggest{" "}
                <span className="font-bold text-[#2E7D32]">3 units</span> based
                on your ratio.&rdquo;
              </p>
            </div>

            <div
              className="animate-float absolute bottom-20 left-4 rounded-[20px] border-[3px] border-[#90CAF9] px-5 py-4"
              style={{
                background: "#E3F2FD",
                boxShadow:
                  "0 6px 0 #BBDEFB, 0 10px 24px rgba(33,150,243,0.08), inset 0 -2px 4px rgba(0,0,0,0.02)",
                animationDelay: "1s",
              }}
            >
              <div className="mb-2 text-xs font-bold text-[#1565C0]">
                7-Day Trend
              </div>
              <div className="flex items-end gap-[5px]">
                {[38, 60, 48, 68, 55, 75, 62].map((h, i) => (
                  <div
                    key={i}
                    className="w-[14px] rounded-t-[6px] border-2 border-[#42A5F5]"
                    style={{ height: `${h}px`, background: "#90CAF9" }}
                  />
                ))}
              </div>
            </div>

            <div
              className="animate-float-slow absolute bottom-2 right-6 rounded-[20px] border-[3px] border-[#FFCC80] px-5 py-4"
              style={{
                background: "#FFF8E1",
                boxShadow:
                  "0 6px 0 #FFE0B2, 0 10px 24px rgba(255,152,0,0.08), inset 0 -2px 4px rgba(0,0,0,0.02)",
                animationDelay: "1.5s",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border-2 border-[#FFB74D] bg-[#FFE0B2]">
                  <HugeiconsIcon
                    className="text-[#E65100]"
                    color="currentColor"
                    icon={ChampionIcon}
                    size={20}
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#E65100]">
                    7-Day Streak!
                  </div>
                  <div className="text-[11px] font-bold text-[#FF9800]">
                    +50 XP earned
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ HERO FEATURE: MULTIMODAL INPUT ═══════════════ */}
      <section className="px-6 py-24" style={{ background: "#FFFFFF" }}>
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="mb-14 text-center">
              <div
                className="mx-auto mb-4 inline-block rounded-full border-[3px] border-[#CE93D8] px-4 py-1.5 font-display text-sm font-bold text-[#7B1FA2]"
                style={{ background: "#F3E5F5", boxShadow: "0 3px 0 #E1BEE7" }}
              >
                No other diabetes app does this
              </div>
              <h2 className="mb-3 font-display text-3xl font-extrabold text-[#2D2A26] sm:text-4xl">
                Three ways to log. Zero friction.
              </h2>
              <p className="mx-auto max-w-lg text-[15px] leading-relaxed text-[#78716C]">
                Type &ldquo;I had pizza for lunch&rdquo;, snap a photo of your
                plate, or just say it out loud. Our AI understands all of it and
                creates structured entries — meals, insulin, blood sugar —
                automatically.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-3">
            <Reveal delay={0}>
              <ClayCard borderColor="#CE93D8" color="#F3E5F5">
                <div className="flex flex-col items-center gap-4 text-center">
                  <ClayIcon
                    bg="#FFFFFF"
                    border="#CE93D8"
                    color="#7B1FA2"
                    icon={AiChat02Icon}
                  />
                  <h3 className="font-display text-xl font-bold text-[#2D2A26]">
                    Chat
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#78716C]">
                    &ldquo;Had 2 eggs and toast for breakfast, sugar was 130
                    before eating&rdquo; — one message logs a meal <em>and</em>{" "}
                    a reading.
                  </p>
                </div>
              </ClayCard>
            </Reveal>
            <Reveal delay={100}>
              <ClayCard borderColor="#90CAF9" color="#E3F2FD">
                <div className="flex flex-col items-center gap-4 text-center">
                  <ClayIcon
                    bg="#FFFFFF"
                    border="#90CAF9"
                    color="#1565C0"
                    icon={Camera01Icon}
                  />
                  <h3 className="font-display text-xl font-bold text-[#2D2A26]">
                    Snap
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#78716C]">
                    Take a photo of your food. AI identifies every item,
                    estimates carbs, protein, fat, and calculates the insulin
                    dose for you.
                  </p>
                </div>
              </ClayCard>
            </Reveal>
            <Reveal delay={200}>
              <ClayCard borderColor="#A5D6A7" color="#F1F8E9">
                <div className="flex flex-col items-center gap-4 text-center">
                  <ClayIcon
                    bg="#FFFFFF"
                    border="#A5D6A7"
                    color="#2E7D32"
                    icon={Mic01Icon}
                  />
                  <h3 className="font-display text-xl font-bold text-[#2D2A26]">
                    Speak
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#78716C]">
                    Hands full? Just talk. Voice gets transcribed and parsed
                    into entries just like chat — perfect when you&apos;re
                    eating.
                  </p>
                </div>
              </ClayCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURE GRID: WHAT SETS US APART ═══════════════ */}
      <section className="px-6 py-24" style={{ background: "#FFF8F0" }}>
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <h2 className="mb-3 text-center font-display text-3xl font-extrabold text-[#2D2A26] sm:text-4xl">
              Built for how you actually live
            </h2>
            <p className="mx-auto mb-14 max-w-lg text-center text-[15px] text-[#A8A29E]">
              Not another form-filling app. SugarCoach connects to your devices,
              knows your insulin ratio, and keeps you motivated.
            </p>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2">
            <Reveal delay={0}>
              <ClayCard
                borderColor="#90CAF9"
                className="h-full"
                color="#E3F2FD"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <ClayIcon
                      bg="#FFFFFF"
                      border="#90CAF9"
                      color="#1565C0"
                      icon={BluetoothIcon}
                    />
                    <div className="flex gap-2">
                      <ClayIcon
                        bg="#FFFFFF"
                        border="#90CAF9"
                        color="#1565C0"
                        icon={Upload02Icon}
                        size={22}
                      />
                    </div>
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#2D2A26]">
                    Auto-sync your glucose meter
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#78716C]">
                    Pair your <strong>Accu-Chek</strong> via Bluetooth and
                    readings sync automatically when you open the app. Or import
                    history from <strong>FreeStyle Libre</strong>,{" "}
                    <strong>Dexcom</strong>, and <strong>MySugr</strong> — CSV
                    or Excel, we parse it all.
                  </p>
                </div>
              </ClayCard>
            </Reveal>

            <Reveal delay={100}>
              <ClayCard
                borderColor="#FFCC80"
                className="h-full"
                color="#FFF8E1"
              >
                <div className="flex flex-col gap-4">
                  <ClayIcon
                    bg="#FFFFFF"
                    border="#FFCC80"
                    color="#E65100"
                    icon={Restaurant01Icon}
                  />
                  <h3 className="font-display text-xl font-bold text-[#2D2A26]">
                    AI diet plans that fit your ratio
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#78716C]">
                    Tell us your insulin-to-carb ratio, dietary preferences, and
                    foods you love or hate. AI generates a{" "}
                    <strong>personalized 7-day meal plan</strong> with exact
                    carb counts and insulin suggestions for every meal.
                  </p>
                </div>
              </ClayCard>
            </Reveal>

            <Reveal delay={200}>
              <ClayCard
                borderColor="#CE93D8"
                className="h-full"
                color="#F3E5F5"
              >
                <div className="flex flex-col gap-4">
                  <ClayIcon
                    bg="#FFFFFF"
                    border="#CE93D8"
                    color="#7B1FA2"
                    icon={ChartLineData02Icon}
                  />
                  <h3 className="font-display text-xl font-bold text-[#2D2A26]">
                    Trends, A1C estimation &amp; insights
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#78716C]">
                    See your <strong>time-in-range</strong>, 7/30/90 day trends,
                    and an <strong>AI-estimated A1C</strong> from your readings
                    — no lab visit needed. Spot patterns like post-meal spikes
                    and dawn phenomenon before your next appointment.
                  </p>
                </div>
              </ClayCard>
            </Reveal>

            <Reveal delay={300}>
              <ClayCard
                borderColor="#A5D6A7"
                className="h-full"
                color="#F1F8E9"
              >
                <div className="flex flex-col gap-4">
                  <ClayIcon
                    bg="#FFFFFF"
                    border="#A5D6A7"
                    color="#2E7D32"
                    icon={Target01Icon}
                  />
                  <h3 className="font-display text-xl font-bold text-[#2D2A26]">
                    Knows your insulin math
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#78716C]">
                    Set your <strong>insulin-to-carb ratio</strong> and{" "}
                    <strong>correction factor</strong> once. Every time you log
                    a meal, the app calculates exactly how many units you need —
                    whether you&apos;re on a pen or syringe.
                  </p>
                </div>
              </ClayCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ GAMIFICATION SPOTLIGHT ═══════════════ */}
      <section className="px-6 py-24" style={{ background: "#FFFFFF" }}>
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
              {/* Left: explanation */}
              <div className="flex-1">
                <div
                  className="mb-4 inline-block rounded-full border-[3px] border-[#FFCC80] px-4 py-1.5 font-display text-sm font-bold text-[#E65100]"
                  style={{
                    background: "#FFF8E1",
                    boxShadow: "0 3px 0 #FFE0B2",
                  }}
                >
                  Why kids actually use it
                </div>
                <h2 className="mb-4 font-display text-3xl font-extrabold text-[#2D2A26] sm:text-4xl">
                  Diabetes management
                  <br />
                  that feels like a game.
                </h2>
                <p className="mb-6 text-[15px] leading-relaxed text-[#78716C]">
                  Every blood sugar reading earns XP. Every meal logged extends
                  your streak. Hit milestones and unlock achievements like{" "}
                  <strong>Week Warrior</strong>, <strong>Century Streak</strong>
                  , and <strong>Photo Logger</strong>. Level up through the
                  ranks and watch your progress grow — because managing diabetes
                  shouldn&apos;t feel like a chore.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      icon: FireIcon,
                      label: "Daily Streaks",
                      color: "#EF4444",
                      glow: "rgba(239,68,68,0.2)",
                    },
                    {
                      icon: StarsIcon,
                      label: "XP & Levels",
                      color: "#F59E0B",
                      glow: "rgba(245,158,11,0.2)",
                    },
                    {
                      icon: Medal01Icon,
                      label: "20+ Achievements",
                      color: "#8B5CF6",
                      glow: "rgba(139,92,246,0.2)",
                    },
                    {
                      icon: Camera01Icon,
                      label: "Photo Logger",
                      color: "#0EA5E9",
                      glow: "rgba(14,165,233,0.2)",
                    },
                  ].map((tag) => (
                    <span
                      key={tag.label}
                      className="flex items-center gap-1.5 rounded-full border-[2px] border-[#FFE0B2] px-3 py-1.5 text-[13px] font-bold text-[#E65100]"
                      style={{ background: "#FFF8E1" }}
                    >
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full"
                        style={{
                          background: tag.glow,
                          boxShadow: `0 0 8px ${tag.glow}`,
                        }}
                      >
                        <HugeiconsIcon
                          color={tag.color}
                          icon={tag.icon}
                          size={12}
                          strokeWidth={2.2}
                        />
                      </span>
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: visual stack */}
              <div className="flex w-full max-w-[260px] flex-col gap-4">
                <ClayCard borderColor="#FFCC80" color="#FFF8E1">
                  <div className="flex items-center gap-3">
                    <ClayIcon
                      bg="#FFFFFF"
                      border="#FFCC80"
                      color="#E65100"
                      icon={ChampionIcon}
                    />
                    <div>
                      <div className="text-sm font-bold text-[#E65100]">
                        Week Warrior
                      </div>
                      <div className="text-[12px] text-[#A8A29E]">
                        7-day streak unlocked
                      </div>
                    </div>
                  </div>
                </ClayCard>
                <ClayCard borderColor="#A5D6A7" color="#F1F8E9">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-[#2E7D32]">
                        Level 12
                      </div>
                      <div className="text-[12px] text-[#A8A29E]">
                        2,450 / 3,000 XP
                      </div>
                    </div>
                    <div className="h-3 w-24 overflow-hidden rounded-full border-2 border-[#A5D6A7] bg-white">
                      <div className="h-full w-[82%] rounded-full bg-[#66BB6A]" />
                    </div>
                  </div>
                </ClayCard>
                <ClayCard borderColor="#CE93D8" color="#F3E5F5">
                  <div className="flex items-center gap-3">
                    <ClayIcon
                      bg="#FFFFFF"
                      border="#CE93D8"
                      color="#7B1FA2"
                      icon={AiVoiceIcon}
                      size={22}
                    />
                    <div>
                      <div className="text-sm font-bold text-[#7B1FA2]">
                        Photo Logger
                      </div>
                      <div className="text-[12px] text-[#A8A29E]">
                        Analyzed 50 meals
                      </div>
                    </div>
                  </div>
                </ClayCard>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ STATS ═══════════════ */}
      <section className="px-6 py-20" style={{ background: "#FFF8F0" }}>
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              {[
                {
                  value: 500,
                  suffix: "+",
                  label: "Active users",
                  border: "#CE93D8",
                  bg: "#F3E5F5",
                },
                {
                  value: 50000,
                  suffix: "+",
                  label: "Readings logged",
                  border: "#90CAF9",
                  bg: "#E3F2FD",
                },
                {
                  value: 98,
                  suffix: "%",
                  label: "In-range accuracy",
                  border: "#A5D6A7",
                  bg: "#F1F8E9",
                },
                {
                  value: 4.9,
                  suffix: "/5",
                  label: "User rating",
                  border: "#FFCC80",
                  bg: "#FFF8E1",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-[20px] border-[3px] p-5 text-center"
                  style={{
                    borderColor: s.border,
                    background: s.bg,
                    boxShadow: `0 5px 0 ${s.border}, inset 0 -2px 4px rgba(0,0,0,0.02)`,
                  }}
                >
                  <div className="font-display text-3xl font-extrabold text-[#2D2A26]">
                    <Counter end={s.value} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-[12px] font-bold text-[#A8A29E]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ BOTTOM CTA ═══════════════ */}
      <section className="px-6 py-24" style={{ background: "#FFFFFF" }}>
        <Reveal>
          <div
            className="mx-auto max-w-2xl rounded-[28px] border-[3px] border-[#FFCC80] p-10 text-center sm:p-14"
            style={{
              background: "linear-gradient(135deg, #FFF8E1, #FFECB3)",
              boxShadow:
                "0 8px 0 #FFE0B2, 0 14px 40px rgba(255,152,0,0.1), inset 0 -2px 6px rgba(0,0,0,0.02)",
            }}
          >
            <h2 className="mb-3 font-display text-3xl font-extrabold text-[#2D2A26] sm:text-4xl">
              Ready to take control?
            </h2>
            <p className="mx-auto mb-10 max-w-md text-lg text-[#78716C]">
              Free to start. No credit card. Works with your existing glucose
              meter and CGM.
            </p>
            <ClayButton href="/register">Get Started Free</ClayButton>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer
        className="px-6 py-10 text-center"
        style={{ background: "#FFF8F0", borderTop: "3px solid #F0EDE8" }}
      >
        <div className="mb-2 flex items-center justify-center gap-2">
          <svg
            className="h-5 w-5 text-[#F5A623]"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <circle cx="9" cy="9.5" fill="currentColor" r="1.5" stroke="none" />
            <circle
              cx="15"
              cy="9.5"
              fill="currentColor"
              r="1.5"
              stroke="none"
            />
          </svg>
          <span className="font-display text-sm font-bold text-[#A8A29E]">
            SugarCoach &copy; {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex justify-center gap-5">
          <Link
            className="text-xs font-semibold text-[#A8A29E] transition-colors duration-200 hover:text-[#F5A623]"
            href="#"
          >
            Privacy
          </Link>
          <Link
            className="text-xs font-semibold text-[#A8A29E] transition-colors duration-200 hover:text-[#F5A623]"
            href="#"
          >
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
