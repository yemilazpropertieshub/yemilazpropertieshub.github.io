function ascii(value) {
  return String(value ?? '').replace(/[₦]/g, 'NGN ').normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function escapePdf(value) { return ascii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
function wrap(value, max = 92) {
  const words = ascii(value).split(' '); const lines = []; let line = '';
  for (const word of words) {
    if (!word) continue;
    if (line && `${line} ${word}`.length > max) { lines.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}
const money = (value) => `NGN ${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value) => {
  if (!value) return 'Not recorded';
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? String(value) : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parsed);
};
const cleanDate = () => new Date().toISOString().slice(0, 10);

function textAt(x, yTop, value, font = 'F1', size = 10, color = '0.16 0.22 0.25') {
  return `BT ${color} rg /${font} ${size} Tf 1 0 0 1 ${x} ${792 - yTop} Tm (${escapePdf(value)}) Tj ET`;
}
function rect(x, yTop, width, height, color) { return `${color} rg ${x} ${792 - yTop - height} ${width} ${height} re f`; }
function line(x1, y1, x2, y2, color = '0.87 0.90 0.88', width = 1) { return `${color} RG ${width} w ${x1} ${792-y1} m ${x2} ${792-y2} l S`; }

function renderDocument({ brand = 'Yemilaz Properties', title, subtitle = '', recipient = '', sections = [] }) {
  const pages = []; let ops = []; let y = 148;
  const startPage = () => { ops = [rect(0, 0, 612, 116, '0.07 0.31 0.28'), rect(0, 112, 612, 4, '0.79 0.62 0.34')];
    ops.push(textAt(42, 34, ascii(brand).toUpperCase(), 'F2', 9, '0.93 0.84 0.66'));
    ops.push(textAt(42, 67, title, 'F2', 22, '1 1 1'));
    if (subtitle) ops.push(textAt(42, 91, subtitle, 'F1', 9, '0.86 0.92 0.89'));
    if (recipient) ops.push(textAt(42, 105, `Prepared for ${recipient}`, 'F1', 8, '0.86 0.92 0.89'));
    y = 145; };
  const finishPage = () => { pages.push(ops); startPage(); };
  const ensure = (height) => { if (y + height > 738) finishPage(); };
  startPage();
  for (const section of sections) {
    if (section.type === 'section') {
      ensure(34); ops.push(rect(42, y - 1, 3, 18, '0.08 0.40 0.35'));
      ops.push(textAt(54, y + 12, section.title.toUpperCase(), 'F2', 10, '0.08 0.31 0.28'));
      y += 27; continue;
    }
    if (section.type === 'paragraph' || section.type === 'bullet') {
      const lines = wrap(section.text, section.type === 'bullet' ? 86 : 96); const h = lines.length * 14 + 7; ensure(h);
      lines.forEach((item, index) => ops.push(textAt(section.type === 'bullet' ? 58 : 48, y + index * 14, `${section.type === 'bullet' && index === 0 ? '-  ' : ''}${item}`, 'F1', 9, '0.18 0.24 0.25')));
      y += h; continue;
    }
    if (section.type === 'callout') {
      const lines = wrap(section.text, 92); const h = lines.length * 14 + 22; ensure(h);
      ops.push(rect(42, y, 528, h, '0.93 0.96 0.94'));
      lines.forEach((item, index) => ops.push(textAt(54, y + 16 + index * 14, item, 'F1', 8, '0.18 0.31 0.28')));
      y += h + 8; continue;
    }
    if (section.type === 'table') {
      const widths = section.widths || section.headers.map(() => 528 / section.headers.length);
      const drawRow = (cells, header = false) => {
        const linesByCell = cells.map((cell, index) => wrap(cell, Math.max(10, Math.floor(widths[index] / (header ? 6 : 6.1)))));
        const height = Math.max(24, Math.max(...linesByCell.map((cell) => cell.length)) * 12 + 10); ensure(height);
        ops.push(rect(42, y, 528, height, header ? '0.91 0.95 0.93' : (section.rowIndex++ % 2 ? '0.97 0.98 0.97' : '1 1 1')));
        let x = 48;
        linesByCell.forEach((cellLines, index) => {
          cellLines.forEach((cell, lineIndex) => ops.push(textAt(x, y + 15 + lineIndex * 12, cell, header ? 'F2' : 'F1', header ? 7 : 7.5, header ? '0.08 0.31 0.28' : '0.20 0.25 0.25')));
          x += widths[index];
        });
        ops.push(line(42, y + height, 570, y + height)); y += height;
      };
      section.rowIndex = 0; drawRow(section.headers, true); section.rows.forEach((row) => drawRow(row)); y += 8; continue;
    }
    if (section.type === 'signatures') {
      ensure(92); const labels = section.labels || ['Landlord / authorized representative', 'Tenant', 'Guarantor'];
      labels.forEach((label) => { ops.push(textAt(48, y + 10, label, 'F2', 8, '0.25 0.31 0.30')); ops.push(line(48, y + 34, 386, y + 34)); ops.push(textAt(410, y + 10, 'Date', 'F2', 8, '0.25 0.31 0.30')); ops.push(line(438, y + 34, 560, y + 34)); y += 48; });
      continue;
    }
    if (section.type === 'spacer') y += section.height || 10;
  }
  if (ops.length) pages.push(ops);
  pages.forEach((page, index) => {
    page.push(line(42, 754, 570, 754));
    page.push(textAt(42, 772, `${ascii(brand)}  |  Private tenancy record  |  Generated ${cleanDate()}`, 'F1', 7, '0.40 0.47 0.45'));
    page.push(textAt(522, 772, `${index + 1} / ${pages.length}`, 'F2', 7, '0.08 0.31 0.28'));
  });
  const objects = []; const add = (value) => { objects.push(value); return objects.length; };
  const catalogId = add(''); const pagesId = add('');
  const regularId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const boldId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'); const pageIds = [];
  for (const pageOps of pages) {
    const stream = pageOps.join('\n');
    const streamId = add(`<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`);
    pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${regularId} 0 R /F2 ${boldId} 0 R >> >> /Contents ${streamId} 0 R >>`));
  }
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let output = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(output, 'ascii')); output += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xrefOffset = Buffer.byteLength(output, 'ascii'); output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { output += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(output, 'ascii');
}

