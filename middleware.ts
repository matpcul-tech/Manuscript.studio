import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isStoreRequest, STORE_COOKIE } from '@/lib/storeBuildShared';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const store = isStoreRequest(request.headers.get('user-agent'), request.cookies.get(STORE_COOKIE)?.value);

  // Store build mode: no pricing page, landing page, or billing inside the native app.
  if (store && (path === '/' || path.startsWith('/billing'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/app';
    url.search = '';
    const res = NextResponse.redirect(url);
    res.cookies.set(STORE_COOKIE, '1', { path: '/', sameSite: 'lax', secure: true });
    return res;
  }
  if (store && path.startsWith('/api/stripe/') && !path.startsWith('/api/stripe/webhook')) {
    return NextResponse.json({ error: 'Purchases are not available in the app.' }, { status: 403 });
  }

  // Skip auth callback route
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protect /app routes
  if (!user && request.nextUrl.pathname.startsWith('/app')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (store && request.cookies.get(STORE_COOKIE)?.value !== '1') {
    supabaseResponse.cookies.set(STORE_COOKIE, '1', { path: '/', sameSite: 'lax', secure: true });
  }
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
