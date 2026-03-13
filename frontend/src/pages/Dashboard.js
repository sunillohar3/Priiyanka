import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Calendar, ShoppingBag, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [bookingsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/bookings`, { withCredentials: true }),
        axios.get(`${API}/orders`, { withCredentials: true })
      ]);
      setBookings(bookingsRes.data);
      setOrders(ordersRes.data);
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
                <p className="text-3xl font-bold text-foreground">{bookings.length}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Bookings' : 'Afspraken'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{orders.length}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'Orders' : 'Bestellingen'}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card p-8 rounded-2xl border border-border">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-6">
              {language === 'en' ? 'Recent Bookings' : 'Recente Afspraken'}
            </h2>
            {bookings.length === 0 ? (
              <p className="text-muted-foreground">
                {language === 'en' ? 'No bookings yet' : 'Nog geen afspraken'}
              </p>
            ) : (
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking.booking_id} className="border-b border-border pb-4 last:border-0">
                    <p className="font-semibold text-foreground">{booking.booking_date}</p>
                    <p className="text-sm text-muted-foreground">{booking.booking_time}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card p-8 rounded-2xl border border-border">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-6">
              {language === 'en' ? 'Recent Orders' : 'Recente Bestellingen'}
            </h2>
            {orders.length === 0 ? (
              <p className="text-muted-foreground">
                {language === 'en' ? 'No orders yet' : 'Nog geen bestellingen'}
              </p>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.order_id} className="border-b border-border pb-4 last:border-0">
                    <p className="font-semibold text-foreground">€{order.total_amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} {language === 'en' ? 'items' : 'items'}
                    </p>
                    <span className="inline-block mt-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;