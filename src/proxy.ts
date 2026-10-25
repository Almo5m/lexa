import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup"];
// Open to everyone: the landing page, the guarded demo API, and parent/teacher links (the token is the key).
const OPEN_PATHS = ["/welcome", "/api/demo", "/share/", "/forgot", "/reset"];

export async function proxy(request: NextRequest) {
  if (OPEN_PATHS.some((p) => request.nextUrl.pathname.startsWith(p))) return NextResponse.next({ request });
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          for (const { name, value } of items) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of items) response.cookies.set(name, value, options);
        },
      },
    },
  );

  // Checks the signed token locally instead of calling Supabase on every navigation.
  const { data: authData } = await supabase.auth.getClaims();
  const user = authData?.claims?.sub ? authData.claims : null;

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    // A first-time visitor sees the landing page; a deep link to a page goes to login.
    url.pathname = path === "/" ? "/welcome" : "/login";
    return NextResponse.redirect(url);
  }
  if (user && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|api/health|bo/).*)"],
};
