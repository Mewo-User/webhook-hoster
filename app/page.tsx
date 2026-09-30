"use client";

import { useEffect, useMemo, useState } from "react";

type Endpoint = {
  id: string;
  name: string;
  targetUrl: string;
  secret: string;
  createdAt: string;
  publicUrl: string;
};

type EventRecord = {
  id: string;
  endpointId: string;
  receivedAt: string;
  payload: any;
  source: string;
  signatureHeader?: string;
  deliveryStatus: string;
  responseCode?: number;
  error?: string;
};

const emptyForm = { name: "", targetUrl: "", secret: "" };

export default function HomePage() {
  const [form, setForm] = useState(emptyForm);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string>("");

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const selectedEndpoint = useMemo(
    () => endpoints.find((endpoint) => endpoint.id === selectedId) ?? endpoints[0],
    [endpoints, selectedId],
  );

  useEffect(() => {
    if (selectedEndpoint) {
      setSelectedId(selectedEndpoint.id);
      fetchEvents(selectedEndpoint.id);
    }
  }, [selectedEndpoint]);

  async function fetchEndpoints() {
    const response = await fetch("/api/endpoints");
    const data = await response.json();
    setEndpoints(data.endpoints || []);
    if (!selectedId && data.endpoints?.[0]?.id) {
      setSelectedId(data.endpoints[0].id);
    }
  }

  async function fetchEvents(endpointId: string) {
    const response = await fetch(`/api/endpoints/${endpointId}/events`);
    const data = await response.json();
    setEvents(data.events || []);
  }

  async function createEndpoint(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice("");

    const response = await fetch("/api/endpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setNotice(data.error || "Could not create endpoint.");
      return;
    }

    setForm(emptyForm);
    setNotice(`Created ${data.endpoint.name}.`);
    await fetchEndpoints();
  }

  async function replayEvent(eventId: string) {
    if (!selectedEndpoint) return;

    const response = await fetch(`/api/endpoints/${selectedEndpoint.id}/replay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });

    const data = await response.json();
    if (!response.ok) {
      setNotice(data.error || "Replay failed.");
      return;
    }

    setNotice(`Replay queued for ${selectedEndpoint.name}.`);
    await fetchEvents(selectedEndpoint.id);
  }

  async function copyPublicUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setNotice("Public webhook URL copied to clipboard.");
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 80px" }}>
      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, alignItems: "stretch" }}>
        <div>
          <p style={{ letterSpacing: 2, textTransform: "uppercase", color: "#93c5fd", fontSize: 12, marginBottom: 12 }}>
            Webhook Hoster / Manager
          </p>
          <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1.1, margin: 0 }}>
            Receive, verify, store, and replay webhooks from anywhere.
          </h1>
          <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.7, marginTop: 20, maxWidth: 700 }}>
            Spin up a public webhook endpoint in seconds, forward it to your server, inspect payloads,
            and retry failed deliveries from a single dashboard.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26 }}>
            <a href="#create" style={{ background: "#2563eb", color: "white", padding: "12px 20px", borderRadius: 12, textDecoration: "none", fontWeight: 700 }}>
              Create endpoint
            </a>
            <a href="#events" style={{ border: "1px solid rgba(148,163,184,0.45)", color: "#e2e8f0", padding: "12px 20px", borderRadius: 12, textDecoration: "none" }}>
              View logs
            </a>
          </div>
        </div>

        <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(148, 163, 184, 0.2)", borderRadius: 18, padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Why this works</h2>
          <ul style={{ paddingLeft: 20, color: "#cbd5e1", lineHeight: 1.9 }}>
            <li>Public webhook endpoints with unique IDs</li>
            <li>Signature verification using a shared secret</li>
            <li>Persistent event history and replay support</li>
            <li>Target delivery retries with delivery status tracking</li>
          </ul>
        </div>
      </section>

      <section id="create" style={{ marginTop: 40, display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 24 }}>
        <form onSubmit={createEndpoint} style={{ background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 18, padding: 22 }}>
          <h2 style={{ marginTop: 0 }}>Create a webhook endpoint</h2>

          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ display: "block", marginBottom: 8, color: "#cbd5e1" }}>Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Customer billing webhooks"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.3)", background: "#0f172a", color: "white" }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ display: "block", marginBottom: 8, color: "#cbd5e1" }}>Target URL</span>
            <input
              value={form.targetUrl}
              onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
              placeholder="https://example.com/api/webhook/receiver"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.3)", background: "#0f172a", color: "white" }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 18 }}>
            <span style={{ display: "block", marginBottom: 8, color: "#cbd5e1" }}>Shared Secret</span>
            <input
              value={form.secret}
              onChange={(e) => setForm({ ...form, secret: e.target.value })}
              placeholder="whsec_123456"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(148,163,184,0.3)", background: "#0f172a", color: "white" }}
            />
          </label>

          <button
            type="submit"
            disabled={loading || !form.name || !form.targetUrl}
            style={{ width: "100%", padding: "12px 18px", borderRadius: 12, border: "none", background: loading ? "#4b5563" : "#2563eb", color: "white", fontWeight: 700, cursor: loading ? "default" : "pointer" }}
          >
            {loading ? "Creating..." : "Create endpoint"}
          </button>

          {notice ? (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: "rgba(59,130,246,0.18)", color: "#dbeafe", border: "1px solid rgba(96,165,250,0.35)" }}>
              {notice}
            </div>
          ) : null}
        </form>

        <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 18, padding: 22 }}>
          <h2 style={{ marginTop: 0 }}>Your endpoints</h2>

          {endpoints.length === 0 ? (
            <p style={{ color: "#cbd5e1" }}>No webhook endpoints yet. Create your first one to the left.</p>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {endpoints.map((endpoint) => (
                <button
                  key={endpoint.id}
                  onClick={() => setSelectedId(endpoint.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 12,
                    border: endpoint.id === selectedId ? "1px solid #60a5fa" : "1px solid rgba(148,163,184,0.2)",
                    background: endpoint.id === selectedId ? "rgba(37,99,235,0.16)" : "rgba(15,23,42,0.7)",
                    color: "#e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <strong>{endpoint.name}</strong>
                    <span style={{ color: "#93c5fd", fontSize: 12 }}>{endpoint.createdAt}</span>
                  </div>
                  <div style={{ marginTop: 8, color: "#cbd5e1", wordBreak: "break-all" }}>{endpoint.targetUrl}</div>
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        copyPublicUrl(endpoint.publicUrl);
                      }}
                      style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.3)", color: "#bfdbfe", padding: "8px 10px", borderRadius: 8, cursor: "pointer" }}
                    >
                      Copy public URL
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="events" style={{ marginTop: 32, background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 18, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Delivery log</h2>
          {selectedEndpoint ? (
            <div style={{ color: "#cbd5e1", wordBreak: "break-all" }}>{selectedEndpoint.publicUrl}</div>
          ) : null}
        </div>

        {selectedEndpoint ? (
          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
            {events.length === 0 ? (
              <p style={{ color: "#cbd5e1" }}>No events yet. Send a POST request to the public URL above to test delivery.</p>
            ) : (
              events.map((event) => (
                <div key={event.id} style={{ border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, padding: 18, background: "rgba(2,6,23,0.6)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <strong>{event.source}</strong>
                      <div style={{ color: "#94a3b8", marginTop: 4 }}>{new Date(event.receivedAt).toLocaleString()}</div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ background: event.deliveryStatus === "delivered" ? "rgba(34,197,94,0.18)" : "rgba(248,113,113,0.18)", color: event.deliveryStatus === "delivered" ? "#86efac" : "#fecaca", borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 700 }}>
                        {event.deliveryStatus}
                      </span>
                      <button
                        type="button"
                        onClick={() => replayEvent(event.id)}
                        style={{ border: "1px solid rgba(148,163,184,0.3)", background: "transparent", color: "#dbeafe", borderRadius: 8, padding: "8px 10px", cursor: "pointer" }}
                      >
                        Replay
                      </button>
                    </div>
                  </div>

                  <pre style={{ marginTop: 14, whiteSpace: "pre-wrap", background: "#020617", padding: 14, borderRadius: 10, overflowX: "auto", color: "#e2e8f0" }}>
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>

                  {event.error ? <div style={{ marginTop: 10, color: "#fca5a5" }}>Error: {event.error}</div> : null}
                </div>
              ))
            )}
          </div>
        ) : (
          <p style={{ color: "#cbd5e1", marginTop: 18 }}>No endpoint selected.</p>
        )}
      </section>
    </main>
  );
}
