import 'dotenv/config';
import express from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createPdf, createPaymentReceiptPdf, createRecordUpdatePdf, createTenantDocumentSet } from './pdf.mjs';

const app = express();
const port = Number(process.env.PORT || 3000);
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const resendWebhookSecret = process.env.RESEND_WEBHOOK_SECRET;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sender = process.env.RESEND_FROM_EMAIL;
const allowedOrigins = (process.env.FRONTEND_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);

app.use(express.json({ limit: '32kb', verify: (req, _res, buffer) => { req.rawBody = Buffer.from(buffer); } }));
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
function safeFileName(value) { return String(value || 'document.pdf').replace(/[^a-zA-Z0-9_.-]/g, '-').slice(0, 100); }

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

async function recordDelivery(delivery, ownerId, tenantId, accessToken, retryOf = null, attemptNumber = 1) {
  try {
    await supabaseRequest('tenant_packet_deliveries', accessToken, {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        owner_id: ownerId, tenant_id: tenantId, recipient_role: delivery.role,
        recipient_email: delivery.email, status: delivery.status,
        provider_id: delivery.providerId || null, error_message: delivery.error || null,
        retry_of: retryOf, attempt_number: attemptNumber, provider_status: 'unknown',
      }),
    });
  } catch (error) {
    console.error('Could not save delivery record:', error.message);
  }
}

async function saveParticipantDocuments({ files, recipients, ownerId, tenantId, propertyId, accessToken }) {
  const saved = [];
  const recipientEmails = [...new Set(recipients.map((recipient) => recipient.email?.trim().toLowerCase()).filter(Boolean))];
  const entries = [
    ...files.map((file) => ({
      ...file,
      emails: (file.emails || (file.recipientEmail ? [file.recipientEmail] : recipientEmails))
        .map((email) => email.trim().toLowerCase()),
      category: file.category || 'individual_packet',
    })),
  ];
  for (const file of entries) {
    const path = `${ownerId}/${tenantId}/${crypto.randomUUID()}/${safeFileName(file.name.split('/').at(-1))}`;
    try {
      const upload = await fetch(`${supabaseUrl}/storage/v1/object/property-documents/${path}`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/pdf',
          'x-upsert': 'false',
        },
        body: file.data,
      });
      if (!upload.ok) throw new Error(`Storage upload failed (${upload.status}): ${(await upload.text()).slice(0, 220)}`);
      await supabaseRequest('property_documents', accessToken, {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          owner_id: ownerId, tenant_id: tenantId, property_id: propertyId || null,
          uploaded_by: ownerId, title: file.title || file.name.split('/').at(-1).replace(/\.pdf$/i, '').replaceAll('-', ' '),
          storage_path: path, mime_type: 'application/pdf',
          recipient_emails: file.emails || recipientEmails, document_category: file.category || 'tenancy_document',
        }),
      });
      saved.push(file.name);
    } catch (error) {
      console.error(`Could not save participant PDF ${file.name}:`, error.message);
    }
  }
  return saved.length;
}

app.get('/health', (_req, res) => res.json({ ok: true, downloadConfigured: Boolean(configReady('download')), emailConfigured: Boolean(configReady('email')) }));

