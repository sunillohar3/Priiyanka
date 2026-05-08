import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Calendar, Clock, Euro } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import API from '../lib/api';

const BookingModal = ({ service, trigger }) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    booking_date: '',
    booking_time: '',
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error(language === 'en' ? 'Please login to book an appointment' : 'Log in om een afspraak te maken');
      return;
    }

    if (!formData.booking_date || !formData.booking_time) {
      toast.error(language === 'en' ? 'Please select date and time' : 'Selecteer datum en tijd');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        service_id: service.service_id,
        booking_date: formData.booking_date,
        booking_time: formData.booking_time,
        notes: formData.notes
      };

      await axios.post(`${API}/bookings`, bookingData, {
        withCredentials: true
      });

      toast.success(
        language === 'en'
          ? 'Appointment booked successfully!'
          : 'Afspraak succesvol geboekt!'
      );

      setFormData({
        booking_date: '',
        booking_time: '',
        notes: ''
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(
        language === 'en'
          ? 'Failed to book appointment'
          : 'Kan afspraak niet boeken'
      );
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-semibold">
            {t('booking.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">
              {language === 'en' ? service.name_en : service.name_nl}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{service.duration} {language === 'en' ? 'minutes' : 'minuten'}</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-primary">
                <Euro className="w-4 h-4" />
                <span>{service.price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="booking_date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t('booking.selectDate')}
                </Label>
                <Input
                  id="booking_date"
                  name="booking_date"
                  type="date"
                  min={getMinDate()}
                  value={formData.booking_date}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking_time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t('booking.selectTime')}
                </Label>
                <Input
                  id="booking_time"
                  name="booking_time"
                  type="time"
                  value={formData.booking_time}
                  onChange={handleInputChange}
                  required
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                {t('booking.notes')}
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder={language === 'en' ? 'Any special requests or notes...' : 'Speciale verzoeken of opmerkingen...'}
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                {language === 'en' ? 'Cancel' : 'Annuleren'}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-primary-foreground hover:bg-secondary"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    {language === 'en' ? 'Booking...' : 'Boeken...'}
                  </div>
                ) : (
                  t('booking.submit')
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;