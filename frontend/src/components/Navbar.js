import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Globe, LogOut, User, LayoutDashboard, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { language, setLanguage, t } = useLanguage();
  const { cartCount } = useCart();
  const { user, logout } = useAuth();

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <span className="text-2xl text-primary-foreground font-handwriting">P</span>
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-foreground">Priiyanka's</h1>
              <p className="text-xs text-muted-foreground">Nature Nest</p>
            </div>
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
              <Button onClick={handleLogin} className="bg-primary text-primary-foreground hover:bg-secondary rounded-full px-6" data-testid="login-button">
                {t('nav.login')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;