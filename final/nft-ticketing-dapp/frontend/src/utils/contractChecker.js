import { getContract } from './contractUtils';

/**
 * Checks if the contract is properly connected
 * @returns {Promise<boolean>} True if the contract is connected, false otherwise
 */
export const checkContractConnection = async () => {
  try {
    const contract = await getContract(false);
    // Try to call a simple view function to check if the contract is connected
    const adminRole = await contract.ADMIN_ROLE();
    console.log('Contract connection successful, ADMIN_ROLE:', adminRole);
    return true;
  } catch (error) {
    console.error('Contract connection failed:', error);
    return false;
  }
};

/**
 * Gets the contract address being used
 * @returns {string} The contract address
 */
export const getContractAddress = () => {
  return import.meta.env.VITE_CONTRACT_ADDRESS || '0x6710D2C70ba9cE7f70c3655DE3CF7960e942cD21';
};
