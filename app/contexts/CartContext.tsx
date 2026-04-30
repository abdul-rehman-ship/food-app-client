'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { ref, get, set, push, remove, update } from 'firebase/database';
import toast from 'react-hot-toast';

interface CartItem {
  cartItemId?: string;
  foodId: string;
  selectedSize: string;
  quantity: number;
  addedAt: number;
}

interface CartItemWithDetails {
  cartItemId?: string;
  foodId: string;
  foodName: string;
  foodImage: string;
  selectedSize: string;
  sizePrice: number;
  quantity: number;
  totalPrice: number;
  addedAt: number;
}

interface CartContextType {
  cart: CartItemWithDetails[];
  loading: boolean;
  addToCart: (foodId: string, selectedSize: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        // Check for guest session
        const guestData = localStorage.getItem('guest_session');
        if (guestData) {
          const guest = JSON.parse(guestData);
          setUserId(guest.userId);
        } else {
          setUserId(null);
          setCart([]);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch cart when userId changes
  useEffect(() => {
    if (userId) {
      fetchCart();
    } else {
      setCart([]);
      setLoading(false);
    }
  }, [userId]);

  const fetchCart = async () => {
    if (!userId) {
      setCart([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const cartRef = ref(db, `bucket/${userId}`);
      const snapshot = await get(cartRef);
      
      const cartItems: CartItem[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          cartItems.push({ cartItemId: child.key, ...child.val() });
        });
      }

      // Fetch food details for each cart item
      const cartWithDetails: CartItemWithDetails[] = [];
      for (const item of cartItems) {
        const foodRef = ref(db, `food_items/${item.foodId}`);
        const foodSnapshot = await get(foodRef);
        const foodData = foodSnapshot.val();
        
        if (foodData) {
          // Find the size price
          const sizeObj = foodData.sizes?.find((s: any) => s.name === item.selectedSize);
          const sizePrice = sizeObj ? sizeObj.price : foodData.price;
          
          cartWithDetails.push({
            cartItemId: item.cartItemId,
            foodId: item.foodId,
            foodName: foodData.name,
            foodImage: foodData.images?.[0] || '',
            selectedSize: item.selectedSize,
            sizePrice: sizePrice,
            quantity: item.quantity,
            totalPrice: sizePrice * item.quantity,
            addedAt: item.addedAt
          });
        }
      }
      
      // Sort by addedAt (oldest first)
      cartWithDetails.sort((a, b) => a.addedAt - b.addedAt);
      setCart(cartWithDetails);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (foodId: string, selectedSize: string, quantity: number) => {
    if (!userId) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      // Check if item with same foodId and size already exists
      const cartRef = ref(db, `bucket/${userId}`);
      const snapshot = await get(cartRef);
      
      let existingItemId: string | null = null;
      
      if (snapshot.exists()) {
        for (const [key, value] of Object.entries(snapshot.val())) {
          const cartItem = value as CartItem;
          if (cartItem.foodId === foodId && cartItem.selectedSize === selectedSize) {
            existingItemId = key;
            break;
          }
        }
      }

      const addedAt = Date.now();

      if (existingItemId) {
        // Update existing item
        const existingItem = cart.find(item => item.cartItemId === existingItemId);
        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          await update(ref(db, `bucket/${userId}/${existingItemId}`), {
            quantity: newQuantity,
            addedAt: addedAt
          });
          toast.success(`Updated quantity in cart`);
        }
      } else {
        // Add new item
        const newCartItemRef = push(ref(db, `bucket/${userId}`));
        await set(newCartItemRef, {
          cartItemId: newCartItemRef.key,
          foodId: foodId,
          selectedSize: selectedSize,
          quantity: quantity,
          addedAt: addedAt
        });
        toast.success(`Added to bucket!`);
      }
      
      await fetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!userId) return;
    
    try {
      await remove(ref(db, `bucket/${userId}/${cartItemId}`));
      toast.success('Item removed from bucket');
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item');
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (!userId) return;
    
    if (quantity < 1) {
      await removeFromCart(cartItemId);
      return;
    }
    
    try {
      await update(ref(db, `bucket/${userId}/${cartItemId}`), {
        quantity: quantity
      });
      await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const clearCart = async () => {
    if (!userId) return;
    
    try {
      await set(ref(db, `bucket/${userId}`), null);
      setCart([]);
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};