import { ReceiptData } from '@/types'

// Extended interface for Bluetooth Web API
export interface BluetoothPrinter {
  device: BluetoothDevice
  server?: BluetoothRemoteGATTServer
  characteristic?: BluetoothRemoteGATTCharacteristic
}

// Thermal Printer Service & Characteristic UUIDs
// Common standard thermal printer services: 0x18f0, 0xfff0, 0xe7810a71...
const PRINTER_SERVICES = [
  0x18f0,
  0xfff0,
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
]

const CHUNK_SIZE = 100
const CHUNK_DELAY_MS = 20
const LINE_WIDTH = 32

/**
 * Format number to Indonesian Rupiah currency string (e.g. "10.500")
 */
export function formatRupiah(amount: number): string {
  return Math.round(amount).toLocaleString('id-ID')
}

/**
 * Format Date object into Indonesian WIB date time string (e.g. "22/10/2026 16:45 WIB")
 */
export function formatWIBDateTime(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }
  const parts = new Intl.DateTimeFormat('id-ID', options).format(date)
  return `${parts.replace(/\./g, ':')} WIB`
}

/**
 * Generate invoice number formatted as RSL-DDMMYY-XXXX (WIB date + 4 random digits)
 */
export function generateInvoiceNumber(date: Date = new Date()): string {
  const wib = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date)
  const dateCode = wib.replace(/\//g, '')
  const random4 = Math.floor(1000 + Math.random() * 9000)
  return `RSL-${dateCode}-${random4}`
}

/**
 * Pad a two-column line to fill exactly 32 characters
 */
function padTwoColumns(left: string, right: string, width: number = LINE_WIDTH): string {
  const maxLeft = Math.max(0, width - right.length - 1)
  const truncatedLeft = left.length > maxLeft ? left.substring(0, maxLeft) : left
  const spaceCount = Math.max(1, width - truncatedLeft.length - right.length)
  return truncatedLeft + ' '.repeat(spaceCount) + right
}

/**
 * Center-align a text string within 32 characters
 */
export function padCenter(text: string, width: number = LINE_WIDTH): string {
  if (text.length >= width) return text.substring(0, width)
  const leftPad = Math.floor((width - text.length) / 2)
  const rightPad = width - text.length - leftPad
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad)
}

/**
 * Check if Web Bluetooth API is supported and available in the current browser
 */
export function isBluetoothSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'bluetooth' in navigator && !!navigator.bluetooth && typeof navigator.bluetooth.requestDevice === 'function'
}

/**
 * Connect to a thermal Bluetooth printer via Web Bluetooth API
 */
export async function connectBluetoothPrinter(): Promise<BluetoothPrinter | null> {
  if (!isBluetoothSupported() || !navigator.bluetooth) {
    return null
  }

  const bluetooth = navigator.bluetooth

  try {
    const device = await bluetooth.requestDevice({
      filters: [{ services: PRINTER_SERVICES }],
      optionalServices: PRINTER_SERVICES,
    }).catch(async () => {
      // Fallback: accept all devices if service filter isn't accepted by printer model
      return await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES,
      })
    })

    if (!device || !device.gatt) {
      return null
    }

    const server = await device.gatt.connect()
    
    // Find primary service and writable characteristic
    let characteristic: BluetoothRemoteGATTCharacteristic | undefined

    for (const serviceUuid of PRINTER_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid)
        const characteristics = await service.getCharacteristics()
        const writeChar = characteristics.find(
          c => c.properties.write || c.properties.writeWithoutResponse
        )
        if (writeChar) {
          characteristic = writeChar
          break
        }
      } catch {
        // Continue searching other services
      }
    }

    if (!characteristic) {
      // Try to inspect any available services
      const services = await server.getPrimaryServices()
      for (const service of services) {
        try {
          const chars = await service.getCharacteristics()
          const writeChar = chars.find(
            c => c.properties.write || c.properties.writeWithoutResponse
          )
          if (writeChar) {
            characteristic = writeChar
            break
          }
        } catch {
          // ignore
        }
      }
    }

    return {
      device,
      server,
      characteristic,
    }
  } catch (error: unknown) {
    // NotFoundError occurs if user cancels the picker dialog
    const err = error as { name?: string; message?: string }
    if (err.name === 'NotFoundError') {
      return null
    }
    console.warn('[connectBluetoothPrinter] Connection failed:', error)
    return null
  }
}

