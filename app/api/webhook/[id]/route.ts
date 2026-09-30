import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { replayEvent, getEndpointById, getEventById } = await import("@/lib/store");

  try {
    const body = await request.json();
    const event = getEventById(body.eventId);
    const endpoint = getEndpointById(params.id);

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const replayed = replayEvent(endpoint.id, event.id);
    return NextResponse.json({ replayed }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid replay request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
