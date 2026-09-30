import fs from "fs";
import path from "path";
import crypto from "crypto";

export type EndpointRecord = {
  id: string;
  name: string;
  targetUrl: string;
  secret: string;
  createdAt: string;
  publicUrl: string;
};

export type EventRecord = {
  id: string;
  endpointId: string;
  source: string;
  receivedAt: string;
  payload: unknown;
  signatureHeader?: string;
  deliveryStatus: "pending" | "delivered" | "failed";
  responseCode?: number;
  error?: string;
};

type StoreData = {
  endpoints: EndpointRecord[];
  events: EventRecord[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORE_FILE)) {
    const initial: StoreData = { endpoints: [], events: [] };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2));
  }
}

function readStore(): StoreData {
  ensureStore();
  const raw = fs.readFileSync(STORE_FILE, "utf8");
  try {
    return JSON.parse(raw) as StoreData;
  } catch {
    return { endpoints: [], events: [] };
  }
}

function writeStore(data: StoreData) {
  ensureStore();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
}

export function listEndpoints(): EndpointRecord[] {
  return readStore().endpoints;
}

export function getEndpointById(id: string): EndpointRecord | undefined {
  return readStore().endpoints.find((endpoint) => endpoint.id === id);
}

export function createEndpoint(input: { name: string; targetUrl: string; secret: string }): EndpointRecord {
  const name = input.name.trim();
  const targetUrl = input.targetUrl.trim();
  const secret = input.secret.trim();

  if (!name) throw new Error("Webhook name is required");
  if (!targetUrl) throw new Error("Target URL is required");

  const store = readStore();
  const endpoint: EndpointRecord = {
    id: crypto.randomUUID(),
    name,
    targetUrl,
    secret,
    createdAt: new Date().toISOString(),
    publicUrl: `http://localhost:3000/api/webhook/${crypto.randomUUID()}`,
  };

  endpoint.publicUrl = `http://localhost:3000/api/webhook/${endpoint.id}`;

  store.endpoints.push(endpoint);
  writeStore(store);
  return endpoint;
}

export function getEndpointEvents(endpointId: string): EventRecord[] {
  const store = readStore();
  return store.events.filter((event) => event.endpointId === endpointId).sort((a, b) => {
    return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
  });
}

export function getEventById(eventId: string): EventRecord | undefined {
  return readStore().events.find((event) => event.id === eventId);
}

export function recordEvent(input: {
  endpointId: string;
  source: string;
  payload: unknown;
  signatureHeader?: string;
}): EventRecord {
  const store = readStore();
  const event: EventRecord = {
    id: crypto.randomUUID(),
    endpointId: input.endpointId,
    source: input.source,
    receivedAt: new Date().toISOString(),
    payload: input.payload,
    signatureHeader: input.signatureHeader,
    deliveryStatus: "pending",
  };

  store.events.push(event);
  writeStore(store);
  return event;
}

export async function deliverEvent(endpoint: EndpointRecord, event: EventRecord): Promise<{ status: string; responseCode?: number }> {
  const store = readStore();
  const target = endpoint.targetUrl;

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "webhook-hoster/1.0",
        "X-Webhook-Id": event.id,
        "X-Webhook-Endpoint": endpoint.id,
      },
      body: JSON.stringify({
        eventId: event.id,
        source: event.source,
        receivedAt: event.receivedAt,
        payload: event.payload,
      }),
    });

    const updated = store.events.map((entry) =>
      entry.id === event.id
        ? { ...entry, deliveryStatus: response.ok ? "delivered" : "failed", responseCode: response.status }
        : entry,
    );

    writeStore({ ...store, events: updated });
    return { status: response.ok ? "delivered" : "failed", responseCode: response.status };
  } catch (error) {
    const updated = store.events.map((entry) =>
      entry.id === event.id
        ? { ...entry, deliveryStatus: "failed", error: error instanceof Error ? error.message : "Delivery failed" }
        : entry,
    );

    writeStore({ ...store, events: updated });
    return { status: "failed" };
  }
}

export async function replayEvent(endpointId: string, eventId: string): Promise<{ status: string }> {
  const endpoint = getEndpointById(endpointId);
  const event = getEventById(eventId);

  if (!endpoint || !event) {
    throw new Error("Event or endpoint not found");
  }

  const result = await deliverEvent(endpoint, event);
  return { status: result.status };
}

export function deleteEndpoint(id: string): boolean {
  const store = readStore();
  const nextEndpoints = store.endpoints.filter((endpoint) => endpoint.id !== id);
  const nextEvents = store.events.filter((event) => event.endpointId !== id);

  if (nextEndpoints.length === store.endpoints.length) {
    return false;
  }

  writeStore({ endpoints: nextEndpoints, events: nextEvents });
  return true;
}