/**
 * Build ESC/POS byte commands for a 58mm (32 chars) thermal receipt
 */
export function buildReceiptBytes(data: ReceiptData): Uint8Array {
  const encoder = new TextEncoder()
  const bytes: number[] = []

  // ESC/POS Commands
  const ESC = 0x1b
  const GS = 0x1d

  // Initialize printer
  bytes.push(ESC, 0x40) // ESC @

  // Helper to push text
  const pushText = (str: string) => {
    const encoded = encoder.encode(str)
    for (let i = 0; i < encoded.length; i++) {
      bytes.push(encoded[i]!)
    }
  }

  // Helper for new line
  const pushLine = (str: string = '') => {
    pushText(str + '\n')
  }

  // Line separator
  const separator = '-'.repeat(LINE_WIDTH)

  // Align Center
  bytes.push(ESC, 0x61, 1) // ESC a 1
  bytes.push(ESC, 0x45, 1) // Bold ON
  pushLine('RISOL UMKM BERKAH')
  bytes.push(ESC, 0x45, 0) // Bold OFF
  pushLine('Gerobak Jl. Raya Utama')
  pushLine(separator)

  // Align Left
  bytes.push(ESC, 0x61, 0) // ESC a 0
  pushLine(`Nota  : ${data.invoiceNumber}`)
  pushLine(`Waktu : ${data.datetime}`)
  pushLine(`Kasir : ${data.cashierName}`)
  pushLine(separator)

  // Items
  for (const item of data.items) {
    const productName = item.name.length > 20 ? item.name.substring(0, 20) : item.name
    pushLine(productName)
    const qtyPrice = `${item.qty} x ${formatRupiah(item.price)}`
    const subtotal = formatRupiah(item.subtotal)
    pushLine(padTwoColumns(qtyPrice, subtotal))
  }
  pushLine(separator)

  // Totals
  pushLine(padTwoColumns(`Total Item : ${data.totalPcs} Pcs`, ''))
  bytes.push(ESC, 0x45, 1) // Bold ON
  pushLine(padTwoColumns('TOTAL', `Rp ${formatRupiah(data.totalAmount)}`))
  bytes.push(ESC, 0x45, 0) // Bold OFF
  pushLine(separator)

  // Payment Info
  const methodLabel = data.paymentMethod === 'CASH' ? 'TUNAI' : 'QRIS MUAMALAT'
  pushLine(padTwoColumns('Metode', methodLabel))

  if (data.paymentMethod === 'CASH') {
    if (data.cashReceived !== undefined) {
      pushLine(padTwoColumns('Terima', `Rp ${formatRupiah(data.cashReceived)}`))
    }
    if (data.changeAmount !== undefined) {
      pushLine(padTwoColumns('Kembali', `Rp ${formatRupiah(data.changeAmount)}`))
    }
  } else {
    if (data.qrisIssuer) {
      pushLine(padTwoColumns('Aplikasi', data.qrisIssuer))
    }
  }
  pushLine(separator)

  // Status LUNAS (Center Bold)
  bytes.push(ESC, 0x61, 1) // Align Center
  bytes.push(ESC, 0x45, 1) // Bold ON
  pushLine('Status : LUNAS')
  bytes.push(ESC, 0x45, 0) // Bold OFF
  pushLine(separator)

  // Footer message
  pushLine('Terima Kasih Atas Pembelian')
  pushLine('Risol Hangat Kami!')

  // Feed 3 lines & Paper Cut
  bytes.push(0x0a, 0x0a, 0x0a)
  bytes.push(GS, 0x56, 66, 3) // GS V 66 3

  return new Uint8Array(bytes)
}

/**
 * Print receipt using Bluetooth remote GATT in safe 100-byte chunks
 */
