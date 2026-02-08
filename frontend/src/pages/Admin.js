import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Plus, Edit, Trash2, Users, Calendar, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Admin = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_nl: '',
    description_en: '',
    description_nl: '',
    price: '',
    duration: '',
    category: '',
    image_url: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [servicesRes, bookingsRes, usersRes, ordersRes] = await Promise.all([
        axios.get(`${API}/services`),
        axios.get(`${API}/bookings`, { withCredentials: true }),
        axios.get(`${API}/admin/users`, { withCredentials: true }),
        axios.get(`${API}/orders`, { withCredentials: true })
      ]);
      setServices(servicesRes.data);
      setBookings(bookingsRes.data);
      setUsers(usersRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
  };

  const handleSubmitService = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await axios.put(
          `${API}/services/${editingService.service_id}`,
          formData,
          { withCredentials: true }
        );
        toast.success('Service updated successfully');
      } else {
        await axios.post(
          `${API}/services`,
          formData,
          { withCredentials: true }
        );
        toast.success('Service created successfully');
      }
      setShowServiceForm(false);
      setEditingService(null);
      setFormData({
        name_en: '',
        name_nl: '',
        description_en: '',
        description_nl: '',
        price: '',
        duration: '',
        category: '',
        image_url: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Failed to save service');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await axios.delete(`${API}/services/${serviceId}`, { withCredentials: true });
      toast.success('Service deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setFormData({
      name_en: service.name_en,
      name_nl: service.name_nl,
      description_en: service.description_en,
      description_nl: service.description_nl,
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category,
      image_url: service.image_url || ''
    });
    setShowServiceForm(true);
  };

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      await axios.put(
        `${API}/bookings/${bookingId}?status=${status}`,
        {},
        { withCredentials: true }
      );
      toast.success('Booking status updated');
      fetchData();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const handleUpdateUserRole = async (userId, role) => {
    try {
      await axios.put(
        `${API}/admin/users/${userId}/role?role=${role}`,
        {},
        { withCredentials: true }
      );
      toast.success('User role updated');
      fetchData();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-8" data-testid="admin-title">
          Admin Panel
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{services.length}</p>
                <p className="text-sm text-muted-foreground">Services</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{bookings.length}</p>
                <p className="text-sm text-muted-foreground">Bookings</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{users.length}</p>
                <p className="text-sm text-muted-foreground">Users</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{orders.length}</p>
                <p className="text-sm text-muted-foreground">Orders</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('services')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'services'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-services"
            >
              Services
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'bookings'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-bookings"
            >
              Bookings
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-users"
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'orders'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-orders"
            >
              Orders
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'services' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-heading font-semibold text-foreground">Manage Services</h2>
                  <Button
                    onClick={() => {
                      setEditingService(null);
                      setFormData({
                        name_en: '',
                        name_nl: '',
                        description_en: '',
                        description_nl: '',
                        price: '',
                        duration: '',
                        category: '',
                        image_url: ''
                      });
                      setShowServiceForm(!showServiceForm);
                    }}
                    className="bg-primary text-primary-foreground rounded-full"
                    data-testid="add-service-button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </div>

                {showServiceForm && (
                  <form onSubmit={handleSubmitService} className="bg-muted p-6 rounded-xl mb-6" data-testid="service-form">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Name (English)</label>
                        <Input
                          value={formData.name_en}
                          onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                          required
                          data-testid="input-name-en"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Name (Dutch)</label>
                        <Input
                          value={formData.name_nl}
                          onChange={(e) => setFormData({ ...formData, name_nl: e.target.value })}
                          required
                          data-testid="input-name-nl"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Description (English)</label>
                        <Textarea
                          value={formData.description_en}
                          onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                          required
                          data-testid="input-description-en"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Description (Dutch)</label>
                        <Textarea
                          value={formData.description_nl}
                          onChange={(e) => setFormData({ ...formData, description_nl: e.target.value })}
                          required
                          data-testid="input-description-nl"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Price (€)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                          data-testid="input-price"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Duration (min)</label>
                        <Input
                          type="number"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          required
                          data-testid="input-duration"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Category</label>
                        <Input
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          required
                          data-testid="input-category"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Image URL</label>
                        <Input
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          data-testid="input-image-url"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="bg-primary text-primary-foreground" data-testid="submit-service">
                        {editingService ? 'Update' : 'Create'} Service
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowServiceForm(false);
                          setEditingService(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.service_id} className="border border-border rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{service.name_en} / {service.name_nl}</h3>
                        <p className="text-sm text-muted-foreground">
                          €{service.price} • {service.duration} min • {service.category}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditService(service)}
                          data-testid={`edit-service-${service.service_id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteService(service.service_id)}
                          data-testid={`delete-service-${service.service_id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <h2 className="text-2xl font-heading font-semibold text-foreground mb-6">Manage Bookings</h2>
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.booking_id} className="border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{booking.booking_date} at {booking.booking_time}</p>
                          <p className="text-sm text-muted-foreground">Booking ID: {booking.booking_id}</p>
                          {booking.notes && <p className="text-sm text-muted-foreground mt-2">Notes: {booking.notes}</p>}
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={booking.status}
                            onChange={(e) => handleUpdateBookingStatus(booking.booking_id, e.target.value)}
                            className="px-4 py-2 rounded-lg border border-border bg-background"
                            data-testid={`booking-status-${booking.booking_id}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-heading font-semibold text-foreground">Manage Users</h2>
                  <div className="text-sm text-muted-foreground">
                    Total Users: {users.length} | Admins: {users.filter(u => u.role === 'admin').length}
                  </div>
                </div>
                <div className="space-y-4">
                  {users.map((u) => (
                    <div key={u.user_id} className="border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {u.picture && (
                            <img src={u.picture} alt={u.name} className="w-12 h-12 rounded-full" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">{u.name}</p>
                              {u.role === 'admin' && (
                                <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">User ID: {u.user_id}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.user_id, e.target.value)}
                            className="px-4 py-2 rounded-lg border border-border bg-background font-medium"
                            data-testid={`user-role-${u.user_id}`}
                          >
                            <option value="user">👤 User</option>
                            <option value="admin">👑 Admin</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-6 bg-muted/50 rounded-xl border border-border">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Admin Management Tips
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use the dropdown to promote users to Admin or demote them to User</li>
                    <li>• Changes take effect immediately - users may need to refresh their page</li>
                    <li>• Admins can manage services, bookings, orders, and other users</li>
                    <li>• Regular users can only view their own bookings and orders</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-heading font-semibold text-foreground mb-6">Manage Orders</h2>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.order_id} className="border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-foreground">€{order.total_amount.toFixed(2)}</p>
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Order ID: {order.order_id}</p>
                      <p className="text-sm text-muted-foreground">{order.items.length} items</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;