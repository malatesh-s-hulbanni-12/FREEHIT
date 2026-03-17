import React from 'react';
import Navbar from '../components/Navbar';
import Home from '../components/Home';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Home />
    </div>
  );
};

export default HomePage;