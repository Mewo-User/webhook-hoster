import { NextResponse } from "next/server";

export async function GET() {
  const { listEndpoints } = await import("@/lib/store");
  const endpoints = listEndpoints();
  return NextResponse.json({ endpoints });
}

export async function POST(request: Request) {
  const { createEndpoint } = await import("@/lib/store");

  try {
    const body = await request.json();
    const endpoint = createEndpoint({
      name: String(body.name || "").trim(),
      targetUrl: String(body.targetUrl || "").trim(),
      secret: String(body.secret || "").trim(),
    });

    return NextResponse.json({ endpoint }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create endpoint";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
