'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Image, Badge, Spinner, Form, Modal, Alert } from 'react-bootstrap';
import { FaTrash, FaPlus, FaMinus, FaShoppingCart, FaArrowLeft, FaTruck, FaStore, FaMapMarkerAlt, FaCity, FaComment, FaCheck } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '../lib/firebase';
import { ref, get, push, set } from 'firebase/database';
import { sendOrderNotificationEmail } from '../lib/email';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function BucketPage() {
  const { cart, loading: cartLoading, removeFromCart, updateQuantity, totalItems, totalPrice, fetchCart } = useCart();
  const { user, userData, isGuest } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery');
  const [cities, setCities] = useState<any[]>([]);
  const [trailors, setTrailors] = useState<any[]>([]);
  const [selectedTrailor, setSelectedTrailor] = useState<any>(null);
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    cityId: '',
    cityName: '',
    cityState: '',
    comment: ''
  });

  useEffect(() => {
    fetchCart();
    fetchCities();
    fetchTrailors();
  }, []);

  const fetchCities = async () => {
    try {
      const citiesSnapshot = await get(ref(db, 'cities'));
      const citiesData: any[] = [];
      citiesSnapshot.forEach((child) => {
        const city = { id: child.key, ...child.val() };
        if (city.isActive) {
          citiesData.push(city);
        }
      });
      setCities(citiesData);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchTrailors = async () => {
    try {
      const trailorsSnapshot = await get(ref(db, 'trailors'));
      const trailorsData: any[] = [];
      trailorsSnapshot.forEach((child) => {
        const trailor = { id: child.key, ...child.val() };
        if (trailor.status === 'available') {
          trailorsData.push(trailor);
        }
      });
      setTrailors(trailorsData);
    } catch (error) {
      console.error('Error fetching trailors:', error);
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCityId = e.target.value;
    const selectedCity = cities.find(city => city.id === selectedCityId);
    if (selectedCity) {
      setFormData(prev => ({
        ...prev,
        cityId: selectedCity.id,
        cityName: selectedCity.name,
        cityState: selectedCity.state
      }));
    }
  };

  const getDeliveryFee = () => {
    if (deliveryOption === 'pickup') return 0;
    const selectedCity = cities.find(city => city.id === formData.cityId);
    return selectedCity?.deliveryFee || 3.99;
  };

  const getFinalTotal = () => {
    return totalPrice + getDeliveryFee();
  };

  const handleOrderNow = () => {
    if (isGuest) {
      toast.error('Please login to place order');
      router.push('/auth');
      return;
    }
    setShowCheckoutModal(true);
  };

  const handlePlaceOrder = async () => {
    if (deliveryOption === 'delivery') {
      if (!formData.deliveryAddress) {
        toast.error('Please enter delivery address');
        return;
      }
      if (!formData.cityId) {
        toast.error('Please select a city');
        return;
      }
    }

    if (deliveryOption === 'pickup' && !selectedTrailor) {
      toast.error('Please select a pickup location');
      return;
    }

    setLoading(true);
    
    try {
      const orderId = `-O${Date.now()}`;
      const orderData: any = {
        orderId: orderId,
        userId: user?.uid,
        items: cart.map(item => ({
          foodId: item.foodId,
          foodName: item.foodName,
          foodImage: item.foodImage,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          sizePrice: item.sizePrice,
          totalPrice: item.totalPrice
        })),
        subtotal: totalPrice,
        deliveryFee: getDeliveryFee(),
        total: getFinalTotal(),
        orderType: deliveryOption,
        status: 'pending',
        createdAt: Date.now(),
        comment: formData.comment
      };

      // Add delivery-specific fields
      if (deliveryOption === 'delivery') {
        orderData.deliveryAddress = formData.deliveryAddress;
        orderData.cityId = formData.cityId;
        orderData.cityName = formData.cityName;
        orderData.cityState = formData.cityState;
      } else {
        // Add pickup-specific fields
        orderData.trailerId = selectedTrailor.id;
        orderData.trailerName = selectedTrailor.name;
        orderData.trailerPhone = selectedTrailor.phone;
        orderData.trailerAddress = selectedTrailor.address;
      }

      // Save order to Firebase
      const orderRef = push(ref(db, 'orders'));
      await set(orderRef, orderData);

      // Prepare email data
      const emailOrderData = {
        orderId: orderId,
        items: orderData.items,
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee,
        total: orderData.total,
        orderType: orderData.orderType,
        deliveryAddress: orderData.deliveryAddress,
        cityName: orderData.cityName,
        cityState: orderData.cityState,
        trailerName: orderData.trailerName,
        trailerAddress: orderData.trailerAddress,
        comment: orderData.comment,
        createdAt: orderData.createdAt
      };

      const emailUserData = {
        fullName: userData?.fullName || 'Customer',
        email: userData?.email || user?.email || 'No email',
        mobileNumber: userData?.mobileNumber || 'No phone'
      };

      // Send email notification (don't await to avoid delaying order placement)
      sendOrderNotificationEmail(emailOrderData, emailUserData).catch(err => {
        console.error('Email sending failed:', err);
      });

      // Clear cart
      await Promise.all(cart.map(item => removeFromCart(item.cartItemId!)));

      toast.success('Order placed successfully!');
      setShowCheckoutModal(false);
      router.push('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading) {
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
                  
                  <Button 
                    onClick={handleOrderNow}
                    className="w-100 py-3 fw-bold mt-3"
                    style={{ 
                      background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px'
                    }}
                  >
                    Order Now
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

      {/* Checkout Modal */}
      <Modal show={showCheckoutModal} onHide={() => setShowCheckoutModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pt-4 px-4">
          <Modal.Title className="fw-bold" style={{ color: '#6b0c12' }}>
            Complete Your Order
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Delivery/Pickup Option */}
          <div className="mb-4">
            <label className="fw-semibold mb-3">Select Order Type</label>
            <div className="d-flex gap-3">
              <Button
                type="button"
                variant={deliveryOption === 'delivery' ? 'dark' : 'outline-dark'}
                onClick={() => setDeliveryOption('delivery')}
                className="flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-3"
                style={{ borderRadius: '12px' }}
              >
                <FaTruck size={18} />
                Delivery
              </Button>
              <Button
                type="button"
                variant={deliveryOption === 'pickup' ? 'dark' : 'outline-dark'}
                onClick={() => setDeliveryOption('pickup')}
                className="flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-3"
                style={{ borderRadius: '12px' }}
              >
                <FaStore size={18} />
                Pickup
              </Button>
            </div>
          </div>

          {deliveryOption === 'delivery' ? (
            <>
              {/* Delivery Address */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">
                  <FaMapMarkerAlt className="me-2" /> Delivery Address *
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Enter your complete delivery address"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  style={{ borderRadius: '10px', border: '2px solid #e0e0e0' }}
                  required
                />
              </Form.Group>

              {/* City Selection */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">
                  <FaCity className="me-2" /> Select City *
                </Form.Label>
                <Form.Select
                  value={formData.cityId}
                  onChange={handleCityChange}
                  style={{ borderRadius: '10px', border: '2px solid #e0e0e0' }}
                  required
                >
                  <option value="">Choose a city</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>
                      {city.name}, {city.state} - Delivery Fee: ${city.deliveryFee}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          ) : (
            <>
              {/* Pickup Location - Trailors */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">
                  <FaStore className="me-2" /> Select Pickup Location *
                </Form.Label>
                <div className="d-flex flex-column gap-2">
                  {trailors.length === 0 ? (
                    <Alert variant="info">No pickup locations available at the moment</Alert>
                  ) : (
                    trailors.map((trailor) => (
                      <div
                        key={trailor.id}
                        className={`p-3 rounded-3 border-2 cursor-pointer ${selectedTrailor?.id === trailor.id ? 'border-primary' : ''}`}
                        style={{ 
                          cursor: 'pointer',
                          border: selectedTrailor?.id === trailor.id ? '2px solid #6b0c12' : '1px solid #e0e0e0',
                          borderRadius: '12px',
                          background: selectedTrailor?.id === trailor.id ? '#fef8f9' : 'white'
                        }}
                        onClick={() => setSelectedTrailor(trailor)}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="fw-bold mb-1">{trailor.name}</h6>
                            <div className="small text-muted mb-1">
                              <FaMapMarkerAlt size={12} className="me-1" />
                              {trailor.address || 'Address not specified'}
                            </div>
                            <div className="small text-muted">
                              Phone: {trailor.phone}
                            </div>
                          </div>
                          {selectedTrailor?.id === trailor.id && (
                            <FaCheck size={20} style={{ color: '#6b0c12' }} />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Form.Group>
            </>
          )}

          {/* Comment */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              <FaComment className="me-2" /> Order Comment (Optional)
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Any special instructions or comments..."
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              style={{ borderRadius: '10px', border: '2px solid #e0e0e0' }}
            />
          </Form.Group>

          {/* Order Summary in Modal */}
          <div className="mt-4 pt-3 border-top">
            <h6 className="fw-bold mb-3">Order Summary</h6>
            <div className="d-flex justify-content-between mb-2">
              <span>Subtotal ({totalItems} items)</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Delivery Fee</span>
              <span>${getDeliveryFee().toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between fw-bold mt-2 pt-2 border-top">
              <span>Total</span>
              <span style={{ color: '#6b0c12', fontSize: '20px' }}>${getFinalTotal().toFixed(2)}</span>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pb-4 px-4">
          <Button variant="light" onClick={() => setShowCheckoutModal(false)} style={{ borderRadius: '10px' }}>
            Cancel
          </Button>
          <Button 
            onClick={handlePlaceOrder}
            disabled={loading}
            className="px-4 d-flex align-items-center gap-2"
            style={{ 
              background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
              border: 'none',
              borderRadius: '10px'
            }}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Confirm Order'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}