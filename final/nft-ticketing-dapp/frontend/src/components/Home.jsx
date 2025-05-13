import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ isConnected, connectWallet }) => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to NFT Ticketing DApp</h1>
        <h2>The Future of Event Ticketing with Blockchain Technology</h2>
        
        <div className="hero-cta">
          {isConnected ? (
            <Link to="/events" className="cta-button">
              Browse Events
            </Link>
          ) : (
            <button onClick={connectWallet} className="cta-button">
              Connect Wallet to Get Started
            </button>
          )}
        </div>
      </div>
      
      <div className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>NFT Tickets</h3>
            <p>Each ticket is a unique NFT on the blockchain, providing authenticity and ownership verification.</p>
          </div>
          
          <div className="feature-card">
            <h3>AI-Generated Artwork</h3>
            <p>Every ticket features unique AI-generated artwork based on the event theme.</p>
          </div>
          
          <div className="feature-card">
            <h3>QR Code Verification</h3>
            <p>Secure entry with QR code verification at the venue.</p>
          </div>
          
          <div className="feature-card">
            <h3>Transfer Control</h3>
            <p>Lock your tickets to prevent unauthorized transfers or enable secondary market sales.</p>
          </div>
        </div>
      </div>
      
      <div className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Connect Your Wallet</h3>
            <p>Connect your Ethereum wallet to access the platform.</p>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <h3>Browse Events</h3>
            <p>Explore upcoming events and select the ones you're interested in.</p>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <h3>Purchase Tickets</h3>
            <p>Buy tickets as NFTs with your connected wallet.</p>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <h3>Attend Events</h3>
            <p>Show your QR code at the venue for verification and entry.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
