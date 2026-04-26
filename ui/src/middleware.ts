import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Only protect if PASSWORD environment variable is set
  if (!process.env.PASSWORD) {
    return NextResponse.next();
  }

  const basicAuth = req.headers.get('authorization');
  const url = req.nextUrl;

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    // atob is standard in modern edge runtimes
    const [user, pwd] = atob(authValue).split(':');

    // Here we just check password (username can be anything)
    if (pwd === process.env.PASSWORD) {
      return NextResponse.next();
    }
  }
  
  url.pathname = '/api/basicauth';
  
  return new NextResponse('Auth Required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Dashboard"'
    }
  });
}

export const config = {
  matcher: ['/((?!api/basicauth|_next/static|_next/image|favicon.ico).*)'],
};
