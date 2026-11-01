function ascii(value) {
  return String(value ?? '')
    .replace(/[₦]/g, 'NGN ')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function wrap(value, max = 86) {
  const words = ascii(value).split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    if (!word) continue;
    if (line && `${line} ${word}`.length > max) { lines.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

function pdfEscape(value) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function renderPdf(lines) {
  const pages = [];
  while (lines.length) pages.push(lines.splice(0, 47));
  const objects = [];
  const add = (value) => { objects.push(value); return objects.length; };
  const catalogId = add('');
  const pagesId = add('');
  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds = [];
  for (const pageLines of pages) {
    const commands = ['BT', '/F1 10 Tf', '48 752 Td', '14 TL'];
    pageLines.forEach((line, index) => {
      if (index === 0) commands.push('/F1 15 Tf');
      if (line && /^[A-Z][A-Z0-9 &/()'-]{2,}$/.test(line)) commands.push('/F1 11 Tf');
      else if (index > 0) commands.push('/F1 9 Tf');
      commands.push(`(${pdfEscape(line)}) Tj`, 'T*');
    });
    commands.push('ET');
    const stream = commands.join('\n');
    const streamId = add(`<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`);
    const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${streamId} 0 R >>`);
    pageIds.push(pageId);
  }
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let output = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(output, 'ascii'));
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(output, 'ascii');
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { output += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(output, 'ascii');
}

export function createPdf({ tenant, landlord, property, guarantor, charges, recipient }) {
  const paid = charges.filter((charge) => charge.status === 'paid');
  const due = charges.filter((charge) => charge.status === 'unpaid');
  const totalPaid = paid.reduce((sum, charge) => sum + Number(charge.amount || 0), 0);
  const totalDue = due.reduce((sum, charge) => sum + Number(charge.amount || 0), 0);
  const rawSections = [
    ['TENANCY SUMMARY', [
      `Prepared for: ${recipient.name || recipient.email} (${recipient.role})`,
      `Landlord / business: ${landlord.full_name || ''} / ${landlord.business_name || ''}`,
      `Tenant: ${tenant.full_name} | Email: ${tenant.email || 'Not provided'} | Phone: ${tenant.phone || 'Not provided'}`,
      `Guarantor: ${guarantor?.full_name || 'Not provided'} | Relationship: ${guarantor?.relationship || 'Not recorded'}`,
      `Property: ${property?.name || 'Not allocated'} | Address: ${property?.address || 'Not recorded'} | Location: ${[property?.city, property?.state, property?.country].filter(Boolean).join(', ')}`,
      `Lease: ${tenant.lease_start} through ${tenant.lease_end} | Rent: NGN ${Number(tenant.rent_amount || 0).toLocaleString('en-NG')} ${tenant.rent_frequency || ''}`,
      `Deposit agreed: NGN ${Number(tenant.deposit_amount || 0).toLocaleString('en-NG')}`,
      `Landlord contact: ${landlord.phone || ''} ${landlord.business_address || ''}`,
    ]],
    ['PAYMENTS AND CHARGES', [
      `Recorded paid: NGN ${totalPaid.toLocaleString('en-NG')} | Outstanding recorded charges: NGN ${totalDue.toLocaleString('en-NG')}`,
      ...(charges.length ? charges.map((charge) => `${charge.status.toUpperCase()} - ${charge.description} (${charge.category}) - NGN ${Number(charge.amount || 0).toLocaleString('en-NG')} - due ${charge.due_date || 'not set'} - paid ${charge.paid_at || 'not paid'}`) : ['No payments or charges have been recorded yet.']),
      'This is a statement of entries recorded in the management system, not proof of any payment beyond the listed entries.',
    ]],
    ['AGREEMENT TERMS', [landlord.agreement_terms || 'No landlord agreement terms have been entered.']],
    ['HOUSE RULES', [landlord.house_rules || 'No house rules have been entered.']],
    ['ACKNOWLEDGEMENT AND SIGNATURES', [
      'The parties acknowledge receiving this summary and the attached terms and house rules.',
      'Landlord signature: ______________________________   Date: ______________',
      'Tenant signature: ________________________________   Date: ______________',
      'Guarantor signature: _____________________________   Date: ______________',
      'This packet is a record and draft template. It is not legal advice or a substitute for a locally reviewed tenancy agreement. The landlord and parties should have the document checked by a qualified lawyer before signing.',
    ]],
  ];
  const lines = [`YEMILAZ PROPERTIES  |  TENANCY DOCUMENT COPY`, `COPY FOR ${recipient.role.toUpperCase()} - ${recipient.name || recipient.email}`, `Generated ${new Date().toISOString().slice(0, 10)}`, ''];
  for (const [heading, paragraphs] of rawSections) {
    lines.push(heading);
    for (const paragraph of paragraphs) lines.push(...wrap(paragraph));
    lines.push('');
  }
  return renderPdf(lines);
}

export function createPaymentReceiptPdf({ charge, tenant, landlord, property }) {
  const lines = [
    'YEMILAZ PROPERTIES  |  PAYMENT RECEIPT',
    `RECEIPT ${String(charge.id || '').slice(0, 8).toUpperCase()}`,
    `Issued: ${new Date().toISOString().slice(0, 10)}`,
    '',
    'PAYMENT DETAILS',
    ...wrap(`Tenant: ${tenant.full_name} | Email: ${tenant.email || 'Not provided'} | Phone: ${tenant.phone || 'Not provided'}`),
    ...wrap(`Landlord: ${landlord.full_name || landlord.business_name || 'Not provided'} | Contact: ${landlord.phone || 'Not provided'}`),
    ...wrap(`Property: ${property?.name || 'Not allocated'} | Address: ${property?.address || 'Not recorded'} | Location: ${[property?.city, property?.state, property?.country].filter(Boolean).join(', ')}`),
    ...wrap(`Payment: ${charge.description || charge.category || 'Payment'} | Category: ${charge.category || 'Not recorded'}`),
    `Amount received: NGN ${Number(charge.amount || 0).toLocaleString('en-NG')}`,
    `Payment status: ${String(charge.status || '').toUpperCase()}`,
    `Date received: ${charge.paid_at || 'Not recorded'}`,
    '',
    'This receipt records a payment marked as paid in the landlord management system.',
    '',
    'Landlord / authorized agent: _________________________',
    'Tenant acknowledgement: ____________________________',
  ];
  return renderPdf(lines);
}
