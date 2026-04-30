'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap';
import { FaClock, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaInstagram, FaTwitter, FaWhatsapp, FaUtensils, FaTruck, FaHeart, FaStar, FaAward, FaRegClock } from 'react-icons/fa';
import { db } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import Navbar from '../components/Navbar';
import Image from 'next/image';
import Link from 'next/link';

interface BusinessHours {
  id?: string;
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface ContactInfo {
  id?: string;
  phone: string;
  email: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
}

interface RestaurantLocation {
  id?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

export default function AboutPage() {
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [location, setLocation] = useState<RestaurantLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch business hours
      const hoursSnapshot = await get(ref(db, 'business_hours'));
      const hoursData: BusinessHours[] = [];
      hoursSnapshot.forEach((child) => {
        hoursData.push({ id: child.key, ...child.val() });
      });
      // Sort by day order
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      hoursData.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
      setBusinessHours(hoursData);

      // Fetch contact info
      const contactSnapshot = await get(ref(db, 'contact_info'));
      if (contactSnapshot.exists()) {
        const contactData = contactSnapshot.val();
        const contactKey = Object.keys(contactData)[0];
        const contactValue = contactData[contactKey];
        setContactInfo({ id: contactKey, ...contactValue });
      }

      // Fetch location
      const locationSnapshot = await get(ref(db, 'restaurant_location'));
      if (locationSnapshot.exists()) {
        const locationData = locationSnapshot.val();
        const locationKey = Object.keys(locationData)[0];
        const locationValue = locationData[locationKey];
        setLocation({ id: locationKey, ...locationValue });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
          padding: '80px 0',
          marginBottom: '60px'
        }}>
          <Container>
            <Row className="align-items-center justify-content-center text-center">
              <Col lg={8}>
                <h1 className="display-3 fw-bold mb-3 animate__animated animate__fadeInUp">
                  About Us
                </h1>
                <p className="lead mb-0 fs-4">
                  Discover the heart and soul behind Bertha's Food
                </p>
                <div className="mt-4">
                  <Image 
                    src="/headliner.png" 
                    alt="Bertha's Food" 
                    width={220} 
                    height={170}
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </Col>
            </Row>
          </Container>
        </div>

