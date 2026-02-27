import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ArthikScroll from "./components/features/ArthikScroll";
import { Home } from "./pages/Home/Home";
import { Preferences } from "./pages/Preferences/Preferences";
import { Auth } from "./pages/Auth/Auth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LanguageProvider } from "./context/LanguageContext";
import PaymentSuccess from "./pages/Payment/PaymentSuccess";
import PaymentFailure from "./pages/Payment/PaymentFailure";
import { Bookings } from "./pages/Bookings/Bookings";
import "./assets/styles/App.css";

function App() {
  return (
    <LanguageProvider>
      <Router>
        <main className="min-h-screen bg-[#050505] selection:bg-white selection:text-black">
          <Routes>
            <Route path="/" element={<ArthikScroll />} />
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/preferences" element={
              <ProtectedRoute>
                <Preferences />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<Auth />} />
            <Route path="/auth/google/callback" element={<Auth />} />
            <Route path="/auth/callback" element={<Auth />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failure" element={<PaymentFailure />} />
            <Route path="/bookings" element={
              <ProtectedRoute>
                <Bookings />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </Router>
    </LanguageProvider>
  );
}

export default App;
