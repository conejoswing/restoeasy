
'use client';

import type { OrderItem } from '@/app/tables/[tableId]/page';
import type { DeliveryInfo } from '@/components/app/delivery-dialog';

// Helper to format currency (consistent with other parts of the app)
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

// Helper to format date and time
const formatDateTime = (date: Date): string => {
    return date.toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// --- Receipt Formatting Functions ---

export const formatKitchenOrderReceipt = (
    orderItems: OrderItem[],
    orderIdentifier: string,
    orderNumber: number,
    deliveryInfo?: DeliveryInfo | null
): string => {
    const time = formatDateTime(new Date());

    let itemsHtml = '';
    orderItems.forEach(item => {
        const modificationsText = item.selectedModifications && item.selectedModifications.length > 0
            ? `<br><small style="margin-left: 10px; font-weight: bold;">(${item.selectedModifications.join(', ')})</small>`
            : '';
        const ingredientsText = item.ingredients && item.ingredients.length > 0
            ? `<br><small style="margin-left: 10px; color: #333; font-style: italic;">Ingredientes: ${item.ingredients.join(', ')}</small>`
            : '';

        itemsHtml += `
      <tr>
        <td style="vertical-align: top; padding-right: 10px; font-weight: bold;">${item.quantity}x</td>
        <td>
          <span style="font-weight: bold;">${item.name}</span>
          ${modificationsText}
          ${ingredientsText}
        </td>
      </tr>
    `;
    });

    let deliveryHtml = '';
    if (orderIdentifier.toLowerCase().startsWith('delivery') && deliveryInfo) {
        deliveryHtml = `
        <div style="margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px;">
            <strong>Enviar a:</strong><br>
            ${deliveryInfo.name}<br>
            ${deliveryInfo.address}<br>
            ${deliveryInfo.phone}
        </div>
    `;
    }

    return `
    <html>
    <head>
      <title>Comanda</title>
      <style>
        @page { margin: 5mm; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 10pt;
          width: 70mm;
          color: #000;
          background-color: #fff;
        }
        h1 {
            font-size: 14pt;
            text-align: center;
            margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        td {
          padding: 2px 0;
        }
        .header-info {
            text-align: center;
            margin-bottom: 15px;
            font-size: 9pt;
        }
        .order-number {
            font-size: 12pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 5px;
        }
        .items-section {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #000;
        }
        hr {
            border: none;
            border-top: 1px dashed #000;
            margin: 10px 0;
        }
        strong { font-weight: bold; }
        small { font-size: 8pt; }
      </style>
    </head>
    <body>
      <h1>COMANDA: ${orderIdentifier.toUpperCase()}</h1>
      <div class="order-number">SU NÚMERO: ${String(orderNumber).padStart(3, '0')}</div>
      <div class="header-info">
        ${time}
      </div>
      <hr>
      <div class="items-section">
        <table>
         <thead>
            <tr><th colspan="2">Productos:</th></tr>
         </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>
      ${deliveryHtml}
    </body>
    </html>
  `;
};


export const formatCustomerReceipt = (
    orderItems: OrderItem[],
    totalAmount: number, // This is now the grand total including tip
    paymentMethod: string,
    tableId: string | number,
    deliveryInfo?: DeliveryInfo | null,
    tipAmount?: number // Optional tip amount
): string => {
    const isDelivery = tableId === 'delivery';
    const title = "BOLETA";
    const shopName = "El Bajón de la Cami";
    const time = formatDateTime(new Date());
    const orderIdentifier = isDelivery ? `Delivery: ${deliveryInfo?.name || 'Cliente'}` : `Mesa ${tableId}`;

    let subtotal = 0;
    let itemsHtml = '';
    orderItems.forEach(item => {
        const itemTotal = item.finalPrice * item.quantity;
        subtotal += itemTotal;
        const modificationsText = item.selectedModifications && item.selectedModifications.length > 0
            ? `<br><small style="margin-left: 10px; font-weight: bold;">(${item.selectedModifications.join(', ')})</small>`
            : '';

        itemsHtml += `
      <tr>
        <td style="font-weight: bold;">${item.quantity}x</td>
        <td>
            <span style="font-weight: bold;">${item.name}</span>
             ${modificationsText}
        </td>
        <td style="text-align: right; font-weight: bold;">${formatCurrency(itemTotal)}</td>
      </tr>
    `;
    });

    let deliveryFeeHtml = '';
    if (isDelivery && deliveryInfo && deliveryInfo.deliveryFee > 0) {
        deliveryFeeHtml = `
        <tr>
            <td colspan="2" style="font-weight: bold;">Costo Envío</td>
            <td style="text-align: right; font-weight: bold;">${formatCurrency(deliveryInfo.deliveryFee)}</td>
        </tr>
        `;
        subtotal += deliveryInfo.deliveryFee; // Add delivery fee to subtotal for display
    }

    let tipHtml = '';
    if (tipAmount && tipAmount > 0) {
        tipHtml = `
        <tr>
            <td colspan="2" style="font-weight: bold;">Propina (10%)</td>
            <td style="text-align: right; font-weight: bold;">${formatCurrency(tipAmount)}</td>
        </tr>
        `;
    }


    return `
    <html>
    <head>
      <title>${title}</title>
      <style>
         @page { margin: 5mm; }
         body { font-family: 'Courier New', Courier, monospace; font-size: 10pt; width: 70mm; color: #000; background-color: #fff; }
         h1, h2 { text-align: center; margin: 5px 0; }
         h1 { font-size: 14pt; }
         h2 { font-size: 12pt; }
         table { width: 100%; border-collapse: collapse; margin-top: 10px; }
         th, td { padding: 3px 0; }
         th { text-align: left; border-bottom: 1px solid #000; font-weight: bold;}
         .header-info, .footer-info { text-align: center; margin-bottom: 10px; font-size: 9pt; }
         .total-section { margin-top: 10px; padding-top: 5px; border-top: 1px solid #000; }
         .total-row td { font-weight: bold; }
         hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
         strong { font-weight: bold; }
         small { font-size: 8pt; }
         .right { text-align: right; }
      </style>
    </head>
    <body>
      <h2>${shopName}</h2>
      <div class="header-info">
        ${time}<br>
        ${orderIdentifier}
      </div>
      <hr>
      <table>
        <thead>
          <tr>
            <th>Cant</th>
            <th>Descripción</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          ${deliveryFeeHtml}
        </tbody>
      </table>
      <div class="total-section">
        <table>
          <tbody>
            ${tipHtml}
            <tr class="total-row">
              <td colspan="2">TOTAL</td>
              <td style="text-align: right;">${formatCurrency(totalAmount)}</td>
            </tr>
             <tr>
               <td colspan="3" style="padding-top: 5px;">Método Pago: ${paymentMethod}</td>
             </tr>
          </tbody>
        </table>
      </div>
      <hr>
      <div class="footer-info">
        ¡Gracias por su preferencia!
      </div>
    </body>
    </html>
  `;
};


export const formatCashClosingReceipt = (
    date: string,
    dailyTotals: {
        dailyCashIncome: number;
        dailyDebitCardIncome: number;
        dailyCreditCardIncome: number;
        dailyTransferIncome: number;
        dailyDeliveryFees: number;
        dailyTotalIncome: number;
        dailyExpenses: number;
        dailyNetTotal: number;
    }
): string => {
    const {
        dailyCashIncome, dailyDebitCardIncome, dailyCreditCardIncome, dailyTransferIncome,
        dailyDeliveryFees, dailyTotalIncome, dailyExpenses, dailyNetTotal
    } = dailyTotals;

    return `
    <html>
    <head>
      <title>Cierre de Caja</title>
       <style>
         @page { margin: 5mm; }
         body { font-family: 'Courier New', Courier, monospace; font-size: 10pt; width: 70mm; color: #000; background-color: #fff; }
         h1 { font-size: 14pt; text-align: center; margin-bottom: 5px; }
         .date { text-align: center; font-size: 9pt; margin-bottom: 15px; }
         table { width: 100%; border-collapse: collapse; }
         td { padding: 3px 0; }
         .label { padding-right: 10px; }
         .amount { text-align: right; }
         .total-row td { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; }
         hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
         strong { font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>CIERRE DE CAJA</h1>
      <div class="date">${date}</div>
      <table>
        <tbody>
          <tr><td class="label">Ingresos Efectivo:</td><td class="amount">${formatCurrency(dailyCashIncome)}</td></tr>
          <tr><td class="label">Ingresos T. Débito:</td><td class="amount">${formatCurrency(dailyDebitCardIncome)}</td></tr>
          <tr><td class="label">Ingresos T. Crédito:</td><td class="amount">${formatCurrency(dailyCreditCardIncome)}</td></tr>
          <tr><td class="label">Ingresos Transfer.:</td><td class="amount">${formatCurrency(dailyTransferIncome)}</td></tr>
          <tr><td class="label">Total Costo Envío:</td><td class="amount">${formatCurrency(dailyDeliveryFees)}</td></tr>
          <tr class="total-row">
             <td class="label">TOTAL INGRESOS:</td>
             <td class="amount">${formatCurrency(dailyTotalIncome)}</td>
          </tr>
          <tr><td colspan="2"><hr></td></tr>
          <tr><td class="label">Total Egresos:</td><td class="amount">${formatCurrency(dailyExpenses)}</td></tr>
          <tr><td colspan="2"><hr></td></tr>
          <tr class="total-row">
            <td class="label">TOTAL NETO:</td>
            <td class="amount">${formatCurrency(dailyNetTotal)}</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;
};


/**
 * Prints the given HTML content using a hidden iframe and the browser's print API.
 * Note: This method relies on the browser's print dialog and requires manual
 * printer selection by the user each time. For silent/direct printing,
 * a dedicated middleware or native application interacting with the printer SDK is recommended.
 * @param htmlContent The HTML string to print.
 */
export const printHtml = (htmlContent: string): void => {
    console.log("Attempting to print...");

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    try {
        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc) {
            throw new Error("Could not access iframe document.");
        }
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();
        console.log("HTML content written to iframe.");

        setTimeout(() => {
            try {
                 if (!iframe.contentWindow) {
                    throw new Error("Could not access iframe content window for printing.");
                }
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                console.log("Print dialog initiated.");

                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                        console.log("Iframe removed.");
                    }
                }, 1000);

            } catch (printError) {
                console.error('Error initiating print:', printError);
                if (iframe && document.body.contains(iframe)) {
                     document.body.removeChild(iframe);
                     console.log("Iframe removed after print error.");
                }
            }
        }, 500);

    } catch (writeError) {
        console.error('Error writing to iframe:', writeError);
        if (iframe && document.body.contains(iframe)) {
            document.body.removeChild(iframe);
            console.log("Iframe removed after write error.");
        }
    }
};