app.post('/webhooks/resend', async (req, res) => {
  if (!resendWebhookSecret || !supabaseServiceRoleKey) return res.status(503).json({ error: 'Email delivery updates are not configured.' });
  const id = req.get('svix-id');
  const timestamp = req.get('svix-timestamp');
  const signatureHeader = req.get('svix-signature') || '';
  if (!id || !timestamp || !req.rawBody || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return res.status(400).json({ error: 'Invalid or expired webhook request.' });
  const secret = Buffer.from(resendWebhookSecret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', secret).update(`${id}.${timestamp}.${req.rawBody.toString('utf8')}`).digest('base64');
  const valid = signatureHeader.split(' ').some((part) => {
    const [, value] = part.split(',', 2);
    if (!value) return false;
    const received = Buffer.from(value);
    const expectedBuffer = Buffer.from(expected);
    return received.length === expectedBuffer.length && timingSafeEqual(received, expectedBuffer);
  });
  if (!valid) return res.status(401).json({ error: 'Webhook signature could not be verified.' });
  const event = req.body || {};
  const providerStatus = ({ 'email.delivered': 'delivered', 'email.bounced': 'bounced', 'email.complained': 'complained', 'email.delivery_delayed': 'delivery_delayed' })[event.type];
  const providerId = event.data?.email_id || event.data?.id;
  if (!providerStatus || !providerId) return res.json({ received: true, updated: false });
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/tenant_packet_deliveries?provider_id=eq.${encodeURIComponent(providerId)}`, {
      method: 'PATCH',
      headers: { apikey: supabaseServiceRoleKey, Authorization: `Bearer ${supabaseServiceRoleKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ provider_status: providerStatus, provider_event_id: id }),
    });
    if (!response.ok) throw new Error(`Delivery update failed (${response.status}).`);
    return res.json({ received: true, updated: true });
  } catch (error) { console.error('Resend webhook update failed:', error.message); return res.status(500).json({ error: 'Could not record the provider delivery update.' }); }
});

