'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Badge, Modal } from 'react-bootstrap';
import { FaHeart, FaRegHeart, FaShoppingCart, FaClock, FaUtensils, FaTrash } from 'react-icons/fa';
import { db } from '../lib/firebase';
import { ref, get, remove } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

import type { FoodItem } from '../types';
import { favoritesEvents } from '../utils/event';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  
  const { user, isGuest } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (isGuest) {
      router.push('/auth');
      return;
    }
    if (user) {
      fetchFavorites();
    }
  }, [user, isGuest]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get favorite IDs from user's favorites node
      const favoritesSnapshot = await get(ref(db, `favorites/${user.uid}`));
      
      if (favoritesSnapshot.exists()) {
        const favoriteIds = Object.keys(favoritesSnapshot.val());
        
        // Fetch full food item details for each favorite ID
        const favoriteItems: FoodItem[] = [];
        for (const foodId of favoriteIds) {
          const foodRef = ref(db, `food_items/${foodId}`);
          const foodSnapshot = await get(foodRef);
          
          if (foodSnapshot.exists()) {
            const foodData = { id: foodSnapshot.key, ...foodSnapshot.val() };
            favoriteItems.push(foodData);
          }
        }
        
        setFavorites(favoriteItems);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };


// Update the removeFromFavorites function
const removeFromFavorites = async (foodId: string) => {
  if (!user) return;
  
  setRemovingId(foodId);
  try {
    const favoriteRef = ref(db, `favorites/${user.uid}/${foodId}`);
    await remove(favoriteRef);
    
    // Update local state
    setFavorites(prev => prev.filter(item => item.id !== foodId));
    toast.success('Removed from favorites');
    
    // Dispatch event to update navbar badge
    favoritesEvents.dispatch();
  } catch (error) {
    console.error('Error removing favorite:', error);
    toast.error('Failed to remove from favorites');
  } finally {
    setRemovingId(null);
  }
};


 
  const handleAddToCart = (item: FoodItem) => {
    if (item.sizes && item.sizes.length > 0) {
      // If item has sizes, add the first size by default or show modal
      addToCart(item.id!, item.sizes[0].name, 1);
    } else {
      addToCart(item.id!, 'Regular', 1);
    }
  };

  const getCategoryName = (categoryId: string) => {
    // This will be populated from props or you can fetch categories
    return 'Category';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: '#f8f9fa', paddingTop: '80px' }}>
          <Spinner animation="border" variant="dark" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingTop: '80px' }}>
        <Container className="py-5">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{ 
                width: '80px', 
                height: '80px', 
                background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                borderRadius: '50%'
              }}>
              <FaHeart size={35} color="#fff" />
            </div>
            <h1 className="fw-bold mb-2" style={{ 
              background: 'linear-gradient(135deg, #6b0c12, #ff6b35)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              My Favorites
            </h1>
            <p className="text-muted">Your collection of favorite dishes</p>
          </div>

          {/* Favorites Grid */}
          {favorites.length === 0 ? (
            <Card className="text-center py-5 border-0 shadow-sm mx-auto" style={{ maxWidth: '500px', borderRadius: '20px' }}>
              <Card.Body className="p-5">
                <FaRegHeart size={80} className="text-muted mb-3" />
                <h3 className="fw-bold mb-2">No Favorites Yet</h3>
                <p className="text-muted mb-4">
                  Start adding your favorite dishes by clicking the heart icon on any food item.
                </p>
                <Button 
                  onClick={() => router.push('/')}
                  style={{ 
                    background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                    border: 'none',
                    borderRadius: '12px'
                  }}
                >
                  Browse Menu
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <Row className="g-4">
              {favorites.map((item) => (
                <Col key={item.id} md={6} lg={4} xl={3}>
                  <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px', overflow: 'hidden', transition: 'all 0.3s' }}>
                    {/* Image Section */}
                    <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="h-100 d-flex align-items-center justify-content-center bg-light">
                          <FaUtensils size={60} className="text-muted" />
                        </div>
                      )}
                      
                      {/* Remove from Favorites Button */}
                      <Button
                        variant="danger"
                        onClick={() => removeFromFavorites(item.id!)}
                        disabled={removingId === item.id}
                        className="position-absolute"
                        style={{
                          top: '10px',
                          right: '10px',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        {removingId === item.id ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <FaTrash size={16} />
                        )}
                      </Button>
                      
                      {/* Favorite Badge */}
                      <Badge 
                        className="position-absolute bottom-0 start-0 m-2"
                        style={{ background: '#ff6b35', border: 'none' }}
                      >
                        <FaHeart size={12} className="me-1" /> Favorite
                      </Badge>
                    </div>
                    
                    <Card.Body className="p-4">
                      <h5 className="fw-bold mb-2" style={{ color: '#6b0c12' }}>{item.name}</h5>
                      
                      <p className="text-muted small mb-3">
                        {item.description?.substring(0, 80)}...
                      </p>
                      
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex gap-2">
                          <Badge bg="light" text="dark" className="px-2 py-1">
                            <FaClock className="me-1" size={10} />
                            {item.preparationTime || '15-20 min'}
                          </Badge>
                        </div>
                        <h5 className="fw-bold mb-0" style={{ color: '#6b0c12' }}>${item.price}</h5>
                      </div>
                    </Card.Body>
                    
                    <Card.Footer className="bg-white border-0 pb-4 px-4">
                      <Button 
                        onClick={() => handleAddToCart(item)}
                        className="w-100 d-flex align-items-center justify-content-center gap-2"
                        style={{ 
                          background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '10px'
                        }}
                      >
                        <FaShoppingCart size={16} />
                        Add to Bucket
                      </Button>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </div>
    </>
  );
}