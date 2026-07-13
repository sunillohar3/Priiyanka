import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Trash2, Euro, ShoppingBag, Calendar, Clock } from 'lucide-react';
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
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const totalDuration = cartItems.reduce((sum, item) => sum + (item.duration || 0), 0);

  const getMinDate = () => new Date().toISOString().split('T')[0];

  const handleConfirm = async () => {
    if (!user) {
      toast.error(language === 'en' ? 'Please login to book an appointment' : 'Log in om een afspraak te maken');
      return;
    }
    if (!date || !time) {
      toast.error(language === 'en' ? 'Please select a date and time' : 'Selecteer een datum en tijd');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        items: cartItems.map(item => ({
          service_id: item.service_id,
          name: language === 'en' ? item.name_en : item.name_nl,
          price: item.price,
          duration: item.duration
        })),
        booking_date: date,
        booking_time: time,
        notes
      };

      await axios.post(`${API}/appointments`, payload, { withCredentials: true });

      toast.success(
        language === 'en'
          ? 'Appointment requested! We will confirm shortly.'
          : 'Afspraak aangevraagd! We bevestigen spoedig.'
      );
      clearCart();
      navigate('/dashboard');
    } catch (error) {
      console.error('Appointment error:', error);
      const detail = error?.response?.data?.detail;
      toast.error(
        detail || (language === 'en'
          ? 'Could not book the appointment. Please try again.'
          : 'Kan de afspraak niet boeken. Probeer het opnieuw.')
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
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-3" data-testid="cart-title">
          {language === 'en' ? 'Your Appointment' : 'Uw Afspraak'}
        </h1>
        <p className="text-muted-foreground mb-10">
          {language === 'en'
            ? 'Review your treatments, then choose a date and time for your visit.'
            : 'Bekijk uw behandelingen en kies een datum en tijd voor uw bezoek.'}
        </p>

        {/* Selected treatments */}
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
                <p className="text-muted-foreground flex items-center gap-1 text-sm mt-1">
                  <Clock className="w-4 h-4" />
                  {item.duration} {t('services.minutes')}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <p className="text-xl font-bold text-primary flex items-center gap-1">
                  <Euro className="w-5 h-5" />
                  {item.price.toFixed(2)}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart(item.service_id)}
                  aria-label={language === 'en' ? `Remove ${item.name_en}` : `${item.name_nl} verwijderen`}
                  data-testid={`remove-item-${item.service_id}`}
                >
                  <Trash2 className="w-5 h-5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Appointment scheduling + summary */}
        <div className="bg-muted p-8 rounded-2xl">
          <h2 className="text-2xl font-heading font-semibold text-foreground mb-6">
            {language === 'en' ? 'Choose your slot' : 'Kies uw tijdslot'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="appt-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('booking.selectDate')}
              </Label>
              <Input
                id="appt-date"
                type="date"
                min={getMinDate()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appt-time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('booking.selectTime')}
              </Label>
              <Input
                id="appt-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <Label htmlFor="appt-notes">{t('booking.notes')}</Label>
            <Textarea
              id="appt-notes"
              rows={3}
              placeholder={language === 'en' ? 'Any special requests or notes...' : 'Speciale verzoeken of opmerkingen...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="border-t border-border pt-6 space-y-2 mb-6">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{language === 'en' ? 'Total duration' : 'Totale duur'}</span>
              <span className="font-medium">{totalDuration} {t('services.minutes')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-heading font-bold text-foreground">{t('cart.total')}</span>
              <span className="text-3xl font-bold text-primary flex items-center gap-1">
                <Euro className="w-7 h-7" />
                {getTotal().toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'en' ? 'Payable at the clinic.' : 'Te betalen in de praktijk.'}
            </p>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={processing}
            className="w-full bg-primary text-primary-foreground hover:bg-secondary rounded-full py-6 text-lg"
            data-testid="confirm-appointment-button"
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
                {language === 'en' ? 'Booking...' : 'Boeken...'}
              </span>
            ) : (
              language === 'en' ? 'Confirm Appointment' : 'Afspraak Bevestigen'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
