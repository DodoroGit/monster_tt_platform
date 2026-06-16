import { useState, useEffect } from 'react'
import type { CartItem, Product } from '@/types'

// Module-level cart state with pub/sub
let _items: CartItem[] = []
const _listeners = new Set<() => void>()

function notify() {
  _listeners.forEach((fn) => fn())
}

export const cartStore = {
  get items() { return _items },
  addItem(product: Product, quantity = 1) {
    const idx = _items.findIndex((i) => i.product.id === product.id)
    _items = idx >= 0
      ? _items.map((i, n) => n === idx ? { ...i, quantity: i.quantity + quantity } : i)
      : [..._items, { product, quantity }]
    notify()
  },
  removeItem(productId: string) {
    _items = _items.filter((i) => i.product.id !== productId)
    notify()
  },
  updateQuantity(productId: string, quantity: number) {
    _items = _items.map((i) => i.product.id === productId ? { ...i, quantity } : i)
    notify()
  },
  clear() { _items = []; notify() },
}

export function useCartStore<T>(selector: (items: CartItem[]) => T): T {
  const [val, setVal] = useState(() => selector(_items))
  useEffect(() => {
    const update = () => setVal(selector(_items))
    _listeners.add(update)
    return () => { _listeners.delete(update) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return val
}
