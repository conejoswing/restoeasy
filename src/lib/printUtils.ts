
'use client';

import type { OrderItem, PaymentMethod } from '@/app/tables/[tableId]/page';
import type { DeliveryInfo } from '@/components/app/delivery-dialog';
import type { CashMovement } from '@/app/expenses/page'; // Import CashMovement type
import type { InventoryItem } from '@/app/inventory/page'; // Import InventoryItem type
import { format, isToday } from 'date-fns'; // Import format and isToday from date-fns

// Helper to format currency (consistent with other parts of the app)
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

// Helper to format date and time
const formatDateTime = (date: Date, includeTime: boolean = true): string => {
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    return date.toLocaleString('es-CL', options);
};

// --- Receipt Formatting Functions ---

export const formatKitchenOrderReceipt = (
    orderItems: OrderItem[],
    orderIdentifier: string, // This will be tableDisplayName ("Mesa 1", "Mesón", "Delivery")
    orderNumber: number,
    deliveryInfo?: DeliveryInfo | null
): string => {
    const time = formatDateTime(new Date());

    let itemsHtml = '';
    orderItems.forEach(item => {
        const categoryLine = `<p style="font-size: 11pt; margin-bottom: 0; margin-top: 8px; font-weight: bold;">- ${item.category.toUpperCase()}</p>`;
        const itemNameLine = `<p style="font-size: 12pt; margin-left: 15px; margin-top: 0; margin-bottom: 0; font-weight: bold;">${item.quantity}x ${item.name}</p>`;
        
        const modificationsLine = item.selectedModifications && item.selectedModifications.length > 0
            ? `<p style="font-size: 10pt; margin-left: 15px; margin-top: 0; margin-bottom: 0; font-weight: bold;">(${item.selectedModifications.join(', ')})</p>`
            : '';
            
        const observationLine = item.observation
            ? `<p style="font-size: 10pt; margin-left: 15px; margin-top: 2px; margin-bottom: 0; font-weight: bold;">Obs: ${item.observation}</p>`
            : '';

        let ingredientsLines = '';
        if (item.ingredients && item.ingredients.length > 0) {
            const ingredientsLabel = "Incluye:";
            ingredientsLines = `
                <p style="font-size: 10pt; margin-left: 15px; margin-top: 2px; margin-bottom: 0; font-weight: bold;">${ingredientsLabel}</p>
                <p style="font-size: 10pt; margin-left: 25px; margin-top: 0; margin-bottom: 0; font-weight: bold;">${item.ingredients.join(', ')}</p>
            `;
        }


        itemsHtml += `
            <div style="margin-bottom: 8px;">
                ${categoryLine}
                ${itemNameLine}
                ${modificationsLine}
                ${observationLine}
                ${ingredientsLines}
            </div>
        `;
    });
    
    const deliveryHtml = deliveryInfo && orderIdentifier.toLowerCase().startsWith('delivery') ? `
        <div class="delivery-info">
            <strong style="font-weight: bold;">Enviar a:</strong><br>
            <span style="font-weight: bold;">${deliveryInfo.name}</span><br>
            <span style="font-weight: bold;">${deliveryInfo.address}</span><br>
            <span style="font-weight: bold;">${deliveryInfo.phone}</span>
        </div>
      ` : '';

    return `
    <html>
    <head>
      <title>Comanda</title>
      <style>
        @page { margin: 5mm; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 10pt; /* Default, can be overridden */
          width: 70mm; /* Standard thermal printer width */
          color: #000;
          background-color: #fff;
          font-weight: bold;
        }
        .order-number-title { 
            font-size: 28pt; 
            text-align: center;
            margin-bottom: 2px; 
            font-weight: bold;
        }
        .comanda-identifier-title { 
            font-size: 14pt; 
            text-align: center;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .header-date-time { 
            text-align: center;
            margin-bottom: 10px;
            font-size: 9pt;
            font-weight: bold;
        }
        .products-title { 
            font-size: 11pt; 
            text-align: left;
            margin-top: 10px; 
            margin-bottom: 5px;
            font-weight: bold;
        }
        .items-section {
            margin-top: 5px;
        }
        hr {
            border: none;
            border-top: 1px dashed #000;
            margin: 10px 0;
        }
        p { 
            margin: 0;
            padding: 0;
            line-height: 1.3; 
            font-weight: bold;
        }
        .delivery-info { 
            margin-top: 15px; 
            border-top: 1px dashed #000; 
            padding-top: 10px; 
            font-size: 10pt;
            font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="order-number-title">ORDEN #${String(orderNumber).padStart(3, '0')}</div>
      <div class="comanda-identifier-title">COMANDA - ${orderIdentifier.toUpperCase()}</div>
      <div class="header-date-time">${time}</div>
      <hr>
      <div class="products-title">Productos:</div>
      <div class="items-section">
        ${itemsHtml}
      </div>
      ${deliveryHtml}
    </body>
    </html>
  `;
};


