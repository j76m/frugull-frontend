import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Search from './pages/Search';
import CreateDeal from './pages/CreateDeal';
import Profile from './pages/Profile';
import Filters from './pages/Filters';
import HowItWorks from './pages/HowItWorks';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FilterProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* Browsing is public — only posting (and your own profile)
                requires an account. This matters directly for organic
                growth: someone clicking a shared deal link should see the
                actual deal, not a login wall. */}
            <Route path="/" element={<Search />} />
            <Route path="/filters" element={<Filters />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateDeal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/me"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </FilterProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}