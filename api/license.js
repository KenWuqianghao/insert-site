import { createPrivateKey, sign } from "node:crypto";

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{1,250}$/;

const json = (status, body) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function licenseKey({ email, order, issued }, privateKey) {
  const payload = Buffer.from(JSON.stringify({ email, order, issued }), "utf8");
  const signature = sign(null, payload, privateKey);
  return `INSERT1-${payload.toString("base64url")}.${signature.toString("base64url")}`;
}

export default {
  async fetch(request) {
    const sessionId = new URL(request.url).searchParams.get("session_id");
    if (!sessionId || !SESSION_ID.test(sessionId)) {
      return json(400, { error: "invalid_session_id" });
    }

    const { STRIPE_SECRET_KEY, STRIPE_PAYMENT_LINK_ID, LICENSE_SIGNING_KEY } = process.env;
    if (!STRIPE_SECRET_KEY || !STRIPE_PAYMENT_LINK_ID || !LICENSE_SIGNING_KEY) {
      console.error("license: missing environment variables");
      return json(500, { error: "not_configured" });
    }

    let privateKey;
    try {
      privateKey = createPrivateKey({
        key: Buffer.from(LICENSE_SIGNING_KEY, "base64"),
        format: "der",
        type: "pkcs8",
      });
    } catch {
      console.error("license: LICENSE_SIGNING_KEY is not a base64 PKCS8 DER key");
      return json(500, { error: "not_configured" });
    }

    const stripe = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    });
    if (stripe.status === 404) return json(404, { error: "not_found" });
    if (!stripe.ok) {
      console.error(`license: Stripe returned ${stripe.status}`);
      return json(502, { error: "stripe_unavailable" });
    }

    const session = await stripe.json();
    const email = session.customer_details?.email;
    if (
      session.id !== sessionId ||
      session.payment_status !== "paid" ||
      session.payment_link !== STRIPE_PAYMENT_LINK_ID ||
      !email ||
      !Number.isInteger(session.created)
    ) {
      return json(404, { error: "not_found" });
    }

    const issued = new Date(session.created * 1000).toISOString().slice(0, 10);
    const key = licenseKey({ email, order: session.id, issued }, privateKey);
    return json(200, { key, email });
  },
};
