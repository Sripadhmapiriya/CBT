import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { isAdmin, isOrganizer, getCurrentAccount } from '../utils/contractUtils';
import { checkContractConnection, getContractAddress } from '../utils/contractChecker';

const RoleChecker = () => {
  const [account, setAccount] = useState('');
  const [adminRole, setAdminRole] = useState(false);
  const [organizerRole, setOrganizerRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const checkRoles = async () => {
      try {
        setLoading(true);
        setError(null);

        // First check if the contract is connected
        const isContractConnected = await checkContractConnection();

        if (!isContractConnected) {
          console.warn('Contract not connected. Using address:', getContractAddress());
          setError('Failed to connect to the contract. Please check your network connection and make sure you are on the correct network.');
          setLoading(false);
          return;
        }

        // Get current account
        const currentAccount = await getCurrentAccount();
        setAccount(currentAccount);

        // Check roles
        const isUserAdmin = await isAdmin();
        const isUserOrganizer = await isOrganizer();

        setAdminRole(isUserAdmin);
        setOrganizerRole(isUserOrganizer);

        setLoading(false);
      } catch (err) {
        console.error('Error checking roles:', err);
        setError('Failed to check roles. Please make sure your wallet is connected.');
        setLoading(false);
      }
    };

    checkRoles();
  }, []);

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Get user's highest role
  const getUserRole = () => {
    if (adminRole) return 'admin';
    if (organizerRole) return 'organizer';
    return 'user';
  };

  // Get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'organizer': return 'Event Organizer';
      default: return 'Regular User';
    }
  };

  // Get role description
  const getRoleDescription = (role) => {
    switch (role) {
      case 'admin':
        return 'As an administrator, you have full control over the platform. You can manage organizers, approve or reject registration requests, and create events.';
      case 'organizer':
        return 'As an event organizer, you can create and manage events, issue tickets, and verify ticket ownership.';
      default:
        return 'As a regular user, you can purchase tickets for events and view your ticket collection. To create events, you need to register as an organizer.';
    }
  };

  // Get role permissions
  const getRolePermissions = (role) => {
    switch (role) {
      case 'admin':
        return [
          'Create and manage events',
          'Add and remove organizers',
          'Approve or reject registration requests',
          'Access admin dashboard',
          'Verify tickets',
          'Purchase tickets',
          'View ticket collection'
        ];
      case 'organizer':
        return [
          'Create and manage events',
          'Issue tickets',
          'Verify tickets',
          'Purchase tickets',
          'View ticket collection'
        ];
      default:
        return [
          'Purchase tickets',
          'View ticket collection',
          'Register as organizer'
        ];
    }
  };

  if (loading) {
    return (
      <div className="check-role-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Checking your roles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="check-role-container">
        <div className="error">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      </div>
    );
  }

  const userRole = getUserRole();

  return (
    <div className="check-role-container">
      <h2>
        <i className="fas fa-user-shield"></i> Role Checker
      </h2>

      <div className="role-status-card">
        <div className="role-status-header">
          <div className="wallet-address">
            <div className="wallet-icon">
              <i className="fas fa-wallet"></i>
            </div>
            <div className="wallet-details">
              <span className="wallet-label">Connected Wallet</span>
              <span className="wallet-value">{formatAddress(account)}</span>
              <button className="copy-address-btn" onClick={() => navigator.clipboard.writeText(account)}>
                <i className="fas fa-copy"></i>
              </button>
            </div>
          </div>

          <div className="role-badges">
            <div className={`role-badge ${userRole}`}>
              <i className={`fas ${userRole === 'admin' ? 'fa-user-cog' : userRole === 'organizer' ? 'fa-user-tie' : 'fa-user'}`}></i>
              {getRoleDisplayName(userRole)}
            </div>
          </div>
        </div>

        <div className="role-tabs">
          <button
            className={`role-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`role-tab ${activeTab === 'permissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('permissions')}
          >
            Permissions
          </button>
          <button
            className={`role-tab ${activeTab === 'actions' ? 'active' : ''}`}
            onClick={() => setActiveTab('actions')}
          >
            Actions
          </button>
          <div className={`role-tab-slider ${activeTab}`}></div>
        </div>

        <div className="role-content">
          {activeTab === 'overview' && (
            <div className="role-overview">
              <div className="role-info">
                <div className="role-icon">
                  <i className={`fas ${userRole === 'admin' ? 'fa-user-cog' : userRole === 'organizer' ? 'fa-user-tie' : 'fa-user'}`}></i>
                </div>
                <div className="role-description">
                  <h3>{getRoleDisplayName(userRole)}</h3>
                  <p>{getRoleDescription(userRole)}</p>
                </div>
              </div>

              <div className="role-status-items">
                <div className="role-status-item">
                  <div className="status-label">Admin Role:</div>
                  <div className={`status-value ${adminRole ? 'active' : 'inactive'}`}>
                    <i className={`fas ${adminRole ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                    {adminRole ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div className="role-status-item">
                  <div className="status-label">Organizer Role:</div>
                  <div className={`status-value ${organizerRole ? 'active' : 'inactive'}`}>
                    <i className={`fas ${organizerRole ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                    {organizerRole ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="role-permissions">
              <h4>Your Permissions</h4>
              <div className="permission-list">
                {getRolePermissions(userRole).map((permission, index) => (
                  <div key={index} className="permission-item">
                    <i className="fas fa-check"></i>
                    {permission}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="role-actions">
              <h4>Available Actions</h4>

              <div className="action-buttons">
                {adminRole && (
                  <>
                    <Link to="/admin" className="action-button admin">
                      <i className="fas fa-user-shield"></i>
                      Admin Dashboard
                    </Link>
                    <Link to="/create-event" className="action-button">
                      <i className="fas fa-calendar-plus"></i>
                      Create Event
                    </Link>
                  </>
                )}

                {organizerRole && !adminRole && (
                  <Link to="/create-event" className="action-button organizer">
                    <i className="fas fa-calendar-plus"></i>
                    Create Event
                  </Link>
                )}

                {!organizerRole && !adminRole && (
                  <Link to="/register" className="action-button user">
                    <i className="fas fa-user-plus"></i>
                    Register as Organizer
                  </Link>
                )}

                <Link to="/events" className="action-button">
                  <i className="fas fa-ticket-alt"></i>
                  Browse Events
                </Link>

                <Link to="/my-tickets" className="action-button">
                  <i className="fas fa-wallet"></i>
                  My Tickets
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {!organizerRole && !adminRole && (
        <div className="role-warning">
          <div className="warning-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="warning-content">
            <h4>Limited Access</h4>
            <p>You do not have organizer privileges. To create events, you need to register as an organizer and get approved by an admin.</p>
            <Link to="/register" className="register-button">
              <i className="fas fa-user-plus"></i>
              Register as Organizer
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleChecker;
