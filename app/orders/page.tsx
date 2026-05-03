'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Modal, Tab, Tabs, Alert } from 'react-bootstrap';
import { FaBox, FaClock, FaMapMarkerAlt, FaTruck, FaStore, FaEye, FaReceipt, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';
import { db } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Image from 'next/image';

interface OrderItem {
  foodId: string;
  foodName: string;
  foodImage: string;
  quantity: number;
  selectedSize: string;
  sizePrice: number;
  totalPrice: number;
}

interface Order {
  id?: string;
  orderId: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderType: 'delivery' | 'pickup';
  status: string;
  createdAt: number;
  deliveryAddress?: string;
  cityName?: string;
  cityState?: string;
  trailerName?: string;
  trailerPhone?: string;
  trailerAddress?: string;
  comment?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { user, isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isGuest) {
      router.push('/auth');
      return;
    }
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchOrders();
  }, [user, isGuest]);

  useEffect(() => {
    filterOrders();
  }, [statusFilter, orders]);

  const fetchOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const ordersSnapshot = await get(ref(db, 'orders'));
      const ordersData: Order[] = [];
      ordersSnapshot.forEach((child) => {
        const order = { id: child.key, ...child.val() };
        if (order.userId === user.uid) {
          ordersData.push(order);
        }
      });
      // Sort by date (newest first)
      ordersData.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === statusFilter));
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge bg="warning" className="px-3 py-2 d-flex align-items-center gap-2">
          <FaHourglassHalf size={12} /> Pending
        </Badge>;
      case 'accepted':
        return <Badge bg="info" className="px-3 py-2 d-flex align-items-center gap-2">
          <FaCheckCircle size={12} /> Accepted
        </Badge>;
      case 'preparing':
        return <Badge bg="primary" className="px-3 py-2 d-flex align-items-center gap-2">
          Preparing
        </Badge>;
      case 'on_the_way':
        return <Badge bg="info" className="px-3 py-2 d-flex align-items-center gap-2">
          <FaTruck size={12} /> On The Way
        </Badge>;
      case 'ready_for_pickup':
        return <Badge bg="success" className="px-3 py-2 d-flex align-items-center gap-2">
          Ready for Pickup
        </Badge>;
      case 'delivered':
        return <Badge bg="success" className="px-3 py-2 d-flex align-items-center gap-2">
          <FaCheckCircle size={12} /> Delivered
        </Badge>;
      case 'rejected':
        return <Badge bg="danger" className="px-3 py-2 d-flex align-items-center gap-2">
          <FaTimesCircle size={12} /> Rejected
        </Badge>;
      default:
        return <Badge bg="secondary" className="px-3 py-2">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': return '#28a745';
      case 'pending': return '#ffc107';
      case 'accepted': return '#17a2b8';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
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
        {/* Hero Section */}
        <div className="position-relative text-white" style={{ 
          background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
          padding: '50px 0',
          marginBottom: '40px'
        }}>
          <Container>
            <Row className="align-items-center">
              <Col>
                <h1 className="display-5 fw-bold mb-2">My Orders</h1>
                <p className="lead mb-0">Track and manage all your orders in one place</p>
              </Col>
              <Col xs="auto" className="d-none d-md-block">
                <FaReceipt size={60} color="rgba(255,255,255,0.2)" />
              </Col>
            </Row>
          </Container>
        </div>

        <Container>
          {/* Status Filter Tabs */}
          <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '20px' }}>
            <Card.Body className="p-3">
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                <Button
                  variant={statusFilter === 'all' ? 'dark' : 'outline-dark'}
                  onClick={() => setStatusFilter('all')}
                  className="px-4 py-2"
                  style={{ borderRadius: '30px' }}
                >
                  All Orders
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'warning' : 'outline-warning'}
                  onClick={() => setStatusFilter('pending')}
                  className="px-4 py-2"
                  style={{ borderRadius: '30px' }}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'accepted' ? 'info' : 'outline-info'}
                  onClick={() => setStatusFilter('accepted')}
                  className="px-4 py-2"
                  style={{ borderRadius: '30px' }}
                >
                  Accepted
                </Button>
                <Button
                  variant={statusFilter === 'on_the_way' ? 'info' : 'outline-info'}
                  onClick={() => setStatusFilter('on_the_way')}
                  className="px-4 py-2"
                  style={{ borderRadius: '30px' }}
                >
                  On The Way
                </Button>
                <Button
                  variant={statusFilter === 'delivered' ? 'success' : 'outline-success'}
                  onClick={() => setStatusFilter('delivered')}
                  className="px-4 py-2"
                  style={{ borderRadius: '30px' }}
                >
                  Delivered
                </Button>
                <Button
                  variant={statusFilter === 'rejected' ? 'danger' : 'outline-danger'}
                  onClick={() => setStatusFilter('rejected')}
                  className="px-4 py-2"
                  style={{ borderRadius: '30px' }}
                >
                  Rejected
                </Button>
              </div>
            </Card.Body>
          </Card>

          {filteredOrders.length === 0 ? (
            <Card className="text-center py-5 border-0 shadow-sm" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-5">
                <FaBox size={80} className="text-muted mb-3" />
                <h3 className="fw-bold mb-2">No Orders Found</h3>
                <p className="text-muted mb-4">
                  {orders.length === 0 ? "You haven't placed any orders yet" : `No ${statusFilter} orders found`}
                </p>
                <Button 
                  onClick={() => router.push('/')}
                  style={{ 
                    background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                    border: 'none',
                    borderRadius: '12px'
                  }}
                >
                  Start Shopping
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <Row className="g-4">
              {filteredOrders.map((order) => (
                <Col key={order.id} lg={6} xl={4}>
                  <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px', overflow: 'hidden', transition: 'transform 0.3s' }}>
                    {/* Order Header */}
                    <div style={{ 
                      background: `linear-gradient(135deg, ${getStatusColor(order.status)}20, ${getStatusColor(order.status)}10)`,
                      padding: '16px 20px',
                      borderBottom: `3px solid ${getStatusColor(order.status)}`
                    }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-muted">Order #{order.orderId?.slice(-8)}</small>
                          <h6 className="fw-bold mb-0 mt-1">{formatDate(order.createdAt)}</h6>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>

                    <Card.Body className="p-4">
                      {/* Order Type Icon */}
                      <div className="d-flex align-items-center gap-2 mb-3">
                        {order.orderType === 'delivery' ? (
                          <FaTruck style={{ color: '#6b0c12' }} />
                        ) : (
                          <FaStore style={{ color: '#6b0c12' }} />
                        )}
                        <span className="fw-semibold">
                          {order.orderType === 'delivery' ? 'Delivery' : 'Pickup'}
                        </span>
                        <div className="ms-auto">
                          <small className="text-muted">{order.items.length} item(s)</small>
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className="mb-3">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="d-flex gap-2 mb-2">
                            {item.foodImage && (
                              <img 
                                src={item.foodImage} 
                                alt={item.foodName}
                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }}
                              />
                            )}
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between">
                                <span className="small fw-semibold">{item.foodName}</span>
                                <span className="small">${item.totalPrice.toFixed(2)}</span>
                              </div>
                              <small className="text-muted">{item.quantity} x {item.selectedSize}</small>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <small className="text-muted">+{order.items.length - 2} more items</small>
                        )}
                      </div>

                      {/* Delivery/Pickup Info */}
                      {order.orderType === 'delivery' && order.deliveryAddress && (
                        <div className="mb-3 p-2 rounded-3" style={{ background: '#f8f9fa' }}>
                          <FaMapMarkerAlt size={12} className="me-1" style={{ color: '#6b0c12' }} />
                          <small className="text-muted">{order.deliveryAddress}</small>
                          <br />
                          <small className="text-muted">{order.cityName}, {order.cityState}</small>
                        </div>
                      )}

                      {order.orderType === 'pickup' && order.trailerName && (
                        <div className="mb-3 p-2 rounded-3" style={{ background: '#f8f9fa' }}>
                          <FaStore size={12} className="me-1" style={{ color: '#6b0c12' }} />
                          <small className="text-muted">Pickup: {order.trailerName}</small>
                        </div>
                      )}

                      {/* Order Total */}
                      <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                        <span className="fw-bold">Total</span>
                        <span className="fw-bold fs-5" style={{ color: '#6b0c12' }}>
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </Card.Body>

                    <Card.Footer className="bg-white border-0 pb-4 px-4">
                      <Button 
                        variant="outline-dark"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailModal(true);
                        }}
                        className="w-100 d-flex align-items-center justify-content-center gap-2"
                        style={{ borderRadius: '12px' }}
                      >
                        <FaEye size={14} /> View Details
                      </Button>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </div>

      {/* Order Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
        {selectedOrder && (
          <>
            <Modal.Header closeButton className="border-0 pt-4 px-4">
              <Modal.Title className="fw-bold" style={{ color: '#6b0c12' }}>
                Order #{selectedOrder.orderId?.slice(-8)}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 pb-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Order Status Timeline */}
              <div className="mb-4 p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="text-muted">Order Status</small>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">Order Date</small>
                  <small>{formatDate(selectedOrder.createdAt)}</small>
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <small className="text-muted">Order Type</small>
                  <small>{selectedOrder.orderType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}</small>
                </div>
              </div>

              {/* Order Items */}
              <h6 className="fw-bold mb-3">Order Items</h6>
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="d-flex gap-3 mb-3 p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                  <img 
                    src={item.foodImage || '/placeholder-food.jpg'} 
                    alt={item.foodName}
                    style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '12px' }}
                  />
                  <div className="flex-grow-1">
                    <h6 className="fw-bold mb-1">{item.foodName}</h6>
                    <Badge bg="secondary" className="mb-2">{item.selectedSize}</Badge>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <span className="text-muted">Qty: {item.quantity}</span>
                      <span className="fw-bold" style={{ color: '#6b0c12' }}>${item.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Delivery/Pickup Details */}
              {selectedOrder.orderType === 'delivery' ? (
                <>
                  <h6 className="fw-bold mt-3 mb-2">Delivery Details</h6>
                  <div className="p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                    <p className="mb-1"><strong>Address:</strong> {selectedOrder.deliveryAddress}</p>
                    <p className="mb-0"><strong>City:</strong> {selectedOrder.cityName}, {selectedOrder.cityState}</p>
                  </div>
                </>
              ) : (
                selectedOrder.trailerName && (
                  <>
                    <h6 className="fw-bold mt-3 mb-2">Pickup Location</h6>
                    <div className="p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                      <p className="mb-1"><strong>Location:</strong> {selectedOrder.trailerName}</p>
                      <p className="mb-1"><strong>Address:</strong> {selectedOrder.trailerAddress}</p>
                      <p className="mb-0"><strong>Phone:</strong> {selectedOrder.trailerPhone}</p>
                    </div>
                  </>
                )
              )}

              {/* Order Summary */}
              <h6 className="fw-bold mt-3 mb-2">Order Summary</h6>
              <div className="p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <span>${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Delivery Fee</span>
                  <span>${selectedOrder.deliveryFee.toFixed(2)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bold">
                  <span>Total</span>
                  <span style={{ color: '#6b0c12', fontSize: '18px' }}>${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.comment && (
                <>
                  <h6 className="fw-bold mt-3 mb-2">Order Comment</h6>
                  <div className="p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                    <p className="mb-0">{selectedOrder.comment}</p>
                  </div>
                </>
              )}
            </Modal.Body>
            <Modal.Footer className="border-0 pb-4 px-4">
              <Button 
                variant="light" 
                onClick={() => setShowDetailModal(false)}
                style={{ borderRadius: '10px' }}
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setShowDetailModal(false);
                  router.push('/');
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                  border: 'none',
                  borderRadius: '10px'
                }}
              >
                Order Again
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </>
  );
}