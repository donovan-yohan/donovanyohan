// Pages Router API route for next-auth v5
// next-auth v5 is designed for App Router; Pages Router requires a manual adapter.
// handlers.GET / handlers.POST expect NextRequest (Web API), not Node's req/res.

import { handlers } from "../../../auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { NextRequest } from "next/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  // Adapt Node.js IncomingMessage → NextRequest (Web standard)
  const webReq = new NextRequest(url, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body:
      req.method !== "GET" && req.method !== "HEAD"
        ? JSON.stringify(req.body)
        : undefined,
  });

  const webRes =
    req.method === "POST"
      ? await handlers.POST(webReq)
      : await handlers.GET(webReq);

  res.status(webRes.status);
  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const body = await webRes.text();
  res.send(body);
}
