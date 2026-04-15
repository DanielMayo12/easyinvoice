import { Invoice, LineItem } from '@/types/invoice';
import { calculateLineItemTotal, calculateInvoiceSubtotal, formatCurrency, formatDate } from '@/utils/invoice';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildLineItemRows(items: LineItem[], currency: string): string {
  return items
    .map(
      (item, index) => `
      <tr class="${index % 2 === 0 ? 'alt' : ''}">
        <td class="desc">${escapeHtml(item.description)}</td>
        <td class="center">${item.quantity}</td>
        <td class="right">${formatCurrency(item.rate, currency)}</td>
        <td class="right bold">${formatCurrency(calculateLineItemTotal(item), currency)}</td>
      </tr>`
    )
    .join('');
}

export function generateInvoiceHtml(invoice: Invoice, logoUri?: string): string {
  const subtotal = calculateInvoiceSubtotal(invoice.lineItems);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: #0F172A;
    background: #fff;
    padding: 40px;
    font-size: 13px;
    line-height: 1.5;
  }
  .accent-bar {
    height: 5px;
    background: #0F6FFF;
    border-radius: 3px;
    margin-bottom: 32px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 28px;
  }
  .logo {
    width: 60px;
    height: 60px;
    object-fit: contain;
    border-radius: 8px;
    margin-bottom: 10px;
  }
  .invoice-title {
    font-size: 32px;
    font-weight: 800;
    color: #0F6FFF;
    letter-spacing: 3px;
  }
  .invoice-num {
    font-size: 13px;
    color: #64748B;
    margin-top: 2px;
  }
  .dates { text-align: right; }
  .date-block { margin-bottom: 6px; }
  .date-label {
    font-size: 9px;
    font-weight: 700;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .date-value {
    font-size: 13px;
    font-weight: 600;
    color: #0F172A;
  }
  .divider {
    height: 1px;
    background: #E2E8F0;
    margin: 24px 0;
  }
  .parties {
    display: flex;
    gap: 40px;
    margin-bottom: 28px;
  }
  .party { flex: 1; }
  .party-tag {
    font-size: 9px;
    font-weight: 700;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }
  .party-name {
    font-size: 15px;
    font-weight: 700;
    color: #0F172A;
    margin-bottom: 3px;
  }
  .party-detail {
    font-size: 12px;
    color: #64748B;
    line-height: 1.6;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }
  thead tr {
    background: #F1F5F9;
  }
  thead th {
    font-size: 10px;
    font-weight: 700;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 10px 12px;
    text-align: left;
  }
  thead th.center { text-align: center; }
  thead th.right { text-align: right; }
  tbody td {
    padding: 12px;
    font-size: 13px;
    color: #0F172A;
    border-bottom: 1px solid #F1F5F9;
  }
  tbody tr.alt { background: rgba(248,250,252,0.5); }
  td.desc { }
  td.center { text-align: center; }
  td.right { text-align: right; }
  td.bold { font-weight: 600; }
  .totals {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 28px;
  }
  .totals-box { width: 240px; }
  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
  }
  .totals-label { font-size: 13px; color: #64748B; }
  .totals-value { font-size: 14px; font-weight: 600; color: #0F172A; }
  .totals-divider {
    height: 1px;
    background: #E2E8F0;
    margin: 10px 0;
  }
  .total-due-label { font-size: 16px; font-weight: 700; color: #0F172A; }
  .total-due-value { font-size: 20px; font-weight: 800; color: #0F6FFF; }
  .notes-box {
    background: #F8FAFC;
    border-radius: 8px;
    padding: 14px 16px;
    margin-top: 8px;
  }
  .notes-tag {
    font-size: 9px;
    font-weight: 700;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .notes-content {
    font-size: 13px;
    color: #64748B;
    line-height: 1.6;
  }
  .footer {
    margin-top: 40px;
    text-align: center;
    font-size: 11px;
    color: #C8CED6;
    letter-spacing: 0.3px;
  }
</style>
</head>
<body>
  <div class="accent-bar"></div>

  <div class="header">
    <div>
      ${logoUri ? `<img src="${logoUri}" class="logo" />` : ''}
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-num">${escapeHtml(invoice.invoiceNumber)}</div>
    </div>
    <div class="dates">
      <div class="date-block">
        <div class="date-label">Issued</div>
        <div class="date-value">${formatDate(invoice.issueDate)}</div>
      </div>
      <div class="date-block">
        <div class="date-label">Due</div>
        <div class="date-value">${formatDate(invoice.dueDate)}</div>
      </div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="parties">
    <div class="party">
      <div class="party-tag">From</div>
      ${invoice.businessName ? `<div class="party-name">${escapeHtml(invoice.businessName)}</div>` : ''}
      ${invoice.businessEmail ? `<div class="party-detail">${escapeHtml(invoice.businessEmail)}</div>` : ''}
      ${invoice.businessPhone ? `<div class="party-detail">${escapeHtml(invoice.businessPhone)}</div>` : ''}
      ${invoice.businessAddress ? `<div class="party-detail">${escapeHtml(invoice.businessAddress)}</div>` : ''}
    </div>
    <div class="party">
      <div class="party-tag">Bill To</div>
      <div class="party-name">${escapeHtml(invoice.clientName)}</div>
      ${invoice.clientEmail ? `<div class="party-detail">${escapeHtml(invoice.clientEmail)}</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="center">Qty</th>
        <th class="right">Rate</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${buildLineItemRows(invoice.lineItems, invoice.currency)}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row">
        <span class="totals-label">Subtotal</span>
        <span class="totals-value">${formatCurrency(subtotal, invoice.currency)}</span>
      </div>
      <div class="totals-divider"></div>
      <div class="totals-row">
        <span class="total-due-label">Total Due</span>
        <span class="total-due-value">${formatCurrency(subtotal, invoice.currency)}</span>
      </div>
    </div>
  </div>

  ${
    invoice.notes
      ? `<div class="notes-box">
          <div class="notes-tag">Notes</div>
          <div class="notes-content">${escapeHtml(invoice.notes)}</div>
        </div>`
      : ''
  }

  <div class="footer">Created with EasyInvoice</div>
</body>
</html>`;
}
