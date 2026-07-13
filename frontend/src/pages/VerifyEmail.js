import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useSEO } from '../hooks/useSEO';
import API from '../lib/api';

const VerifyEmail = () => {
  const { language } = useLanguage();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useSEO(language === 'en' ? 'Verify Email' : 'E-mail verifiëren', '');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(language === 'en' ? 'Invalid verification link.' : 'Ongeldige verificatielink.');
      return;
    }
    axios.post(`${API}/auth/verify-email`, { token })
      .then((res) => {
        setStatus('success');
        setMessage(res.data?.message || (language === 'en' ? 'Your email has been verified.' : 'Uw e-mail is geverifieerd.'));
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.response?.data?.detail || (language === 'en' ? 'Verification failed.' : 'Verificatie mislukt.'));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 text-center">
      <div className="max-w-md">
        {status === 'verifying' && (
          <>
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">{language === 'en' ? 'Verifying your email...' : 'Uw e-mail verifiëren...'}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-14 h-14 text-secondary mx-auto mb-4" />
            <h1 className="text-2xl font-heading font-semibold text-foreground mb-3">
              {language === 'en' ? 'Email verified' : 'E-mail geverifieerd'}
            </h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Link to="/"><Button className="rounded-full px-8">{language === 'en' ? 'Go to Home' : 'Naar Home'}</Button></Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-heading font-semibold text-foreground mb-3">
              {language === 'en' ? 'Verification failed' : 'Verificatie mislukt'}
            </h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Link to="/"><Button variant="outline" className="rounded-full px-8">{language === 'en' ? 'Back to Home' : 'Terug naar Home'}</Button></Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
