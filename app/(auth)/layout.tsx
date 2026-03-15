export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span aria-label="candy" className="text-4xl" role="img">
            🍬
          </span>
          <h1 className="text-3xl font-bold text-foreground">SugarCoach</h1>
        </div>
        <p className="text-sm text-default-500">Your AI Diabetes Buddy</p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