app.post('/api/tenant-packets', async (req, res) => {
  const action = ['download', 'tenant-download'].includes(req.body?.action) ? req.body.action : 'email';
  const isDownload = action !== 'email';
  if (!configReady(isDownload ? 'download' : 'email')) return res.status(503).json({ error: 'Document service is not fully configured.' });
  const accessToken = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) return res.status(401).json({ error: 'Sign in is required.' });
  const user = await authenticate(accessToken);
  if (!user?.id) return res.status(401).json({ error: 'Your session has expired. Sign in again.' });
  const tenantId = String(req.body?.tenantId || '');
  if (!/^[0-9a-f-]{36}$/i.test(tenantId)) return res.status(400).json({ error: 'A valid tenant ID is required.' });

  try {
    // Tenant downloads are constrained by the tenant's verified email and tenancy RLS.
    if (action !== 'tenant-download' && user.email) {
      await supabaseRequest(`landlord_profiles?user_id=eq.${user.id}`, accessToken, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ contact_email: user.email }),
      });
    }
    // Let tenant row-level security verify the signed-in email. Filtering by
    // `email=eq...` here was case-sensitive and could reject a valid linked
    // tenant when the saved address used different capitalization.
    const tenantRows = await supabaseRequest(action === 'tenant-download'
      ? `tenants?id=eq.${tenantId}&select=*`
      : `tenants?id=eq.${tenantId}&owner_id=eq.${user.id}&select=*`, accessToken);
    const tenant = tenantRows?.[0];
    const ownerId = tenant?.owner_id;
    const [profileRows, guarantors] = tenant && ownerId ? await Promise.all([
      supabaseRequest(`landlord_profiles?user_id=eq.${ownerId}&select=*`, accessToken),
      supabaseRequest(`guarantors?tenant_id=eq.${tenantId}&owner_id=eq.${ownerId}&select=*`, accessToken),
    ]) : [[], []];
    const landlord = profileRows?.[0];
    const guarantor = guarantors?.[0];
    if (!tenant || !landlord) return res.status(404).json({ error: 'Tenant or landlord profile not found in this account.' });
    const [properties, charges, agentRows, caretakerRows] = await Promise.all([
      tenant.property_id ? supabaseRequest(`properties?id=eq.${tenant.property_id}&owner_id=eq.${ownerId}&select=*`, accessToken) : [],
      supabaseRequest(`service_charges?tenant_id=eq.${tenant.id}&owner_id=eq.${ownerId}&select=id,property_id,description,category,amount,status,due_date,paid_at&order=created_at.asc`, accessToken),
      tenant.agent_id ? supabaseRequest(`staff?id=eq.${tenant.agent_id}&owner_id=eq.${ownerId}&select=full_name,email,phone,role`, accessToken) : [],
      tenant.caretaker_id ? supabaseRequest(`staff?id=eq.${tenant.caretaker_id}&owner_id=eq.${ownerId}&select=full_name,email,phone,role`, accessToken) : [],
    ]);
    const property = properties?.[0] || null;
    const agent = agentRows?.[0] || null;
    const caretaker = caretakerRows?.[0] || null;

    const allRecipients = [
      { role: 'landlord', name: landlord.full_name || landlord.business_name, email: action === 'tenant-download' ? landlord.contact_email : user.email },
      { role: 'tenant', name: tenant.full_name, email: tenant.email },
      { role: 'guarantor', name: guarantor?.full_name, email: guarantor?.email },
      { role: 'lawyer', name: landlord.lawyer_name, email: landlord.lawyer_email },
      { role: 'agent', name: agent?.full_name, email: agent?.email },
      { role: 'caretaker', name: caretaker?.full_name, email: caretaker?.email },
    ].filter((recipient) => recipient.role === 'landlord' || recipient.role === 'tenant' || (recipient.role === 'guarantor' && guarantor) || (recipient.role === 'lawyer' && (landlord.lawyer_name || landlord.lawyer_email)) || (recipient.role === 'agent' && agent) || (recipient.role === 'caretaker' && caretaker));
    let recipients = allRecipients.filter((recipient) => recipient.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email));
    const requestedRetryOf = String(req.body?.retryOf || '');
    const requestedRecipient = String(req.body?.recipientEmail || '').trim().toLowerCase();
    let attemptNumber = 1;
    if (requestedRetryOf || requestedRecipient) {
      if (!/^[0-9a-f-]{36}$/i.test(requestedRetryOf) || !requestedRecipient) return res.status(400).json({ error: 'A failed delivery and its recipient email are required to retry.' });
      const previousRows = await supabaseRequest(`tenant_packet_deliveries?id=eq.${requestedRetryOf}&owner_id=eq.${user.id}&tenant_id=eq.${tenant.id}&select=id,status,recipient_email,attempt_number`, accessToken);
      const previous = previousRows?.[0];
      if (!previous || previous.status !== 'failed' || previous.recipient_email?.toLowerCase() !== requestedRecipient) return res.status(409).json({ error: 'Only the same recipient’s failed delivery can be retried.' });
      recipients = recipients.filter((recipient) => recipient.email.toLowerCase() === requestedRecipient);
      if (!recipients.length) return res.status(404).json({ error: 'The failed recipient is no longer linked to this tenancy. Update the contact record before retrying.' });
      const latestRows = await supabaseRequest(`tenant_packet_deliveries?owner_id=eq.${user.id}&tenant_id=eq.${tenant.id}&recipient_email=eq.${encodeURIComponent(requestedRecipient)}&select=attempt_number&order=created_at.desc&limit=1`, accessToken);
      attemptNumber = Number(latestRows?.[0]?.attempt_number || previous.attempt_number || 1) + 1;
    }
    if (!isDownload && !recipients.some((recipient) => recipient.role === 'tenant')) {
      return res.status(422).json({ error: 'Add a valid tenant email address before emailing tenancy documents.' });
    }

    const tenantSlug = safeName(tenant.full_name);
    const ownerEmail = action === 'tenant-download' ? landlord.contact_email : user.email;
    const documentRecipients = action === 'tenant-download' ? allRecipients.filter((recipient) => recipient.role === 'tenant') : isDownload ? allRecipients : recipients;
    const files = documentRecipients.map((recipient) => ({
      name: `Packets/${tenantSlug}-${safeName(recipient.role)}.pdf`,
      data: createPdf({ tenant, landlord, property, guarantor, charges: charges || [], recipient, ownerEmail }),
    }));
    const sharedDocuments = createTenantDocumentSet({ tenant, landlord, property, guarantor, charges: charges || [], agent, caretaker, ownerEmail })
      .map((document) => ({ ...document, name: `Documents/${document.name}` }));
    const paidCharges = (charges || []).filter((charge) => charge.status === 'paid');
    const receiptFiles = paidCharges.map((charge, index) => ({
      name: `Receipts/${tenantSlug}-receipt-${String(index + 1).padStart(2, '0')}-${safeName(charge.category || charge.description)}.pdf`,
      data: createPaymentReceiptPdf({ charge, tenant, landlord, property }),
    }));
    if (isDownload) {
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
      await recordDelivery(delivery, user.id, tenant.id, accessToken, requestedRetryOf || null, attemptNumber);
      deliveries.push(delivery);
    }
    const dashboardDocumentCount = await saveParticipantDocuments({
      files: [
        ...sharedDocuments.map((document) => ({ ...document, category: 'tenancy_document' })),
        ...receiptFiles.map((file) => ({ ...file, category: 'payment_receipt' })),
        ...files.map((file) => {
          const role = file.name.match(/-([a-zA-Z0-9_-]+)\.pdf$/)?.[1];
          const recipient = recipients.find((item) => safeName(item.role) === role);
          return { ...file, recipientEmail: recipient?.email, title: `${tenant.full_name} ${recipient?.role || 'participant'} tenancy summary`, category: 'individual_packet' };
        }),
      ],
      recipients, ownerId: user.id, tenantId: tenant.id, propertyId: property?.id, accessToken,
    });
    res.json({ deliveries, dashboardDocumentCount });
  } catch (error) {
    console.error('Tenant packet delivery failed:', error);
    res.status(500).json({ error: 'Yemilaz Properties could not prepare this document packet. Please try again later or contact your property administrator.' });
  }
});

