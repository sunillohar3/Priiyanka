import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Globe, LogOut, User, LayoutDashboard, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
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
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await login(loginEmail, loginPassword);
      setShowLoginModal(false);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await register(registerEmail, registerPassword, registerName);
      setShowLoginModal(false);
    } catch (error) {
      console.error('Register error:', error);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to the backend Google OAuth login endpoint
    const redirectUrl = encodeURIComponent(`${window.location.origin}/auth/callback`);
    // REACT_APP_BACKEND_URL already includes /api, so don't add it again
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/auth/google/login?redirect=${redirectUrl}`;
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
            <img 
              src="https://customer-assets.emergentagent.com/job_priiyanka-nature/artifacts/4azlwkyk_Logo.png" 
              alt="Priiyanka's Nature Nest" 
              className="h-16 w-auto"
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-foreground hover:text-primary transition-colors" data-testid="nav-home">
              {t('nav.home')}
            </Link>
            <Link to="/services" className="text-foreground hover:text-primary transition-colors" data-testid="nav-services">
              {t('nav.services')}
            </Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors" data-testid="nav-about">
              {t('nav.about')}
            </Link>
            <Link to="/contact" className="text-foreground hover:text-primary transition-colors" data-testid="nav-contact">
              {t('nav.contact')}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setLanguage(language === 'en' ? 'nl' : 'en')}
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
              data-testid="language-switch"
            >
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium uppercase">{language}</span>
            </button>

            <Link to="/cart" className="relative" data-testid="cart-link">
              <ShoppingCart className="w-5 h-5 text-foreground hover:text-primary transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
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
                  <Button className="bg-primary text-primary-foreground hover:bg-secondary rounded-full px-6" data-testid="login-button">
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
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          {t('auth.login')}
                        </Button>
                      </form>
                    </TabsContent>
                    <TabsContent value="register">
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-name">{t('auth.name')}</Label>
                          <Input
                            id="register-name"
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
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          {t('auth.register')}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                  <div className="mt-4">
                    <Button onClick={handleGoogleLogin} variant="outline" className="w-full">
                      {t('auth.googleLogin')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;