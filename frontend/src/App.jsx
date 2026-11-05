import { Route, Routes, useLocation } from "react-router-dom";
import {useEffect} from 'react';
import MobileNavigation from './components/MobileNavigation';
import RouteSeo from './components/RouteSeo';
import CategoryPage from './pages/CategoryPage';
import AboutPage from './pages/AboutPage';
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import RecipeDetailPage from "./pages/RecipeDetailPage.jsx";
import EditRecipePage from "./pages/EditRecipePage.jsx";
import ChefProfilePage from "./pages/ChefProfilePage.jsx";
import TopChefsPage from "./pages/TopChefsPage.jsx";
import SubmitRecipePage from "./pages/SubmitRecipePage.jsx";
import SavedRecipesPage from "./pages/SavedRecipesPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import SmartFridgePage from "./pages/SmartFridgePage.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import CommunityPage from "./pages/CommunityPage.jsx";

function App() {
  const {pathname}=useLocation();
  const page=pathname==='/'?'home':pathname.split('/')[1];
  useEffect(()=>{window.scrollTo({top:0,left:0,behavior:'auto'});},[pathname]);
  return (
    <div className="app-shell" data-page={page}>
    <RouteSeo/>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/product/:id" element={<ProductDetailPage />} />
      <Route path="/recipe/:id" element={<RecipeDetailPage />} />
      <Route path="/edit-recipe/:id" element={<EditRecipePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/chef/:id" element={<ChefProfilePage />} />
      <Route path="/chefs" element={<TopChefsPage />} />
      <Route path="/community" element={<CommunityPage />} />
      <Route path="/community/posts/:id" element={<CommunityPage />} />
      <Route path="/submit-recipe" element={<SubmitRecipePage />} />
      <Route path="/saved-recipes" element={<SavedRecipesPage />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/fridge" element={<RequireAuth><SmartFridgePage /></RequireAuth>} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
    <MobileNavigation/>
    </div>
  );
}

export default App;

