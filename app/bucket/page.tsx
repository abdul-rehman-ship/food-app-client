'use client';

import { Container, Row, Col, Card, Button, Image, Badge, Spinner } from 'react-bootstrap';
import { FaTrash, FaPlus, FaMinus, FaShoppingCart, FaArrowLeft } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function BucketPage() {
  const { cart, loading, removeFromCart, updateQuantity, totalItems, totalPrice, fetchCart } = useCart();
  const { isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchCart();
  }, []);

  const handleCheckout = () => {
    if (isGuest) {
      toast.error('Please login or signup to proceed with checkout');
      router.push('/auth');
      return;
    }
    router.push('/checkout');
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

  if (cart.length === 0) {
    return (
      <>
        <Navbar />
        <div style={{ paddingTop: '80px' }}>
          <Container className="py-5 text-center">
            <Card className="border-0 shadow-sm mx-auto" style={{ maxWidth: '500px', borderRadius: '20px' }}>
              <Card.Body className="p-5">
                <FaShoppingCart size={80} className="text-muted mb-3" />
                <h3 className="fw-bold mb-2">Your Bucket is Empty</h3>
                <p className="text-muted mb-4">Looks like you haven't added any items yet</p>
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
          </Container>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingTop: '80px' }}>
        <Container className="py-5">
          <Row>
            <Col lg={8}>
              <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '20px' }}>
                <Card.Header className="bg-white border-0 pt-4 px-4">
                  <h3 className="fw-bold mb-0" style={{ color: '#6b0c12' }}>
                    <FaShoppingCart className="me-2" /> My Bucket ({totalItems} items)
                  </h3>
                </Card.Header>
                <Card.Body className="px-4 pb-4">
                  {cart.map((item) => (
                    <div key={item.cartItemId} className="d-flex gap-3 mb-4 pb-3 border-bottom">
                      <img 
                        src={item.foodImage || '/placeholder-food.jpg'} 
                        alt={item.foodName}
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-food.jpg';
                        }}
                      />
                      <div className="flex-grow-1">
                        <h5 className="fw-bold mb-1">{item.foodName}</h5>
                        <Badge bg="secondary" className="mb-2">Size: {item.selectedSize}</Badge>
                        <div className="d-flex align-items-center gap-3 mt-2">
                          <div className="d-flex align-items-center gap-2">
                            <Button
                              variant="outline-dark"
                              size="sm"
                              onClick={() => updateQuantity(item.cartItemId!, item.quantity - 1)}
                              style={{ borderRadius: '8px' }}
                            >
                              <FaMinus size={10} />
                            </Button>
                            <span className="fw-semibold">{item.quantity}</span>
                            <Button
                              variant="outline-dark"
                              size="sm"
                              onClick={() => updateQuantity(item.cartItemId!, item.quantity + 1)}
                              style={{ borderRadius: '8px' }}
                            >
                              <FaPlus size={10} />
                            </Button>
                          </div>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeFromCart(item.cartItemId!)}
                            className="d-flex align-items-center gap-1"
                            style={{ borderRadius: '8px' }}
                          >
                            <FaTrash size={12} /> Remove
                          </Button>
                        </div>
                      </div>
                      <div className="text-end">
                        <h5 className="fw-bold" style={{ color: '#6b0c12' }}>
                          ${item.totalPrice.toFixed(2)}
                        </h5>
                        <small className="text-muted">${item.sizePrice} each</small>
                      </div>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="border-0 shadow-sm mb-4 sticky-top" style={{ top: '100px', borderRadius: '20px' }}>
                <Card.Header className="bg-white border-0 pt-4 px-4">
                  <h4 className="fw-bold mb-0">Order Summary</h4>
                </Card.Header>
                <Card.Body className="px-4 pb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span>Delivery Fee</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between fw-bold mb-4">
                    <span>Total</span>
                    <span style={{ color: '#6b0c12', fontSize: '20px' }}>${totalPrice.toFixed(2)}</span>
                  </div>
                  <Button 
                    onClick={handleCheckout}
                    className="w-100 py-2 fw-bold"
                    style={{ 
                      background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                      border: 'none',
                      borderRadius: '12px'
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                  <Button 
                    onClick={() => router.push('/')}
                    variant="outline-dark"
                    className="w-100 mt-2 d-flex align-items-center justify-content-center gap-2"
                    style={{ borderRadius: '12px' }}
                  >
                    <FaArrowLeft size={14} /> Continue Shopping
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
}