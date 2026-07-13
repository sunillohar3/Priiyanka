import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Globe, LogOut, User, LayoutDashboard, Shield, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
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

  const closeMobile = () => setMobileOpen(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await login(loginEmail, loginPassword);
      setShowLoginModal(false);
      toast.success(language === 'en' ? 'Welcome back!' : 'Welkom terug!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(
        language === 'en'
          ? 'Login failed. Please check your email and password.'
          : 'Inloggen mislukt. Controleer uw e-mail en wachtwoord.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await register(registerEmail, registerPassword, registerName);
      setShowLoginModal(false);
      toast.success(language === 'en' ? 'Account created successfully!' : 'Account succesvol aangemaakt!');
    } catch (error) {
      console.error('Register error:', error);
      toast.error(
        language === 'en'
          ? 'Registration failed. Please try again.'
          : 'Registratie mislukt. Probeer het opnieuw.'
      );
    } finally {
      setAuthLoading(false);
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
              src="/assets/logo.png"
              alt="Priiyanka's Nature Nest logo"
              className="h-16 w-auto object-contain"
            />
            <div className="text-2xl font-bold text-primary hidden sm:block">
              Priiyanka's Nature Nest
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
                      <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">{t('auth.email')}</Label>
                          <Input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password">{t('auth.password')}</Label>
                          <Input
                            id="login-password"
                            type="password"
                            autoComplete="current-password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                          />
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
                      </form>
                    </TabsContent>
                    <TabsContent value="register">
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-name">{t('auth.name')}</Label>
                          <Input
                            id="register-name"
                            autoComplete="name"
                            value={registerName}
                            onChange={(e) => setRegisterName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-email">{t('auth.email')}</Label>
                          <Input
                            id="register-email"
                            type="email"
                            autoComplete="email"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-password">{t('auth.password')}</Label>
                          <Input
                            id="register-password"
                            type="password"
                            autoComplete="new-password"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            required
                          />
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
