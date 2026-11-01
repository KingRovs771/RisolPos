import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'

// Custom Metrics
const posTxSuccessRate = new Rate('pos_transaction_success')
const auditRealtimeSuccessRate = new Rate('owner_audit_realtime_success')
const posTxDuration = new Trend('pos_transaction_duration_ms')
const monitoringDuration = new Trend('owner_monitoring_duration_ms')
const totalRisolSold = new Counter('total_risol_sold_pcs')

export const options = {
  stages: [
    { duration: '5s', target: 5 },   // Ramp-up ke 5 kasir/user serentak
    { duration: '15s', target: 10 }, // Peak load: 10 user aktif bersamaan
    { duration: '5s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],                 // Error rate < 5%
    http_req_duration: ['p(95)<3000'],              // 95% request < 3 detik (Neon Serverless)
    pos_transaction_success: ['rate>0.95'],         // Transaksi POS sukses > 95%
    owner_audit_realtime_success: ['rate>0.95'],    // Audit stok realtime sukses > 95%
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const JSON_HEADERS = { headers: { 'Content-Type': 'application/json' } }

export function setup() {
  console.log(`[k6 Setup] Menyiapkan data uji terhadap ${BASE_URL}...`)

  // 1. Cek Health Database
  const healthRes = http.get(`${BASE_URL}/api/health`)
  check(healthRes, {
    'setup: health check 200': r => r.status === 200,
  })

  // 2. Buat Outlet Uji Sementara
  const uniqueSuffix = Date.now().toString(36)
  const outletName = `Gerobak K6 Test ${uniqueSuffix}`
  const outletRes = http.post(
    `${BASE_URL}/api/outlets`,
    JSON.stringify({
      name: outletName,
      address: 'Lokasi Simulasi Load Test k6',
    }),
    JSON_HEADERS
  )

  let outletId = 'outlet-1'
  try {
    const body = JSON.parse(outletRes.body)
    if (body && body.data && body.data.id) {
      outletId = body.data.id
    }
  } catch {
    // fallback
  }

  // 3. Buat Menu Risol Uji Sementara dengan Stok Awal 1000 pcs
  const productName = `Risol Mayo K6 ${uniqueSuffix}`
  const prodRes = http.post(
    `${BASE_URL}/api/owner/products`,
    JSON.stringify({
      name: productName,
      price: 3500,
      cost_price: 2000,
      category: 'Best Seller',
      description: 'Menu pengujian beban k6',
      badge: 'TEST K6',
      initial_stock_per_outlet: 1000,
    }),
    JSON_HEADERS
  )

  let productId = 1
  try {
    const body = JSON.parse(prodRes.body)
    if (body && body.data && body.data.id) {
      productId = Number(body.data.id)
    }
  } catch {
    // fallback
  }

  // 4. Buat Akun Kasir Uji untuk Outlet Tersebut
  const cashierUsername = `kasir_k6_${uniqueSuffix}`
  const userRes = http.post(
    `${BASE_URL}/api/owner/users`,
    JSON.stringify({
      username: cashierUsername,
      name: 'Kasir Simulasi K6',
      role: 'CASHIER',
      pin: '123456',
      outlet_id: outletId,
    }),
    JSON_HEADERS
  )

  let cashierId = 'user-k6'
  try {
    const body = JSON.parse(userRes.body)
    if (body && body.data && body.data.id) {
      cashierId = body.data.id
    }
  } catch {
    // fallback
  }

  console.log(
    `[k6 Setup Selesai] outletId=${outletId}, productId=${productId}, cashier=${cashierUsername}`
  )

  return {
    outletId,
    outletName,
    productId,
    productName,
    cashierId,
    cashierUsername,
  }
}

export default function runLoadTest(data) {
  const today = new Date().toISOString().split('T')[0]

  // 1. Cek Katalog POS Per Outlet
  group('01_POS_Load_Products', () => {
    const res = http.get(`${BASE_URL}/api/pos?outletId=${encodeURIComponent(data.outletId)}`)
    check(res, {
      'GET /api/pos status 200': r => r.status === 200,
      'GET /api/pos memiliki daftar produk': r => {
        try {
          const b = JSON.parse(r.body)
          return b.success === true && Array.isArray(b.data)
        } catch {
          return false
        }
      },
    })
  })

  // 2. Simulasi Transaksi Kasir POS (Tunai / QRIS)
  group('02_POS_Checkout_Transaction', () => {
    const isQris = __ITER % 2 === 1
    const qty = (__VU % 3) + 1
    const subtotal = qty * 3500
    const invoiceNumber = `RSL-K6-${__VU}-${__ITER}-${Date.now().toString(36)}`

    const payload = {
      invoiceNumber,
      userId: data.cashierId,
      cashierName: 'Kasir Simulasi K6',
      outletId: data.outletId,
      paymentMethod: isQris ? 'QRIS_MUAMALAT' : 'CASH',
      cashReceived: isQris ? null : subtotal + 1500,
      changeAmount: isQris ? null : 1500,
      qrisIssuer: isQris ? 'GoPay' : null,
      items: [
        {
          productId: data.productId,
          name: data.productName,
          qty,
          price: 3500,
          subtotal,
        },
      ],
      totalAmount: subtotal,
    }

    const start = Date.now()
    const res = http.post(`${BASE_URL}/api/pos`, JSON.stringify(payload), JSON_HEADERS)
    posTxDuration.add(Date.now() - start)

    const ok = check(res, {
      'POST /api/pos transaksi sukses (200)': r => r.status === 200,
      'POST /api/pos mengembalikan ID transaksi': r => {
        try {
          const b = JSON.parse(r.body)
          return b.success === true && Boolean(b.data && b.data.id)
        } catch {
          return false
        }
      },
    })

    posTxSuccessRate.add(ok)
    if (ok) {
      totalRisolSold.add(qty)
    }
  })

  // 3. Simulasi Restock / Penyesuaian Stok oleh Owner (setiap 3 iterasi)
  if (__ITER % 3 === 0) {
    group('03_Owner_Stock_Adjustment', () => {
      const res = http.post(
        `${BASE_URL}/api/owner/stock`,
        JSON.stringify({
          productId: data.productId,
          outletId: data.outletId,
          userId: 'user-owner',
          movementType: 'IN_RESTOCK',
          qtyChange: 5,
          notes: `Restock otomatis k6 VU#${__VU}`,
        }),
        JSON_HEADERS
      )

      check(res, {
        'POST /api/owner/stock status 200': r => r.status === 200,
        'POST /api/owner/stock update stok berhasil': r => {
          try {
            const b = JSON.parse(r.body)
            return b.success === true && typeof b.data.stock_after === 'number'
          } catch {
            return false
          }
        },
      })
    })
  }

  // 4. Verifikasi Realtime Monitoring & Audit Stok Owner
  group('04_Owner_Realtime_Monitoring_And_Stock_Audit', () => {
    const start = Date.now()
    const res = http.get(
      `${BASE_URL}/api/owner/monitoring?startDate=${today}&endDate=${today}&outletId=${encodeURIComponent(
        data.outletId
      )}`
    )
    monitoringDuration.add(Date.now() - start)

    const ok = check(res, {
      'GET /api/owner/monitoring status 200': r => r.status === 200,
      'Monitoring mengembalikan stockAudit & stockMovements realtime': r => {
        try {
          const b = JSON.parse(r.body)
          if (!b.success || !b.data) return false
          const hasAudit = Array.isArray(b.data.stockAudit) && b.data.stockAudit.length > 0
          const hasMovements = Array.isArray(b.data.stockMovements)
          const hasOutletStocks = Array.isArray(b.data.outletStocks)
          const targetAudit = b.data.stockAudit.find(
            item => Number(item.productId) === Number(data.productId)
          )
          return (
            hasAudit &&
            hasMovements &&
            hasOutletStocks &&
            Boolean(targetAudit) &&
            typeof targetAudit.currentStock === 'number' &&
            typeof targetAudit.outSale === 'number'
          )
        } catch {
          return false
        }
      },
    })

    auditRealtimeSuccessRate.add(ok)
  })

  sleep(0.5)
}

export function teardown(data) {
  console.log(`[k6 Teardown] Membersihkan data uji sementara...`)
  if (data.productId) {
    http.del(`${BASE_URL}/api/owner/products?id=${data.productId}`)
  }
  if (data.cashierId) {
    http.del(`${BASE_URL}/api/owner/users?id=${encodeURIComponent(data.cashierId)}`)
  }
}

