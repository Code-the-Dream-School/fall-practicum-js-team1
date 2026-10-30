import './App.css';
import { Routes, Route } from 'react-router';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ItemDetailsPage from './pages/ItemDetailsPage';
import PostItemPage from './pages/PostItemPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/items/:id" element={<ItemDetailsPage />} />
        <Route path="/items/new" element={<PostItemPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
