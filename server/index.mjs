import 'dotenv/config';
import express from 'express';
import { createPdf, createPaymentReceiptPdf, createTenantDocumentSet } from './pdf.mjs';

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

function configReady(action) { return supabaseUrl && supabaseAnonKey && (action === 'download' || (resendApiKey && sender)); }

function safeName(value) { return String(value || 'record').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60); }

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Build a standards-compliant ZIP using store mode so generated PDFs need no extra native tools.
function createZip(files) {
  const localParts = []; const centralParts = []; let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name, 'utf8'); const data = Buffer.from(file.data); const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8); local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22); local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, data);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8); central.writeUInt16LE(0, 10); central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28); central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + data.length;
  }
  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, centralDirectory, end]);
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

app.get('/health', (_req, res) => res.json({ ok: true, downloadConfigured: Boolean(configReady('download')), emailConfigured: Boolean(configReady('email')) }));

app.post('/api/tenant-packets', async (req, res) => {
  const action = req.body?.action === 'download' ? 'download' : 'email';
  if (!configReady(action)) return res.status(503).json({ error: 'Document email service is not fully configured.' });
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
      supabaseRequest(`service_charges?tenant_id=eq.${tenant.id}&owner_id=eq.${user.id}&select=id,property_id,description,category,amount,status,due_date,paid_at&order=created_at.asc`, accessToken),
      tenant.agent_id ? supabaseRequest(`staff?id=eq.${tenant.agent_id}&owner_id=eq.${user.id}&select=full_name,email,phone,role`, accessToken) : [],
      tenant.caretaker_id ? supabaseRequest(`staff?id=eq.${tenant.caretaker_id}&owner_id=eq.${user.id}&select=full_name,email,phone,role`, accessToken) : [],
    ]);
    const property = properties?.[0] || null;
    const agent = agentRows?.[0] || null;
    const caretaker = caretakerRows?.[0] || null;

    const allRecipients = [
      { role: 'landlord', name: landlord.full_name || landlord.business_name, email: user.email },
      { role: 'tenant', name: tenant.full_name, email: tenant.email },
      { role: 'guarantor', name: guarantor?.full_name, email: guarantor?.email },
      { role: 'lawyer', name: landlord.lawyer_name, email: landlord.lawyer_email },
      { role: 'agent', name: agent?.full_name, email: agent?.email },
      { role: 'caretaker', name: caretaker?.full_name, email: caretaker?.email },
    ].filter((recipient) => recipient.role === 'landlord' || recipient.role === 'tenant' || (recipient.role === 'guarantor' && guarantor) || (recipient.role === 'lawyer' && (landlord.lawyer_name || landlord.lawyer_email)) || (recipient.role === 'agent' && agent) || (recipient.role === 'caretaker' && caretaker));
    const recipients = allRecipients.filter((recipient) => recipient.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email));
    if (action === 'email' && (!recipients.some((recipient) => recipient.role === 'tenant') || !recipients.some((recipient) => recipient.role === 'guarantor'))) {
      return res.status(422).json({ error: 'Tenant and guarantor email addresses are needed before sending the packet.' });
    }
    if (action === 'email' && !recipients.some((recipient) => recipient.role === 'lawyer')) {
      return res.status(422).json({ error: 'Add a lawyer email in the landlord profile before sending the packet.' });
    }
    if (action === 'email' && !recipients.some((recipient) => ['agent', 'caretaker'].includes(recipient.role))) {
      return res.status(422).json({ error: 'Assign an agent or caretaker with an email to receive a copy.' });
    }

    const tenantSlug = safeName(tenant.full_name);
    const documentRecipients = action === 'download' ? allRecipients : recipients;
    const files = documentRecipients.map((recipient) => ({
      name: `Packets/${tenantSlug}-${safeName(recipient.role)}.pdf`,
      data: createPdf({ tenant, landlord, property, guarantor, charges: charges || [], recipient, ownerEmail: user.email }),
    }));
    const sharedDocuments = createTenantDocumentSet({ tenant, landlord, property, guarantor, charges: charges || [], agent, caretaker, ownerEmail: user.email })
      .map((document) => ({ ...document, name: `Documents/${document.name}` }));
    const paidCharges = (charges || []).filter((charge) => charge.status === 'paid');
    const receiptFiles = paidCharges.map((charge, index) => ({
      name: `Receipts/${tenantSlug}-receipt-${String(index + 1).padStart(2, '0')}-${safeName(charge.category || charge.description)}.pdf`,
      data: createPaymentReceiptPdf({ charge, tenant, landlord, property }),
    }));
    if (action === 'download') {
      const zip = createZip([...sharedDocuments, ...files, ...receiptFiles]);
      return res.json({ filename: `Yemilaz-${tenantSlug}-documents.zip`, zipBase64: zip.toString('base64'), documentCount: sharedDocuments.length, copyCount: files.length, receiptCount: receiptFiles.length });
    }

    const deliveries = [];
    for (const recipient of recipients) {
      const packet = files.find((file) => file.name.includes(`-${safeName(recipient.role)}.pdf`));
      let delivery;
      try {
        const mailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: sender, to: [recipient.email],
            subject: `${landlord.business_name || 'Yemilaz Properties'} | Your tenancy documents for ${tenant.full_name}`,
            text: `Hello ${recipient.name || 'there'},\n\n${landlord.business_name || 'Yemilaz Properties'} has prepared your individual tenancy document packet for ${property?.name || 'the tenancy'}. This copy is addressed to you as ${recipient.role}. The attached receipt PDFs list payments recorded as paid.\n\nPlease contact the landlord if anything needs correction.\n\nYemilaz Properties`,
            attachments: [
              { filename: `Yemilaz-${recipient.role}-tenancy-${tenant.id.slice(0, 8)}.pdf`, content: packet.data.toString('base64') },
              ...sharedDocuments.map((document) => ({ filename: document.name.split('/').at(-1), content: document.data.toString('base64') })),
              ...receiptFiles.map((receipt) => ({ filename: receipt.name.split('/').at(-1), content: receipt.data.toString('base64') })),
            ],
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
    res.status(500).json({ error: 'Yemilaz Properties could not prepare this document packet. Please try again later or contact your property administrator.' });
  }
});

app.listen(port, () => console.log(`Yemilaz document service listening on ${port}`));
