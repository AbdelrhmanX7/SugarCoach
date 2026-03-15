import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip auth checks if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith("http")) {
    return NextResponse.next({ request });
  }

  // Skip auth redirects in development
  if (process.env.NODE_ENV === "development" && process.env.SKIP_AUTH === "1") {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Allow auth pages and landing page without any checks
  const publicPaths = ["/login", "/register", "/"];
  const isPublic = publicPaths.includes(request.nextUrl.pathname);

  let user = null;

  try {
    const { data } = await supabase.auth.getUser();

    user = data.user;
  } catch {
    // Supabase unreachable — let the request through
    return supabaseResponse;
  }

  // Public pages — no auth needed, just pass through
  if (!user && isPublic) {
    return supabaseResponse;
  }

  // Protected routes - redirect to login if not authenticated
  if (!user && request.nextUrl.pathname.startsWith("/(dashboard)")) {
    const url = request.nextUrl.clone();

    url.pathname = "/login";

    return NextResponse.redirect(url);
  }

  // Also check non-grouped dashboard paths
  const protectedPaths = [
    "/home",
    "/chat",
    "/log",
    "/tracking",
    "/diet",
    "/import",
    "/achievements",
    "/profile",
  ];

  if (
    !user &&
    protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))
  ) {
    const url = request.nextUrl.clone();

    url.pathname = "/login";

    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages and landing page
  if (
    user &&
    (request.nextUrl.pathname === "/" ||
      request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register")
  ) {
    const url = request.nextUrl.clone();

    url.pathname = "/home";

    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
