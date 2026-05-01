import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Trash2, Euro, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import API from '../lib/api';

const Cart = () => {
  const { cartItems, removeFromCart, getTotal, clearCart } = useCart();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!user) {
      toast.error(language === 'en' ? 'Please login to checkout' : 'Log in om af te rekenen');
      return;
    }

    try {
      const orderData = {
        items: cartItems.map(item => ({
          service_id: item.service_id,
          name: language === 'en' ? item.name_en : item.name_nl,
          price: item.price,
          quantity: item.quantity
        })),
        total_amount: getTotal()
      };

      await axios.post(`${API}/orders`, orderData, {
        withCredentials: true
      });

      toast.success(
        language === 'en' 
          ? 'Order placed successfully!' 
          : 'Bestelling succesvol geplaatst!'
      );
      clearCart();
      navigate('/dashboard');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to place order' 
          : 'Kan bestelling niet plaatsen'
      );
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-3xl font-heading font-bold text-foreground mb-4">
            {t('cart.empty')}
          </h2>
          <Link to="/services">
            <Button className="bg-primary text-primary-foreground hover:bg-secondary rounded-full px-8">
              {t('cart.continueShopping')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-12" data-testid="cart-title">
          {t('cart.title')}
        </h1>

        <div className="space-y-4 mb-8">
          {cartItems.map((item) => (
            <div 
              key={item.service_id} 
              className="bg-card p-6 rounded-2xl border border-border flex items-center justify-between"
              data-testid={`cart-item-${item.service_id}`}
            >
              <div className="flex-1">
                <h3 className="text-xl font-heading font-semibold text-foreground">
                  {language === 'en' ? item.name_en : item.name_nl}
                </h3>
                <p className="text-muted-foreground">
                  {item.duration} {t('services.minutes')}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Quantity' : 'Aantal'}: {item.quantity}
                  </p>
                  <p className="text-xl font-bold text-primary flex items-center gap-1">
                    <Euro className="w-5 h-5" />
                    {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart(item.service_id)}
                  data-testid={`remove-item-${item.service_id}`}
                >
                  <Trash2 className="w-5 h-5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-2xl font-heading font-bold text-foreground">{t('cart.total')}</span>
            <span className="text-3xl font-bold text-primary flex items-center gap-1">
              <Euro className="w-7 h-7" />
              {getTotal().toFixed(2)}
            </span>
          </div>
          <Button 
            onClick={handleCheckout}
            className="w-full bg-primary text-primary-foreground hover:bg-secondary rounded-full py-6 text-lg"
            data-testid="checkout-button"
          >
            {t('cart.checkout')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;