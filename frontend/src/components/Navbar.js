import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Globe, LogOut, User, LayoutDashboard, Shield, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import API from '../lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const Navbar = () => {
  const { language, setLanguage, t } = useLanguage();
  const { cartCount } = useCart();
  const { user, logout, login, register } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [loginErrors, setLoginErrors] = useState({});
  const [registerErrors, setRegisterErrors] = useState({});
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim());
  const vmsg = {
    required: language === 'en' ? 'This field is required' : 'Dit veld is verplicht',
    email: language === 'en' ? 'Please enter a valid email address' : 'Voer een geldig e-mailadres in',
    pwLen: language === 'en' ? 'Password must be at least 6 characters' : 'Wachtwoord moet minstens 6 tekens bevatten',
  };

  const focusFirst = (pairs, errs) => {
    for (const [key, id] of pairs) {
      if (errs[key]) {
        const el = document.getElementById(id);
        if (el) el.focus();
        break;
      }
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!loginEmail.trim()) errs.email = vmsg.required;
    else if (!isEmail(loginEmail)) errs.email = vmsg.email;
    if (!loginPassword) errs.password = vmsg.required;
    setLoginErrors(errs);
    if (Object.keys(errs).length) {
      focusFirst([['email', 'login-email'], ['password', 'login-password']], errs);
      return;
    }

    setAuthLoading(true);
    try {
      await login(loginEmail, loginPassword);
      setShowLoginModal(false);
      toast.success(language === 'en' ? 'Welcome back!' : 'Welkom terug!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(
        error?.response?.data?.detail ||
        (language === 'en'
          ? 'Login failed. Please check your email and password.'
          : 'Inloggen mislukt. Controleer uw e-mail en wachtwoord.')
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!registerName.trim()) errs.name = vmsg.required;
    if (!registerEmail.trim()) errs.email = vmsg.required;
    else if (!isEmail(registerEmail)) errs.email = vmsg.email;
    if (!registerPassword) errs.password = vmsg.required;
    else if (registerPassword.length < 6) errs.password = vmsg.pwLen;
    setRegisterErrors(errs);
    if (Object.keys(errs).length) {
      focusFirst([['name', 'register-name'], ['email', 'register-email'], ['password', 'register-password']], errs);
      return;
    }

    setAuthLoading(true);
    try {
      await register(registerEmail, registerPassword, registerName);
      setShowLoginModal(false);
      toast.success(language === 'en' ? 'Account created successfully!' : 'Account succesvol aangemaakt!');
    } catch (error) {
      console.error('Register error:', error);
      toast.error(
        error?.response?.data?.detail ||
        (language === 'en'
          ? 'Registration failed. Please try again.'
          : 'Registratie mislukt. Probeer het opnieuw.')
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!isEmail(forgotEmail)) {
      toast.error(vmsg.email);
      return;
    }
    setForgotLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: forgotEmail });
      toast.success(
        language === 'en'
          ? 'If that email is registered, a reset link has been sent.'
          : 'Als dat e-mailadres bestaat, is er een resetlink verzonden.'
      );
      setForgotMode(false);
      setForgotEmail('');
    } catch (error) {
      toast.error(language === 'en' ? 'Something went wrong. Please try again.' : 'Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setForgotLoading(false);
    }
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/services', label: t('nav.services') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const nextLanguageLabel = language === 'en' ? 'Overschakelen naar Nederlands' : 'Switch to English';

  const focusRing =
    'rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className={`flex items-center gap-3 ${focusRing}`} data-testid="logo-link">
            <img
              src="/assets/logo-icon.png"
              alt="Priiyanka's Nature Nest logo"
              width="406"
              height="282"
              className="h-12 w-auto object-contain"
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-heading text-xl font-bold text-primary tracking-tight">
                Priiyanka's Nature Nest
              </span>
              <span className="hidden lg:block whitespace-nowrap text-[11px] uppercase tracking-[0.2em] text-accent font-medium">
                Where Nature Nurtures You
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-foreground hover:text-primary transition-colors ${focusRing}`}
                data-testid={`nav-${link.to === '/' ? 'home' : link.to.slice(1)}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setLanguage(language === 'en' ? 'nl' : 'en')}
              className={`flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-2 text-foreground hover:text-primary transition-colors ${focusRing}`}
              aria-label={nextLanguageLabel}
              data-testid="language-switch"
            >
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium uppercase">{language}</span>
            </button>

            <Link
              to="/cart"
              className={`relative flex items-center justify-center min-h-[44px] min-w-[44px] text-foreground hover:text-primary transition-colors ${focusRing}`}
              aria-label={
                cartCount > 0
                  ? `${t('nav.cart')} (${cartCount})`
                  : t('nav.cart')
              }
              data-testid="cart-link"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-0 bg-accent text-accent-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/dashboard" data-testid="dashboard-link">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    {t('nav.dashboard')}
                  </Button>
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" data-testid="admin-link">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Shield className="w-4 h-4" />
                      {t('nav.admin')}
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={logout} className="gap-2" data-testid="logout-button">
                  <LogOut className="w-4 h-4" />
                  {t('nav.logout')}
                </Button>
              </div>
            ) : (
              <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
                <DialogTrigger asChild>
                  <Button className="hidden md:inline-flex bg-primary text-primary-foreground hover:bg-secondary rounded-full px-6" data-testid="login-button">
                    {t('nav.login')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t('auth.login')}</DialogTitle>
                    <DialogDescription>
                      {t('auth.loginDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
                      <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                      <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
                        <div className="space-y-2">
                          <Label htmlFor="login-email">
                            {t('auth.email')} <span className="text-destructive" aria-hidden="true">*</span>
                          </Label>
                          <Input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            value={loginEmail}
                            onChange={(e) => { setLoginEmail(e.target.value); if (loginErrors.email) setLoginErrors((p) => ({ ...p, email: undefined })); }}
                            required
                            aria-required="true"
                            aria-invalid={loginErrors.email ? 'true' : undefined}
                            aria-describedby={loginErrors.email ? 'login-email-error' : undefined}
                          />
                          {loginErrors.email && (
                            <p id="login-email-error" role="alert" className="text-sm text-destructive">{loginErrors.email}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password">
                            {t('auth.password')} <span className="text-destructive" aria-hidden="true">*</span>
                          </Label>
                          <Input
                            id="login-password"
                            type="password"
                            autoComplete="current-password"
                            value={loginPassword}
                            onChange={(e) => { setLoginPassword(e.target.value); if (loginErrors.password) setLoginErrors((p) => ({ ...p, password: undefined })); }}
                            required
                            aria-required="true"
                            aria-invalid={loginErrors.password ? 'true' : undefined}
                            aria-describedby={loginErrors.password ? 'login-password-error' : undefined}
                          />
                          {loginErrors.password && (
                            <p id="login-password-error" role="alert" className="text-sm text-destructive">{loginErrors.password}</p>
                          )}
                        </div>
                        <Button type="submit" className="w-full" disabled={authLoading}>
                          {authLoading ? (
                            <span className="flex items-center gap-2">
                              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                              {language === 'en' ? 'Signing in...' : 'Inloggen...'}
                            </span>
                          ) : (
                            t('auth.login')
                          )}
                        </Button>
                        <div className="pt-1 text-center">
                          <button
                            type="button"
                            onClick={() => setForgotMode((v) => !v)}
                            className="text-sm text-primary hover:underline"
                          >
                            {forgotMode
                              ? (language === 'en' ? 'Back to login' : 'Terug naar inloggen')
                              : (language === 'en' ? 'Forgot your password?' : 'Wachtwoord vergeten?')}
                          </button>
                        </div>
                      </form>
                      {forgotMode && (
                        <div className="space-y-2 mt-4 pt-4 border-t border-border" data-testid="forgot-password">
                          <Label htmlFor="forgot-email">{t('auth.email')}</Label>
                          <Input
                            id="forgot-email"
                            type="email"
                            autoComplete="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                          />
                          <Button type="button" className="w-full" onClick={handleForgot} disabled={forgotLoading}>
                            {forgotLoading
                              ? (language === 'en' ? 'Sending...' : 'Versturen...')
                              : (language === 'en' ? 'Send reset link' : 'Verstuur resetlink')}
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="register">
                      <form onSubmit={handleRegister} className="space-y-4" noValidate>
                        <div className="space-y-2">
                          <Label htmlFor="register-name">
                            {t('auth.name')} <span className="text-destructive" aria-hidden="true">*</span>
                          </Label>
                          <Input
                            id="register-name"
                            autoComplete="name"
                            value={registerName}
                            onChange={(e) => { setRegisterName(e.target.value); if (registerErrors.name) setRegisterErrors((p) => ({ ...p, name: undefined })); }}
                            required
                            aria-required="true"
                            aria-invalid={registerErrors.name ? 'true' : undefined}
                            aria-describedby={registerErrors.name ? 'register-name-error' : undefined}
                          />
                          {registerErrors.name && (
                            <p id="register-name-error" role="alert" className="text-sm text-destructive">{registerErrors.name}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-email">
                            {t('auth.email')} <span className="text-destructive" aria-hidden="true">*</span>
                          </Label>
                          <Input
                            id="register-email"
                            type="email"
                            autoComplete="email"
                            value={registerEmail}
                            onChange={(e) => { setRegisterEmail(e.target.value); if (registerErrors.email) setRegisterErrors((p) => ({ ...p, email: undefined })); }}
                            required
                            aria-required="true"
                            aria-invalid={registerErrors.email ? 'true' : undefined}
                            aria-describedby={registerErrors.email ? 'register-email-error' : undefined}
                          />
                          {registerErrors.email && (
                            <p id="register-email-error" role="alert" className="text-sm text-destructive">{registerErrors.email}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-password">
                            {t('auth.password')} <span className="text-destructive" aria-hidden="true">*</span>
                          </Label>
                          <Input
                            id="register-password"
                            type="password"
                            autoComplete="new-password"
                            value={registerPassword}
                            onChange={(e) => { setRegisterPassword(e.target.value); if (registerErrors.password) setRegisterErrors((p) => ({ ...p, password: undefined })); }}
                            required
                            aria-required="true"
                            aria-invalid={registerErrors.password ? 'true' : undefined}
                            aria-describedby={registerErrors.password ? 'register-password-error' : 'register-password-hint'}
                          />
                          {registerErrors.password ? (
                            <p id="register-password-error" role="alert" className="text-sm text-destructive">{registerErrors.password}</p>
                          ) : (
                            <p id="register-password-hint" className="text-xs text-muted-foreground">
                              {language === 'en' ? 'At least 6 characters' : 'Minstens 6 tekens'}
                            </p>
                          )}
                        </div>
                        <Button type="submit" className="w-full" disabled={authLoading}>
                          {authLoading ? (
                            <span className="flex items-center gap-2">
                              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                              {language === 'en' ? 'Creating account...' : 'Account aanmaken...'}
                            </span>
                          ) : (
                            t('auth.register')
                          )}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            )}

            <button
              onClick={() => setMobileOpen((open) => !open)}
              className={`md:hidden flex items-center justify-center min-h-[44px] min-w-[44px] text-foreground hover:text-primary transition-colors ${focusRing}`}
              aria-label={mobileOpen ? (language === 'en' ? 'Close menu' : 'Menu sluiten') : (language === 'en' ? 'Open menu' : 'Menu openen')}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              data-testid="mobile-menu-toggle"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-border bg-background/95 backdrop-blur-md"
          data-testid="mobile-menu"
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMobile}
                className={`flex items-center min-h-[44px] px-2 text-foreground hover:text-primary transition-colors ${focusRing}`}
                data-testid={`mobile-nav-${link.to === '/' ? 'home' : link.to.slice(1)}`}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-border mt-2 pt-2 flex flex-col gap-1">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={closeMobile} className={`flex items-center gap-2 min-h-[44px] px-2 text-foreground hover:text-primary transition-colors ${focusRing}`}>
                    <LayoutDashboard className="w-4 h-4" />
                    {t('nav.dashboard')}
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={closeMobile} className={`flex items-center gap-2 min-h-[44px] px-2 text-foreground hover:text-primary transition-colors ${focusRing}`}>
                      <Shield className="w-4 h-4" />
                      {t('nav.admin')}
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); closeMobile(); }}
                    className={`flex items-center gap-2 min-h-[44px] px-2 text-left text-foreground hover:text-primary transition-colors ${focusRing}`}
                  >
                    <LogOut className="w-4 h-4" />
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <Button
                  onClick={() => { closeMobile(); setShowLoginModal(true); }}
                  className="bg-primary text-primary-foreground hover:bg-secondary rounded-full"
                  data-testid="mobile-login-button"
                >
                  <User className="w-4 h-4" />
                  {t('nav.login')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
