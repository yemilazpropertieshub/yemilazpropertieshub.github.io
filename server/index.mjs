import 'dotenv/config';
import express from 'express';
import { createPdf } from './pdf.mjs';

const app = express();
const port = Number(process.env.PORT || 3000);
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const sender = process.env.RESEND_FROM_EMAIL;
const allowedOrigins = (process.env.FRONTEND_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);

app.use(express.json({ limit: '32kb' }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function configReady() {
  return supabaseUrl && supabaseAnonKey && resendApiKey && sender;
}

async function supabaseRequest(path, accessToken, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}): ${body.slice(0, 300)}`);
  return body ? JSON.parse(body) : null;
}

async function authenticate(accessToken) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  return response.json();
}

async function recordDelivery(delivery, ownerId, tenantId, accessToken) {
  try {
    await supabaseRequest('tenant_packet_deliveries', accessToken, {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        owner_id: ownerId, tenant_id: tenantId, recipient_role: delivery.role,
        recipient_email: delivery.email, status: delivery.status,
        provider_id: delivery.providerId || null, error_message: delivery.error || null,
      }),
    });
  } catch (error) {
    console.error('Could not save delivery record:', error.message);
  }
}

app.get('/health', (_req, res) => res.json({ ok: true, configured: Boolean(configReady()) }));

app.post('/api/tenant-packets', async (req, res) => {
  if (!configReady()) return res.status(503).json({ error: 'Document email service is not fully configured.' });
  const accessToken = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) return res.status(401).json({ error: 'Sign in is required.' });
  const user = await authenticate(accessToken);
  if (!user?.id) return res.status(401).json({ error: 'Your session has expired. Sign in again.' });
  const tenantId = String(req.body?.tenantId || '');
  if (!/^[0-9a-f-]{36}$/i.test(tenantId)) return res.status(400).json({ error: 'A valid tenant ID is required.' });

  try {
    // Every lookup uses the tenant's own signed-in JWT, so Supabase RLS enforces landlord ownership.
    const [tenantRows, profileRows, guarantors] = await Promise.all([
      supabaseRequest(`tenants?id=eq.${tenantId}&owner_id=eq.${user.id}&select=*`, accessToken),
      supabaseRequest(`landlord_profiles?user_id=eq.${user.id}&select=*`, accessToken),
      supabaseRequest(`guarantors?tenant_id=eq.${tenantId}&owner_id=eq.${user.id}&select=*`, accessToken),
    ]);
    const tenant = tenantRows?.[0];
    const landlord = profileRows?.[0];
    const guarantor = guarantors?.[0];
    if (!tenant || !landlord) return res.status(404).json({ error: 'Tenant or landlord profile not found in this account.' });
    const [properties, charges, agentRows, caretakerRows] = await Promise.all([
      tenant.property_id ? supabaseRequest(`properties?id=eq.${tenant.property_id}&owner_id=eq.${user.id}&select=*`, accessToken) : [],
      supabaseRequest(`service_charges?tenant_id=eq.${tenant.id}&owner_id=eq.${user.id}&select=description,category,amount,status,due_date,paid_at&order=created_at.asc`, accessToken),
      tenant.agent_id ? supabaseRequest(`staff?id=eq.${tenant.agent_id}&owner_id=eq.${user.id}&select=full_name,email,phone,role`, accessToken) : [],
      tenant.caretaker_id ? supabaseRequest(`staff?id=eq.${tenant.caretaker_id}&owner_id=eq.${user.id}&select=full_name,email,phone,role`, accessToken) : [],
    ]);
    const property = properties?.[0] || null;
    const agent = agentRows?.[0] || null;
    const caretaker = caretakerRows?.[0] || null;

    const recipients = [
      { role: 'landlord', name: landlord.full_name || landlord.business_name, email: user.email },
      { role: 'tenant', name: tenant.full_name, email: tenant.email },
      { role: 'guarantor', name: guarantor?.full_name, email: guarantor?.email },
      { role: 'lawyer', name: landlord.lawyer_name, email: landlord.lawyer_email },
      { role: 'agent', name: agent?.full_name, email: agent?.email },
      { role: 'caretaker', name: caretaker?.full_name, email: caretaker?.email },
    ].filter((recipient) => recipient.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email));
    if (!recipients.some((recipient) => recipient.role === 'tenant') || !recipients.some((recipient) => recipient.role === 'guarantor')) {
      return res.status(422).json({ error: 'Tenant and guarantor email addresses are needed before sending the packet.' });
    }
    if (!recipients.some((recipient) => recipient.role === 'lawyer')) {
      return res.status(422).json({ error: 'Add a lawyer email in the landlord profile before sending the packet.' });
    }
    if (!recipients.some((recipient) => ['agent', 'caretaker'].includes(recipient.role))) {
      return res.status(422).json({ error: 'Assign an agent or caretaker with an email to receive a copy.' });
    }

    const deliveries = [];
    for (const recipient of recipients) {
      const pdf = createPdf({ tenant, landlord, property, guarantor, charges: charges || [], recipient });
      let delivery;
      try {
        const mailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: sender, to: [recipient.email],
            subject: `Confidential tenancy documents for ${tenant.full_name}`,
            text: `Hello ${recipient.name || 'there'},\n\nAttached is your individual Yemilaz Properties tenancy document packet for ${property?.name || 'the tenancy'}. This copy is addressed to you as ${recipient.role}.\n\nPlease contact the landlord if anything needs correction.`,
            attachments: [{ filename: `Yemilaz-${recipient.role}-tenancy-${tenant.id.slice(0, 8)}.pdf`, content: pdf.toString('base64') }],
          }),
        });
        const result = await mailResponse.json();
        if (!mailResponse.ok) throw new Error(result.message || result.error || `Email provider returned ${mailResponse.status}`);
        delivery = { role: recipient.role, email: recipient.email, status: 'sent', providerId: result.id };
      } catch (error) {
        delivery = { role: recipient.role, email: recipient.email, status: 'failed', error: error.message };
      }
      await recordDelivery(delivery, user.id, tenant.id, accessToken);
      deliveries.push(delivery);
    }
    res.json({ deliveries });
  } catch (error) {
    console.error('Tenant packet delivery failed:', error);
    res.status(500).json({ error: 'Could not prepare the tenant packet. Check the server logs and Supabase setup.' });
  }
});

app.listen(port, () => console.log(`Yemilaz document service listening on ${port}`));