function address(property) { return [property?.address, property?.city, property?.state, property?.country].filter(Boolean).join(', ') || 'Not recorded'; }
function details(brand, title, subtitle, recipient, blocks) { return renderDocument({ brand, title, subtitle, recipient, sections: blocks }); }

export function createPdf({ tenant, landlord, property, guarantor, charges = [], recipient, ownerEmail = '' }) {
  const paid = charges.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const outstanding = charges.filter((item) => item.status === 'unpaid').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const brand = landlord.business_name || 'Yemilaz Properties';
  return details(brand, 'TENANCY FILE', 'Tenant overview and recorded account snapshot', `${recipient.name || recipient.email || recipient.role} - ${recipient.role}`, [
    { type: 'section', title: 'Parties and contacts' },
    { type: 'table', headers: ['Role', 'Name', 'Email', 'Phone'], widths: [74, 158, 190, 106], rows: [
      ['Landlord', landlord.full_name || brand, ownerEmail || 'Not recorded', landlord.phone || 'Not recorded'],
      ['Tenant', tenant.full_name, tenant.email || 'Not recorded', tenant.phone || 'Not recorded'],
      ['Guarantor', guarantor?.full_name || 'Not recorded', guarantor?.email || '', guarantor?.phone || ''],
    ] },
    { type: 'section', title: 'Property and lease' },
    { type: 'paragraph', text: `Property: ${property?.name || 'Not allocated'} | Address: ${address(property)}` },
    { type: 'paragraph', text: `Lease term: ${date(tenant.lease_start)} to ${date(tenant.lease_end)} | Status: ${tenant.status || 'Not recorded'}` },
    { type: 'paragraph', text: `Rent: ${money(tenant.rent_amount)} per ${tenant.rent_frequency || 'period'} | Deposit agreed: ${money(tenant.deposit_amount)}` },
    { type: 'section', title: 'Account snapshot' },
    { type: 'table', headers: ['Recorded paid', 'Outstanding charges', 'Recorded entries'], widths: [176, 176, 176], rows: [[money(paid), money(outstanding), String(charges.length)]] },
    { type: 'callout', text: 'This file reflects information entered in the property management system on the generation date. Confirm terms and payment records with the parties before relying on them.' },
  ]);
}

function addMonths(dateValue, months) {
  const d = new Date(`${String(dateValue).slice(0, 10)}T00:00:00Z`); const day = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last)); return d.toISOString().slice(0, 10);
}
function rentSchedule(tenant) {
  const interval = tenant.rent_frequency === 'monthly' ? 1 : tenant.rent_frequency === 'quarterly' ? 3 : 12;
  const end = String(tenant.lease_end || '').slice(0, 10); const rows = [];
  for (let i = 0; i < 120; i++) {
    const due = addMonths(tenant.lease_start, i * interval); if (!due || due > end) break;
    rows.push([String(i + 1).padStart(2, '0'), date(due), money(tenant.rent_amount), 'As recorded in lease']);
  }
  return rows;
}

