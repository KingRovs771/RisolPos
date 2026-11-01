'use client'

import { useState, useMemo, useCallback } from 'react'
import { Product, CartItem } from '@/types'

export function useCart(products: Product[]) {
  // Map of productId -> qty
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  // Find product by id safely
  const productMap = useMemo(() => {
    const map = new Map<number, Product>()
    for (const p of products) {
      map.set(p.id, p)
    }
    return map
  }, [products])

  // Derived list of cart items
  const cartItems = useMemo<CartItem[]>(() => {
    const items: CartItem[] = []
    for (const [idStr, qty] of Object.entries(quantities)) {
      const id = Number(idStr)
      const product = productMap.get(id)
      if (product && qty > 0) {
        items.push({
          product,
          qty,
        })
      }
    }
    // Consistent ordering by product id
    return items.sort((a, b) => a.product.id - b.product.id)
  }, [quantities, productMap])

  // Total pcs in cart
  const totalPcs = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.qty, 0)
  }, [cartItems])

  // Total rupiah amount
  const totalAmount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.qty * item.product.price, 0)
  }, [cartItems])

  // Get qty for a specific product
  const getQty = useCallback(
    (productId: number): number => {
      return quantities[productId] ?? 0
    },
    [quantities]
  )

  // Add 1 to cart with stock validation
  const addItem = useCallback(
    (product: Product): { success: boolean; message?: string } => {
      if (product.stock <= 0) {
        return { success: false, message: `Stok ${product.name} sudah habis` }
      }

      const current = quantities[product.id] ?? 0
      if (current >= product.stock) {
        return { success: false, message: `Stok ${product.name} hanya tersisa ${product.stock} pcs` }
      }

      setQuantities(prev => ({
        ...prev,
        [product.id]: current + 1,
      }))
      return { success: true }
    },
    [quantities]
  )

  // Decrement 1 from cart
  const removeItem = useCallback(
    (productId: number) => {
      setQuantities(prev => {
        const current = prev[productId] ?? 0
        if (current <= 1) {
          const next = { ...prev }
          delete next[productId]
          return next
        }
        return {
          ...prev,
          [productId]: current - 1,
        }
      })
    },
    []
  )

  // Direct set qty with clamping
  const setItemQty = useCallback(
    (product: Product, targetQty: number) => {
      const clamped = Math.max(0, Math.min(targetQty, product.stock))
      setQuantities(prev => {
        if (clamped <= 0) {
          const next = { ...prev }
          delete next[product.id]
          return next
        }
        return {
          ...prev,
          [product.id]: clamped,
        }
      })
    },
    []
  )

  // Clear all items in cart
  const clearCart = useCallback(() => {
    setQuantities({})
  }, [])

  return {
    cartItems,
    totalPcs,
    totalAmount,
    getQty,
    addItem,
    removeItem,
    setItemQty,
    clearCart,
  }
}
