import QRCode from 'qrcode';

// Generate QR code for a ticket
export const generateTicketQR = async (tokenId, eventId, eventName, ownerAddress) => {
  try {
    // Create ticket data object
    const ticketData = {
      tokenId,
      eventId,
      eventName,
      owner: ownerAddress,
      timestamp: Date.now()
    };
    
    // Convert to JSON string
    const dataString = JSON.stringify(ticketData);
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(dataString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Parse QR code data
export const parseTicketQR = (qrData) => {
  try {
    return JSON.parse(qrData);
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    throw new Error('Invalid QR code data');
  }
};
