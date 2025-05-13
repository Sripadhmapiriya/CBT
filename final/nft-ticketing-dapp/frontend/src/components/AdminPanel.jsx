import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addOrganizer, removeOrganizer, isOrganizer } from '../utils/contractUtils';

const AdminPanel = ({ isAdmin }) => {
  const navigate = useNavigate();

  const [organizerAddress, setOrganizerAddress] = useState('');
  const [action, setAction] = useState('add');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('organizers');
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Redirect if not an admin
  useEffect(() => {
    if (isAdmin === false) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Load registration requests from local storage
  useEffect(() => {
    const loadRequests = () => {
      const requests = JSON.parse(localStorage.getItem('registrationRequests') || '[]');
      setRegistrationRequests(requests);
    };

    loadRequests();

    // Set up interval to check for new requests every 30 seconds
    const interval = setInterval(loadRequests, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle form submission for manual organizer management
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate address
    if (!organizerAddress || !organizerAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Please enter a valid Ethereum address.');
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setResult(null);

      if (action === 'add') {
        // Add organizer
        await addOrganizer(organizerAddress);
        setResult(`Successfully added ${organizerAddress} as an organizer.`);
      } else {
        // Remove organizer
        await removeOrganizer(organizerAddress);
        setResult(`Successfully removed organizer role from ${organizerAddress}.`);
      }

      // Clear form
      setOrganizerAddress('');
      setProcessing(false);
    } catch (err) {
      console.error('Error managing organizer:', err);
      setError('Failed to process request. Please try again later.');
      setProcessing(false);
    }
  };

  // Handle registration request approval
  const handleApproveRequest = async (request) => {
    try {
      setProcessing(true);
      setError(null);
      setResult(null);

      // Check if the user already has the organizer role
      const alreadyOrganizer = await isOrganizer(request.walletAddress);

      if (alreadyOrganizer) {
        // If already an organizer, just update the status in local storage
        console.log(`${request.walletAddress} is already an organizer. Updating status only.`);
      } else {
        // Add organizer role to the wallet address
        await addOrganizer(request.walletAddress);

        // Verify that the role was granted successfully
        const verifyOrganizer = await isOrganizer(request.walletAddress);
        if (!verifyOrganizer) {
          throw new Error('Failed to verify organizer role was granted. Please try again.');
        }
      }

      // Update request status in local storage
      const updatedRequests = registrationRequests.map(req => {
        if (req.walletAddress === request.walletAddress) {
          return { ...req, status: 'approved', approvedDate: new Date().toISOString() };
        }
        return req;
      });

      localStorage.setItem('registrationRequests', JSON.stringify(updatedRequests));
      setRegistrationRequests(updatedRequests);

      setResult(`Successfully approved ${request.name}'s registration request.`);
      setSelectedRequest(null);
      setProcessing(false);
    } catch (err) {
      console.error('Error approving request:', err);

      // Provide more specific error message
      let errorMessage = 'Failed to approve request. Please try again later.';

      if (err.message && err.message.includes('execution reverted')) {
        errorMessage = 'Transaction failed: ' + (err.reason || 'execution reverted');
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setProcessing(false);
    }
  };

  // Handle registration request rejection
  const handleRejectRequest = (request) => {
    try {
      // Update request status in local storage
      const updatedRequests = registrationRequests.map(req => {
        if (req.walletAddress === request.walletAddress) {
          return { ...req, status: 'rejected', rejectedDate: new Date().toISOString() };
        }
        return req;
      });

      localStorage.setItem('registrationRequests', JSON.stringify(updatedRequests));
      setRegistrationRequests(updatedRequests);

      setResult(`Successfully rejected ${request.name}'s registration request.`);
      setSelectedRequest(null);
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError('Failed to reject request. Please try again later.');
    }
  };

  // Filter requests by status
  const pendingRequests = registrationRequests.filter(req => req.status === 'pending');
  const approvedRequests = registrationRequests.filter(req => req.status === 'approved');
  const rejectedRequests = registrationRequests.filter(req => req.status === 'rejected');

  if (isAdmin === false) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="admin-panel-container">
      <div className="admin-panel-header">
        <h2>Admin Panel</h2>
        <p>Manage organizers and registration requests for your NFT Ticketing platform</p>
      </div>

      <div className="admin-dashboard-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="admin-stat-value">{pendingRequests.length}</div>
          <div className="admin-stat-label">Pending Requests</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="admin-stat-value">{approvedRequests.length}</div>
          <div className="admin-stat-label">Approved Organizers</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <i className="fas fa-times-circle"></i>
          </div>
          <div className="admin-stat-value">{rejectedRequests.length}</div>
          <div className="admin-stat-label">Rejected Requests</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs-wrapper">
        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === 'organizers' ? 'active' : ''}`}
            onClick={() => setActiveTab('organizers')}
          >
            <span className="tab-button-icon">
              <i className="fas fa-user-shield"></i>
            </span>
            Manage Organizers
          </button>
          <button
            className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <span className="tab-button-icon">
              <i className="fas fa-clipboard-list"></i>
            </span>
            Registration Requests
            {pendingRequests.length > 0 && (
              <span className="badge pending">{pendingRequests.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Organizers Tab */}
      {activeTab === 'organizers' && (
        <div className="admin-section">
          <h3>Manage Organizers</h3>

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label htmlFor="organizerAddress">Organizer Wallet Address</label>
              <input
                type="text"
                id="organizerAddress"
                value={organizerAddress}
                onChange={(e) => setOrganizerAddress(e.target.value)}
                placeholder="Enter Ethereum address (0x...)"
                required
              />
              <div className="input-icon">
                <i className="fas fa-wallet"></i>
              </div>
              <div className="form-hint">Enter the Ethereum wallet address of the organizer you want to manage</div>
            </div>

            <div className="form-group">
              <label>Select Action</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="action"
                    value="add"
                    checked={action === 'add'}
                    onChange={() => setAction('add')}
                  />
                  <span>Add Organizer</span>
                </label>

                <label>
                  <input
                    type="radio"
                    name="action"
                    value="remove"
                    checked={action === 'remove'}
                    onChange={() => setAction('remove')}
                  />
                  <span>Remove Organizer</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="admin-form-button"
              disabled={processing}
            >
              <i className={action === 'add' ? 'fas fa-user-plus' : 'fas fa-user-minus'}></i>
              {processing ? 'Processing...' : action === 'add' ? 'Add Organizer' : 'Remove Organizer'}
            </button>
          </form>

          {error && <div className="error"><i className="fas fa-exclamation-circle"></i> {error}</div>}
          {result && <div className="success"><i className="fas fa-check-circle"></i> {result}</div>}

          <div className="organizer-list">
            <div className="organizer-list-header">
              <h4>Current Organizers</h4>
              <div className="organizer-count">
                <i className="fas fa-users"></i>
                {approvedRequests.length} Organizers
              </div>
            </div>

            <div className="organizer-grid">
              {approvedRequests.map((request, index) => (
                <div key={index} className="organizer-card">
                  <div className="organizer-address">
                    {request.walletAddress}
                  </div>
                  <p><strong>Name:</strong> {request.name}</p>
                  <p><strong>Email:</strong> {request.email}</p>
                  <p><strong>Approved:</strong> {new Date(request.approvedDate).toLocaleDateString()}</p>

                  <div className="organizer-actions">
                    <button className="copy-address-btn">
                      <i className="fas fa-copy"></i>
                      Copy Address
                    </button>
                    <button
                      className="remove-organizer-btn"
                      onClick={() => handleRejectRequest(request)}
                    >
                      <i className="fas fa-user-minus"></i>
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {approvedRequests.length === 0 && (
                <div className="no-requests">
                  <div className="no-requests-icon">
                    <i className="fas fa-users-slash"></i>
                  </div>
                  <h3>No Organizers Found</h3>
                  <p>You haven't added any organizers yet. Use the form above to add your first organizer.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registration Requests Tab */}
      {activeTab === 'requests' && (
        <div className="admin-section">
          <h3>Registration Requests</h3>

          {/* Request Status Tabs */}
          <div className="request-status-tabs">
            <button
              className={`status-tab ${!selectedRequest ? 'active' : ''}`}
              onClick={() => setSelectedRequest(null)}
            >
              <i className="fas fa-clock"></i>
              Pending
              <span className="status-tab-count">{pendingRequests.length}</span>
            </button>
            <button
              className={`status-tab ${selectedRequest === 'approved' ? 'active' : ''}`}
              onClick={() => setSelectedRequest('approved')}
            >
              <i className="fas fa-check-circle"></i>
              Approved
              <span className="status-tab-count">{approvedRequests.length}</span>
            </button>
            <button
              className={`status-tab ${selectedRequest === 'rejected' ? 'active' : ''}`}
              onClick={() => setSelectedRequest('rejected')}
            >
              <i className="fas fa-times-circle"></i>
              Rejected
              <span className="status-tab-count">{rejectedRequests.length}</span>
            </button>
          </div>

          <div className="admin-tab-content">
            {/* Pending Requests */}
            {!selectedRequest && (
              <div className="requests-list">
                {pendingRequests.length === 0 ? (
                  <div className="no-requests">
                    <div className="no-requests-icon">
                      <i className="fas fa-inbox"></i>
                    </div>
                    <h3>No Pending Requests</h3>
                    <p>There are currently no pending registration requests to review.</p>
                  </div>
                ) : (
                  <>
                    <div className="admin-section-title">Pending Registration Requests</div>
                    {pendingRequests.map((request, index) => (
                      <div key={index} className="request-card pending">
                        <div className="request-status-badge pending">
                          <i className="fas fa-clock"></i>
                          Pending Review
                        </div>
                        <div className="request-header">
                          <div className="request-header-left">
                            <h4>{request.name}</h4>
                            <div className="request-meta">
                              <span className="request-date">
                                <i className="far fa-calendar-alt"></i>
                                {new Date(request.requestDate).toLocaleDateString()}
                              </span>
                              <span className="request-user">
                                <i className="far fa-envelope"></i>
                                {request.email}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="request-content">
                          <div className="request-details">
                            <div className="request-detail-item">
                              <span className="request-detail-label">Email Address</span>
                              <div className="request-detail-value">{request.email}</div>
                            </div>
                            <div className="request-detail-item">
                              <span className="request-detail-label">Wallet Address</span>
                              <div className="request-detail-value">{request.walletAddress}</div>
                            </div>
                          </div>

                          <div className="request-description">
                            <h5>Request Reason</h5>
                            <p>{request.reason}</p>
                          </div>

                          <div className="request-actions">
                            <button
                              className="request-action-button approve-button"
                              onClick={() => handleApproveRequest(request)}
                              disabled={processing}
                            >
                              <i className="fas fa-check-circle"></i>
                              {processing ? 'Processing...' : 'Approve Request'}
                            </button>
                            <button
                              className="request-action-button reject-button"
                              onClick={() => handleRejectRequest(request)}
                              disabled={processing}
                            >
                              <i className="fas fa-times-circle"></i>
                              Reject Request
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Approved Requests */}
            {selectedRequest === 'approved' && (
              <div className="requests-list">
                {approvedRequests.length === 0 ? (
                  <div className="no-requests">
                    <div className="no-requests-icon">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <h3>No Approved Requests</h3>
                    <p>You haven't approved any registration requests yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="admin-section-title">Approved Registration Requests</div>
                    {approvedRequests.map((request, index) => (
                      <div key={index} className="request-card approved">
                        <div className="request-status-badge approved">
                          <i className="fas fa-check-circle"></i>
                          Approved
                        </div>
                        <div className="request-header">
                          <div className="request-header-left">
                            <h4>{request.name}</h4>
                            <div className="request-meta">
                              <span className="request-date">
                                <i className="far fa-calendar-check"></i>
                                Approved: {new Date(request.approvedDate).toLocaleDateString()}
                              </span>
                              <span className="request-user">
                                <i className="far fa-envelope"></i>
                                {request.email}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="request-content">
                          <div className="request-details">
                            <div className="request-detail-item">
                              <span className="request-detail-label">Email Address</span>
                              <div className="request-detail-value">{request.email}</div>
                            </div>
                            <div className="request-detail-item">
                              <span className="request-detail-label">Wallet Address</span>
                              <div className="request-detail-value">{request.walletAddress}</div>
                            </div>
                            <div className="request-detail-item">
                              <span className="request-detail-label">Request Date</span>
                              <div className="request-detail-value">{new Date(request.requestDate).toLocaleDateString()}</div>
                            </div>
                            <div className="request-detail-item">
                              <span className="request-detail-label">Approval Date</span>
                              <div className="request-detail-value">{new Date(request.approvedDate).toLocaleDateString()}</div>
                            </div>
                          </div>

                          <div className="request-description">
                            <h5>Request Reason</h5>
                            <p>{request.reason}</p>
                          </div>

                          <div className="request-actions">
                            <button
                              className="request-action-button view-details-button"
                              onClick={() => {/* View details function */}}
                            >
                              <i className="fas fa-eye"></i>
                              View Details
                            </button>
                            <button
                              className="request-action-button reject-button"
                              onClick={() => handleRejectRequest(request)}
                            >
                              <i className="fas fa-user-minus"></i>
                              Revoke Access
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Rejected Requests */}
            {selectedRequest === 'rejected' && (
              <div className="requests-list">
                {rejectedRequests.length === 0 ? (
                  <div className="no-requests">
                    <div className="no-requests-icon">
                      <i className="fas fa-times-circle"></i>
                    </div>
                    <h3>No Rejected Requests</h3>
                    <p>You haven't rejected any registration requests yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="admin-section-title">Rejected Registration Requests</div>
                    {rejectedRequests.map((request, index) => (
                      <div key={index} className="request-card rejected">
                        <div className="request-status-badge rejected">
                          <i className="fas fa-times-circle"></i>
                          Rejected
                        </div>
                        <div className="request-header">
                          <div className="request-header-left">
                            <h4>{request.name}</h4>
                            <div className="request-meta">
                              <span className="request-date">
                                <i className="far fa-calendar-times"></i>
                                Rejected: {new Date(request.rejectedDate).toLocaleDateString()}
                              </span>
                              <span className="request-user">
                                <i className="far fa-envelope"></i>
                                {request.email}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="request-content">
                          <div className="request-details">
                            <div className="request-detail-item">
                              <span className="request-detail-label">Email Address</span>
                              <div className="request-detail-value">{request.email}</div>
                            </div>
                            <div className="request-detail-item">
                              <span className="request-detail-label">Wallet Address</span>
                              <div className="request-detail-value">{request.walletAddress}</div>
                            </div>
                            <div className="request-detail-item">
                              <span className="request-detail-label">Request Date</span>
                              <div className="request-detail-value">{new Date(request.requestDate).toLocaleDateString()}</div>
                            </div>
                            <div className="request-detail-item">
                              <span className="request-detail-label">Rejection Date</span>
                              <div className="request-detail-value">{new Date(request.rejectedDate).toLocaleDateString()}</div>
                            </div>
                          </div>

                          <div className="request-description">
                            <h5>Request Reason</h5>
                            <p>{request.reason}</p>
                          </div>

                          <div className="request-actions">
                            <button
                              className="request-action-button approve-button"
                              onClick={() => handleApproveRequest(request)}
                              disabled={processing}
                            >
                              <i className="fas fa-check-circle"></i>
                              {processing ? 'Processing...' : 'Approve Request'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {error && <div className="error"><i className="fas fa-exclamation-circle"></i> {error}</div>}
          {result && <div className="success"><i className="fas fa-check-circle"></i> {result}</div>}
        </div>
      )}

      <div className="admin-info">
        <h3><i className="fas fa-shield-alt"></i> Admin Information</h3>
        <p>As an administrator of the NFT Ticketing platform, you have access to powerful management tools. Use these capabilities responsibly to maintain the integrity and security of the platform.</p>
        <ul>
          <li>Add new event organizers by entering their Ethereum wallet address</li>
          <li>Review, approve, or reject organizer registration requests</li>
          <li>Revoke organizer privileges when necessary</li>
          <li>Create and manage events directly from your account</li>
          <li>Monitor platform activity and user engagement</li>
        </ul>
        <p>Remember that all administrative actions are recorded on the blockchain and cannot be reversed. If you need assistance or have questions about your admin responsibilities, please contact the platform development team.</p>
      </div>

      <div className="admin-pagination">
        <button className="pagination-button disabled">
          <i className="fas fa-chevron-left"></i>
        </button>
        <button className="pagination-button active">1</button>
        <button className="pagination-button">2</button>
        <button className="pagination-button">3</button>
        <button className="pagination-button">
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