export function createTenantDocumentSet({ tenant, landlord, property, guarantor, charges = [], agent, caretaker, ownerEmail = '' }) {
  const brand = landlord.business_name || 'Yemilaz Properties'; const tenantName = tenant.full_name || 'Tenant';
  const docs = [
    { name: '00-Document-Guide.pdf', data: details(brand, 'TENANCY DOCUMENT PACK', 'Prepared documents and how to use them', tenantName, [
      { type: 'paragraph', text: `Prepared for ${tenantName} | Premises: ${property?.name || 'Not allocated'} | Generated ${date(cleanDate())}` },
      { type: 'section', title: 'Documents in this pack' },
      ...['Tenancy overview and account snapshot','Tenancy agreement draft for local legal review','House rules and acknowledgement','Rent schedule calculated from lease dates','Payment ledger from recorded charges','Property handover and condition checklist','Contacts and property details','Individual payment receipts for charges marked paid'].map((text) => ({ type: 'bullet', text })),
      { type: 'callout', text: 'The ZIP also includes separate copies addressed to the landlord and tenant, and to any guarantor, lawyer, agent, or caretaker with a recorded email/contact. Review all names, dates, amounts, and terms before sharing or signing.' },
      { type: 'callout', text: 'Templates and schedules are administrative records, not legal advice or confirmation of payment. Have the tenancy agreement reviewed for the applicable jurisdiction.' },
    ]) },
    { name: '01-Tenancy-Overview.pdf', data: createPdf({ tenant, landlord, property, guarantor, charges, recipient: { role: 'Management file', name: tenantName }, ownerEmail }) },
    { name: '02-Tenancy-Agreement-Draft.pdf', data: details(brand, 'TENANCY AGREEMENT', 'Draft for review and completion by the parties', tenantName, [
      { type: 'callout', text: 'Draft record only. Have a qualified local lawyer review this document and confirm any required disclosures, notices, deposits, and execution formalities before signing.' },
      { type: 'section', title: 'Parties and premises' },
      { type: 'paragraph', text: `Landlord: ${landlord.full_name || brand} | Business: ${brand} | Contact: ${landlord.phone || 'Not recorded'} | Address: ${landlord.business_address || 'Not recorded'}` },
      { type: 'paragraph', text: `Tenant: ${tenantName} | Email: ${tenant.email || 'Not recorded'} | Phone: ${tenant.phone || 'Not recorded'}` },
      { type: 'paragraph', text: `Premises: ${property?.name || 'Not allocated'} | ${address(property)}` },
      { type: 'section', title: 'Term and financial terms' },
      { type: 'table', headers: ['Lease start', 'Lease end', 'Rent / frequency', 'Deposit agreed'], widths: [120, 120, 145, 143], rows: [[date(tenant.lease_start), date(tenant.lease_end), `${money(tenant.rent_amount)} / ${tenant.rent_frequency || 'period'}`, money(tenant.deposit_amount)]] },
      { type: 'section', title: 'Additional agreement terms' },
      ...wrap(landlord.agreement_terms || 'No additional agreement terms are recorded.', 96).map((text) => ({ type: 'paragraph', text })),
      { type: 'section', title: 'Execution' }, { type: 'signatures' },
    ]) },
    { name: '03-House-Rules.pdf', data: details(brand, 'HOUSE RULES', 'Property use, care, and shared responsibilities', tenantName, [
      { type: 'paragraph', text: `Premises: ${property?.name || 'Not allocated'} | ${address(property)}` },
      { type: 'section', title: 'Rules provided by the property manager' },
      ...String(landlord.house_rules || 'No house rules have been recorded.').split(/\n+/).filter(Boolean).map((text) => ({ type: 'bullet', text: text.replace(/^[-*•\d. ]+/, '') })),
      { type: 'section', title: 'Acknowledgement' }, { type: 'paragraph', text: 'The undersigned confirm that these rules were provided for review. Any enforceability or variation should be confirmed in the signed tenancy agreement.' }, { type: 'signatures', labels: ['Landlord / authorized representative', 'Tenant'] },
    ]) },
    { name: '04-Rent-Schedule.pdf', data: details(brand, 'RENT SCHEDULE', 'Scheduled instalments based on the recorded lease term', tenantName, [
      { type: 'paragraph', text: `Premises: ${property?.name || 'Not allocated'} | Lease: ${date(tenant.lease_start)} to ${date(tenant.lease_end)} | Frequency: ${tenant.rent_frequency || 'Not recorded'}` },
      { type: 'table', headers: ['Instalment', 'Scheduled date', 'Amount', 'Basis'], widths: [74, 112, 126, 216], rows: rentSchedule(tenant) },
      { type: 'callout', text: 'Dates are calculated from the recorded lease start date and frequency. Confirm the actual due-day, prorations, grace periods, and any agreed adjustments with the signed agreement.' },
    ]) },
    { name: '05-Payment-Ledger.pdf', data: details(brand, 'PAYMENT LEDGER', 'Charges and payments recorded for this tenant', tenantName, [
      { type: 'paragraph', text: `Premises: ${property?.name || 'Not allocated'} | Generated ${date(cleanDate())}` },
      { type: 'table', headers: ['Description', 'Type', 'Status', 'Due', 'Paid', 'Amount'], widths: [142, 70, 64, 76, 76, 100], rows: charges.length ? charges.map((item) => [item.description, item.category, item.status, date(item.due_date), date(item.paid_at), money(item.amount)]) : [['No entries recorded', '', '', '', '', '']] },
      { type: 'callout', text: 'Only charges recorded in this system are shown. A status of paid reflects the manager’s entry and is not independent confirmation of bank settlement.' },
    ]) },
    { name: '06-Property-Handover-Checklist.pdf', data: details(brand, 'PROPERTY HANDOVER', 'Move-in condition and key handover record', tenantName, [
      { type: 'paragraph', text: `Premises: ${property?.name || 'Not allocated'} | Address: ${address(property)} | Inspection date: __________________` },
      { type: 'section', title: 'Condition checklist' },
      { type: 'table', headers: ['Area / item', 'Condition', 'Notes / meter reading'], widths: [174, 120, 234], rows: ['Entrance and locks','Living areas','Kitchen and appliances','Bedrooms','Bathrooms and plumbing','Windows and glazing','Electrical fittings','Walls, floors and ceilings','Water / utility meters','Keys, remotes and access cards','Other items'].map((item) => [item, '________________', '________________________________']) },
      { type: 'paragraph', text: 'Attach dated photographs separately where available. Record existing damage and meter readings before the tenant takes possession.' },
      { type: 'signatures', labels: ['Landlord / representative', 'Tenant'] },
    ]) },
    { name: '07-Contacts-and-Property-Details.pdf', data: details(brand, 'CONTACTS & PROPERTY', 'Key tenancy contacts and reference details', tenantName, [
      { type: 'section', title: 'Premises' }, { type: 'paragraph', text: `${property?.name || 'Not allocated'} | ${address(property)}` },
      { type: 'table', headers: ['Contact role', 'Name', 'Email', 'Telephone'], widths: [100, 142, 180, 106], rows: [
        ['Landlord', landlord.full_name || brand, ownerEmail || 'Not recorded', landlord.phone || ''],
        ['Tenant', tenantName, tenant.email || '', tenant.phone || ''],
        ['Guarantor', guarantor?.full_name || 'Not recorded', guarantor?.email || '', guarantor?.phone || ''],
        ['Agent', agent?.full_name || 'Not assigned', agent?.email || '', agent?.phone || ''],
        ['Caretaker', caretaker?.full_name || 'Not assigned', caretaker?.email || '', caretaker?.phone || ''],
        ['Lawyer', landlord.lawyer_name || 'Not recorded', landlord.lawyer_email || '', ''],
      ] },
      { type: 'section', title: 'Emergency information' }, { type: 'paragraph', text: 'Local emergency contact: __________________________________ | Utility / facility contact: __________________________________' },
      { type: 'callout', text: 'Add local emergency numbers and building contacts after confirming them. This document does not invent or verify emergency contact details.' },
    ]) },
  ];
  return docs;
}