export const formatCustomerReceipt = (
    orderItems: OrderItem[],
    totalAmount: number, // This is the GRAND TOTAL (including tip and delivery fee if applicable)
    paymentMethod: string,
    tableIdentifier: string, 
    orderNumber: number,
    deliveryInfo?: DeliveryInfo | null, 
    tipAmount?: number // Tip amount itself
): string => {
    const isDelivery = tableIdentifier.toLowerCase().startsWith('delivery');
    const title = "BOLETA";
    const shopName = "El Bajón de la Cami";
    const time = formatDateTime(new Date());
    
    let subtotalFromItems = 0;
    let itemsHtml = '';
    orderItems.forEach(item => {
        const itemTotal = item.finalPrice * item.quantity;
        subtotalFromItems += itemTotal;
        const modificationsText = item.selectedModifications && item.selectedModifications.length > 0
            ? `<br><small style="margin-left: 10px; font-weight: bold;">(${item.selectedModifications.join(', ')})</small>`
            : '';
        
        const observationText = item.observation
            ? `<br><small style="margin-left: 10px; font-weight: bold; color: #555;">Obs: ${item.observation}</small>`
            : '';

        const ingredientsText = item.ingredients && item.ingredients.length > 0 && (item.category.toLowerCase().includes('promo') || item.category.toLowerCase().includes('fajitas'))
            ? `<br><small style="margin-left: 10px; font-weight: bold; color: #333;"><em>Incluye: ${item.ingredients.join(', ')}</em></small>`
            : '';


        itemsHtml += `
      <tr>
        <td style="font-weight: bold;">${item.quantity}x</td>
        <td>
            <span style="font-weight: bold;">${item.name}</span>
             ${modificationsText}
             ${ingredientsText}
             ${observationText}
        </td>
        <td style="text-align: right; font-weight: bold;">${formatCurrency(itemTotal)}</td>
      </tr>
    `;
    });

    let deliveryFeeForReceipt = 0;
    if (isDelivery && deliveryInfo && deliveryInfo.deliveryFee > 0) {
        deliveryFeeForReceipt = deliveryInfo.deliveryFee;
    }
    // Subtotal for display = sum of items + delivery fee (if any)
    const displaySubtotal = subtotalFromItems + deliveryFeeForReceipt;


    let deliveryFeeHtml = '';
    if (deliveryFeeForReceipt > 0) {
        deliveryFeeHtml = `
        <tr>
            <td colspan="2" style="font-weight: bold;">Costo Envío</td>
            <td style="text-align: right; font-weight: bold;">${formatCurrency(deliveryFeeForReceipt)}</td>
        </tr>
        `;
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
         body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 10pt; width: 70mm;
            color: #000;
            background-color: #fff;
            font-weight: bold;
         }
         .shop-name { font-size: 14pt; text-align: center; margin-bottom: 5px; font-weight: bold; }
         .receipt-title { font-size: 12pt; text-align: center; margin-bottom: 5px; font-weight: bold; }

         .order-number-customer { 
            font-size: 20pt; 
            text-align: center;
            margin-bottom: 1px;
            font-weight: bold;
         }
         .table-identifier-customer {
            font-size: 11pt;
            text-align: center;
            margin-bottom: 3px;
            font-weight: bold;
         }
         .date-time-customer {
            text-align: center;
            margin-bottom: 10px;
            font-size: 9pt;
            font-weight: bold;
         }

         table { width: 100%; border-collapse: collapse; margin-top: 10px; }
         th, td { padding: 3px 0; font-weight: bold; }
         th { text-align: left; border-bottom: 1px solid #000; font-weight: bold;}
         .total-section { margin-top: 10px; padding-top: 5px; border-top: 1px solid #000; }
         .total-row td { font-weight: bold; }
         hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
         strong { font-weight: bold; }
         small { font-size: 8pt; font-weight: bold; }
         .right { text-align: right; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="shop-name">${shopName}</div>
      <div class="receipt-title">${title}</div>
      
      <div class="order-number-customer">ORDEN #${String(orderNumber).padStart(3, '0')}</div>
      <div class="table-identifier-customer">${tableIdentifier.toUpperCase()}</div>
      <div class="date-time-customer">${time}</div>
      
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
        </tbody>
      </table>
       <div class="total-section">
        <table>
          <tbody>
            <tr>
                <td colspan="2" style="font-weight: bold;">SUBTOTAL</td>
                <td style="text-align: right; font-weight: bold;">${formatCurrency(displaySubtotal)}</td>
            </tr>
            ${deliveryFeeHtml} 
            ${tipHtml}
            <tr class="total-row">
              <td colspan="2">TOTAL</td>
              <td style="text-align: right;">${formatCurrency(totalAmount)}</td>
            </tr>
             <tr>
               <td colspan="3" style="padding-top: 5px; font-weight: bold;">Método Pago: ${paymentMethod}</td>
             </tr>
          </tbody>
        </table>
      </div>
      <hr>
      <div class="footer-info" style="text-align: center; font-size: 9pt; font-weight: bold;">
        ¡Gracias por su preferencia!
      </div>
    </body>
    </html>
  `;
};


export const formatPendingOrderCopy = (
    orderItems: OrderItem[],
    tableIdentifier: string, 
    orderNumber: number,
    deliveryInfo?: DeliveryInfo | null,
    includeTip?: boolean, // New: flag to include tip
    tipAmountForCopy?: number // New: tip amount for the copy
): string => {
    const isDelivery = tableIdentifier.toLowerCase().startsWith('delivery');
    const title = "DETALLE PEDIDO (PRE-CUENTA)";
    const shopName = "El Bajón de la Cami";
    const time = formatDateTime(new Date());
    
    let subtotalFromItems = 0;
    let itemsHtml = '';
    orderItems.forEach(item => {
        const itemTotal = item.finalPrice * item.quantity;
        subtotalFromItems += itemTotal;
        const modificationsText = item.selectedModifications && item.selectedModifications.length > 0
            ? `<br><small style="margin-left: 10px; font-weight: bold;">(${item.selectedModifications.join(', ')})</small>`
            : '';
        
        const observationText = item.observation
            ? `<br><small style="margin-left: 10px; font-weight: bold; color: #555;">Obs: ${item.observation}</small>`
            : '';

        const ingredientsText = item.ingredients && item.ingredients.length > 0 && (item.category.toLowerCase().includes('promo') || item.category.toLowerCase().includes('fajitas'))
            ? `<br><small style="margin-left: 10px; font-weight: bold; color: #333;"><em>Incluye: ${item.ingredients.join(', ')}</em></small>`
            : '';

        itemsHtml += `
      <tr>
        <td style="font-weight: bold;">${item.quantity}x</td>
        <td>
            <span style="font-weight: bold;">${item.name}</span>
             ${modificationsText}
             ${ingredientsText}
             ${observationText}
        </td>
        <td style="text-align: right; font-weight: bold;">${formatCurrency(itemTotal)}</td>
      </tr>
    `;
    });

    let deliveryFeeForCopy = 0;
    if (isDelivery && deliveryInfo && deliveryInfo.deliveryFee > 0) {
        deliveryFeeForCopy = deliveryInfo.deliveryFee;
    }
    const subtotalWithDelivery = subtotalFromItems + deliveryFeeForCopy;

    let tipHtml = '';
    let finalTotalForCopy = subtotalWithDelivery;

    if (includeTip && tipAmountForCopy && tipAmountForCopy > 0) {
        finalTotalForCopy += tipAmountForCopy;
        tipHtml = `
        <tr>
            <td colspan="2" style="font-weight: bold;">Propina Sugerida (10%)</td>
            <td style="text-align: right; font-weight: bold;">${formatCurrency(tipAmountForCopy)}</td>
        </tr>
        `;
    }
    
    let deliveryFeeHtml = '';
     if (deliveryFeeForCopy > 0) {
        deliveryFeeHtml = `
        <tr>
            <td colspan="2" style="font-weight: bold;">Costo Envío</td>
            <td style="text-align: right; font-weight: bold;">${formatCurrency(deliveryFeeForCopy)}</td>
        </tr>
        `;
    }


    return `
    <html>
    <head>
      <title>${title}</title>
      <style>
         @page { margin: 5mm; }
         body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 10pt; width: 70mm;
            color: #000;
            background-color: #fff;
            font-weight: bold;
         }
         .shop-name { font-size: 14pt; text-align: center; margin-bottom: 5px; font-weight: bold; }
         .receipt-title { font-size: 11pt; text-align: center; margin-bottom: 5px; font-weight: bold; }

         .order-number-customer { 
            font-size: 20pt; 
            text-align: center;
            margin-bottom: 1px;
            font-weight: bold;
         }
         .table-identifier-customer {
            font-size: 11pt;
            text-align: center;
            margin-bottom: 3px;
            font-weight: bold;
         }
         .date-time-customer {
            text-align: center;
            margin-bottom: 10px;
            font-size: 9pt;
            font-weight: bold;
         }

         table { width: 100%; border-collapse: collapse; margin-top: 10px; }
         th, td { padding: 3px 0; font-weight: bold; }
         th { text-align: left; border-bottom: 1px solid #000; font-weight: bold;}
         .total-section { margin-top: 10px; padding-top: 5px; border-top: 1px solid #000; }
         .total-row td { font-weight: bold; }
         hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
         strong { font-weight: bold; }
         small { font-size: 8pt; font-weight: bold; }
         .right { text-align: right; font-weight: bold; }
         .footer-info { text-align: center; font-size: 9pt; font-weight: bold; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="shop-name">${shopName}</div>
      <div class="receipt-title">${title}</div>
      
      <div class="order-number-customer">ORDEN #${String(orderNumber).padStart(3, '0')}</div>
      <div class="table-identifier-customer">${tableIdentifier.toUpperCase()}</div>
      <div class="date-time-customer">${time}</div>
      
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
        </tbody>
      </table>
      <div class="total-section">
        <table>
          <tbody>
            <tr>
                <td colspan="2" style="font-weight: bold;">SUBTOTAL</td>
                <td style="text-align: right; font-weight: bold;">${formatCurrency(subtotalWithDelivery)}</td>
            </tr>
            ${deliveryFeeHtml}
            ${tipHtml}
            <tr class="total-row">
              <td colspan="2">TOTAL A PAGAR</td>
              <td style="text-align: right;">${formatCurrency(finalTotalForCopy)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <hr>
      <div class="footer-info">
        Este documento no es una boleta válida.
      </div>
    </body>
    </html>
  `;
};


export const formatCashClosingReceipt = (
    closingDateTime: Date,
    dailyTotals: {
        dailyCashIncome: number;
        dailyDebitCardIncome: number;
        dailyCreditCardIncome: number;
        dailyTransferIncome: number;
        dailyDeliveryFees: number;
        dailyTipsTotal: number;
        dailyTotalIncome: number;
        dailyExpenses: number;
        dailyNetTotal: number;
        dailyGrossTotal?: number; 
    },
    allDailyMovements: CashMovement[],
    inventoryDetails: InventoryItem[]
): string => {
    const {
        dailyCashIncome, dailyDebitCardIncome, dailyCreditCardIncome, dailyTransferIncome,
        dailyDeliveryFees, dailyTipsTotal, dailyTotalIncome, dailyExpenses, dailyNetTotal, dailyGrossTotal
    } = dailyTotals;

    const formattedClosingDateTime = formatDateTime(closingDateTime, true);


    let movementsHtml = '';
    if (allDailyMovements.length > 0) {
        allDailyMovements.forEach(movement => {
            let movementDesc = movement.description;
            
            if (movementDesc.length > 25) {
                movementDesc = movementDesc.substring(0, 22) + "...";
            }
            const movementDate = movement.date instanceof Date ? movement.date : new Date(movement.date);
            const formattedMovementTime = format(movementDate, 'HH:mm');

            movementsHtml += `
              <tr>
                <td style="font-weight: bold; font-size: 8pt;">${formattedMovementTime}</td>
                <td style="font-weight: bold; max-width: 25mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 8pt;">${movement.category}</td>
                <td style="font-weight: bold; max-width: 25mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${movementDesc}</td>
                <td style="text-align: right; font-weight: bold;">${formatCurrency(movement.amount)}</td>
              </tr>
            `;
        });
    } else {
        movementsHtml = '<tr><td colspan="4" style="text-align: center; font-style: italic; font-weight: bold;">No hay movimientos registrados.</td></tr>';
    }

    const movementsDetailsSection = `
        <hr>
        <div class="movements-details-section" style="margin-top: 10px;">
          <h3 style="text-align: center; font-size: 11pt; margin-bottom: 5px; font-weight: bold;">DETALLE DE MOVIMIENTOS</h3>
          <table style="width: 100%; font-size: 8pt;">
            <thead>
              <tr>
                <th style="text-align: left; font-weight: bold; width: 15%;">Hora</th>
                <th style="text-align: left; font-weight: bold; width: 30%;">Categoría</th>
                <th style="text-align: left; font-weight: bold; width: 30%;">Desc.</th>
                <th style="text-align: right; font-weight: bold; width: 25%;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${movementsHtml}
            </tbody>
          </table>
        </div>
    `;
    
    const grossTotalHtml = dailyGrossTotal !== undefined ? `
          <tr class="total-row">
             <td class="label">TOTAL GENERAL (BRUTO):</td>
             <td class="amount">${formatCurrency(dailyGrossTotal)}</td>
          </tr>
          <tr><td colspan="2"><hr></td></tr>
    ` : '';

    let inventoryHtml = '';
    if (inventoryDetails.length > 0) {
        inventoryDetails.forEach(item => {
            inventoryHtml += `
              <tr>
                <td style="font-weight: bold; max-width: 45mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</td>
                <td style="text-align: right; font-weight: bold;">${item.stock}</td>
              </tr>
            `;
        });
    } else {
        inventoryHtml = '<tr><td colspan="2" style="text-align: center; font-style: italic; font-weight: bold;">No hay datos de inventario.</td></tr>';
    }

    const inventorySection = `
        <hr>
        <div class="inventory-section" style="margin-top: 10px;">
          <h3 style="text-align: center; font-size: 11pt; margin-bottom: 5px; font-weight: bold;">STOCK DE INVENTARIO</h3>
          <table style="width: 100%; font-size: 8pt;">
            <thead>
              <tr>
                <th style="text-align: left; font-weight: bold; width: 70%;">Producto</th>
                <th style="text-align: right; font-weight: bold; width: 30%;">Stock</th>
              </tr>
            </thead>
            <tbody>
              ${inventoryHtml}
            </tbody>
          </table>
        </div>
    `;


    return `
    <html>
    <head>
      <title>Cierre de Caja</title>
       <style>
         @page { margin: 5mm; }
         body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 10pt; width: 70mm;
            color: #000;
            background-color: #fff;
            font-weight: bold;
        }
         h1 { font-size: 14pt; text-align: center; margin-bottom: 5px; font-weight: bold; }
         .date { text-align: center; font-size: 9pt; margin-bottom: 15px; font-weight: bold; }
         table { width: 100%; border-collapse: collapse; }
         td { padding: 3px 0; font-weight: bold; }
         .label { padding-right: 10px; font-weight: bold;}
         .amount { text-align: right; font-weight: bold;}
         .total-row td { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; }
         hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
         strong { font-weight: bold; }
         .movements-details-section table th, .movements-details-section table td {
            padding: 1px 0;
         }
         .inventory-section table th, .inventory-section table td {
            padding: 1px 0;
         }
      </style>
    </head>
    <body>
      <h1>CIERRE DE CAJA</h1>
      <div class="date">${formattedClosingDateTime}</div>
      <table>
        <tbody>
          <tr><td class="label">Ingresos Efectivo:</td><td class="amount">${formatCurrency(dailyCashIncome)}</td></tr>
          <tr><td class="label">Ingresos T. Débito:</td><td class="amount">${formatCurrency(dailyDebitCardIncome)}</td></tr>
          <tr><td class="label">Ingresos T. Crédito:</td><td class="amount">${formatCurrency(dailyCreditCardIncome)}</td></tr>
          <tr><td class="label">Ingresos Transfer.:</td><td class="amount">${formatCurrency(dailyTransferIncome)}</td></tr>
          <tr><td colspan="2"><hr></td></tr>
          <tr class="total-row">
             <td class="label">TOTAL INGRESOS BRUTO:</td>
             <td class="amount">${formatCurrency(dailyTotalIncome)}</td>
          </tr>
          <tr><td colspan="2"><hr></td></tr>
          <tr><td class="label">Total Costo Envío:</td><td class="amount">${formatCurrency(dailyDeliveryFees)}</td></tr>
          <tr><td class="label">Total Propinas:</td><td class="amount">${formatCurrency(dailyTipsTotal)}</td></tr>
          <tr><td colspan="2"><hr></td></tr>
          ${grossTotalHtml}
          <tr><td class="label">Total Egresos:</td><td class="amount">${formatCurrency(dailyExpenses)}</td></tr>
          <tr><td colspan="2"><hr></td></tr>
          <tr class="total-row">
            <td class="label">TOTAL NETO CAJA:</td>
            <td class="amount">${formatCurrency(dailyNetTotal)}</td>
          </tr>
        </tbody>
      </table>
      ${movementsDetailsSection}
      ${inventorySection}
    </body>
    </html>
  `;
};


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
