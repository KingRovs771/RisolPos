const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testEndpoint(name, url, options = {}) {
  try {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => null);
    console.log(`\n========================================`);
    console.log(`[TEST] ${name}`);
    console.log(`URL: ${options.method || 'GET'} ${url}`);
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    if (!res.ok) {
      throw new Error(`Failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`❌ [FAILED] ${name}:`, err.message);
    throw err;
  }
}

async function run() {
  console.log(`🧪 Starting End-to-End Verification against: ${BASE_URL}\n`);

  // 1. Health check with Neon Postgres
  await testEndpoint('Health Check (Neon Postgres)', `${BASE_URL}/api/health`);

  // 1b. Outlets check
  await testEndpoint('Fetch Outlets', `${BASE_URL}/api/outlets`);

  // 2. Authentication with bcrypt against Neon Postgres
  const authRes = await testEndpoint('Authentication (Kasir PIN)', `${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'kasir_kampus',
      pin: '111111',
    }),
  });

  // 3. Fetch products from Neon Postgres
  await testEndpoint('Fetch Active Products', `${BASE_URL}/api/pos`);

  // 4. Create POS Transaction in Neon Postgres
  await testEndpoint('Create POS Transaction', `${BASE_URL}/api/pos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      invoiceNumber: `RSL-E2E-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: authRes.data.id,
      cashierName: authRes.data.name,
      paymentMethod: 'CASH',
      cashReceived: 10000,
      changeAmount: 3000,
      items: [
        {
          productId: 1,
          name: 'Risol Mayo Smoke Beef',
          qty: 2,
          price: 3500,
          subtotal: 7000,
        },
      ],
    }),
  });

  // 5. Adjust Stock in Neon Postgres
  await testEndpoint('Adjust Product Stock (Restock)', `${BASE_URL}/api/owner/stock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: 1,
      userId: 'user-owner',
      type: 'IN_RESTOCK',
      qtyChange: 20,
      notes: 'Restock batch E2E verification',
    }),
  });

  // 6. Record Expense in Neon Postgres
  await testEndpoint('Record Purchase Expense', `${BASE_URL}/api/owner/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itemName: 'Tepung Terigu Segitiga Biru',
      qtyDescription: '5 Kg',
      totalCost: 65000,
    }),
  });

  // 7. Monitoring query in Neon Postgres
  const today = new Date().toISOString().split('T')[0];
  await testEndpoint('Owner Monitoring Data', `${BASE_URL}/api/owner/monitoring?startDate=${today}&endDate=${today}`);

  console.log(`\n🎉 ALL SERVICES VERIFIED END-TO-END SUCCESSFULLY!\n`);
}

run().catch(() => process.exit(1));
