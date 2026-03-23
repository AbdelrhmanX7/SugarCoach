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

import SplashCursor from "@/components/ui/splash-cursor";

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
      {/* Fluid mouse trail */}
      <SplashCursor
        BACK_COLOR={{ r: 0, g: 0, b: 0 }}
        COLOR_UPDATE_SPEED={6}
        CURL={2}
        DENSITY_DISSIPATION={4}
        DYE_RESOLUTION={1024}
        PRESSURE={0.15}
        SPLAT_FORCE={4000}
        SPLAT_RADIUS={0.15}
        TRANSPARENT={true}
        VELOCITY_DISSIPATION={3}
      />

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

      {/* ═══════════════ FEATURE 1: MULTIMODAL INPUT ═══════════════ */}
      <section className="px-6 py-28" style={{ background: "#FFFFFF" }}>
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="flex flex-col items-center gap-14 lg:flex-row lg:gap-20">
              {/* Text */}
              <div className="flex-1">
                <div
                  className="mb-4 inline-block rounded-full border-[3px] border-[#CE93D8] px-4 py-1.5 font-display text-sm font-bold text-[#7B1FA2]"
                  style={{
                    background: "#F3E5F5",
                    boxShadow: "0 3px 0 #E1BEE7",
                  }}
                >
                  No other diabetes app does this
                </div>
                <h2 className="mb-4 font-display text-3xl font-extrabold text-[#2D2A26] sm:text-4xl">
                  Three ways to log.
                  <br />
                  Zero friction.
                </h2>
                <p className="mb-6 max-w-md text-[15px] leading-relaxed text-[#78716C]">
                  Type &ldquo;I had pizza for lunch&rdquo;, snap a photo of your
                  plate, or just say it out loud. Our AI understands all of it
                  and creates structured entries — meals, insulin doses, blood
                  sugar readings — automatically. One message can log{" "}
                  <em>multiple</em> things at once.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      icon: AiChat02Icon,
                      label: "Natural Language Chat",
                      color: "#7B1FA2",
                      glow: "rgba(123,31,162,0.15)",
                    },
                    {
                      icon: Camera01Icon,
                      label: "Photo Food Analysis",
                      color: "#1565C0",
                      glow: "rgba(21,101,194,0.15)",
                    },
                    {
                      icon: Mic01Icon,
                      label: "Voice Input",
                      color: "#2E7D32",
                      glow: "rgba(46,125,50,0.15)",
                    },
                  ].map((t) => (
                    <span
                      key={t.label}
                      className="flex items-center gap-1.5 rounded-full border-[2px] border-[#E8E4DF] px-3 py-1.5 text-[13px] font-bold text-[#2D2A26]"
                      style={{ background: "#FAFAFA" }}
                    >
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full"
                        style={{ background: t.glow }}
                      >
                        <HugeiconsIcon
                          color={t.color}
                          icon={t.icon}
                          size={11}
                          strokeWidth={2.2}
                        />
                      </span>
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Visual: chat mockup */}
              <div className="w-full max-w-sm flex-shrink-0">
                <ClayCard
                  borderColor="#CE93D8"
                  className="!p-5"
                  color="#F3E5F5"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#BA68C8] bg-[#E1BEE7]">
                      <HugeiconsIcon
                        color="#7B1FA2"
                        icon={AiChat02Icon}
                        size={14}
                        strokeWidth={2.2}
                      />
                    </div>
                    <span className="font-display text-sm font-bold text-[#4A148C]">
                      AI Coach
                    </span>
                  </div>
                  {/* User message */}
                  <div
                    className="mb-3 ml-auto w-fit rounded-2xl rounded-tr-md border-[2px] border-[#D98E1B] px-4 py-2.5"
                    style={{ background: "#FFF8E1" }}
                  >
                    <p className="text-[13px] font-medium text-[#2D2A26]">
                      Had 2 slices of pizza and a juice box, sugar was 185 after
                    </p>
                  </div>
                  {/* AI response */}
                  <div
                    className="w-fit rounded-2xl rounded-tl-md border-[2px] border-[#BA68C8] px-4 py-2.5"
                    style={{ background: "#FFFFFF" }}
                  >
                    <p className="text-[13px] font-medium text-[#2D2A26]">
                      Got it! I logged:
                    </p>
                    <ul className="mt-1.5 space-y-1 text-[12px] text-[#78716C]">
                      <li className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#F5A623]" />{" "}
                        Meal: 2 pizza slices + juice box (62g carbs)
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />{" "}
                        Blood sugar: 185 mg/dL (after meal)
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />{" "}
                        Suggested dose: 5 units (your 1:12 ratio)
                      </li>
                    </ul>
                  </div>
                </ClayCard>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ FEATURE 2: PHOTO ANALYSIS ═══════════════ */}
      <section className="px-6 py-28" style={{ background: "#FFF8F0" }}>
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="flex flex-col items-center gap-14 lg:flex-row-reverse lg:gap-20">
              {/* Text */}
              <div className="flex-1">
                <ClayIcon
                  bg="#E3F2FD"
                  border="#90CAF9"
                  color="#1565C0"
                  icon={Camera01Icon}
                />
                <h2 className="mb-4 mt-5 font-display text-3xl font-extrabold text-[#2D2A26] sm:text-4xl">
                  Snap your plate.
                  <br />
                  We count the carbs.
                </h2>
                <p className="max-w-md text-[15px] leading-relaxed text-[#78716C]">
                  Take a photo of any meal and our AI identifies every item on
                  your plate —{" "}
                  <strong>
                    carbs, protein, fat, fiber, sugar, and calories
                  </strong>
                  . It even calculates how much insulin you&apos;d need based on
                  your personal carb ratio. Works with home-cooked meals,
                  restaurant plates, packaged snacks — anything.
                </p>
              </div>

              {/* Visual: nutrition breakdown mockup */}
              <div className="w-full max-w-sm flex-shrink-0">
                <ClayCard
                  borderColor="#90CAF9"
                  className="!p-5"
                  color="#E3F2FD"
                >
                  <div className="mb-3 text-xs font-bold text-[#1565C0]">
                    Photo Analysis Result
                  </div>
                  <div className="mb-4 flex h-32 items-center justify-center rounded-xl border-[2px] border-[#90CAF9] bg-white">
                    <div className="text-center">
                      <HugeiconsIcon
                        color="#90CAF9"
                        icon={Camera01Icon}
                        size={32}
                        strokeWidth={1.5}
                      />
                      <div className="mt-1 text-[11px] font-bold text-[#90CAF9]">
                        Grilled chicken + rice
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Carbs", value: "42g", color: "#F5A623" },
                      { label: "Protein", value: "28g", color: "#2E7D32" },
                      { label: "Fat", value: "12g", color: "#E91E63" },
                    ].map((n) => (
                      <div
                        key={n.label}
                        className="rounded-xl border-[2px] border-[#BBDEFB] bg-white p-2.5 text-center"
                      >
                        <div
                          className="font-display text-lg font-extrabold"
                          style={{ color: n.color }}
                        >
                          {n.value}
                        </div>
                        <div className="text-[10px] font-bold text-[#A8A29E]">
                          {n.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl border-[2px] border-[#90CAF9] bg-white px-3 py-2 text-center text-[12px] font-bold text-[#1565C0]">
                    Suggested: <span className="text-[#F5A623]">3.5 units</span>{" "}
                    (1:12 ratio)
                  </div>
                </ClayCard>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ FEATURE 3: DEVICE SYNC ═══════════════ */}
      <section className="px-6 py-28" style={{ background: "#FFFFFF" }}>
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="flex flex-col items-center gap-14 lg:flex-row lg:gap-20">
              {/* Text */}
              <div className="flex-1">
                <ClayIcon
                  bg="#E3F2FD"
                  border="#90CAF9"
                  color="#1565C0"
                  icon={BluetoothIcon}
                />
                <h2 className="mb-4 mt-5 font-display text-3xl font-extrabold text-[#2D2A26] sm:text-4xl">
                  Your meter syncs.
                  <br />
                  You do nothing.
                </h2>
                <p className="mb-6 max-w-md text-[15px] leading-relaxed text-[#78716C]">
                  Pair your <strong>Accu-Chek</strong> glucose meter via
                  Bluetooth once. After that, readings sync automatically every
                  time you open the app — no clicks, no cables, no manual entry.
                </p>
                <p className="max-w-md text-[15px] leading-relaxed text-[#78716C]">
                  Switching from another app? Import your full history from{" "}
                  <strong>FreeStyle Libre</strong>, <strong>Dexcom</strong>, or{" "}
                  <strong>MySugr</strong> — CSV and Excel files. We parse and
                  normalize everything into one unified timeline.
                </p>
              </div>

              {/* Visual: device list */}
              <div className="w-full max-w-xs flex-shrink-0 space-y-3">
                {[
                  {
                    name: "Accu-Chek Guide",
                    status: "Auto-synced",
                    icon: BluetoothIcon,
                    border: "#90CAF9",
                    bg: "#E3F2FD",
                    statusColor: "#2E7D32",
                  },
                  {
                    name: "FreeStyle Libre",
                    status: "CSV import",
                    icon: Upload02Icon,
                    border: "#A5D6A7",
                    bg: "#F1F8E9",
                    statusColor: "#558B2F",
                  },
                  {
                    name: "Dexcom G6",
                    status: "CSV import",
                    icon: Upload02Icon,
                    border: "#CE93D8",
                    bg: "#F3E5F5",
                    statusColor: "#7B1FA2",
                  },
                  {
                    name: "MySugr",
                    status: "CSV / Excel",
                    icon: Upload02Icon,
                    border: "#FFCC80",
                    bg: "#FFF8E1",
                    statusColor: "#E65100",
                  },
                ].map((d) => (
                  <ClayCard
                    key={d.name}
                    borderColor={d.border}
                    className="!p-4"
                    color={d.bg}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-[12px] border-[2px] bg-white"
                          style={{ borderColor: d.border }}
                        >
                          <HugeiconsIcon
                            color={d.statusColor}
                            icon={d.icon}
                            size={18}
                            strokeWidth={2}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#2D2A26]">
                            {d.name}
                          </div>
                          <div
                            className="text-[11px] font-bold"
                            style={{ color: d.statusColor }}
                          >
                            {d.status}
                          </div>
                        </div>
                      </div>
                      <svg
                        className="h-4 w-4 text-[#D4CFC8]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </ClayCard>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ FEATURE 4: AI DIET PLANS ═══════════════ */}
      <section className="px-6 py-28" style={{ background: "#FFF8F0" }}>
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="flex flex-col items-center gap-14 lg:flex-row-reverse lg:gap-20">
              {/* Text */}
              <div className="flex-1">
                <ClayIcon
                  bg="#FFF8E1"
                  border="#FFCC80"
                  color="#E65100"
                  icon={Restaurant01Icon}
                />
                <h2 className="mb-4 mt-5 font-display text-3xl font-extrabold text-[#2D2A26] sm:text-4xl">
                  Meal plans built
                  <br />
                  around <em>your</em> ratio.
                </h2>
                <p className="max-w-md text-[15px] leading-relaxed text-[#78716C]">
                  Tell us your insulin-to-carb ratio, your favorite foods, and
                  any dietary restrictions. AI generates a{" "}
                  <strong>personalized 7-day meal plan</strong> — breakfast,
                  lunch, dinner, and snacks — with exact carb counts per meal
                  and the insulin dose you&apos;d need for each. Save foods you
                  like to your <strong>pantry</strong> and get suggestions based
                  on what you already have.
                </p>
              </div>

              {/* Visual: meal plan mockup */}
              <div className="w-full max-w-sm flex-shrink-0">
                <ClayCard
                  borderColor="#FFCC80"
                  className="!p-5"
                  color="#FFF8E1"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-[#E65100]">
                      Monday Plan
                    </span>
                    <span className="rounded-full border-[2px] border-[#FFCC80] bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#E65100]">
                      1:12 ratio
                    </span>
                  </div>
                  {[
                    {
                      meal: "Breakfast",
                      food: "Oatmeal + banana + almond milk",
                      carbs: "38g",
                      units: "3",
                    },
                    {
                      meal: "Lunch",
                      food: "Grilled chicken wrap + veggies",
                      carbs: "45g",
                      units: "4",
                    },
                    {
                      meal: "Snack",
                      food: "Apple slices + peanut butter",
                      carbs: "22g",
                      units: "2",
                    },
                    {
                      meal: "Dinner",
                      food: "Salmon, sweet potato, broccoli",
                      carbs: "35g",
                      units: "3",
                    },
                  ].map((m) => (
                    <div
                      key={m.meal}
                      className="mb-2 rounded-xl border-[2px] border-[#FFE0B2] bg-white px-3.5 py-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#E65100]">
                          {m.meal}
                        </span>
                        <span className="text-[10px] font-bold text-[#A8A29E]">
                          {m.carbs} · {m.units}u
                        </span>
                      </div>
                      <div className="mt-0.5 text-[12px] text-[#78716C]">
                        {m.food}
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 rounded-xl border-[2px] border-[#FFCC80] bg-[#FFF3E0] px-3 py-2 text-center text-[12px] font-bold text-[#E65100]">
                    Daily total: 140g carbs · 12 units
                  </div>
                </ClayCard>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ FEATURE 5: TRENDS & A1C ═══════════════ */}
      <section className="px-6 py-28" style={{ background: "#FFFFFF" }}>
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="flex flex-col items-center gap-14 lg:flex-row lg:gap-20">
              {/* Text */}
              <div className="flex-1">
                <ClayIcon
                  bg="#F3E5F5"
                  border="#CE93D8"
                  color="#7B1FA2"
                  icon={ChartLineData02Icon}
                />
                <h2 className="mb-4 mt-5 font-display text-3xl font-extrabold text-[#2D2A26] sm:text-4xl">
                  See your patterns.
                  <br />
                  Know your A1C.
                </h2>
                <p className="mb-6 max-w-md text-[15px] leading-relaxed text-[#78716C]">
                  Beautiful charts show your <strong>time-in-range</strong>,
                  7/30/90 day glucose trends, and average readings by time of
                  day. Spot post-meal spikes, dawn phenomenon, and overnight
                  lows before your next endo visit.
                </p>
                <p className="max-w-md text-[15px] leading-relaxed text-[#78716C]">
                  Don&apos;t want to wait for lab results? Our AI estimates your{" "}
                  <strong>A1C from your readings</strong> — updated in real time
                  as you log more data.
                </p>
              </div>

              {/* Visual: chart + A1C mockup */}
              <div className="w-full max-w-sm flex-shrink-0 space-y-3">
                <ClayCard
                  borderColor="#CE93D8"
                  className="!p-5"
                  color="#F3E5F5"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#7B1FA2]">
                      30-Day Trend
                    </span>
                    <span className="rounded-full border-[2px] border-[#CE93D8] bg-white px-2 py-0.5 text-[10px] font-bold text-[#7B1FA2]">
                      ↓ 8% avg
                    </span>
                  </div>
                  <div className="flex items-end gap-[3px]">
                    {[
                      55, 70, 62, 78, 50, 65, 58, 72, 45, 60, 52, 68, 48, 55,
                      50,
                    ].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-[4px] border-[1.5px] border-[#BA68C8]"
                        style={{ height: `${h}px`, background: "#E1BEE7" }}
                      />
                    ))}
                  </div>
                </ClayCard>
                <div className="grid grid-cols-2 gap-3">
                  <ClayCard
                    borderColor="#A5D6A7"
                    className="!p-4 text-center"
                    color="#F1F8E9"
                  >
                    <div className="font-display text-2xl font-extrabold text-[#2E7D32]">
                      78%
                    </div>
                    <div className="text-[10px] font-bold text-[#A8A29E]">
                      Time in Range
                    </div>
                  </ClayCard>
                  <ClayCard
                    borderColor="#FFCC80"
                    className="!p-4 text-center"
                    color="#FFF8E1"
                  >
                    <div className="font-display text-2xl font-extrabold text-[#E65100]">
                      6.8%
                    </div>
                    <div className="text-[10px] font-bold text-[#A8A29E]">
                      Estimated A1C
                    </div>
                  </ClayCard>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ FEATURE 6: INSULIN CALCULATOR ═══════════════ */}
      <section className="px-6 py-28" style={{ background: "#FFF8F0" }}>
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="flex flex-col items-center gap-14 lg:flex-row-reverse lg:gap-20">
              {/* Text */}
              <div className="flex-1">
                <ClayIcon
                  bg="#F1F8E9"
                  border="#A5D6A7"
                  color="#2E7D32"
                  icon={Target01Icon}
                />
                <h2 className="mb-4 mt-5 font-display text-3xl font-extrabold text-[#2D2A26] sm:text-4xl">
                  It knows your
                  <br />
                  insulin math.
                </h2>
                <p className="max-w-md text-[15px] leading-relaxed text-[#78716C]">
                  Set your <strong>insulin-to-carb ratio</strong> and{" "}
                  <strong>correction factor</strong> once in your profile. Every
                  time you log a meal — by chat, photo, or voice — the app
                  calculates exactly how many units you need. Works whether
                  you&apos;re on a pen or syringe. One less thing to do in your
                  head.
                </p>
              </div>

              {/* Visual: calculator mockup */}
              <div className="w-full max-w-xs flex-shrink-0">
                <ClayCard
                  borderColor="#A5D6A7"
                  className="!p-5"
                  color="#F1F8E9"
                >
                  <div className="mb-4 text-xs font-bold text-[#558B2F]">
                    Dose Calculator
                  </div>
                  {[
                    { label: "Meal carbs", value: "62g" },
                    { label: "Your ratio", value: "1:12" },
                    { label: "Current BG", value: "185 mg/dL" },
                    { label: "Target BG", value: "120 mg/dL" },
                    { label: "Correction factor", value: "1:40" },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="mb-2 flex items-center justify-between rounded-xl border-[2px] border-[#C8E6C9] bg-white px-3.5 py-2"
                    >
                      <span className="text-[12px] font-medium text-[#78716C]">
                        {r.label}
                      </span>
                      <span className="text-[12px] font-bold text-[#2D2A26]">
                        {r.value}
                      </span>
                    </div>
                  ))}
                  <div
                    className="mt-3 rounded-xl border-[3px] border-[#66BB6A] px-4 py-3 text-center"
                    style={{
                      background: "#E8F5E9",
                      boxShadow: "0 4px 0 #A5D6A7",
                    }}
                  >
                    <div className="text-[11px] font-bold text-[#558B2F]">
                      Recommended dose
                    </div>
                    <div className="font-display text-3xl font-extrabold text-[#2E7D32]">
                      7 units
                    </div>
                    <div className="text-[10px] font-bold text-[#81C784]">
                      5 meal + 2 correction
                    </div>
                  </div>
                </ClayCard>
              </div>
            </div>
          </Reveal>
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
