'use client';

import { Navbar as BSNavbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import { FaUser, FaShoppingCart, FaSignOutAlt, FaUserPlus, FaUtensils, FaInfoCircle, FaUserCircle, FaHeart } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import { favoritesEvents } from '../utils/event';

export default function Navbar() {
  const { user, userData, isGuest, logout } = useAuth();
  const { totalItems } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch favorites count when user changes
  useEffect(() => {
    if (user && !isGuest) {
      fetchFavoritesCount();
    } else {
      setFavoritesCount(0);
    }
  }, [user, isGuest]);

  // Listen for favorites updates
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      if (user && !isGuest) {
        fetchFavoritesCount();
      }
    };
    
    favoritesEvents.addEventListener(handleFavoritesUpdate);
    return () => favoritesEvents.removeEventListener(handleFavoritesUpdate);
  }, [user, isGuest]);

  const fetchFavoritesCount = async () => {
    if (!user) return;
    try {
      const snapshot = await get(ref(db, `favorites/${user.uid}`));
      if (snapshot.exists()) {
        const favorites = snapshot.val();
        setFavoritesCount(Object.keys(favorites).length);
      } else {
        setFavoritesCount(0);
      }
    } catch (error) {
      console.error('Error fetching favorites count:', error);
    }
  };

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <BSNavbar 
      expand="lg" 
      fixed="top"
      className={`shadow-sm transition-all  navbar-dark duration-300 ${scrolled ? 'py-2' : 'py-3'}`}
      style={{ 
        background: scrolled ? '#000000' : '#000000',
        transition: 'all 0.3s ease'
      }}
    >
      <Container>
        <BSNavbar.Brand onClick={() => router.push('/')} style={{ cursor: 'pointer' }} className="d-flex align-items-center gap-2">
          <FaUtensils size={28} color="#ff6b35" />
          <span 
            className="fw-bold fs-4" 
            style={{ 
              fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
              background: 'linear-gradient(135deg, #ffffff, #ff6b35, #6b0c12)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '1px',
              fontStyle: 'italic'
            }}
          >
            Bertha's Food
          </span>
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="navbar-nav" />
        
        <BSNavbar.Collapse id="navbar-nav">
          <Nav className="ms-auto d-flex align-items-center gap-2">
            {/* Home Button */}
            <Button
              variant="link"
              onClick={() => router.push('/')}
              className={`d-flex align-items-center gap-2 px-3 py-2 text-decoration-none nav-link-custom ${isActive('/') ? 'active-custom' : ''}`}
              style={{ 
                borderRadius: '10px',
                color: '#ffffff',
                transition: 'all 0.3s ease',
                background: 'transparent',
                border: 'none',
                fontFamily: "'Poppins', sans-serif"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(107, 12, 18, 0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Home
            </Button>
            
            {/* About Button */}
            <Button
              variant="link"
              onClick={() => router.push('/about')}
              className={`d-flex align-items-center gap-2 px-3 py-2 text-decoration-none nav-link-custom ${isActive('/about') ? 'active-custom' : ''}`}
              style={{ 
                borderRadius: '10px',
                color: '#ffffff',
                transition: 'all 0.3s ease',
                background: 'transparent',
                border: 'none',
                fontFamily: "'Poppins', sans-serif"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(107, 12, 18, 0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FaInfoCircle size={18} />
              About
            </Button>
            
            {/* Bucket Button */}
            <Button
              variant="link"
              onClick={() => router.push('/bucket')}
              className={`d-flex align-items-center gap-2 px-3 py-2 position-relative text-decoration-none nav-link-custom ${isActive('/bucket') ? 'active-custom' : ''}`}
              style={{ 
                borderRadius: '10px',
                color: '#ffffff',
                transition: 'all 0.3s ease',
                background: 'transparent',
                border: 'none',
                fontFamily: "'Poppins', sans-serif"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(107, 12, 18, 0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <FaShoppingCart size={18} />
              Bucket
              {totalItems > 0 && (
                <Badge 
                  pill 
                  bg="danger" 
                  className="position-absolute top-0 start-100 translate-middle"
                  style={{ fontSize: '10px' }}
                >
                  {totalItems}
                </Badge>
              )}
            </Button>
            
            {/* Favorites Button - Only show for logged-in users */}
            {user && !isGuest && (
              <Button
                variant="link"
                onClick={() => router.push('/favorites')}
                className={`d-flex align-items-center gap-2 px-3 py-2 position-relative text-decoration-none nav-link-custom ${isActive('/favorites') ? 'active-custom' : ''}`}
                style={{ 
                  borderRadius: '10px',
                  color: '#ffffff',
                  transition: 'all 0.3s ease',
                  background: 'transparent',
                  border: 'none',
                  fontFamily: "'Poppins', sans-serif"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(107, 12, 18, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <FaHeart size={16} />
                Favorites
                {favoritesCount > 0 && (
                  <Badge 
                    pill 
                    bg="danger" 
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{ fontSize: '10px' }}
                  >
                    {favoritesCount}
                  </Badge>
                )}
              </Button>
            )}
            
            {user || isGuest ? (
              <>
                {/* User Info */}
                
                
                {/* Profile Button (only for logged in users, not guests) */}
                {!isGuest && (
                  <Button 
                    variant="outline-light" 
                    size="sm" 
                    onClick={() => router.push('/profile')}
                    className="d-flex align-items-center gap-2 px-3 py-2"
                    style={{ 
                      borderRadius: '10px',
                      color: '#ffffff',
                      transition: 'all 0.3s ease',
                      background: 'transparent',
                      border: 'none',
                      fontFamily: "'Poppins', sans-serif"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(107, 12, 18, 0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <FaUserCircle size={14} />
                    Profile
                  </Button>
                )}

                <div className="d-flex align-items-center gap-2 ms-2 px-3 py-1" style={{ 
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '10px'
                }}>
                  <FaUser size={14} color="#ffffff" />
                  <span className="text-white small" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {isGuest ? 'Guest' : userData?.fullName?.split(' ')[0] || 'User'}
                  </span>
                </div>
                
                {/* Logout Button */}
                <Button 
                  variant="outline-light" 
                  size="sm" 
                  onClick={handleLogout}
                  className="d-flex align-items-center gap-2 px-3 py-2"
                  style={{ 
                    borderRadius: '10px', 
                    borderWidth: '2px',
                    borderColor: '#6b0c12',
                    color: '#ffffff',
                    fontFamily: "'Poppins', sans-serif"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#6b0c12';
                    e.currentTarget.style.borderColor = '#6b0c12';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#6b0c12';
                  }}
                >
                  <FaSignOutAlt size={14} />
                  Logout
                </Button>
              </>
            ) : (
              // Login/Signup Button for non-authenticated users
              <Button 
                onClick={() => router.push('/auth')}
                variant="outline-light" 
                size="sm" 
                className="d-flex align-items-center gap-2 px-3 py-2"
                style={{ 
                  borderRadius: '10px', 
                  borderWidth: '2px',
                  borderColor: '#ff6b35',
                  color: '#ffffff',
                  fontFamily: "'Poppins', sans-serif"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ff6b35';
                  e.currentTarget.style.borderColor = '#ff6b35';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#ff6b35';
                }}
              >
                <FaUserPlus size={14} />
                Login / Signup
              </Button>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}