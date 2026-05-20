import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BookingFunnel from './pages/BookingFunnel';
import SuccessPage from './pages/SuccessPage';
import RescheduleBooking from './pages/RescheduleBooking';
import CancelBooking from './pages/CancelBooking';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book" element={<BookingFunnel />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/reschedule-booking" element={<RescheduleBooking />} />
            <Route path="/cancel-booking" element={<CancelBooking />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;