app.post('/api/profile-invitations', async (req, res) => {
  if (!configReady('email')) return res.status(503).json({ error: 'Invitation email is not configured on the document service.' });
  const accessToken = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) return res.status(401).json({ error: 'Sign in as the landlord before sending an invitation.' });
  const user = await authenticate(accessToken);
  if (!user?.id) return res.status(401).json({ error: 'Your session has expired. Sign in again.' });
  const origin = req.headers.origin;
  if (!origin || !allowedOrigins.includes(origin)) return res.status(403).json({ error: 'This website is not allowed to send account invitations.' });
  const role = String(req.body?.role || '').toLowerCase();
  const recordId = String(req.body?.recordId || '');
  if (!['tenant', 'agent', 'caretaker', 'lawyer'].includes(role) || !/^[0-9a-f-]{36}$/i.test(recordId)) {
    return res.status(400).json({ error: 'Choose a valid tenant, agent, caretaker, or lawyer record.' });
  }

  try {
    const table = role === 'tenant' ? 'tenants' : 'staff';
    const columns = role === 'tenant' ? 'id,owner_id,full_name,email' : 'id,owner_id,full_name,email,role';
    const rows = await supabaseRequest(`${table}?id=eq.${recordId}&owner_id=eq.${user.id}&select=${columns}`, accessToken);
    const person = rows?.[0];
    if (!person || (role !== 'tenant' && person.role !== role)) return res.status(404).json({ error: 'That person is not registered in your account.' });
    if (!person.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email)) return res.status(422).json({ error: 'Add a valid email address to this person’s record first.' });

    const joinUrl = new URL('/', origin);
    joinUrl.searchParams.set('join', role);
    joinUrl.searchParams.set('email', person.email);
    const roleLabel = role === 'tenant' ? 'tenant' : role;
    const safeName = String(person.full_name || 'there').replace(/[<>"'&]/g, '');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: sender, to: [person.email],
        subject: `Your ${roleLabel} profile invitation | Yemilaz Properties`,
        text: `Hello ${safeName},\n\nYour property manager has invited you to create a ${roleLabel} profile on Yemilaz Properties. Use this secure signup link, then confirm your email to activate your account:\n\n${joinUrl.toString()}\n\nUse this invitation only if you expected it. If you have questions, contact your property manager.\n\nYemilaz Properties`,
        html: `<div style="font-family:Arial,sans-serif;color:#24312f;max-width:600px;margin:auto;padding:32px"><div style="font-size:12px;letter-spacing:2px;color:#b08c4d;font-weight:bold">YEMILAZ PROPERTIES</div><h1 style="font-size:26px;margin:24px 0 12px">Your ${roleLabel} profile is ready</h1><p>Hello ${safeName},</p><p>Your property manager has invited you to create a ${roleLabel} profile. You can sign in to view the information and tools assigned to you.</p><p style="margin:28px 0"><a href="${joinUrl.toString()}" style="display:inline-block;background:#15574f;color:white;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:bold">Create your profile</a></p><p>After signing up, confirm your email address to activate your account. If you were not expecting this invitation, contact your property manager before continuing.</p><p style="margin-top:32px;color:#777;font-size:12px">Yemilaz Properties · Property management</p></div>`,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || `Email provider returned ${response.status}`);
    res.json({ sent: true, email: person.email });
  } catch (error) {
    console.error('Profile invitation failed:', error.message);
    res.status(500).json({ error: 'The invitation could not be sent. Check the email service configuration and try again.' });
  }
});

