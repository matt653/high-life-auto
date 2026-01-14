import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SEOProvider from './components/SEOProvider';
import StickyLeadBar from './components/StickyLeadBar';
import SmartChatbot from './components/SmartChatbot';

import { GarageProvider } from './context/GarageContext';

// Code Splitting for Performance
const Homepage = lazy(() => import('./pages/Homepage'));
const InventoryLive = lazy(() => import('./pages/InventoryLive'));
const Showroom = lazy(() => import('./pages/Showroom'));
const VehicleDetailLive = lazy(() => import('./pages/VehicleDetailLive'));
const About = lazy(() => import('./pages/About'));
const Financing = lazy(() => import('./pages/Financing'));
const Contact = lazy(() => import('./pages/Contact'));
const AIToolsDashboard = lazy(() => import('./pages/AIToolsDashboard'));
const ChatBotApp = lazy(() => import('./pages/ChatBotApp'));
const EdmundsApp = lazy(() => import('./pages/EdmundsApp'));
const BluetoothApp = lazy(() => import('./pages/BluetoothApp'));
const MarketplaceApp = lazy(() => import('./pages/MarketplaceApp'));

const StaffPortal = lazy(() => import('./pages/StaffPortal'));

// Loading Fallback
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#1e3a5f' }}>
    <p>Loading...</p>
  </div>
);

function App() {
  return (
    <SEOProvider>
      <GarageProvider>
        <Router>
          <div className="app">
            <Navbar />
            <StickyLeadBar />
            {/* <SmartChatbot /> - Temporarily disabled */}
            <main>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Homepage />} />
                  <Route path="/inventory" element={<InventoryLive />} />
                  <Route path="/showroom" element={<Showroom />} />
                  <Route path="/vehicle/:id" element={<VehicleDetailLive />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/lab" element={<AIToolsDashboard />} />
                  <Route path="/apps/chatbot" element={<ChatBotApp />} />
                  <Route path="/apps/edmunds" element={<EdmundsApp />} />
                  <Route path="/apps/bluetooth" element={<BluetoothApp />} />
                  <Route path="/apps/marketplace" element={<MarketplaceApp />} />
                  <Route path="/secure-login-8191" element={<StaffPortal />} />
                </Routes>
              </Suspense>
            </main>

            <footer style={{
              backgroundColor: '#1a1a1a',
              color: 'white',
              padding: '5rem 0 5rem', // Added bottom padding for sticky bar
              marginTop: '0'
            }}>
              <div className="container">
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '4rem',
                  marginBottom: '4rem'
                }}>
                  <div>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>HIGH LIFE AUTO</h3>
                    <p style={{ opacity: 0.7, fontSize: '0.875rem' }}>
                      "Cool to be Uncool." We sell reliable, budget-friendly cars so your money stays yours.
                    </p>
                  </div>
                  <div>
                    <h4 style={{ marginBottom: '1.5rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Quick Links</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                      <a href="/inventory" style={{ opacity: 0.7 }}>Inventory</a>
                      <a href="/about" style={{ opacity: 0.7 }}>Our Why</a>
                      <a href="/contact" style={{ opacity: 0.7 }}>Visit Us</a>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ marginBottom: '1.5rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Location</h4>
                    <p style={{ opacity: 0.7, fontSize: '0.875rem', marginBottom: '1rem' }}>
                      519 2nd Street<br />Fort Madison, IA 52627<br />
                      <strong>Office:</strong> 319-372-8191<br />
                      <strong>Miriam:</strong> 309-267-7200<br />
                      <strong>Matt (Text Only):</strong> 309-337-1049
                    </p>
                    <a
                      href="https://maps.google.com/?q=519+2nd+Street+Fort+Madison+IA+52627"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{
                        backgroundColor: 'var(--color-gold)',
                        color: 'var(--color-primary)',
                        fontWeight: 700,
                        border: 'none',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        marginBottom: '1rem',
                        display: 'inline-block'
                      }}
                    >
                      Get Directions
                    </a>
                  </div>
                  <div>
                    <h4 style={{ marginBottom: '1.5rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Follow Us</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                      <a href="https://www.facebook.com/highlifeauto" target="_blank" rel="noopener noreferrer" style={{ opacity: 0.7 }}>Facebook</a>
                      <a href="https://www.instagram.com/highlifeauto/" target="_blank" rel="noopener noreferrer" style={{ opacity: 0.7 }}>Instagram</a>
                      <a href="https://youtube.com/playlist?list=PLl7IO3qjXvk6YT6yYeClM1Pn24H0uWGj4&si=jiXuAusTJCEtdxtu" target="_blank" rel="noopener noreferrer" style={{ opacity: 0.7 }}>YouTube</a>
                    </div>
                  </div>
                </div>
                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  paddingTop: '2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  fontSize: '0.75rem',
                  opacity: 0.5
                }}>
                  <div>
                    &copy; {new Date().getFullYear()} High Life Auto. All rights reserved.
                  </div>
                  <div>
                    <a href="#" style={{ marginRight: '1rem' }}>Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                    <a href="/lab" style={{ marginLeft: '1rem', opacity: 0.5 }}>Staff Login</a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Router>
      </GarageProvider>
    </SEOProvider>
  );
}

export default App;
