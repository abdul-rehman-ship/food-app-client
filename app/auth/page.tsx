'use client';

import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Tab, Tabs, Modal } from 'react-bootstrap';
import { FaEnvelope, FaLock, FaUser, FaPhone, FaGoogle, FaUserFriends } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ 
    fullName: '', 
    email: '', 
    mobileNumber: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  
  const { login, signup, loginWithGoogle, loginAsGuest, forgotPassword } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      router.push('/');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await signup(signupData.email, signupData.password, signupData.fullName, signupData.mobileNumber);
      router.push('/');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push('/');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    router.push('/');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(forgotEmail);
      setShowForgot(false);
      toast.success('Password reset email sent!');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' 
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={5} md={7}>
            <Card className="border-0 shadow-lg" style={{ borderRadius: '24px', overflow: 'hidden' }}>
              <div style={{ height: '6px', background: 'linear-gradient(90deg, #6b0c12, #ff6b35)' }} />
              
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                      borderRadius: '50%',
                      boxShadow: '0 10px 25px rgba(107,12,18,0.2)'
                    }}>
                    <Image src="/logo.png" alt="Logo" width={50} height={50} />
                  </div>
                  <h2 className="fw-bold" style={{ 
                    background: 'linear-gradient(135deg, #6b0c12, #ff6b35)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Bertha's Food
                  </h2>
                  <p className="text-muted">Delicious food delivered to your door</p>
                </div>

                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k!)}
                  className="mb-4 border-0"
                  fill
                >
                  <Tab eventKey="login" title="Login" tabClassName="border-0 fw-semibold py-2" />
                  <Tab eventKey="signup" title="Sign Up" tabClassName="border-0 fw-semibold py-2" />
                </Tabs>

                {activeTab === 'login' ? (
                  <Form onSubmit={handleLogin}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        <FaEnvelope className="me-2" /> Email Address
                      </Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter your email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="py-2"
                        style={{ borderRadius: '12px', border: '2px solid #e0e0e0' }}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        <FaLock className="me-2" /> Password
                      </Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="py-2"
                        style={{ borderRadius: '12px', border: '2px solid #e0e0e0' }}
                        required
                      />
                    </Form.Group>

                    <div className="text-end mb-3">
                      <Button 
                        variant="link" 
                        className="p-0 text-decoration-none"
                        onClick={() => setShowForgot(true)}
                        style={{ fontSize: '14px', color: '#6b0c12' }}
                      >
                        Forgot Password?
                      </Button>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-100 py-2 fw-bold"
                      style={{ 
                        background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                        border: 'none',
                        borderRadius: '12px'
                      }}
                    >
                      {loading ? <Spinner animation="border" size="sm" /> : 'Login'}
                    </Button>
                  </Form>
                ) : (
                  <Form onSubmit={handleSignup}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        <FaUser className="me-2" /> Full Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter your full name"
                        value={signupData.fullName}
                        onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                        className="py-2"
                        style={{ borderRadius: '12px', border: '2px solid #e0e0e0' }}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        <FaEnvelope className="me-2" /> Email Address
                      </Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter your email"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className="py-2"
                        style={{ borderRadius: '12px', border: '2px solid #e0e0e0' }}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        <FaPhone className="me-2" /> Mobile Number
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        placeholder="Enter your mobile number"
                        value={signupData.mobileNumber}
                        onChange={(e) => setSignupData({ ...signupData, mobileNumber: e.target.value })}
                        className="py-2"
                        style={{ borderRadius: '12px', border: '2px solid #e0e0e0' }}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        <FaLock className="me-2" /> Password
                      </Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Create a password"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        className="py-2"
                        style={{ borderRadius: '12px', border: '2px solid #e0e0e0' }}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        <FaLock className="me-2" /> Confirm Password
                      </Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Confirm your password"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        className="py-2"
                        style={{ borderRadius: '12px', border: '2px solid #e0e0e0' }}
                        required
                      />
                    </Form.Group>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-100 py-2 fw-bold"
                      style={{ 
                        background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                        border: 'none',
                        borderRadius: '12px'
                      }}
                    >
                      {loading ? <Spinner animation="border" size="sm" /> : 'Sign Up'}
                    </Button>
                  </Form>
                )}

                <div className="position-relative my-4">
                  <hr />
                  <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted">
                    OR
                  </span>
                </div>

                <Button
                  variant="outline-dark"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-100 mb-2 d-flex align-items-center justify-content-center gap-2"
                  style={{ borderRadius: '12px', borderWidth: '2px' }}
                >
                  <FaGoogle /> Continue with Google
                </Button>

                <Button
                  variant="secondary"
                  onClick={handleGuestLogin}
                  className="w-100 d-flex align-items-center justify-content-center gap-2"
                  style={{ 
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ff6b35, #ff8555)',
                    border: 'none'
                  }}
                >
                  <FaUserFriends /> Continue as Guest
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Forgot Password Modal */}
      <Modal show={showForgot} onHide={() => setShowForgot(false)} centered>
        <Modal.Header closeButton className="border-0 pt-4 px-4">
          <Modal.Title className="fw-bold" style={{ color: '#6b0c12' }}>Reset Password</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleForgotPassword}>
          <Modal.Body className="px-4 pb-4">
            <Form.Group>
              <Form.Label className="fw-semibold">Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                style={{ borderRadius: '10px', border: '2px solid #e0e0e0' }}
                required
              />
              <Form.Text className="text-muted">
                We'll send you a link to reset your password
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pb-4 px-4">
            <Button variant="light" onClick={() => setShowForgot(false)} style={{ borderRadius: '10px' }}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              style={{ 
                background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                border: 'none',
                borderRadius: '10px'
              }}
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Send Reset Link'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}