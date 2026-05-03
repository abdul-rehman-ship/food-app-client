'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Button, Modal } from 'react-bootstrap';
import { FaTruck, FaPhone, FaMapMarkerAlt, FaUser, FaStar, FaClock, FaEnvelope, FaIdCard } from 'react-icons/fa';
import { db } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import Navbar from '../components/Navbar';
import type { Trailor } from '../types';

export default function TrailorsPage() {
  const [trailors, setTrailors] = useState<Trailor[]>([]);
  const [filteredTrailors, setFilteredTrailors] = useState<Trailor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrailor, setSelectedTrailor] = useState<Trailor | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTrailors();
  }, []);

  useEffect(() => {
    filterTrailors();
  }, [searchTerm, statusFilter, trailors]);

  const fetchTrailors = async () => {
    try {
      const snapshot = await get(ref(db, 'trailors'));
      const data: Trailor[] = [];
      snapshot.forEach((child) => {
        data.push({ id: child.key, ...child.val() });
      });
      setTrailors(data);
      setFilteredTrailors(data);
    } catch (error) {
      console.error('Error fetching trailors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTrailors = () => {
    let filtered = [...trailors];
    
    if (searchTerm) {
      filtered = filtered.filter(trailor => 
        trailor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trailor.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trailor.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trailor => trailor.status === statusFilter);
    }
    
    setFilteredTrailors(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'available':
        return <Badge bg="success" className="px-3 py-2">Available</Badge>;
      case 'busy':
        return <Badge bg="warning" className="px-3 py-2">Busy</Badge>;
      case 'offline':
        return <Badge bg="secondary" className="px-3 py-2">Offline</Badge>;
      default:
        return <Badge bg="light" text="dark" className="px-3 py-2">{status}</Badge>;
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
          padding: '60px 0',
          marginBottom: '40px'
        }}>
          <Container>
            <Row className="align-items-center">
              <Col lg={8}>
                <h1 className="display-4 fw-bold mb-3">Our Delivery Fleet</h1>
                <p className="lead mb-0">
                  Meet our professional delivery team committed to bringing your food fresh and fast
                </p>
              </Col>
              <Col lg={4} className="d-none d-lg-block text-center">
                <FaTruck size={100} color="rgba(255,255,255,0.2)" />
              </Col>
            </Row>
          </Container>
        </div>

        <Container className="py-4">
          {/* Search and Filter Section */}
          <Row className="mb-4 g-3">
            <Col md={8}>
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control py-3"
                  placeholder="Search by name, ID, or phone number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    borderRadius: '12px', 
                    border: '2px solid #e0e0e0',
                    paddingLeft: '45px'
                  }}
                />
                <FaUser 
                  size={18} 
                  className="position-absolute text-muted" 
                  style={{ top: '16px', left: '16px' }} 
                />
              </div>
            </Col>
            <Col md={4}>
              <select
                className="form-select py-3"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ borderRadius: '12px', border: '2px solid #e0e0e0' }}
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
            </Col>
          </Row>

          {/* Stats Summary */}
          <Row className="mb-4">
            <Col xs={6} md={4} className="mb-3">
              <Card className="border-0 shadow-sm text-center" style={{ borderRadius: '15px' }}>
                <Card.Body className="py-3">
                  <h4 className="fw-bold mb-0" style={{ color: '#6b0c12' }}>{trailors.length}</h4>
                  <small className="text-muted">Total Fleet</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={4} className="mb-3">
              <Card className="border-0 shadow-sm text-center" style={{ borderRadius: '15px' }}>
                <Card.Body className="py-3">
                  <h4 className="fw-bold mb-0" style={{ color: '#28a745' }}>
                    {trailors.filter(t => t.status === 'available').length}
                  </h4>
                  <small className="text-muted">Available</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={4} className="mb-3">
              <Card className="border-0 shadow-sm text-center" style={{ borderRadius: '15px' }}>
                <Card.Body className="py-3">
                  <h4 className="fw-bold mb-0" style={{ color: '#ffc107' }}>
                    {trailors.filter(t => t.status === 'busy').length}
                  </h4>
                  <small className="text-muted">On Delivery</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Trailors Grid */}
          {filteredTrailors.length === 0 ? (
            <Card className="text-center py-5 border-0 shadow-sm" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-5">
                <FaTruck size={60} className="text-muted mb-3" />
                <h5 className="text-muted mb-2">No delivery partners found</h5>
                <p className="text-muted">Try adjusting your search or filter criteria</p>
              </Card.Body>
            </Card>
          ) : (
            <Row className="g-4">
              {filteredTrailors.map((trailor) => (
                <Col key={trailor.id} md={6} lg={4} xl={3}>
                  <Card className="border-0 shadow-sm h-100" style={{ 
                    borderRadius: '20px', 
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}>
                    {/* Header with gradient */}
                    <div style={{ 
                      background: 'linear-gradient(135deg, #6b0c12, #8f1018)',
                      padding: '20px',
                      textAlign: 'center'
                    }}>
                      <div className="mx-auto mb-2 d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '60px', 
                          height: '60px', 
                          background: 'rgba(255,255,255,0.2)',
                          borderRadius: '50%'
                        }}>
                        <FaTruck size={28} color="#fff" />
                      </div>
                      <h5 className="text-white fw-bold mb-1">{trailor.name}</h5>
                      <small className="text-white-50">
                        <FaIdCard size={12} className="me-1" />
                        {trailor.number || 'ID not set'}
                      </small>
                    </div>
                    
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <FaPhone size={14} style={{ color: '#6b0c12' }} />
                          <span className="small">{trailor.phone || 'No phone'}</span>
                        </div>
                        {getStatusBadge(trailor.status)}
                      </div>
                      
                      <div className="mb-3">
                        <div className="d-flex align-items-start gap-2">
                          <FaMapMarkerAlt size={14} style={{ color: '#6b0c12', marginTop: '3px' }} />
                          <span className="small">
                            {trailor.address || 'Address not specified'}
                          </span>
                        </div>
                      </div>
                      
                      {trailor.latitude && trailor.longitude && (
                        <Button
                          variant="outline-dark"
                          size="sm"
                          onClick={() => {
                            setSelectedTrailor(trailor);
                            setShowMapModal(true);
                          }}
                          className="w-100 mt-2 d-flex align-items-center justify-content-center gap-2"
                          style={{ borderRadius: '10px' }}
                        >
                          <FaMapMarkerAlt size={14} /> View on Map
                        </Button>
                      )}
                    </Card.Body>
                    
                    <Card.Footer className="bg-white border-0 pb-4 px-4">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <FaClock size={12} className="text-muted" />
                        <small className="text-muted">
                          {trailor.createdAt ? `Since ${new Date(trailor.createdAt).toLocaleDateString()}` : 'New'}
                        </small>
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </div>

      {/* Map Modal */}
      <Modal show={showMapModal} onHide={() => setShowMapModal(false)} size="lg" centered>
        {selectedTrailor && (
          <>
            <Modal.Header closeButton className="border-0 pt-4 px-4">
              <Modal.Title className="fw-bold" style={{ color: '#6b0c12' }}>
                <FaMapMarkerAlt className="me-2" />
                {selectedTrailor.name} - Location
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 pb-4">
              {selectedTrailor.latitude && selectedTrailor.longitude && (
                <>
                  <div className="mb-3 p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FaUser size={14} style={{ color: '#6b0c12' }} />
                      <strong>{selectedTrailor.name}</strong>
                    </div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FaPhone size={14} style={{ color: '#6b0c12' }} />
                      <span>{selectedTrailor.phone || 'No phone'}</span>
                    </div>
                    <div className="d-flex align-items-start gap-2">
                      <FaMapMarkerAlt size={14} style={{ color: '#6b0c12', marginTop: '3px' }} />
                      <span>{selectedTrailor.address || 'Address not specified'}</span>
                    </div>
                    <hr />
                    <div className="text-center">
                      <small className="text-muted">
                        Coordinates: {selectedTrailor.latitude.toFixed(4)}, {selectedTrailor.longitude.toFixed(4)}
                      </small>
                    </div>
                  </div>
                  
                  <div className="rounded-3 overflow-hidden shadow-sm" style={{ height: '400px' }}>
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${selectedTrailor.latitude},${selectedTrailor.longitude}&zoom=15`}
                      title="Trailor Location"
                    />
                  </div>
                </>
              )}
            </Modal.Body>
            <Modal.Footer className="border-0 pb-4 px-4">
              <Button 
                variant="light" 
                onClick={() => setShowMapModal(false)}
                style={{ borderRadius: '10px' }}
              >
                Close
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </>
  );
}