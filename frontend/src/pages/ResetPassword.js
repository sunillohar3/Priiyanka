import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import { toast } from 'sonner';
import API from '../lib/api';
import Reveal from '../components/common/Reveal';

const ResetPassword = () => {
  const { language } = useLanguage();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useSEO(language === 'en' ? 'Reset Password' : 'Wachtwoord opnieuw instellen', '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(language === 'en' ? 'Password must be at least 6 characters' : 'Wachtwoord moet minstens 6 tekens bevatten');
      return;
    }
    if (password !== confirm) {
      setError(language === 'en' ? 'Passwords do not match' : 'Wachtwoorden komen niet overeen');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { token, password });
      toast.success(language === 'en' ? 'Password updated. Please log in.' : 'Wachtwoord bijgewerkt. Log in.');
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.detail || (language === 'en' ? 'Could not reset password.' : 'Kan wachtwoord niet opnieuw instellen.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 text-center" data-testid="reset-invalid">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-foreground mb-3">
            {language === 'en' ? 'Invalid reset link' : 'Ongeldige resetlink'}
          </h1>
          <Link to="/" className="text-primary underline">{language === 'en' ? 'Back to Home' : 'Terug naar Home'}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <Reveal className="w-full max-w-md bg-card p-8 rounded-2xl border border-border">
        <h1 className="text-2xl font-heading font-semibold text-foreground mb-6">
          {language === 'en' ? 'Set a new password' : 'Nieuw wachtwoord instellen'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate data-testid="reset-password-form">
          <div className="space-y-2">
            <Label htmlFor="new-password">
              {language === 'en' ? 'New password' : 'Nieuw wachtwoord'} <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'reset-error' : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              {language === 'en' ? 'Confirm password' : 'Bevestig wachtwoord'} <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          {error && <p id="reset-error" role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting} data-testid="reset-submit">
            {submitting
              ? (language === 'en' ? 'Updating...' : 'Bijwerken...')
              : (language === 'en' ? 'Update password' : 'Wachtwoord bijwerken')}
          </Button>
        </form>
      </Reveal>
    </div>
  );
};

export default ResetPassword;
