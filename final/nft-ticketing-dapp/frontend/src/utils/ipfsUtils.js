import axios from 'axios';

// Pinata API keys
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || 'f3e6c14fd71820be4511';
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET_KEY || '2a32dd0ea1e17a55e22e01ebcb9b7e6997ce0b99534d96fdc74567ce03564a39';

// Upload JSON metadata to IPFS via Pinata
export const uploadMetadataToIPFS = async (metadata) => {
  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_API_SECRET
        }
      }
    );

    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw error;
  }
};

// Upload image to IPFS via Pinata
export const uploadImageToIPFS = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_API_SECRET
        }
      }
    );

    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading image to IPFS:', error);
    throw error;
  }
};

// AI image generation has been removed - only user uploads are allowed

// Create ticket metadata
export const createTicketMetadata = async (eventId, eventName, eventDate, ticketPrice, imageUrl) => {
  return {
    name: `Ticket for ${eventName}`,
    description: `NFT Ticket for ${eventName} on ${new Date(eventDate).toLocaleDateString()}`,
    image: imageUrl,
    attributes: [
      {
        trait_type: 'Event ID',
        value: eventId.toString()
      },
      {
        trait_type: 'Event Name',
        value: eventName
      },
      {
        trait_type: 'Event Date',
        value: new Date(eventDate).toISOString()
      },
      {
        trait_type: 'Ticket Price',
        value: ticketPrice.toString()
      },
      {
        trait_type: 'Minted Date',
        value: new Date().toISOString()
      }
    ]
  };
};

// Create event metadata
export const createEventMetadata = async (name, description, date, imageUrl) => {
  return {
    name: name,
    description: description,
    image: imageUrl,
    date: new Date(date).toISOString(),
    attributes: [
      {
        trait_type: 'Event Name',
        value: name
      },
      {
        trait_type: 'Event Date',
        value: new Date(date).toISOString()
      },
      {
        trait_type: 'Created Date',
        value: new Date().toISOString()
      }
    ]
  };
};

// Convert IPFS URL to HTTP URL for display
export const ipfsToHttp = (ipfsUrl) => {
  if (!ipfsUrl) return '';

  // Replace ipfs:// with https://ipfs.io/ipfs/
  if (ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }

  return ipfsUrl;
};