export function createPaymentReceiptPdf({ charge, tenant, landlord, property }) {
  const brand = landlord.business_name || 'Yemilaz Properties';
  return details(brand, 'PAYMENT RECEIPT', `Receipt reference ${String(charge.id || '').slice(0, 8).toUpperCase()}`, tenant.full_name, [
    { type: 'section', title: 'Receipt summary' },
    { type: 'table', headers: ['Amount received', 'Payment date', 'Status'], widths: [190, 190, 148], rows: [[money(charge.amount), date(charge.paid_at), String(charge.status || '').toUpperCase()]] },
    { type: 'section', title: 'Parties and premises' },
    { type: 'paragraph', text: `Received from: ${tenant.full_name} | Email: ${tenant.email || 'Not recorded'} | Phone: ${tenant.phone || 'Not recorded'}` },
    { type: 'paragraph', text: `Received by: ${landlord.full_name || brand} | Contact: ${landlord.phone || 'Not recorded'}` },
    { type: 'paragraph', text: `Premises: ${property?.name || 'Not allocated'} | ${address(property)}` },
    { type: 'section', title: 'Transaction details' },
    { type: 'table', headers: ['Description', 'Category', 'Recorded due date', 'Reference'], widths: [194, 100, 118, 116], rows: [[charge.description || 'Payment', charge.category || 'Other', date(charge.due_date), String(charge.id || '').slice(0, 12).toUpperCase()]] },
    { type: 'callout', text: 'This receipt is generated from a payment marked as paid in the property management system. Keep it with your bank or payment-provider confirmation.' },
    { type: 'signatures', labels: ['Landlord / authorized representative', 'Tenant acknowledgement'] },
  ]);
}
