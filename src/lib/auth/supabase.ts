import { createBrowserClient } from '@supabase/ssr';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Create a Supabase client for use in Client Components
 * This client automatically handles session management via cookies
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Create a Supabase client for use in Server Components, Server Actions, and Route Handlers
 * This client reads and writes cookies to maintain session state
 */
export async function createServerSupabaseClient() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase client for use in Middleware
 * This is a special client that can update cookies in the response
 */
export function createMiddlewareClient(request: Request) {
  let response = new Response(null, {
    status: 200,
    headers: request.headers,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.headers.get('cookie')?.split('; ').find(c => c.startsWith(name + '='))?.split('=')[1];
        },
        set(name: string, value: string, options: CookieOptions) {
          response.headers.append('Set-Cookie', `${name}=${value}; Path=/; ${options.maxAge ? `Max-Age=${options.maxAge};` : ''} ${options.httpOnly ? 'HttpOnly;' : ''} ${options.sameSite ? `SameSite=${options.sameSite};` : ''}`);
        },
        remove(name: string, options: CookieOptions) {
          response.headers.append('Set-Cookie', `${name}=; Path=/; Max-Age=0; ${options.httpOnly ? 'HttpOnly;' : ''} ${options.sameSite ? `SameSite=${options.sameSite};` : ''}`);
        },
      },
    }
  );

  return { supabase, response };
}
