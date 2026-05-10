// Spike: protected page for next-auth v5 compatibility testing
//
// CRITICAL FINDING: next-auth v5 has broken Pages Router compatibility.
//  1. auth() is typed for App Router / middleware only — NOT for getServerSideProps.
//  2. getToken() requires Web API Request type, NOT Node.js IncomingMessage.
//
// Workaround used here: manually extract the session cookie and call getToken
// with an adapted headers object that satisfies the type signature.

import type { GetServerSideProps } from "next";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import type { IncomingMessage } from "http";

interface ProtectedTestProps {
  token: JWT | null;
}

export default function ProtectedTestPage({ token }: ProtectedTestProps) {
  return (
    <main style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>Protected Test Page (Spike)</h1>
      <p>
        Authenticated as:{" "}
        <strong>
          {(token?.name as string) ?? (token?.email as string) ?? "unknown"}
        </strong>
      </p>
      <pre
        style={{
          background: "#f4f4f4",
          padding: "1rem",
          borderRadius: "4px",
          overflow: "auto",
        }}
      >
        {JSON.stringify(token, null, 2)}
      </pre>
    </main>
  );
}

/**
 * Adapt Node.js IncomingMessage headers to a format getToken accepts.
 * next-auth v5 getToken() requires: Request | { headers: Headers | Record<string, string> }
 * Pages Router provides: IncomingMessage (Node.js)
 */
function adaptRequestForGetToken(req: IncomingMessage): {
  headers: Record<string, string>;
} {
  const headers: Record<string, string> = {};
  for (const [key, val] of Object.entries(req.headers)) {
    if (val !== undefined) {
      headers[key] = Array.isArray(val) ? val.join(", ") : val;
    }
  }
  return { headers };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Workaround: adapt Pages Router IncomingMessage to the shape getToken expects.
  const adaptedReq = adaptRequestForGetToken(context.req);

  const token = await getToken({
    req: adaptedReq,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return {
      redirect: {
        destination: "/api/auth/signin",
        permanent: false,
      },
    };
  }

  return {
    props: {
      // JWT values may include non-serializable types; convert to plain object
      token: JSON.parse(JSON.stringify(token)) as JWT,
    },
  };
};
