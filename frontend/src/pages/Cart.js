import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Trash2, Euro, ShoppingBag, Calendar, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import BookingModal from '../components/BookingModal';
import API from '../lib/api';

const Cart = () => {
  const { cartItems, removeFromCart, getTotal, clearCart } = useCart();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookingDetails, setBookingDetails] = useState({});
  const [processing, setProcessing] = useState(false);

  const isItemBooking = (serviceId) => Boolean(bookingDetails[serviceId]);

  const setBooking = (serviceId, details) => {
    setBookingDetails(prev => ({ ...prev, [serviceId]: details }));
  };

  const clearBooking = (serviceId) => {
    setBookingDetails(prev => {
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error(language === 'en' ? 'Please login to checkout' : 'Log in om af te rekenen');
      return;
    }

    const orderItems = cartItems.filter(item => !isItemBooking(item.service_id));
    const bookingList = cartItems.filter(item => isItemBooking(item.service_id));

    // Safety net: every booking item must have a date and time selected.
    const incomplete = bookingList.find(item => {
      const details = bookingDetails[item.service_id];
      return !details || !details.booking_date || !details.booking_time;
    });
    if (incomplete) {
      toast.error(
        language === 'en'
          ? `Please select a date and time for "${incomplete.name_en}"`
          : `Selecteer een datum en tijd voor "${incomplete.name_nl}"`
      );
      return;
    }

    setProcessing(true);
    try {
      if (orderItems.length > 0) {
        const orderData = {
          items: orderItems.map(item => ({
            service_id: item.service_id,
            name: language === 'en' ? item.name_en : item.name_nl,
            price: item.price,
            quantity: item.quantity
          })),
          total_amount: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };

        await axios.post(`${API}/orders`, orderData, { withCredentials: true });
      }

      // Create a real booking for each item scheduled via the modal.
      for (const item of bookingList) {
        const details = bookingDetails[item.service_id];
        await axios.post(
          `${API}/bookings`,
          {
            service_id: item.service_id,
            booking_date: details.booking_date,
            booking_time: details.booking_time,
            notes: details.notes || ''
          },
          { withCredentials: true }
        );
      }

      const parts = [];
      if (orderItems.length > 0) {
        parts.push(
          language === 'en'
            ? `${orderItems.length} order(s)`
            : `${orderItems.length} bestelling(en)`
        );
      }
      if (bookingList.length > 0) {
        parts.push(
          language === 'en'
            ? `${bookingList.length} appointment(s)`
            : `${bookingList.length} afspraak/afspraken`
        );
      }
      toast.success(
        language === 'en'
          ? `Checkout complete: ${parts.join(' and ')}.`
          : `Afrekenen voltooid: ${parts.join(' en ')}.`
      );

      clearCart();
      setBookingDetails({});
      navigate('/dashboard');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(
        language === 'en'
          ? 'Failed to complete checkout. Please try again.'
          : 'Kan afrekenen niet voltooien. Probeer het opnieuw.'
      );
    } finally {
      setProcessing(false);
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
          {cartItems.map((item) => {
            const details = bookingDetails[item.service_id];
            const booking = isItemBooking(item.service_id);
            return (
              <div
                key={item.service_id}
                className="bg-card p-6 rounded-2xl border border-border"
                data-testid={`cart-item-${item.service_id}`}
              >
                <div className="flex items-center justify-between mb-4">
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
                      <p className="text-xl font-bold text-primary flex items-center gap-1">
                        <Euro className="w-5 h-5" />
                        {item.price.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { removeFromCart(item.service_id); clearBooking(item.service_id); }}
                      aria-label={language === 'en' ? `Remove ${item.name_en}` : `${item.name_nl} verwijderen`}
                      data-testid={`remove-item-${item.service_id}`}
                    >
                      <Trash2 className="w-5 h-5 text-destructive" />
                    </Button>
                  </div>
                </div>

                {booking && details && (
                  <div className="flex flex-wrap items-center gap-4 mb-3 text-sm font-medium text-primary" data-testid={`booking-slot-${item.service_id}`}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {details.booking_date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {details.booking_time}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-border">
                  {booking ? (
                    <>
                      <BookingModal
                        service={item}
                        initialData={details}
                        onConfirm={(d) => setBooking(item.service_id, d)}
                        confirmLabel={language === 'en' ? 'Update appointment' : 'Afspraak bijwerken'}
                        trigger={
                          <Button
                            variant="outline"
                            className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            data-testid={`booking-edit-${item.service_id}`}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            {language === 'en' ? 'Edit appointment' : 'Afspraak bewerken'}
                          </Button>
                        }
                      />
                      <Button
                        onClick={() => clearBooking(item.service_id)}
                        variant="ghost"
                        className="flex-1"
                        data-testid={`toggle-purchase-${item.service_id}`}
                      >
                        {language === 'en' ? 'Change to purchase' : 'Wijzigen in aankoop'}
                      </Button>
                    </>
                  ) : (
                    <BookingModal
                      service={item}
                      onConfirm={(d) => setBooking(item.service_id, d)}
                      confirmLabel={language === 'en' ? 'Confirm appointment' : 'Afspraak bevestigen'}
                      trigger={
                        <Button
                          variant="outline"
                          className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                          data-testid={`book-item-${item.service_id}`}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          {language === 'en' ? 'Book appointment instead' : 'Boek in plaats daarvan'}
                        </Button>
                      }
                    />
                  )}
                </div>
              </div>
            );
          })}
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
            disabled={processing}
            className="w-full bg-primary text-primary-foreground hover:bg-secondary rounded-full py-6 text-lg"
            data-testid="checkout-button"
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
                {language === 'en' ? 'Processing...' : 'Verwerken...'}
              </span>
            ) : (
              t('cart.checkout')
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
