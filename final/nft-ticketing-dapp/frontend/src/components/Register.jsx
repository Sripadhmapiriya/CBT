import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentAccount } from '../utils/contractUtils';

const Register = ({ isConnected }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    walletAddress: '',
    reason: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [animateForm, setAnimateForm] = useState(false);
  
  // Add animation class after component mounts
  useEffect(() => {
    setAnimateForm(true);
  }, []);
  
  // Get current wallet address when connected
  useEffect(() => {
    const getWalletAddress = async () => {
      if (isConnected) {
        try {
          const address = await getCurrentAccount();
          setFormData(prev => ({
            ...prev,
            walletAddress: address
          }));
        } catch (err) {
          console.error('Error getting wallet address:', err);
        }
      }
    };
    
    getWalletAddress();
  }, [isConnected]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.walletAddress || !formData.reason) {
      setError('Please fill in all fields.');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    // Validate wallet address format
    if (!formData.walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Please enter a valid Ethereum wallet address.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Get existing registration requests from local storage
      const existingRequests = JSON.parse(localStorage.getItem('registrationRequests') || '[]');
      
      // Check if wallet address already exists in requests
      const existingRequest = existingRequests.find(req => req.walletAddress.toLowerCase() === formData.walletAddress.toLowerCase());
      if (existingRequest) {
        setError('A registration request for this wallet address already exists.');
        setSubmitting(false);
        return;
      }
      
      // Add new request
      const newRequest = {
        ...formData,
        status: 'pending',
        requestDate: new Date().toISOString()
      };
      
      // Save to local storage
      localStorage.setItem('registrationRequests', JSON.stringify([...existingRequests, newRequest]));
      
      // Show success message
      setSuccess('Registration request submitted successfully! An admin will review your request.');
      
      // Clear form after successful submission
      setFormData({
        name: '',
        email: '',
        walletAddress: formData.walletAddress, // Keep the wallet address
        reason: ''
      });
      
      setSubmitting(false);
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (err) {
      console.error('Error submitting registration:', err);
      setError('Failed to submit registration. Please try again later.');
      setSubmitting(false);
    }
  };
  
  return (
    <div className="register-container">
      <h2>Register as Event Organizer</h2>
      
      <div className="register-info">
        <p>To create events on our platform, you need to register as an event organizer. Please fill out the form below to submit your request.</p>
        <p>An admin will review your request and approve or reject it. Once approved, you'll be able to create events.</p>
      </div>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group" style={{animation: animateForm ? 'fadeIn 0.5s ease-in-out 0.1s forwards' : 'none', opacity: 0}}>
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />
        </div>
        
        <div className="form-group" style={{animation: animateForm ? 'fadeIn 0.5s ease-in-out 0.2s forwards' : 'none', opacity: 0}}>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email address"
            required
          />
        </div>
        
        <div className="form-group" style={{animation: animateForm ? 'fadeIn 0.5s ease-in-out 0.3s forwards' : 'none', opacity: 0}}>
          <label htmlFor="walletAddress">Wallet Address</label>
          <input
            type="text"
            id="walletAddress"
            name="walletAddress"
            value={formData.walletAddress}
            onChange={handleChange}
            placeholder="0x..."
            required
            disabled={isConnected} // Disable if wallet is connected
          />
          {!isConnected && (
            <p className="form-hint">Please connect your wallet to automatically fill this field.</p>
          )}
        </div>
        
        <div className="form-group" style={{animation: animateForm ? 'fadeIn 0.5s ease-in-out 0.4s forwards' : 'none', opacity: 0}}>
          <label htmlFor="reason">Reason for Registration</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Explain why you want to become an event organizer"
            rows="4"
            required
          ></textarea>
        </div>
        
        <button
          type="submit"
          className="register-button"
          disabled={submitting || !isConnected}
          style={{animation: animateForm ? 'fadeIn 0.5s ease-in-out 0.5s forwards' : 'none', opacity: 0}}
        >
          {submitting ? 'Submitting...' : 'Submit Registration'}
        </button>
        
        {!isConnected && (
          <p className="form-hint" style={{textAlign: 'center', marginTop: '1rem'}}>
            Please connect your wallet to submit the registration.
          </p>
        )}
      </form>
    </div>
  );
};

export default Register;
