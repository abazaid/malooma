import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function wantsMarkdown(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  return request.method === "GET" && accept.toLowerCase().includes("text/markdown");
}

function canServeMarkdown(pathname: string) {
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/markdown")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname.startsWith("/api")) return false;
  if (/\.(?:css|js|map|json|xml|txt|ico|png|jpg|jpeg|webp|svg|woff|woff2)$/i.test(pathname)) return false;
  return true;
}

function unauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin Area"',
    },
  });
}

export function proxy(request: NextRequest) {
  if (wantsMarkdown(request) && canServeMarkdown(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/markdown";
    url.searchParams.set("path", request.nextUrl.pathname);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-markdown-path", request.nextUrl.pathname);
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const expectedUser = process.env.ADMIN_BASIC_AUTH_USER;
  const expectedPass = process.env.ADMIN_BASIC_AUTH_PASS;

  if (!expectedUser || !expectedPass) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const base64Credentials = authHeader.split(" ")[1] ?? "";
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf8");
  const [user, pass] = credentials.split(":");

  if (user !== expectedUser || pass !== expectedPass) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
