import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyTicket, getEvent } from '../utils/contractUtils';
import { parseTicketQR } from '../utils/qrUtils';
import QRScanner from './QRScanner';

const VerifyTicket = ({ isConnected, isOrganizer }) => {
  const navigate = useNavigate();

  const [scanning, setScanning] = useState(false);
  const [manualTokenId, setManualTokenId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [error, setError] = useState(null);
  const [scannerError, setScannerError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Redirect if not connected or not an organizer
  useEffect(() => {
    if (!isConnected) {
      navigate('/');
      return;
    }

    // For demo purposes, we're allowing all connected users to verify tickets
    // In a production app, you would uncomment this to restrict to organizers only
    /*
    if (!isOrganizer) {
      navigate('/');
      return;
    }
    */
  }, [isConnected, isOrganizer, navigate]);

  // Start QR scanner
  const startScanner = () => {
    setScannerError(null);
    setScanning(true);
  };

  // Stop QR scanner
  const stopScanner = () => {
    setScanning(false);
  };

  // Handle scan result
  const handleScanResult = async (qrData) => {
    try {
      stopScanner();

      // Parse QR code data
      const ticketData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;

      // Verify ticket on-chain
      await verifyTicketOnChain(ticketData.tokenId);
    } catch (err) {
      console.error('Error processing QR code:', err);
      setError('Invalid QR code. Please try again.');
    }
  };

  // Handle manual verification
  const handleManualVerify = async (e) => {
    e.preventDefault();

    if (!manualTokenId || isNaN(manualTokenId)) {
      setError('Please enter a valid ticket ID.');
      return;
    }

    try {
      setIsVerifying(true);
      await verifyTicketOnChain(manualTokenId);
      setIsVerifying(false);
    } catch (err) {
      console.error('Error verifying ticket:', err);
      setError('Failed to verify ticket. Please try again.');
      setIsVerifying(false);
    }
  };

  // Verify ticket on-chain
  const verifyTicketOnChain = async (tokenId) => {
    try {
      setError(null);

      // Call contract to verify ticket
      const result = await verifyTicket(tokenId);

      // Get event details
      const event = await getEvent(result.eventId.toNumber());

      setVerificationResult({
        tokenId: tokenId,
        owner: result.owner,
        eventId: result.eventId.toNumber(),
        used: result.used,
        locked: result.locked
      });

      setEventDetails(event);
    } catch (err) {
      console.error('Error verifying ticket on-chain:', err);
      setError('Failed to verify ticket. The ticket may not exist or you may not have permission to verify it.');
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format address
  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Reset verification
  const resetVerification = () => {
    setVerificationResult(null);
    setEventDetails(null);
    setError(null);
    setManualTokenId('');
  };

  if (!isConnected) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="verify-ticket-container">
      <h2>
        <i className="fas fa-ticket-alt"></i> Verify Ticket
      </h2>

      {verificationResult ? (
        <div className="verification-result">
          <div className={`result-status ${verificationResult.used ? 'invalid' : 'valid'}`}>
            <div className="result-status-icon">
              <i className={verificationResult.used ? "fas fa-times" : "fas fa-check"}></i>
            </div>
            <h3>{verificationResult.used ? 'TICKET ALREADY USED' : 'VALID TICKET'}</h3>
          </div>

          <div className="ticket-details">
            <div className="ticket-detail-grid">
              <div className="ticket-detail-item">
                <span className="ticket-detail-label">Ticket ID</span>
                <div className="ticket-detail-value">#{verificationResult.tokenId}</div>
              </div>

              <div className="ticket-detail-item">
                <span className="ticket-detail-label">Owner</span>
                <div className="ticket-detail-value">{formatAddress(verificationResult.owner)}</div>
              </div>

              <div className="ticket-detail-item">
                <span className="ticket-detail-label">Event ID</span>
                <div className="ticket-detail-value">#{verificationResult.eventId}</div>
              </div>

              {eventDetails && (
                <>
                  <div className="ticket-detail-item">
                    <span className="ticket-detail-label">Event Name</span>
                    <div className="ticket-detail-value">{eventDetails.name}</div>
                  </div>

                  <div className="ticket-detail-item">
                    <span className="ticket-detail-label">Event Date</span>
                    <div className="ticket-detail-value">{formatDate(eventDetails.date)}</div>
                  </div>
                </>
              )}

              <div className="ticket-detail-item">
                <span className="ticket-detail-label">Usage Status</span>
                <div className="ticket-detail-value">
                  <div className={`ticket-status ${verificationResult.used ? 'used' : 'unused'}`}>
                    <i className={verificationResult.used ? "fas fa-ban" : "fas fa-check-circle"}></i>
                    {verificationResult.used ? 'Used' : 'Unused'}
                  </div>
                </div>
              </div>

              <div className="ticket-detail-item">
                <span className="ticket-detail-label">Transfer Status</span>
                <div className="ticket-detail-value">
                  <div className={`ticket-status ${verificationResult.locked ? 'locked' : 'unlocked'}`}>
                    <i className={verificationResult.locked ? "fas fa-lock" : "fas fa-lock-open"}></i>
                    {verificationResult.locked ? 'Locked' : 'Unlocked'}
                  </div>
                </div>
              </div>
            </div>

            <button onClick={resetVerification} className="reset-button">
              <i className="fas fa-redo"></i>
              Verify Another Ticket
            </button>
          </div>
        </div>
      ) : (
        <div className="verification-methods">
          <div className="scanner-section">
            <h3>
              <i className="fas fa-qrcode"></i> Scan QR Code
            </h3>

            {scanning ? (
              <div className="scanner">
                <QRScanner
                  onScan={handleScanResult}
                  onError={setScannerError}
                  active={scanning}
                />

                <button onClick={stopScanner} className="stop-scanner-button">
                  <i className="fas fa-stop-circle"></i>
                  Stop Scanner
                </button>
              </div>
            ) : (
              <button onClick={startScanner} className="start-scanner-button">
                <i className="fas fa-camera"></i>
                Start QR Scanner
              </button>
            )}

            {scannerError && (
              <div className="scanner-error">
                <i className="fas fa-exclamation-triangle"></i> {scannerError}
              </div>
            )}
          </div>

          <div className="manual-section">
            <h3>
              <i className="fas fa-keyboard"></i> Manual Verification
            </h3>

            <form onSubmit={handleManualVerify} className="manual-form">
              <div className="form-group">
                <label htmlFor="tokenId">Ticket ID Number</label>
                <input
                  type="number"
                  id="tokenId"
                  value={manualTokenId}
                  onChange={(e) => setManualTokenId(e.target.value)}
                  placeholder="Enter the ticket ID number"
                  min="0"
                  required
                />
              </div>

              <button
                type="submit"
                className="verify-button"
                disabled={isVerifying}
              >
                <i className="fas fa-search"></i>
                {isVerifying ? 'Verifying...' : 'Verify Ticket'}
              </button>
            </form>
          </div>

          {error && (
            <div className="error">
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerifyTicket;
