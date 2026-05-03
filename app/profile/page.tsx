'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaPhone, FaSave, FaEdit, FaShoppingBag, FaBell } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { db, auth } from '../lib/firebase';
import { ref, get, update } from 'firebase/database';
import { updateProfile } from 'firebase/auth';
import { requestNotificationPermission } from '../lib/fcm';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Link from 'next/link';

interface UserProfile {
  fullName: string;
  email: string;
  mobileNumber: string;
  registeredAt: number;
  status: string;
}

export default function ProfilePage() {
  const { user, userData, isGuest, loading: authLoading, refreshUserData, hasFCMToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [enablingNotifications, setEnablingNotifications] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({
    fullName: '',
    email: '',
    mobileNumber: '',
    registeredAt: 0,
    status: ''
  });
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user && !isGuest) {
      router.push('/auth');
    }
  }, [user, isGuest, authLoading, router]);

  useEffect(() => {
    if (user || userData) {
      loadUserData();
      fetchOrderCount();
    }
  }, [user, userData]);

  const loadUserData = () => {
    if (userData) {
      setFormData({
        fullName: userData.fullName || '',
        email: userData.email || '',
        mobileNumber: userData.mobileNumber || '',
        registeredAt: userData.registeredAt || Date.now(),
        status: userData.status || 'active'
      });
    } else if (user) {
      setFormData({
        fullName: user.displayName || '',
        email: user.email || '',
        mobileNumber: '',
        registeredAt: Date.now(),
        status: 'active'
      });
    }
    setLoading(false);
  };

  const fetchOrderCount = async () => {
    if (!user) return;
    
    try {
      const ordersSnapshot = await get(ref(db, 'orders'));
      let count = 0;
      ordersSnapshot.forEach((child) => {
        const order = child.val();
        if (order.userId === user.uid) {
          count++;
        }
      });
      setOrderCount(count);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update in Firebase Database
      const userRef = ref(db, `users/${user?.uid}`);
      await update(userRef, {
        fullName: formData.fullName,
        mobileNumber: formData.mobileNumber
      });

      // Update display name in Firebase Auth
      if (user) {
        await updateProfile(user, {
          displayName: formData.fullName
        });
      }

      toast.success('Profile updated successfully!');
      setEditing(false);
      
      // Refresh user data
      const updatedSnapshot = await get(userRef);
      if (updatedSnapshot.exists()) {
        const updatedData = updatedSnapshot.val();
        setFormData({
          fullName: updatedData.fullName || '',
          email: updatedData.email || '',
          mobileNumber: updatedData.mobileNumber || '',
          registeredAt: updatedData.registeredAt || Date.now(),
          status: updatedData.status || 'active'
        });
      }
      
      // Refresh auth context
      if (refreshUserData) {
        await refreshUserData();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (!user) return;
    
    setEnablingNotifications(true);
    try {
      const token = await requestNotificationPermission(user.uid);
      if (token) {
        toast.success('Notifications enabled! You will receive order updates.');
        if (refreshUserData) {
          await refreshUserData();
        }
      } else {
        toast.error('Could not enable notifications. Please allow notification permission in your browser settings.');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setEnablingNotifications(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: '#f8f9fa', paddingTop: '80px' }}>
          <Spinner animation="border" variant="dark" />
        </div>
      </>
    );
  }

  if (isGuest) {
    return (
      <>
        <Navbar />
        <div style={{ paddingTop: '80px' }}>
          <Container className="py-5 text-center">
            <Card className="border-0 shadow-sm mx-auto" style={{ maxWidth: '500px', borderRadius: '20px' }}>
              <Card.Body className="p-5">
                <FaUser size={80} className="text-muted mb-3" />
                <h3 className="fw-bold mb-2">Guest Mode</h3>
                <p className="text-muted mb-4">Please login or signup to view your profile</p>
                <Button 
                  onClick={() => router.push('/auth')}
                  style={{ 
                    background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                    border: 'none',
                    borderRadius: '12px'
                  }}
                >
                  Login / Signup
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
            <Col lg={8} className="mx-auto">
              <Card className="border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ 
                  background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                  padding: '30px',
                  textAlign: 'center'
                }}>
                  <div className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '50%'
                    }}>
                    <FaUser size={40} color="#fff" />
                  </div>
                  <h3 className="text-white fw-bold mb-1">{formData.fullName || 'User'}</h3>
                  <p className="text-white-50 mb-0">Member since {formatDate(formData.registeredAt)}</p>
                </div>

                <Card.Body className="p-4">
                  {!editing ? (
                    // View Mode
                    <>
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="fw-bold mb-0" style={{ color: '#6b0c12' }}>Personal Information</h5>
                        <Button 
                          variant="outline-dark" 
                          size="sm"
                          onClick={() => setEditing(true)}
                          className="d-flex align-items-center gap-2"
                          style={{ borderRadius: '10px' }}
                        >
                          <FaEdit size={14} /> Edit Profile
                        </Button>
                      </div>

                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <label className="text-muted small mb-1">Full Name</label>
                            <p className="fw-semibold mb-0">{formData.fullName || 'Not set'}</p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <label className="text-muted small mb-1">Email Address</label>
                            <p className="fw-semibold mb-0">{formData.email || 'Not set'}</p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <label className="text-muted small mb-1">Mobile Number</label>
                            <p className="fw-semibold mb-0">{formData.mobileNumber || 'Not set'}</p>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <label className="text-muted small mb-1">Total Orders</label>
                            <p className="fw-semibold mb-0">{orderCount} orders</p>
                          </div>
                        </Col>
                      </Row>

                      {/* Notifications Section */}
                      <div className="mt-3 pt-2 border-top">
                        {!hasFCMToken ? (
                          <>
                            <Button 
                              variant="outline-primary"
                              onClick={handleEnableNotifications}
                              disabled={enablingNotifications}
                              className="w-100 d-flex align-items-center justify-content-center gap-2"
                              style={{ borderRadius: '12px' }}
                            >
                              {enablingNotifications ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <FaBell size={16} />
                              )}
                              {enablingNotifications ? 'Enabling...' : 'Enable Notifications'}
                            </Button>
                            <small className="text-muted d-block text-center mt-2">
                              Get real-time updates about your order status
                            </small>
                          </>
                        ) : (
                          <div className="d-flex align-items-center justify-content-center gap-2 text-success">
                            <FaBell size={16} />
                            <small>Notifications are enabled</small>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-top">
                        <Link href="/orders" className="text-decoration-none">
                          <Button 
                            variant="outline-dark"
                            className="w-100 d-flex align-items-center justify-content-center gap-2"
                            style={{ borderRadius: '12px' }}
                          >
                            <FaShoppingBag size={16} /> View My Orders
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : (
                    // Edit Mode
                    <>
                      <h5 className="fw-bold mb-4" style={{ color: '#6b0c12' }}>Edit Profile</h5>
                      
                      <Form>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">
                            <FaUser className="me-2" /> Full Name
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            style={{ borderRadius: '10px', border: '2px solid #e0e0e0' }}
                            placeholder="Enter your full name"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">
                            <FaPhone className="me-2" /> Mobile Number
                          </Form.Label>
                          <Form.Control
                            type="tel"
                            value={formData.mobileNumber}
                            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                            style={{ borderRadius: '10px', border: '2px solid #e0e0e0' }}
                            placeholder="Enter your mobile number"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">
                            <FaEnvelope className="me-2" /> Email
                          </Form.Label>
                          <Form.Control
                            type="email"
                            value={formData.email}
                            disabled
                            style={{ borderRadius: '10px', border: '2px solid #e0e0e0', background: '#f8f9fa' }}
                          />
                          <Form.Text className="text-muted">Email cannot be changed</Form.Text>
                        </Form.Group>

                        <div className="d-flex gap-2 mt-4">
                          <Button 
                            variant="outline-dark"
                            onClick={() => setEditing(false)}
                            className="flex-grow-1"
                            style={{ borderRadius: '10px' }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                            style={{ 
                              background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                              border: 'none',
                              borderRadius: '10px'
                            }}
                          >
                            {saving ? <Spinner animation="border" size="sm" /> : <FaSave size={16} />}
                            Save Changes
                          </Button>
                        </div>
                      </Form>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
}