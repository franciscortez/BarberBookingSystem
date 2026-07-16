import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import {
  BookingFunnelRoute,
  CancelBookingRoute,
  RescheduleBookingRoute,
  SuccessPageRoute,
  LoginRoute
} from './routes/lazyRoutes';

const RouteFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center px-6 pt-28 text-sm text-zinc-500">
    Loading...
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
          <Navbar />
          <main className="flex-grow">
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/book" element={<BookingFunnelRoute />} />
                <Route path="/success" element={<SuccessPageRoute />} />
                <Route path="/reschedule-booking" element={<RescheduleBookingRoute />} />
                <Route path="/cancel-booking" element={<CancelBookingRoute />} />
                <Route path="/login" element={<LoginRoute />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
