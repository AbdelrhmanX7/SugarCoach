import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";

import { title, subtitle } from "@/components/primitives";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <div className="relative flex flex-col h-screen">
      <Navbar />
      <main className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
          <div className="inline-block max-w-2xl text-center justify-center">
            <div className="mb-2 text-6xl">🍬</div>
            <span className={title()}>Your AI&nbsp;</span>
            <span className={title({ color: "cyan" })}>Diabetes&nbsp;</span>
            <br />
            <span className={title()}>Buddy</span>
            <div className={subtitle({ class: "mt-4" })}>
              Making diabetes management easy, fun, and totally doable. Track
              your blood sugar, log meals, chat with your AI coach, and unlock
              achievements along the way!
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              className={buttonStyles({
                color: "primary",
                radius: "full",
                variant: "shadow",
                size: "lg",
              })}
              href="/register"
            >
              Get Started
            </Link>
            <Link
              className={buttonStyles({
                variant: "bordered",
                radius: "full",
                size: "lg",
              })}
              href="/login"
            >
              Login
            </Link>
          </div>
        </section>
      </main>
      <footer className="w-full flex items-center justify-center py-3">
        <span className="text-sm text-default-400">
          SugarCoach — Your AI Diabetes Buddy
        </span>
      </footer>
    </div>
  );
}
