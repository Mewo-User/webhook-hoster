import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { getEndpointById } = await import("@/lib/store");
  const endpoint = getEndpointById(params.id);

  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
  }

  return NextResponse.json({ endpoint });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { deleteEndpoint } = await import("@/lib/store");
  const deleted = deleteEndpoint(params.id);

  if (!deleted) {
    return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
