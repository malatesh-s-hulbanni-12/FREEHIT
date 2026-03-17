// src/contexts/WalletContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const WalletContext = createContext();

export const useWallet = () => {
  return useContext(WalletContext);
};

export const WalletProvider = ({ children }) => {
  const { user, refreshUserData } = useAuth();
  const [transactions, setTransactions] = useState([]);

  const addFunds = async (amount) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('https://freehit.onrender.com/api/wallet/add', 
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await refreshUserData();
      toast.success(`₹${amount} added to wallet!`);
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add funds');
      return { success: false };
    }
  };

  const value = {
    walletBalance: user?.walletBalance || 0,
    transactions,
    addFunds
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