        <Container className="py-4">
          {/* Stats Section */}
          <Row className="g-4 mb-5">
            <Col md={3}>
              <Card className="border-0 shadow-sm text-center h-100" style={{ borderRadius: '20px' }}>
                <Card.Body className="p-4">
                  <div className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '70px', 
                      height: '70px', 
                      background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                      borderRadius: '50%'
                    }}>
                    <FaUtensils size={30} color="#fff" />
                  </div>
                  <h2 className="fw-bold mb-0" style={{ color: '#6b0c12' }}>50+</h2>
                  <p className="text-muted mb-0">Menu Items</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm text-center h-100" style={{ borderRadius: '20px' }}>
                <Card.Body className="p-4">
                  <div className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '70px', 
                      height: '70px', 
                      background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                      borderRadius: '50%'
                    }}>
                    <FaTruck size={30} color="#fff" />
                  </div>
                  <h2 className="fw-bold mb-0" style={{ color: '#6b0c12' }}>30min</h2>
                  <p className="text-muted mb-0">Avg Delivery Time</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm text-center h-100" style={{ borderRadius: '20px' }}>
                <Card.Body className="p-4">
                  <div className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '70px', 
                      height: '70px', 
                      background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                      borderRadius: '50%'
                    }}>
                    <FaStar size={30} color="#fff" />
                  </div>
                  <h2 className="fw-bold mb-0" style={{ color: '#6b0c12' }}>4.8</h2>
                  <p className="text-muted mb-0">Customer Rating</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm text-center h-100" style={{ borderRadius: '20px' }}>
                <Card.Body className="p-4">
                  <div className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '70px', 
                      height: '70px', 
                      background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                      borderRadius: '50%'
                    }}>
                    <FaAward size={30} color="#fff" />
                  </div>
                  <h2 className="fw-bold mb-0" style={{ color: '#6b0c12' }}>10+</h2>
                  <p className="text-muted mb-0">Years of Service</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Business Hours, Contact, Location Row */}
          <Row className="g-4 mb-5">
            {/* Business Hours */}
            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <FaRegClock size={40} color="#fff" />
                  <h4 className="text-white fw-bold mt-2 mb-0">Business Hours</h4>
                </div>
                <Card.Body className="p-4">
                  {businessHours.map((hour) => (
                    <div key={hour.id} className="d-flex justify-content-between py-3 border-bottom">
                      <span className="fw-semibold">{hour.day}</span>
                      {hour.isOpen ? (
                        <span className="text-success fw-semibold">{hour.openTime} - {hour.closeTime}</span>
                      ) : (
                        <span className="text-danger fw-semibold">Closed</span>
                      )}
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>

            {/* Contact Information */}
            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <FaPhone size={40} color="#fff" />
                  <h4 className="text-white fw-bold mt-2 mb-0">Contact Us</h4>
                </div>
                <Card.Body className="p-4">
                  <div className="mb-4">
                    <div className="d-flex align-items-center gap-3 mb-3 p-2 rounded-3" style={{ background: '#f8f9fa' }}>
                      <FaPhone size={20} style={{ color: '#6b0c12' }} />
                      <div>
                        <div className="small text-muted">Phone</div>
                        <a href={`tel:${contactInfo?.phone}`} className="text-decoration-none fw-semibold">
                          {contactInfo?.phone || 'Not set'}
                        </a>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3 mb-3 p-2 rounded-3" style={{ background: '#f8f9fa' }}>
                      <FaEnvelope size={20} style={{ color: '#6b0c12' }} />
                      <div>
                        <div className="small text-muted">Email</div>
                        <a href={`mailto:${contactInfo?.email}`} className="text-decoration-none fw-semibold">
                          {contactInfo?.email || 'Not set'}
                        </a>
                      </div>
                    </div>
                    {contactInfo?.whatsapp && (
                      <div className="d-flex align-items-center gap-3 mb-3 p-2 rounded-3" style={{ background: '#f8f9fa' }}>
                        <FaWhatsapp size={20} style={{ color: '#25D366' }} />
                        <div>
                          <div className="small text-muted">WhatsApp</div>
                          <a href={`https://wa.me/${contactInfo.whatsapp}`} className="text-decoration-none fw-semibold">
                            {contactInfo.whatsapp}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Social Media Links */}
                  <div className="mt-4 pt-3 border-top">
                    <div className="text-center mb-3">
                      <small className="text-muted">Follow Us on Social Media</small>
                    </div>
                    <div className="d-flex justify-content-center gap-4">
                      {contactInfo?.facebook && (
                        <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" 
                          className="text-decoration-none"
                          style={{ transition: 'transform 0.3s' }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                          <FaFacebook size={28} style={{ color: '#1877F2' }} />
                        </a>
                      )}
                      {contactInfo?.instagram && (
                        <a href={contactInfo.instagram} target="_blank" rel="noopener noreferrer"
                          className="text-decoration-none"
                          style={{ transition: 'transform 0.3s' }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                          <FaInstagram size={28} style={{ color: '#E4405F' }} />
                        </a>
                      )}
                      {contactInfo?.twitter && (
                        <a href={contactInfo.twitter} target="_blank" rel="noopener noreferrer"
                          className="text-decoration-none"
                          style={{ transition: 'transform 0.3s' }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                          <FaTwitter size={28} style={{ color: '#1DA1F2' }} />
                        </a>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Location */}
            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <FaMapMarkerAlt size={40} color="#fff" />
                  <h4 className="text-white fw-bold mt-2 mb-0">Our Location</h4>
                </div>
                <Card.Body className="p-4">
                  {location && (
                    <>
                      <div className="mb-4 p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                        <p className="mb-0">
                          <strong>{location.address}</strong><br />
                          {location.city}, {location.state} {location.zipCode}<br />
                          {location.country}
                        </p>
                      </div>
                      {location.latitude && location.longitude && (
                        <div className="rounded-3 overflow-hidden shadow-sm" style={{ height: '250px' }}>
                          <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${location.latitude},${location.longitude}&zoom=15`}
                            title="Restaurant Location"
                          />
                        </div>
                      )}
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Why Choose Us */}
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-2" style={{ 
              background: 'linear-gradient(135deg, #6b0c12, #ff6b35)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Why Choose Us?
            </h2>
            <p className="text-muted">We take pride in delivering the best experience</p>
          </div>
          
          <Row className="g-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm text-center h-100" style={{ borderRadius: '20px', transition: 'all 0.3s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                <Card.Body className="p-4">
                  <div className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                      borderRadius: '50%'
                    }}>
                    <FaUtensils size={35} color="#fff" />
                  </div>
                  <h5 className="fw-bold mb-3">Quality Ingredients</h5>
                  <p className="text-muted mb-0">We use only the freshest and highest quality ingredients in all our dishes.</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm text-center h-100" style={{ borderRadius: '20px', transition: 'all 0.3s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                <Card.Body className="p-4">
                  <div className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                      borderRadius: '50%'
                    }}>
                    <FaTruck size={35} color="#fff" />
                  </div>
                  <h5 className="fw-bold mb-3">Fast Delivery</h5>
                  <p className="text-muted mb-0">Quick and reliable delivery to your doorstep, hot and fresh.</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm text-center h-100" style={{ borderRadius: '20px', transition: 'all 0.3s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                <Card.Body className="p-4">
                  <div className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                      borderRadius: '50%'
                    }}>
                    <FaHeart size={35} color="#fff" />
                  </div>
                  <h5 className="fw-bold mb-3">Made with Love</h5>
                  <p className="text-muted mb-0">Every dish is prepared with passion and care by our expert chefs.</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Call to Action */}
          <div className="text-center mt-5 pt-4">
            <Card className="border-0 shadow-sm" style={{ 
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
              color: 'white'
            }}>
              <Card.Body className="p-5">
                <h3 className="fw-bold mb-3">Ready to Order?</h3>
                <p className="mb-4">Experience the taste of Bertha's Food today!</p>
                <Link href="/">
                  <Button 
                    variant="light" 
                    size="lg"
                    className="px-5 fw-bold"
                    style={{ borderRadius: '30px' }}
                  >
                    Order Now
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </div>
        </Container>
      </div>
    </>
  );
}