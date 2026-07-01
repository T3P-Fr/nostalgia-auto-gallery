import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import DashboardPage from "./pages/DashboardPage.jsx";
import "./styles.css";

// Build dédié « admin » : on monte UNIQUEMENT le Dashboard (pas le site vitrine
// ni son routeur). Servi en statique sur admin.nostalgiaauto.gallery.
createRoot(document.getElementById("root")).render(
    <StrictMode>
        <DashboardPage />
    </StrictMode>,
);
