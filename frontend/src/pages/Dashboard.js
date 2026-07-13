import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Calendar, Clock, User, Euro } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';

const Dashboard = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

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
    pending: 'bg-accent/15 text-accent',
    confirmed: 'bg-secondary/15 text-secondary',
    completed: 'bg-primary/10 text-primary',
    cancelled: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="min-h-screen py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-2" data-testid="dashboard-title">
            {language === 'en' ? 'Welcome back' : 'Welkom terug'}, {user.name}
          </h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{appointments.length}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Appointments' : 'Afspraken'}
                </p>
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
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Upcoming' : 'Aankomend'}
                </p>
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
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Account Type' : 'Account Type'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-8 rounded-2xl border border-border">
          <h2 className="text-2xl font-heading font-semibold text-foreground mb-6">
            {language === 'en' ? 'Your Appointments' : 'Uw Afspraken'}
          </h2>
          {appointments.length === 0 ? (
            <p className="text-muted-foreground">
              {language === 'en' ? 'No appointments yet' : 'Nog geen afspraken'}
            </p>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div key={appt.appointment_id} className="border-b border-border pb-4 last:border-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {appt.booking_date} · {appt.booking_time}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(appt.items || []).map((it, idx) => (
                          <span key={idx} className="px-3 py-1 bg-muted rounded-full text-xs text-foreground">
                            {it.name}
                          </span>
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
