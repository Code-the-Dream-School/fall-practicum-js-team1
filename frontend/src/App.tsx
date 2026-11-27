import { Routes, Route } from 'react-router';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ItemDetailsPage from './pages/ItemDetailsPage';
import AboutPage from './pages/AboutPage';
import EditItemPage from './pages/EditItemPage';
import PostItemPage from './pages/PostItemPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import AddressesPage from './pages/AddressesPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestRoute from './components/auth/GuestRoute';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/items/:id" element={<ItemDetailsPage />} />
        <Route path="*" element={<NotFoundPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/items/new" element={<PostItemPage />} />
          <Route path="/items/:id/edit" element={<EditItemPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/addresses" element={<AddressesPage />} />
        </Route>
        <Route element={<GuestRoute />}>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
