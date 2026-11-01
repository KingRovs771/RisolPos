export type UserRole = 'OWNER' | 'CASHIER'
export type PaymentMethod = 'CASH' | 'QRIS_MUAMALAT'
export type StockMoveType = 'IN_RESTOCK' | 'OUT_SALE' | 'OUT_WASTE' | 'ADJUSTMENT'

export interface Product {
  id: number
  name: string
  price: number
  cost_price: number
  stock: number
  is_active: boolean
  category?: string
  description?: string
  image_url?: string
  badge?: string
  created_at?: string
}

export interface CartItem {
  product: Product
  qty: number
}

export interface TransactionItem {
  id?: string
  transaction_id?: string
  product_id: number
  product_name: string
  qty: number
  price_at_sale: number
  subtotal: number
}

export interface Outlet {
  id: string
  name: string
  address?: string
  is_active: boolean
  created_at?: string
}

export interface Transaction {
  id: string
  invoice_number: string
  user_id: string
  cashier_name?: string
  outlet_id?: string
  outlet_name?: string
  total_amount: number
  payment_method: PaymentMethod
  cash_received?: number | null
  change_amount?: number | null
  qris_issuer?: string | null
  is_reconciled: boolean
  created_at: string
  items?: TransactionItem[]
}

export interface OutletStockItem {
  outlet_id: string
  outlet_name?: string
  product_id: number
  stock: number
  updated_at?: string
}

export interface StockMovement {
  id: string
  product_id: number
  product_name?: string
  outlet_id?: string
  outlet_name?: string
  user_id: string
  movement_type: StockMoveType
  qty_change: number
  stock_before: number
  stock_after: number
  notes?: string | null
  created_at: string
}

export interface PurchaseExpense {
  id: string
  user_id: string
  item_name: string
  qty_description?: string | null
  total_cost: number
  purchase_date: string
  created_at: string
}

export interface SessionUser {
  id: string
  name: string
  role: UserRole
  username: string
  outlet_id?: string | null
  outlet_name?: string | null
}

export interface ReceiptData {
  invoiceNumber: string
  datetime: string
  cashierName: string
  items: {
    name: string
    qty: number
    price: number
    subtotal: number
  }[]
  totalPcs: number
  totalAmount: number
  paymentMethod: PaymentMethod
  cashReceived?: number
  changeAmount?: number
  qrisIssuer?: string
}

export interface StockAuditItem {
  productId: number
  name: string
  currentStock: number
  inRestock: number
  outSale: number
  outWaste: number
  adjustment: number
  expectedStock: number
  hasDiscrepancy: boolean
}

export interface OwnerMonitoringData {
  totalRevenue: number
  totalPcs: number
  cashRevenue: number
  qrisRevenue: number
  totalExpenses: number
  netCash: number
  transactions: Transaction[]
  expenses: PurchaseExpense[]
  stockAudit: StockAuditItem[]
}
