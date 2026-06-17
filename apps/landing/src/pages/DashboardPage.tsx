import React from 'react';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';
import DashboardSection from '../sections/DashboardSection';

const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen font-sans antialiased bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <DashboardSection />
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;
