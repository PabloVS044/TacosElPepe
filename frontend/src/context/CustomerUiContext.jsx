import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { mockCustomerCatalog } from '../data/mockCustomerCatalog';

const CART_KEY = 'tacos-el-pepe-cart';
const ORDERS_KEY = 'tacos-el-pepe-customer-orders';

const CustomerUiContext = createContext(null);

function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function getDynamicStatus(createdAt, baseStatus = 'pendiente') {
  if (baseStatus === 'cancelado' || baseStatus === 'entregado') return baseStatus;

  const minutesElapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (minutesElapsed >= 12) return 'entregado';
  if (minutesElapsed >= 8) return 'finalizado';
  if (minutesElapsed >= 4) return 'en_proceso';
  if (minutesElapsed >= 1) return 'aprobado';
  return 'pendiente';
}

export function CustomerUiProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    setCart(readStorage(CART_KEY, []));
    setOrders(readStorage(ORDERS_KEY, []));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  const cartItems = useMemo(() => {
    return cart
      .map((entry) => {
        const product = mockCustomerCatalog.find((item) => item.id === entry.id);
        if (!product) return null;
        return {
          ...product,
          cantidad: entry.cantidad,
          subtotal: entry.cantidad * product.precio,
        };
      })
      .filter(Boolean);
  }, [cart]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const serviceFee = cartItems.length > 0 ? 4 : 0;
  const total = subtotal + serviceFee;

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...current, { id: product.id, cantidad: 1 }];
    });
  };

  const updateCartItem = (id, cantidad) => {
    if (cantidad <= 0) {
      setCart((current) => current.filter((item) => item.id !== id));
      return;
    }
    setCart((current) =>
      current.map((item) => (item.id === id ? { ...item, cantidad } : item))
    );
  };

  const clearCart = () => setCart([]);

  const placeOrder = (customerInfo) => {
    const order = {
      codigo: `PEPE-${String(Date.now()).slice(-6)}`,
      createdAt: new Date().toISOString(),
      status: 'pendiente',
      customerInfo,
      items: cartItems,
      subtotal,
      serviceFee,
      total,
    };

    setOrders((current) => [order, ...current]);
    setCart([]);
    return order;
  };

  const getOrderByCode = (code) => {
    const order = orders.find((entry) => entry.codigo.toLowerCase() === code.toLowerCase());
    if (!order) return null;
    return {
      ...order,
      dynamicStatus: getDynamicStatus(order.createdAt, order.status),
    };
  };

  const latestOrder = orders[0]
    ? {
        ...orders[0],
        dynamicStatus: getDynamicStatus(orders[0].createdAt, orders[0].status),
      }
    : null;

  const value = {
    catalog: mockCustomerCatalog,
    cartItems,
    subtotal,
    serviceFee,
    total,
    latestOrder,
    addToCart,
    updateCartItem,
    clearCart,
    placeOrder,
    getOrderByCode,
  };

  return (
    <CustomerUiContext.Provider value={value}>
      {children}
    </CustomerUiContext.Provider>
  );
}

export function useCustomerUi() {
  return useContext(CustomerUiContext);
}