export async function printReceipt(
  printer: BluetoothPrinter,
  data: ReceiptData
): Promise<boolean> {
  if (!printer.characteristic) {
    console.warn('[printReceipt] No writable characteristic found')
    return false
  }

  const receiptBytes = buildReceiptBytes(data)

  try {
    for (let offset = 0; offset < receiptBytes.length; offset += CHUNK_SIZE) {
      const chunk = receiptBytes.slice(offset, offset + CHUNK_SIZE)
      if (printer.characteristic.writeValueWithoutResponse) {
        await printer.characteristic.writeValueWithoutResponse(chunk)
      } else {
        await printer.characteristic.writeValue(chunk)
      }
      if (CHUNK_DELAY_MS > 0) {
        await new Promise(resolve => setTimeout(resolve, CHUNK_DELAY_MS))
      }
    }
    return true
  } catch (error) {
    console.error('[printReceipt] Print execution failed:', error)
    return false
  }
}

/**
 * Fallback print intent for Android using RawBT app
 */
export function printViaRawBT(data: ReceiptData): void {
  if (typeof window === 'undefined') return

  const receiptBytes = buildReceiptBytes(data)
  // Convert Uint8Array to base64
  let binary = ''
  for (let i = 0; i < receiptBytes.byteLength; i++) {
    binary += String.fromCharCode(receiptBytes[i]!)
  }
  const base64Data = window.btoa(binary)
  const rawBtIntent = `intent:base64,${base64Data}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`
  window.location.href = rawBtIntent
}

interface PdfLine {
  text: string
  bold?: boolean
}

