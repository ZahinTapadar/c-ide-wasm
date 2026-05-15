import type { NextRequest } from "next/server";

const UPSTREAM = "https://registry.wasmer.io/graphql";

export async function POST(request: NextRequest): Promise<Response> {
  const body = await request.text();

  const upstreamRes = await fetch(UPSTREAM, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body,
  });

  const text = await upstreamRes.text();
  return new Response(text, {
    status: upstreamRes.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204 });
}
