import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Calendar, Clock, User, Euro, MailWarning } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import Reveal from '../components/common/Reveal';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [rDate, setRDate] = useState('');
  const [rTime, setRTime] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading) return; // wait for the auth check to resolve before deciding
    if (!user) {
      navigate('/');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/appointments`, { withCredentials: true });
      setAppointments(res.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => new Date().toISOString().split('T')[0];

  const handleResend = async () => {
    try {
      await axios.post(`${API}/auth/resend-verification`, {}, { withCredentials: true });
      toast.success(language === 'en' ? 'Verification email sent.' : 'Verificatie-e-mail verzonden.');
    } catch (error) {
      toast.error(error?.response?.data?.detail || (language === 'en' ? 'Could not send email.' : 'Kan e-mail niet verzenden.'));
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm(language === 'en' ? 'Cancel this appointment?' : 'Deze afspraak annuleren?')) return;
    setBusy(true);
    try {
      await axios.post(`${API}/appointments/${id}/cancel`, {}, { withCredentials: true });
      toast.success(language === 'en' ? 'Appointment cancelled.' : 'Afspraak geannuleerd.');
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.detail || (language === 'en' ? 'Could not cancel.' : 'Kan niet annuleren.'));
    } finally {
      setBusy(false);
    }
  };

  const startReschedule = (appt) => {
    setRescheduleId(appt.appointment_id);
    setRDate(appt.booking_date);
    setRTime(appt.booking_time);
  };

  const submitReschedule = async (id) => {
    if (!rDate || !rTime) {
      toast.error(language === 'en' ? 'Please choose a date and time.' : 'Kies een datum en tijd.');
      return;
    }
    setBusy(true);
    try {
      await axios.put(`${API}/appointments/${id}/reschedule`, { booking_date: rDate, booking_time: rTime }, { withCredentials: true });
      toast.success(language === 'en' ? 'Appointment rescheduled.' : 'Afspraak verzet.');
      setRescheduleId(null);
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.detail || (language === 'en' ? 'Could not reschedule.' : 'Kan niet verzetten.'));
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const upcoming = appointments.filter((a) => a.status !== 'cancelled' && a.status !== 'completed').length;
  const statusColor = {
    pending: 'bg-accent text-accent-foreground',
    confirmed: 'bg-secondary text-secondary-foreground',
    completed: 'bg-primary text-primary-foreground',
    cancelled: 'bg-destructive text-destructive-foreground',
  };
  const canModify = (s) => s === 'pending' || s === 'confirmed';

  return (
    <div className="min-h-screen py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <Reveal className="mb-8">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-2" data-testid="dashboard-title">
            {language === 'en' ? 'Welcome back' : 'Welkom terug'}, {user.name}
          </h1>
          <p className="text-muted-foreground">{user.email}</p>
        </Reveal>

        {!user.email_verified && (
          <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 mb-8 flex flex-wrap items-center gap-3" data-testid="verify-banner">
            <MailWarning className="w-5 h-5 text-accent flex-shrink-0" />
            <p className="text-sm text-foreground flex-1">
              {language === 'en'
                ? 'Please verify your email address. Check your inbox for the verification link.'
                : 'Verifieer uw e-mailadres. Controleer uw inbox voor de verificatielink.'}
            </p>
            <Button variant="outline" size="sm" onClick={handleResend}>
              {language === 'en' ? 'Resend email' : 'Opnieuw verzenden'}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{appointments.length}</p>
                <p className="text-sm text-muted-foreground">{language === 'en' ? 'Appointments' : 'Afspraken'}</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{upcoming}</p>
                <p className="text-sm text-muted-foreground">{language === 'en' ? 'Upcoming' : 'Aankomend'}</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground capitalize">{user.role}</p>
                <p className="text-sm text-muted-foreground">{language === 'en' ? 'Account Type' : 'Account Type'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-8 rounded-2xl border border-border">
          <h2 className="text-2xl font-heading font-semibold text-foreground mb-6">
            {language === 'en' ? 'Your Appointments' : 'Uw Afspraken'}
          </h2>
          {appointments.length === 0 ? (
            <p className="text-muted-foreground">{language === 'en' ? 'No appointments yet' : 'Nog geen afspraken'}</p>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div key={appt.appointment_id} className="border-b border-border pb-4 last:border-0" data-testid={`appt-${appt.appointment_id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {appt.booking_date} · {appt.booking_time}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(appt.items || []).map((it, idx) => (
                          <span key={idx} className="px-3 py-1 bg-muted rounded-full text-xs text-foreground">{it.name}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary flex items-center gap-1 justify-end">
                        <Euro className="w-4 h-4" />
                        {(appt.total_amount || 0).toFixed(2)}
                      </p>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColor[appt.status] || 'bg-muted text-muted-foreground'}`}>
                        {appt.status}
                      </span>
                    </div>
                  </div>

                  {canModify(appt.status) && (
                    <div className="mt-3">
                      {rescheduleId === appt.appointment_id ? (
                        <div className="flex flex-wrap items-end gap-3 bg-muted/50 p-3 rounded-xl">
                          <div className="space-y-1">
                            <Label htmlFor={`rd-${appt.appointment_id}`} className="text-xs">{language === 'en' ? 'Date' : 'Datum'}</Label>
                            <Input id={`rd-${appt.appointment_id}`} type="date" min={getMinDate()} value={rDate} onChange={(e) => setRDate(e.target.value)} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`rt-${appt.appointment_id}`} className="text-xs">{language === 'en' ? 'Time' : 'Tijd'}</Label>
                            <Input id={`rt-${appt.appointment_id}`} type="time" value={rTime} onChange={(e) => setRTime(e.target.value)} className="h-9" />
                          </div>
                          <Button size="sm" onClick={() => submitReschedule(appt.appointment_id)} disabled={busy}>
                            {language === 'en' ? 'Save' : 'Opslaan'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRescheduleId(null)} disabled={busy}>
                            {language === 'en' ? 'Cancel' : 'Annuleren'}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startReschedule(appt)} data-testid={`reschedule-${appt.appointment_id}`}>
                            {language === 'en' ? 'Reschedule' : 'Verzetten'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleCancel(appt.appointment_id)} className="text-destructive hover:text-destructive" data-testid={`cancel-${appt.appointment_id}`}>
                            {language === 'en' ? 'Cancel' : 'Annuleren'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
