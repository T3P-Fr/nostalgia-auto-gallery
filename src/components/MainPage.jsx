import { Outlet, useLocation } from "react-router-dom";

/**
 * Zone de contenu de la page (l'élément `<main>`).
 *
 * `<main>` porte le fond fixe via ses pseudo-éléments (`::before` image,
 * `::after` voile) et la transition d'entrée en opacité. La clé de route force un
 * remontage à chaque navigation, ce qui relance le fondu (et, avec lui, l'apparition
 * en fondu de la nouvelle image de fond). Un transform sur `<main>` casserait le
 * `position: fixed` du fond : la transition reste donc en opacité seule (côté CSS).
 * @returns {JSX.Element} La zone de contenu.
 */
export function MainPage() {
    const location = useLocation();

    return (
        <main className="page-transition" key={location.pathname}>
            <Outlet />
        </main>
    );
}
