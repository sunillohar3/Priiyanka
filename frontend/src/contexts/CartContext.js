import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      setCartItems(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (service) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.service_id === service.service_id);
      if (existing) {
        return prev.map(item => 
          item.service_id === service.service_id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...service, quantity: 1 }];
    });
  };

  const removeFromCart = (serviceId) => {
    setCartItems(prev => prev.filter(item => item.service_id !== serviceId));
  };

  const updateQuantity = (serviceId, quantity) => {
    if (quantity === 0) {
      removeFromCart(serviceId);
    } else {
      setCartItems(prev => 
        prev.map(item => 
          item.service_id === serviceId 
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotal,
      cartCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};