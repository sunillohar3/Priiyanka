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

  // A service can be added to the cart only once (no quantity increment).
  // Returns true if it was added, false if it was already present.
  const addToCart = (service) => {
    let added = false;
    setCartItems(prev => {
      if (prev.find(item => item.service_id === service.service_id)) {
        return prev;
      }
      added = true;
      return [...prev, { ...service, quantity: 1 }];
    });
    return added;
  };

  const isInCart = (serviceId) => cartItems.some(item => item.service_id === serviceId);

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
      isInCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotal,
      cartCount: cartItems.length
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