import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";

/*
 * Découpage de code : chaque page est chargée à la demande (lazy). Le bundle initial
 * ne contient que le squelette (Layout + accueil) ; les pages lourdes (réservation,
 * admin…) ne sont téléchargées qu'à la visite de leur route.
 */
const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const NegocePage = lazy(() => import("./pages/NegocePage.jsx"));
const DetailingPage = lazy(() => import("./pages/DetailingPage.jsx"));
const GalleryPage = lazy(() => import("./pages/GalleryPage.jsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.jsx"));
const BookingPage = lazy(() => import("./pages/BookingPage.jsx"));
const InformationsPage = lazy(() => import("./pages/InformationsPage.jsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));
// Dashboard du gérant : espace séparé (sans en-tête/pied de page du site public).
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));

/**
 * Point de suspension partagé par toutes les pages chargées paresseusement.
 * @returns {JSX.Element} L'enveloppe Suspense + la route enfant active.
 */
function SuspendedOutlet() {
    return (
        <Suspense fallback={<div className="route-loading" aria-busy="true" />}>
            <Outlet />
        </Suspense>
    );
}

/**
 * Déclare une route distincte pour chaque page (5 principales + support).
 * @returns {JSX.Element} L'arbre principal de l'application.
 */
export default function App() {
    return (
        <Routes>
            {/* Dashboard du gérant : route à part, EN DEHORS du Layout public,
                pour offrir un espace plein écran à sa propre identité visuelle. */}
            <Route
                path="dashboard"
                element={
                    <Suspense fallback={<div className="route-loading" aria-busy="true" />}>
                        <DashboardPage />
                    </Suspense>
                }
            />
            <Route element={<Layout />}>
                <Route element={<SuspendedOutlet />}>
                    <Route index element={<HomePage />} />
                    <Route path="negoce" element={<NegocePage />} />
                    <Route path="detailing" element={<DetailingPage />} />
                    <Route path="realisations" element={<GalleryPage />} />
                    <Route path="a-propos" element={<AboutPage />} />
                    <Route path="contact" element={<BookingPage />} />
                    <Route path="informations" element={<InformationsPage />} />
                    <Route path="admin" element={<AdminPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Route>
        </Routes>
    );
}
