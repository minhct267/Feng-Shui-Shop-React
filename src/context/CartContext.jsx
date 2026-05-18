import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  fetchCart,
  addCartItem as apiAddCartItem,
  updateCartItem as apiUpdateCartItem,
  removeCartItem as apiRemoveCartItem,
  clearCart as apiClearCart,
  submitCheckout as apiSubmitCheckout,
} from "../services/api";
import { useAuth } from "./AuthContext";

const EMPTY_CART = {
  items: [],
  item_count: 0,
  subtotal: 0,
  shipping_fee: 0,
  tax_amount: 0,
  total: 0,
  has_stock_issue: false,
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isCustomer = user?.role === "customer";

  const refresh = useCallback(async () => {
    if (!isCustomer) {
      setCart(EMPTY_CART);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCart();
      setCart(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isCustomer]);

  useEffect(() => {
    if (authLoading) return;
    if (isCustomer) {
      refresh();
    } else {
      setCart(EMPTY_CART);
    }
  }, [authLoading, isCustomer, refresh]);

  async function addItem(productId, quantity = 1) {
    if (!isCustomer) throw new Error("Please sign in as a customer to add items.");
    const data = await apiAddCartItem(productId, quantity);
    setCart(data);
    return data;
  }

  async function setItemQty(productId, quantity) {
    const data = await apiUpdateCartItem(productId, quantity);
    setCart(data);
    return data;
  }

  async function removeItem(productId) {
    const data = await apiRemoveCartItem(productId);
    setCart(data);
    return data;
  }

  async function clear() {
    const data = await apiClearCart();
    setCart(data);
    return data;
  }

  async function checkout(payload) {
    const result = await apiSubmitCheckout(payload);
    setCart(EMPTY_CART);
    return result;
  }

  const value = {
    cart,
    count: cart.item_count || 0,
    loading,
    error,
    refresh,
    addItem,
    setItemQty,
    removeItem,
    clear,
    checkout,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
