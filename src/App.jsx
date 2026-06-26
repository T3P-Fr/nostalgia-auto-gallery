import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import DetailingPage from "./pages/DetailingPage.jsx";
import GalleryPage from "./pages/GalleryPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import InformationsPage from "./pages/InformationsPage.jsx";

/**
 * Déclare une route distincte pour chaque page de l'architecture v3 (5 pages).
 *
 * Le site est recentré sur le detailing ; l'activité achat/vente n'a plus de page
 * dédiée et n'apparaît que dans une section de la page À propos (cf. Site_Structure.md).
 * @returns {JSX.Element} L'arbre principal de l'application.
 */
export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="detailing" element={<DetailingPage />} />
                <Route path="realisations" element={<GalleryPage />} />
                <Route path="a-propos" element={<AboutPage />} />
                <Route path="contact" element={<BookingPage />} />
                <Route path="informations" element={<InformationsPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}