app.post('/api/tenant-assignment-notifications', async (req, res) => {
  if (!configReady('email')) return res.status(503).json({ error: 'Assignment email is not configured on the document service.' });
  const accessToken = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) return res.status(401).json({ error: 'Sign in as the property owner before sending assignment notifications.' });
  const user = await authenticate(accessToken);
  if (!user?.id) return res.status(401).json({ error: 'Your session has expired. Sign in again.' });
  const origin = req.headers.origin;
  if (!origin || !allowedOrigins.includes(origin)) return res.status(403).json({ error: 'This website is not allowed to send assignment notifications.' });
  const tenantId = String(req.body?.tenantId || '');
  const previousIds = Array.isArray(req.body?.previousStaffIds) ? req.body.previousStaffIds : [];
  if (!/^[0-9a-f-]{36}$/i.test(tenantId) || previousIds.length > 3 || previousIds.some((id) => !/^[0-9a-f-]{36}$/i.test(String(id)))) {
    return res.status(400).json({ error: 'Choose a valid tenant and team assignment.' });
  }

  try {
    const tenantRows = await supabaseRequest(`tenants?id=eq.${tenantId}&owner_id=eq.${user.id}&select=id,owner_id,full_name,email,property_id,agent_id,caretaker_id,lawyer_id`, accessToken);
    const tenant = tenantRows?.[0];
    if (!tenant) return res.status(404).json({ error: 'That tenant is not registered in your property account.' });

    const staffIds = [...new Set([...previousIds, tenant.agent_id, tenant.caretaker_id, tenant.lawyer_id].filter(Boolean))];
    const staffRows = staffIds.length
      ? await supabaseRequest(`staff?id=in.(${staffIds.join(',')})&owner_id=eq.${user.id}&select=id,full_name,email,role`, accessToken)
      : [];
    const assignments = (staffRows || []).filter((person) => person.email);
    const roleSummary = assignments.filter((person) => [tenant.agent_id, tenant.caretaker_id, tenant.lawyer_id].includes(person.id))
      .map((person) => `${person.role}: ${person.full_name}`).join(', ') || 'No team members are currently assigned';
    const recipientMap = new Map();
    for (const person of [{ email: user.email, name: 'Property owner', role: 'property owner' }, { email: tenant.email, name: tenant.full_name, role: 'tenant' }, ...assignments.map((person) => ({ email: person.email, name: person.full_name, role: person.role }))]) {
      if (person.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email)) recipientMap.set(person.email.toLowerCase(), person);
    }
    const safe = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
    const tenantName = safe(tenant.full_name || 'Tenant');
    const sent = [];
    const failed = [];
    for (const recipient of recipientMap.values()) {
      const accountUrl = new URL('/', origin);
      if (['tenant', 'agent', 'caretaker', 'lawyer'].includes(recipient.role)) {
        accountUrl.searchParams.set('join', recipient.role);
        accountUrl.searchParams.set('email', recipient.email);
      } else {
        accountUrl.searchParams.set('portal', 'account');
      }
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: sender, to: [recipient.email],
          subject: `Property team update for ${tenant.full_name || 'your tenancy'} | Yemilaz Properties`,
          text: `Hello ${recipient.name || 'there'},\n\nThe property team assignment for ${tenant.full_name || 'this tenancy'} has been updated. Current team: ${roleSummary}.\n\nReview the tenancy details or set up your ${recipient.role} profile here: ${accountUrl.toString()}\n\nIf you have questions, contact the property owner.\n\nYemilaz Properties`,
          html: `<div style="font-family:Arial,sans-serif;color:#24312f;max-width:600px;margin:auto;padding:32px"><div style="font-size:12px;letter-spacing:2px;color:#b08c4d;font-weight:bold">YEMILAZ PROPERTIES</div><h1 style="font-size:24px;margin:24px 0 12px">Property team assignment updated</h1><p>Hello ${safe(recipient.name || 'there')},</p><p>The team connected to <b>${tenantName}</b> has been updated.</p><p style="padding:16px;background:#f2f6f4;border-radius:8px"><b>Current team:</b> ${safe(roleSummary)}</p><p>Review the tenancy details or set up your account:</p><p style="margin:24px 0"><a href="${safe(accountUrl.toString())}" style="display:inline-block;background:#15574f;color:white;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:bold">Open Yemilaz Properties</a></p><p>If you have questions, contact the property owner.</p><p style="margin-top:32px;color:#777;font-size:12px">Yemilaz Properties · Property management</p></div>`,
        }),
      });
      const result = await response.json();
      if (response.ok) sent.push(recipient.email); else failed.push({ email: recipient.email, error: result.message || result.error || `Email provider returned ${response.status}` });
    }
    res.json({ sent: sent.length, failed });
  } catch (error) {
    console.error('Tenant team assignment notifications failed:', error.message);
    res.status(500).json({ error: 'Assignment notifications could not be sent. Check the email service configuration and try again.' });
  }
});

