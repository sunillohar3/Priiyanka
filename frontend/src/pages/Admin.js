import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Plus, Edit, Trash2, Users, Calendar, ShoppingBag, Shield, MessageSquare, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';

const Admin = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageFilter, setMessageFilter] = useState('all');
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
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    // Load each section independently so one slow/failing endpoint
    // (e.g. a cold-started backend) doesn't blank the whole dashboard.
    const endpoints = [
      { label: 'services', url: `${API}/services`, set: setServices },
      { label: 'appointments', url: `${API}/appointments`, set: setAppointments },
      { label: 'users', url: `${API}/admin/users`, set: setUsers },
      { label: 'messages', url: `${API}/admin/contact`, set: setMessages }
    ];

    const results = await Promise.allSettled(
      endpoints.map(e => axios.get(e.url, { withCredentials: true }))
    );

    const failed = [];
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        endpoints[i].set(result.value.data);
      } else {
        console.error(`Failed to load ${endpoints[i].label}:`, result.reason);
        failed.push(endpoints[i].label);
      }
    });

    if (failed.length > 0) {
      toast.error(`Failed to load: ${failed.join(', ')}`);
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.');
      return;
    }

    const data = new FormData();
    data.append('file', file);

    try {
      setUploadingImage(true);
      const uploadRes = await axios.post(`${API}/upload`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      setFormData({ ...formData, image_url: uploadRes.data.url });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
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

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    try {
      await axios.put(
        `${API}/appointments/${appointmentId}?status=${status}`,
        {},
        { withCredentials: true }
      );
      toast.success('Appointment status updated');
      fetchData();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Delete this appointment? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/appointments/${appointmentId}`, { withCredentials: true });
      toast.success('Appointment deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    }
  };

  const handleUpdateMessageStatus = async (messageId, status) => {
    try {
      await axios.put(
        `${API}/admin/contact/${messageId}?status=${status}`,
        {},
        { withCredentials: true }
      );
      toast.success('Message status updated');
      fetchData();
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/admin/contact/${messageId}`, { withCredentials: true });
      toast.success('Message deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
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

  const messageCounts = {
    all: messages.length,
    new: messages.filter((m) => m.status === 'new').length,
    read: messages.filter((m) => m.status === 'read').length,
    handled: messages.filter((m) => m.status === 'handled').length,
  };
  const filteredMessages = messageFilter === 'all'
    ? messages
    : messages.filter((m) => m.status === messageFilter);

  const statusBadge = {
    new: 'bg-accent/15 text-accent',
    read: 'bg-secondary/15 text-secondary',
    handled: 'bg-primary/10 text-primary',
  };

  return (
    <div className="min-h-screen py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-8" data-testid="admin-title">
          Admin Panel
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <p className="text-3xl font-bold text-foreground">{appointments.length}</p>
                <p className="text-sm text-muted-foreground">Appointments</p>
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
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{messages.length}</p>
                <p className="text-sm text-muted-foreground">Messages</p>
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
              onClick={() => setActiveTab('appointments')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'appointments'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-appointments"
            >
              Appointments
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
              onClick={() => setActiveTab('messages')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'messages'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-messages"
            >
              Messages
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
                        <label className="block text-sm font-medium mb-2">Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2"
                          data-testid="input-image-upload"
                        />
                        {uploadingImage && (
                          <p className="text-sm text-muted-foreground mt-2">Uploading image...</p>
                        )}
                        <Input
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          placeholder="Or paste an existing image URL"
                          data-testid="input-image-url"
                          className="mt-2"
                        />
                      </div>
                    </div>
                    {formData.image_url && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Image Preview</p>
                        <img
                          src={formData.image_url}
                          alt="Selected service preview"
                          className="w-full max-h-64 object-cover rounded-xl border border-border"
                        />
                      </div>
                    )}
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

            {activeTab === 'appointments' && (
              <div>
                <h2 className="text-2xl font-heading font-semibold text-foreground mb-6">Manage Appointments</h2>
                {appointments.length === 0 && (
                  <p className="text-muted-foreground">No appointments yet.</p>
                )}
                <div className="space-y-4">
                  {appointments.map((appt) => (
                    <div key={appt.appointment_id} className="border border-border rounded-xl p-4" data-testid={`appointment-${appt.appointment_id}`}>
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                        <div>
                          <p className="font-semibold text-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            {appt.booking_date} at {appt.booking_time}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {appt.total_duration} min • €{(appt.total_amount || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={appt.status}
                            onChange={(e) => handleUpdateAppointmentStatus(appt.appointment_id, e.target.value)}
                            className="px-4 py-2 rounded-lg border border-border bg-background"
                            data-testid={`appointment-status-${appt.appointment_id}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAppointment(appt.appointment_id)}
                            aria-label="Delete appointment"
                            data-testid={`delete-appointment-${appt.appointment_id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(appt.items || []).map((it, idx) => (
                          <span key={idx} className="px-3 py-1 bg-muted rounded-full text-sm text-foreground">
                            {it.name}
                          </span>
                        ))}
                      </div>
                      {appt.notes && <p className="text-sm text-muted-foreground mt-3">Notes: {appt.notes}</p>}
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

            {activeTab === 'messages' && (
              <div>
                <h2 className="text-2xl font-heading font-semibold text-foreground mb-6">Contact Messages</h2>

                <div className="flex flex-wrap gap-2 mb-6">
                  {['all', 'new', 'read', 'handled'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setMessageFilter(f)}
                      className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                        messageFilter === f
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                      data-testid={`message-filter-${f}`}
                    >
                      {f} ({messageCounts[f]})
                    </button>
                  ))}
                </div>

                {filteredMessages.length === 0 ? (
                  <p className="text-muted-foreground">
                    {messages.length === 0 ? 'No messages yet.' : `No ${messageFilter} messages.`}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredMessages.map((msg) => (
                      <div key={msg.message_id} className="border border-border rounded-xl p-4" data-testid={`message-${msg.message_id}`}>
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                          <div>
                            <p className="font-semibold text-foreground flex items-center gap-2">
                              {msg.name}
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge[msg.status] || 'bg-muted text-muted-foreground'}`}>
                                {msg.status}
                              </span>
                              {msg.subject && <span className="text-muted-foreground font-normal"> — {msg.subject}</span>}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                              <a href={`mailto:${msg.email}`} className="flex items-center gap-1 hover:text-primary">
                                <Mail className="w-3.5 h-3.5" /> {msg.email}
                              </a>
                              {msg.phone && <span>{msg.phone}</span>}
                              <span>{new Date(msg.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={msg.status}
                              onChange={(e) => handleUpdateMessageStatus(msg.message_id, e.target.value)}
                              className="px-4 py-2 rounded-lg border border-border bg-background"
                              data-testid={`message-status-${msg.message_id}`}
                            >
                              <option value="new">New</option>
                              <option value="read">Read</option>
                              <option value="handled">Handled</option>
                            </select>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMessage(msg.message_id)}
                              aria-label="Delete message"
                              data-testid={`delete-message-${msg.message_id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap mt-2">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;