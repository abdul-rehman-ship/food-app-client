'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Badge, Modal, Form, InputGroup } from 'react-bootstrap';
import { FaShoppingCart, FaClock, FaUtensils, FaPlus, FaMinus, FaSearch, FaHeart, FaRegHeart } from 'react-icons/fa';
import { db } from './lib/firebase';
import { ref, get, set, remove, update } from 'firebase/database';
import { useAuth } from './contexts/AuthContext';
import { useCart } from './contexts/CartContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from './components/Navbar';
import { favoritesEvents } from './utils/event';
import type { FoodItem, Category, Size } from './types';

export default function HomePage() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [detailItem, setDetailItem] = useState<FoodItem | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  
  const { user, isGuest } = useAuth();
  const { addToCart, totalItems } = useCart();
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (user && !isGuest) {
      fetchFavorites();
    }
  }, [user, isGuest]);

  useEffect(() => {
    filterItems();
  }, [selectedCategory, searchTerm, foodItems]);

  const fetchData = async () => {
    try {
      const [foodSnapshot, catSnapshot] = await Promise.all([
        get(ref(db, 'food_items')),
        get(ref(db, 'categories'))
      ]);
      
      const foodData: FoodItem[] = [];
      foodSnapshot.forEach((child) => {
        const item = { id: child.key, ...child.val() };
        if (item.stock > 0) {
          foodData.push(item);
        }
      });
      
      const catData: Category[] = [];
      catSnapshot.forEach((child) => {
        catData.push({ id: child.key, ...child.val() });
      });
      
      setFoodItems(foodData);
      setFilteredItems(foodData);
      setCategories(catData);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      const favoritesSnapshot = await get(ref(db, `favorites/${user.uid}`));
      if (favoritesSnapshot.exists()) {
        const favoritesData = favoritesSnapshot.val();
        const favoriteIds = new Set(Object.keys(favoritesData));
        setFavorites(favoriteIds);
      } else {
        setFavorites(new Set());
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

// Add import at the top


// Update the toggleFavorite function
const toggleFavorite = async (foodId: string) => {
  if (isGuest) {
    toast.error('Please login to add favorites');
    router.push('/auth');
    return;
  }

  if (!user) return;

  setFavoritesLoading(true);
  try {
    const favoriteRef = ref(db, `favorites/${user.uid}/${foodId}`);
    const snapshot = await get(favoriteRef);
    
    if (snapshot.exists()) {
      // Remove from favorites
      await remove(favoriteRef);
      setFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(foodId);
        return newSet;
      });
      toast.success('Removed from favorites');
      // Dispatch event to update navbar badge
      favoritesEvents.dispatch();
    } else {
      // Add to favorites
      await set(favoriteRef, true);
      setFavorites(prev => new Set([...prev, foodId]));
      toast.success('Added to favorites');
      // Dispatch event to update navbar badge
      favoritesEvents.dispatch();
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    toast.error('Failed to update favorites');
  } finally {
    setFavoritesLoading(false);
  }
};

  const filterItems = () => {
    let filtered = [...foodItems];
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.categoryId === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredItems(filtered);
  };

  const handleAddToBucket = (item: FoodItem) => {
    if (isGuest) {
      toast.error('Please login or signup to add items to bucket');
      router.push('/auth');
      return;
    }
    
    if (item.sizes && item.sizes.length > 0) {
      setSelectedItem(item);
      setSelectedSize(null);
      setQuantity(1);
      setShowSizeModal(true);
    } else {
      addToCart(item.id!, 'Regular', 1);
    }
  };

  const handleConfirmAddToBucket = async () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    
    await addToCart(selectedItem!.id!, selectedSize.name, quantity);
    
    setShowSizeModal(false);
    setSelectedItem(null);
    setSelectedSize(null);
    setQuantity(1);
  };

  const handleViewDetails = (item: FoodItem) => {
    setDetailItem(item);
    setShowProductDetail(true);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: '#f8f9fa' }}>
          <Spinner animation="border" variant="dark" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingTop: '80px' }}>
        {/* Hero Section with Image */}
        <div className="position-relative text-white" style={{ 
          background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
          padding: '60px 0',
          marginBottom: '40px'
        }}>
          <Container>
            <Row className="align-items-center">
              <Col lg={7}>
                <h1 className="display-4 fw-bold mb-3">
                  Delicious Food Delivered to Your Door
                </h1>
                <p className="lead mb-4">
                  Order your favorite meals from our menu and enjoy fast delivery or pickup
                </p>
                {isGuest ? (
                  <Button 
                    onClick={() => router.push('/auth')}
                    variant="light"
                    className="px-4 py-2 fw-bold"
                    style={{ borderRadius: '12px' }}
                  >
                    Sign in to Order
                  </Button>
                ) : (
                  <div className="d-flex gap-3">
                    <Button 
                      variant="light" 
                      className="px-4 py-2 fw-bold"
                      style={{ borderRadius: '12px' }}
                      onClick={() => {
                        const menuSection = document.getElementById('menu');
                        if (menuSection) {
                          menuSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      Order Now
                    </Button>
                    <Button 
                      variant="outline-light" 
                      className="px-4 py-2 fw-bold"
                      style={{ borderRadius: '12px' }}
                      onClick={() => router.push('/bucket')}
                    >
                      View Bucket ({totalItems})
                    </Button>
                  </div>
                )}
              </Col>
              <Col lg={5} className="d-none d-lg-block">
                <Image 
                  src="/headliner.png" 
                  alt="Delicious Food" 
                  width={400} 
                  height={300}
                  style={{ objectFit: 'contain' }}
                />
              </Col>
            </Row>
          </Container>
        </div>

        <Container className="py-4" id="menu">
          {/* Search Bar */}
          <div className="mb-4">
            <InputGroup style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <InputGroup.Text style={{ background: '#fff', border: '2px solid #e0e0e0', borderRight: 'none' }}>
                <FaSearch style={{ color: '#6b0c12' }} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search by food name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  borderRadius: '12px', 
                  border: '2px solid #e0e0e0',
                  borderLeft: 'none',
                  padding: '12px'
                }}
              />
            </InputGroup>
          </div>

          {/* Categories */}
          <div className="mb-5">
            <h2 className="fw-bold mb-4" style={{ 
              background: 'linear-gradient(135deg, #6b0c12, #ff6b35)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Our Menu
            </h2>
            <div className="d-flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'dark' : 'outline-dark'}
                onClick={() => setSelectedCategory('all')}
                className="px-4 py-2"
                style={{ borderRadius: '12px' }}
              >
                All Items
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'dark' : 'outline-dark'}
                  onClick={() => setSelectedCategory(cat.id!)}
                  className="px-4 py-2"
                  style={{ borderRadius: '12px' }}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Food Items Grid */}
          {filteredItems.length === 0 ? (
            <Card className="text-center py-5 border-0 shadow-sm" style={{ borderRadius: '20px' }}>
              <Card.Body>
                <FaUtensils size={60} className="text-muted mb-3" />
                <h5 className="text-muted">No items found</h5>
              </Card.Body>
            </Card>
          ) : (
            <Row className="g-4">
              {filteredItems.map((item) => (
                <Col key={item.id} md={6} lg={4} xl={3}>
                  <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px', overflow: 'hidden', transition: 'all 0.3s' }}>
                    {/* Image Section with Favorite Button */}
                    <div style={{ position: 'relative' }}>
                      <div 
                        style={{ height: '220px', overflow: 'hidden', cursor: 'pointer' }}
                        onClick={() => handleViewDetails(item)}
                      >
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
                        {item.sizes && item.sizes.length > 0 && (
                          <Badge 
                            className="position-absolute top-0 end-0 m-2"
                            style={{ background: 'linear-gradient(135deg, #ff6b35, #ff8555)' }}
                          >
                            {item.sizes.length} Sizes
                          </Badge>
                        )}
                      </div>
                      
                      {/* Favorite Button - Only show for logged-in users */}
                      {user && !isGuest && (
                        <Button
                          variant="link"
                          onClick={() => toggleFavorite(item.id!)}
                          disabled={favoritesLoading}
                          className="position-absolute"
                          style={{
                            bottom: '10px',
                            right: '10px',
                            background: 'rgba(255,255,255,0.9)',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}
                        >
                          {favorites.has(item.id!) ? (
                            <FaHeart size={18} style={{ color: '#dc3545' }} />
                          ) : (
                            <FaRegHeart size={18} style={{ color: '#6b0c12' }} />
                          )}
                        </Button>
                      )}
                    </div>
                    
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 
                          className="fw-bold mb-0" 
                          style={{ color: '#6b0c12', cursor: 'pointer' }}
                          onClick={() => handleViewDetails(item)}
                        >
                          {item.name}
                        </h5>
                        <Badge bg="dark" className="px-3 py-2">${item.price}</Badge>
                      </div>
                      
                      <Badge bg="secondary" className="mb-2 px-3 py-2">
                        {getCategoryName(item.categoryId)}
                      </Badge>
                      
                      <p className="text-muted small mb-3">
                        {item.description.substring(0, 80)}...
                      </p>
                      
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex gap-2">
                          <Badge bg="light" text="dark" className="px-2 py-1">
                            <FaClock className="me-1" size={10} />
                            {item.preparationTime || '15-20 min'}
                          </Badge>
                          <Badge bg="light" text="dark" className="px-2 py-1">
                            Stock: {item.stock}
                          </Badge>
                        </div>
                      </div>
                    </Card.Body>
                    
                    <Card.Footer className="bg-white border-0 pb-4 px-4">
                      <Button 
                        onClick={() => handleAddToBucket(item)}
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

      {/* Product Detail Modal */}
      <Modal show={showProductDetail} onHide={() => setShowProductDetail(false)} size="lg" centered>
        {detailItem && (
          <>
            <Modal.Header closeButton className="border-0 pt-4 px-4">
              <div className="d-flex justify-content-between align-items-center w-100">
                <Modal.Title className="fw-bold" style={{ color: '#6b0c12' }}>
                  {detailItem.name}
                </Modal.Title>
                {user && !isGuest && (
                  <Button
                    variant="link"
                    onClick={() => {
                      toggleFavorite(detailItem.id!);
                    }}
                    className="p-0 text-decoration-none"
                  >
                    {favorites.has(detailItem.id!) ? (
                      <FaHeart size={24} style={{ color: '#dc3545' }} />
                    ) : (
                      <FaRegHeart size={24} style={{ color: '#6b0c12' }} />
                    )}
                  </Button>
                )}
              </div>
            </Modal.Header>
            <Modal.Body className="px-4 pb-4">
              <Row>
                <Col md={6}>
                  <img
                    src={detailItem.images?.[0] || '/placeholder.jpg'}
                    alt={detailItem.name}
                    style={{ width: '100%', borderRadius: '12px', objectFit: 'cover' }}
                  />
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold text-muted">Description</h6>
                  <p>{detailItem.description}</p>
                  
                  <h6 className="fw-bold text-muted mt-3">Ingredients</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {detailItem.ingredients?.map((ing, idx) => (
                      <Badge key={idx} bg="light" text="dark" className="px-2 py-1">
                        {ing}
                      </Badge>
                    ))}
                  </div>
                  
                  <h6 className="fw-bold text-muted mt-3">Preparation Time</h6>
                  <p><FaClock className="me-2" />{detailItem.preparationTime || '15-20 min'}</p>
                  
                  <h6 className="fw-bold text-muted">Available Sizes</h6>
                  {detailItem.sizes?.map((size, idx) => (
                    <Badge key={idx} bg="dark" className="me-2 mb-2 px-3 py-2">
                      {size.name}: ${size.price}
                    </Badge>
                  ))}
                  
                  <div className="mt-4">
                    <Button 
                      onClick={() => {
                        setShowProductDetail(false);
                        handleAddToBucket(detailItem);
                      }}
                      className="w-100 d-flex align-items-center justify-content-center gap-2"
                      style={{ 
                        background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                        border: 'none',
                        borderRadius: '12px'
                      }}
                    >
                      <FaShoppingCart size={16} /> Add to Bucket
                    </Button>
                  </div>
                </Col>
              </Row>
            </Modal.Body>
          </>
        )}
      </Modal>

      {/* Size Selection Modal */}
      <Modal show={showSizeModal} onHide={() => setShowSizeModal(false)} centered>
        <Modal.Header closeButton className="border-0 pt-4 px-4">
          <Modal.Title className="fw-bold" style={{ color: '#6b0c12' }}>
            Select Size for {selectedItem?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          <div className="mb-4">
            <label className="fw-semibold mb-2">Choose Size:</label>
            <Row className="g-2">
              {selectedItem?.sizes?.map((size) => (
                <Col key={size.name} xs={6}>
                  <Card
                    className="cursor-pointer"
                    style={{ 
                      cursor: 'pointer',
                      border: selectedSize?.name === size.name ? '2px solid #6b0c12' : '1px solid #e0e0e0',
                      borderRadius: '12px'
                    }}
                    onClick={() => setSelectedSize(size)}
                  >
                    <Card.Body className="p-3 text-center">
                      <h6 className="fw-bold mb-1">{size.name}</h6>
                      <Badge bg="dark">${size.price}</Badge>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          <div className="mb-4">
            <label className="fw-semibold mb-2">Quantity:</label>
            <div className="d-flex align-items-center gap-3">
              <Button
                variant="outline-dark"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ borderRadius: '10px' }}
              >
                <FaMinus size={12} />
              </Button>
              <span className="fw-bold fs-5">{quantity}</span>
              <Button
                variant="outline-dark"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
                style={{ borderRadius: '10px' }}
              >
                <FaPlus size={12} />
              </Button>
            </div>
          </div>

          {selectedSize && (
            <div className="p-3 rounded-3" style={{ background: '#f8f9fa' }}>
              <div className="d-flex justify-content-between">
                <span>Total:</span>
                <strong className="text-primary">${(selectedSize.price * quantity).toFixed(2)}</strong>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pb-4 px-4">
          <Button variant="light" onClick={() => setShowSizeModal(false)} style={{ borderRadius: '10px' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAddToBucket}
            disabled={!selectedSize}
            style={{ 
              background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
              border: 'none',
              borderRadius: '10px'
            }}
          >
            Add to Bucket
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}