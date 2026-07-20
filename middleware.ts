import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { CookieOptions } from '@supabase/ssr';
import { esAdmin } from '@/lib/admin';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url));
    if (!esAdmin(user.email)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (request.nextUrl.pathname.startsWith('/mi-cuenta')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/mi-cuenta/:path*',
    '/login',
    '/registro'
  ],
};