app.post('/api/record-document', async (req, res) => {
  if (!configReady('email')) return res.status(503).json({ error: 'PDF and email delivery is not configured on the document service.' });
  const accessToken = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) return res.status(401).json({ error: 'Sign in before creating a record copy.' });
  const user = await authenticate(accessToken);
  if (!user?.id) return res.status(401).json({ error: 'Your session has expired. Sign in again.' });
  const event = req.body?.event || {};
  const allowedTypes = new Set(['payment', 'payment_update', 'tenant_registration', 'team_assignment', 'maintenance', 'inspection', 'property_notice']);
  const type = String(event.type || '');
  const title = String(event.title || '').trim().slice(0, 120);
  const summary = String(event.summary || '').trim().slice(0, 500);
  const details = Array.isArray(event.details) ? event.details.slice(0, 20).map((item) => ({ label: String(item?.label || '').trim().slice(0, 80), value: String(item?.value || '').trim().slice(0, 300) })).filter((item) => item.label && item.value) : [];
  const tenantId = event.tenantId && /^[0-9a-f-]{36}$/i.test(String(event.tenantId)) ? String(event.tenantId) : null;
  const propertyId = event.propertyId && /^[0-9a-f-]{36}$/i.test(String(event.propertyId)) ? String(event.propertyId) : null;
  if (!allowedTypes.has(type) || title.length < 3 || !summary || !details.length) return res.status(400).json({ error: 'A valid record type, clear title, summary and record details are required.' });
  try {
    let tenant = null;
    if (tenantId) {
      tenant = (await supabaseRequest(`tenants?id=eq.${tenantId}&owner_id=eq.${user.id}&select=id,owner_id,full_name,email,property_id,agent_id,caretaker_id,lawyer_id,lease_start,lease_end,rent_amount`, accessToken))?.[0];
      if (!tenant) return res.status(404).json({ error: 'The linked tenant record was not found in your account.' });
    }
    let property = null;
    const linkedPropertyId = propertyId || tenant?.property_id || null;
    if (linkedPropertyId) {
      property = (await supabaseRequest(`properties?id=eq.${linkedPropertyId}&owner_id=eq.${user.id}&select=id,name,address,city,state,country`, accessToken))?.[0] || null;
    }
    const profile = (await supabaseRequest(`landlord_profiles?user_id=eq.${user.id}&select=full_name,business_name,phone`, accessToken))?.[0] || {};
    const staffIds = [tenant?.agent_id, tenant?.caretaker_id, tenant?.lawyer_id].filter(Boolean);
    const staff = staffIds.length ? await supabaseRequest(`staff?id=in.(${staffIds.join(',')})&owner_id=eq.${user.id}&select=full_name,email,role`, accessToken) : [];
    const recipientMap = new Map();
    for (const recipient of [{ email: user.email, name: profile.full_name || 'Property owner', role: 'property owner' }, { email: tenant?.email, name: tenant?.full_name, role: 'tenant' }, ...(staff || []).map((person) => ({ email: person.email, name: person.full_name, role: person.role }))]) {
      if (recipient.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) recipientMap.set(recipient.email.toLowerCase(), recipient);
    }
    const recipients = [...recipientMap.values()];
    const documentTitle = `${title} · ${tenant?.full_name || property?.name || 'Property record'}`;
    const safeId = safeName(tenant?.full_name || property?.name || 'record');
    const filename = `${safeName(type)}-${safeId}-${new Date().toISOString().slice(0, 10)}.pdf`;
    const pdf = createRecordUpdatePdf({
      brand: profile.business_name || 'Yemilaz Properties', title, subtitle: summary,
      recipient: tenant?.full_name || property?.name || profile.full_name || user.email,
      sections: [
        ...(tenant ? [{ type: 'paragraph', text: `Tenant: ${tenant.full_name} | Email: ${tenant.email || 'Not recorded'}` }] : []),
        ...(property ? [{ type: 'paragraph', text: `Property: ${property.name} | ${[property.address, property.city, property.state, property.country].filter(Boolean).join(', ')}` }] : []),
        ...details.map((item) => ({ type: 'paragraph', text: `${item.label}: ${item.value}` })),
      ],
    });
    const path = `${user.id}/${tenant?.id || 'records'}/${crypto.randomUUID()}/${filename}`;
    const upload = await fetch(`${supabaseUrl}/storage/v1/object/property-documents/${path}`, {
      method: 'POST', headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/pdf', 'x-upsert': 'false' }, body: pdf,
    });
    if (!upload.ok) throw new Error(`PDF storage failed (${upload.status}): ${(await upload.text()).slice(0, 200)}`);
    await supabaseRequest('property_documents', accessToken, {
      method: 'POST', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ owner_id: user.id, tenant_id: tenant?.id || null, property_id: linkedPropertyId, uploaded_by: user.id, title: documentTitle, storage_path: path, mime_type: 'application/pdf', recipient_emails: recipients.map((recipient) => recipient.email), document_category: type === 'payment' || type === 'payment_update' ? 'payment_receipt' : 'property_update' }),
    });
    const deliveryResults = [];
    for (const recipient of recipients) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST', headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: sender, to: [recipient.email], subject: `${profile.business_name || 'Yemilaz Properties'} | ${documentTitle}`, text: `Hello ${recipient.name || 'there'},\n\nAttached is your copy of “${title}”.\n\n${summary}\n\nThis PDF is also available in the property documents area of your account. Contact the property manager if anything needs correction.\n\nYemilaz Properties`, attachments: [{ filename, content: pdf.toString('base64') }] }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || result.error || `Email provider returned ${response.status}`);
        deliveryResults.push({ email: recipient.email, status: 'sent' });
      } catch (error) { deliveryResults.push({ email: recipient.email, status: 'failed', error: error.message }); }
    }
    res.json({ saved: true, title: documentTitle, recipients: deliveryResults });
  } catch (error) {
    console.error('Record PDF delivery failed:', error.message);
    res.status(500).json({ error: 'The record was saved, but its PDF copy could not be created or delivered.' });
  }
});

app.listen(port, () => console.log(`Yemilaz document service listening on ${port}`));
