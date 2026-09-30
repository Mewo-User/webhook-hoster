import { NextRequest, NextResponse } from "next/server";
import { verifySignature } from "@/lib/webhook";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { getEndpointById, recordEvent, deliverEvent } = await import("@/lib/store");

  const endpoint = getEndpointById(params.id);
  if (!endpoint) {
    return NextResponse.json({ error: "Unknown webhook endpoint" }, { status: 404 });
  }

  const rawBody = await request.text();
  const contentType = request.headers.get("content-type") || "";
  let payload: any = rawBody;

  if (contentType.includes("application/json")) {
    try {
      payload = JSON.parse(rawBody || "{}")
    } catch {
      payload = rawBody;
    }
  }

  const signatureHeader =
    request.headers.get("x-webhook-signature") ||
    request.headers.get("x-signature") ||
    request.headers.get("x-webhook-secret") ||
    "";

  if (endpoint.secret && signatureHeader) {
    const valid = verifySignature(rawBody, endpoint.secret, signatureHeader);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = recordEvent({
    endpointId: endpoint.id,
    source: "public webhook",
    payload,
    signatureHeader,
  });

  const delivery = await deliverEvent(endpoint, event);

  return NextResponse.json({ success: true, eventId: event.id, deliveryStatus: delivery.status }, { status: 200 });
}