function escapePdfString(str: string): string {
  return str
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

/**
 * Build structured 32-char thermal lines for PDF & text preview
 */
export function buildReceiptLines(data: ReceiptData): PdfLine[] {
  const sep = '-'.repeat(LINE_WIDTH)
  const lines: PdfLine[] = [
    { text: padCenter('RISOL UMKM BERKAH'), bold: true },
    { text: padCenter('Struk Pembayaran Resmi') },
    { text: sep },
    { text: `Nota  : ${data.invoiceNumber}` },
    { text: `Waktu : ${data.datetime}` },
    { text: `Kasir : ${data.cashierName.substring(0, 24)}` },
    { text: sep },
  ]

  for (const item of data.items) {
    const productName = item.name.length > LINE_WIDTH ? item.name.substring(0, LINE_WIDTH) : item.name
    lines.push({ text: productName, bold: true })
    const qtyPrice = `${item.qty} x Rp ${formatRupiah(item.price)}`
    const subtotal = `Rp ${formatRupiah(item.subtotal)}`
    lines.push({ text: padTwoColumns(qtyPrice, subtotal) })
  }

  lines.push({ text: sep })
  lines.push({ text: padTwoColumns('Total Item', `${data.totalPcs} Pcs`) })
  lines.push({
    text: padTwoColumns('TOTAL BAYAR', `Rp ${formatRupiah(data.totalAmount)}`),
    bold: true,
  })
  lines.push({ text: sep })

  const methodLabel = data.paymentMethod === 'CASH' ? 'TUNAI' : 'QRIS MUAMALAT'
  lines.push({ text: padTwoColumns('Metode', methodLabel) })

  if (data.paymentMethod === 'CASH') {
    if (data.cashReceived !== undefined) {
      lines.push({ text: padTwoColumns('Tunai Diterima', `Rp ${formatRupiah(data.cashReceived)}`) })
    }
    if (data.changeAmount !== undefined) {
      lines.push({
        text: padTwoColumns('Kembalian', `Rp ${formatRupiah(data.changeAmount)}`),
        bold: true,
      })
    }
  } else if (data.qrisIssuer) {
    lines.push({ text: padTwoColumns('Aplikasi QRIS', data.qrisIssuer) })
  }

  lines.push({ text: sep })
  lines.push({ text: padCenter('STATUS : LUNAS'), bold: true })
  lines.push({ text: sep })
  lines.push({ text: padCenter('Terima Kasih Atas Pembelian') })
  lines.push({ text: padCenter('Risol Hangat Kami!') })

  return lines
}

/**
 * Generate and download a 58mm Thermal Receipt as a native PDF file (no external dependencies)
 */
export function downloadReceiptPdf(data: ReceiptData): void {
  if (typeof window === 'undefined') return

  const lines = buildReceiptLines(data)
  const pageWidth = 190
  const lineHeight = 12
  const marginTop = 20
  const marginBottom = 20
  const marginLeft = 13
  const pageHeight = Math.max(260, marginTop + marginBottom + lines.length * lineHeight)

  const streamOps: string[] = ['BT']
  let y = pageHeight - marginTop

  for (const line of lines) {
    const fontKey = line.bold ? '/F2' : '/F1'
    const safeText = escapePdfString(line.text)
    streamOps.push(`${fontKey} 8.5 Tf`)
    streamOps.push(`1 0 0 1 ${marginLeft} ${y} Tm`)
    streamOps.push(`(${safeText}) Tj`)
    y -= lineHeight
  }
  streamOps.push('ET')

  const contentStream = streamOps.join('\n')

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n`,
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]

  for (const obj of objects) {
    offsets.push(pdf.length)
    pdf += obj
  }

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i <= objects.length; i++) {
    const off = String(offsets[i]!).padStart(10, '0')
    pdf += `${off} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const safeInvoice = data.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')
  link.href = url
  link.download = `Struk-${safeInvoice}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}

/**
 * Open a 58mm thermal-formatted browser print dialog
 */
export function printReceiptWindow(data: ReceiptData): void {
  if (typeof window === 'undefined') return

  const w = window.open('', '_blank', 'width=360,height=640')
  if (!w) return

  const itemsHtml = data.items
    .map(
      item => `
      <div class="item">
        <div class="item-name">${item.name}</div>
        <div class="row">
          <span>${item.qty} x Rp ${formatRupiah(item.price)}</span>
          <span>Rp ${formatRupiah(item.subtotal)}</span>
        </div>
      </div>`
    )
    .join('')

  const paymentDetailsHtml =
    data.paymentMethod === 'CASH'
      ? `
        ${
          data.cashReceived !== undefined
            ? `<div class="row"><span>Tunai</span><span>Rp ${formatRupiah(data.cashReceived)}</span></div>`
            : ''
        }
        ${
          data.changeAmount !== undefined
            ? `<div class="row bold"><span>Kembali</span><span>Rp ${formatRupiah(data.changeAmount)}</span></div>`
            : ''
        }`
      : data.qrisIssuer
      ? `<div class="row"><span>Issuer</span><span>${data.qrisIssuer}</span></div>`
      : ''

  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Struk ${data.invoiceNumber}</title>
  <style>
    @page { size: 58mm auto; margin: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      width: 58mm;
      margin: 0 auto;
      padding: 4mm;
      box-sizing: border-box;
      font-size: 11px;
      color: #000;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .sep { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .item { margin: 4px 0; }
    .item-name { font-weight: bold; }
  </style>
</head>
<body>
  <div class="center bold" style="font-size:13px;">RISOL UMKM BERKAH</div>
  <div class="center">Struk Pembayaran Resmi</div>
  <div class="sep"></div>
  <div>Nota  : ${data.invoiceNumber}</div>
  <div>Waktu : ${data.datetime}</div>
  <div>Kasir : ${data.cashierName}</div>
  <div class="sep"></div>
  ${itemsHtml}
  <div class="sep"></div>
  <div class="row"><span>Total Item</span><span>${data.totalPcs} Pcs</span></div>
  <div class="row bold" style="font-size:12px;"><span>TOTAL</span><span>Rp ${formatRupiah(data.totalAmount)}</span></div>
  <div class="sep"></div>
  <div class="row"><span>Metode</span><span>${data.paymentMethod === 'CASH' ? 'TUNAI' : 'QRIS MUAMALAT'}</span></div>
  ${paymentDetailsHtml}
  <div class="sep"></div>
  <div class="center bold">STATUS : LUNAS</div>
  <div class="sep"></div>
  <div class="center">Terima Kasih Atas Pembelian</div>
  <div class="center">Risol Hangat Kami!</div>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`)
  w.document.close()
}
