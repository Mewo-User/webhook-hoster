import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { getEndpointById, getEndpointEvents } = await import("@/lib/store");
  const endpoint = getEndpointById(params.id);

  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
  }

  return NextResponse.json({ events: getEndpointEvents(params.id) });
}
