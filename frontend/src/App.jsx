import { Route, Routes } from "react-router-dom";
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
import ErrorPage from "./pages/ErrorPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/product/:id" element={<ProductDetailPage />} />
      <Route path="/recipe/:id" element={<RecipeDetailPage />} />
      <Route path="/edit-recipe/:id" element={<EditRecipePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/chef/:id" element={<ChefProfilePage />} />
      <Route path="/chefs" element={<TopChefsPage />} />
      <Route path="/submit-recipe" element={<SubmitRecipePage />} />
      <Route path="/saved-recipes" element={<SavedRecipesPage />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/fridge" element={<SmartFridgePage />} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}

export default App;

