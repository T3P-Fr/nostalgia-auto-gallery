import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import GalleryPage from "./pages/GalleryPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import PartsPage from "./pages/PartsPage.jsx";
import PricingPage from "./pages/PricingPage.jsx";
import ServicesPage from "./pages/ServicesPage.jsx";
import TradingPage from "./pages/TradingPage.jsx";
import VehiclesPage from "./pages/VehiclesPage.jsx";

/**
 * Déclare une route distincte pour chaque entrée de la navigation.
 * @returns {JSX.Element} L'arbre principal de l'application.
 */
export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="prestations" element={<ServicesPage />} />
                <Route path="negoce-auto" element={<TradingPage />} />
                <Route path="vehicules" element={<VehiclesPage />} />
                <Route path="pieces-automobiles" element={<PartsPage />} />
                <Route path="galerie" element={<GalleryPage />} />
                <Route path="tarifs" element={<PricingPage />} />
                <Route path="a-propos" element={<AboutPage />} />
                <Route path="rendez-vous" element={<BookingPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}
