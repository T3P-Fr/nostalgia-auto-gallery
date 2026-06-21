import { Armchair, CarFront, Wrench } from "lucide-react";

// Les contenus partagés restent centralisés pour garantir leur cohérence.
export const services = [
    {
        title: "Intérieur",
        description:
            "Aspiration, vapeur, shampoing des sièges, soin des cuirs et plastiques. Un habitacle comme au premier jour.",
        from: "dès 65 €",
        icon: Armchair,
    },
    {
        title: "Extérieur",
        description:
            "Prélavage mousse, lavage manuel, décontamination, cire et protection longue durée.",
        from: "dès 65 €",
        icon: CarFront,
    },
    {
        title: "Complet + méca",
        description:
            "Intérieur et extérieur réunis, avec contrôle des niveaux, des pneus et de l’éclairage.",
        from: "dès 120 €",
        icon: Wrench,
    },
];

export const galleryItems = [
    ["nissan-dusk.jpg", "Nissan 200SX", "S13 · coupé"],
    ["nissan-lights.jpg", "200SX", "face avant"],
    ["engine.jpg", "Compartiment moteur", "dégraissage"],
    ["peugeot-side.jpg", "Peugeot 205", "youngtimer"],
    ["peugeot-front.jpg", "205", "profil avant"],
    ["context.jpg", "À domicile", "intervention"],
];

export const interventionTowns = [
    "Parignargues",
    "Gard (30)",
    "Départements voisins",
    "À domicile",
    "Lieu convenu",
    "15 km offerts",
    "Au-delà avec supplément",
];

export const pricingGroups = [
    {
        title: "Intérieur",
        subtitle: "Habitacle",
        tiers: [
            {
                tier: "Standard",
                price: 65,
                duration: "≈ 1h45",
                features: [
                    "Aspiration de l’habitacle",
                    "Brossage des tapis",
                    "Nettoyage de toutes les surfaces",
                    "Lavage des vitres",
                ],
            },
            {
                tier: "Platine",
                price: 110,
                duration: "≈ 2h15",
                includes: "Standard",
                features: [
                    "Shampoing complet des sièges",
                    "Nettoyage à la vapeur",
                    "Coffre & logement roue de secours",
                ],
            },
            {
                tier: "Premium",
                price: 170,
                duration: "≈ 4h",
                includes: "Platine",
                features: ["Nettoyage des ceintures", "Rails de sièges", "Ciel de toit"],
            },
        ],
    },
    {
        title: "Extérieur",
        subtitle: "Carrosserie",
        tiers: [
            {
                tier: "Standard",
                price: 65,
                duration: "≈ 1h45",
                features: [
                    "Roues & jantes",
                    "Prélavage à la mousse",
                    "Lavage manuel",
                    "Séchage à l’air pulsé",
                    "Protection brillance rapide",
                ],
            },
            {
                tier: "Platine",
                price: 110,
                duration: "≈ 2h15",
                includes: "Standard",
                features: [
                    "Décontamination chimique",
                    "Jantes intérieur & extérieur",
                    "Brillant pneu longue durée",
                    "Cire de protection (3–4 mois)",
                ],
            },
            {
                tier: "Premium",
                price: 170,
                duration: "≈ 4h",
                includes: "Platine",
                features: [
                    "Châssis & passages de roues",
                    "Céramique des jantes",
                    "Rénovation des plastiques",
                    "Scellant carnauba (8–12 mois)",
                ],
            },
        ],
    },
    {
        title: "Complet + méca",
        subtitle: "Intérieur + extérieur",
        tiers: [
            {
                tier: "Standard",
                price: 120,
                duration: "≈ 3h30",
                features: [
                    "Nettoyage intérieur et extérieur",
                    "Contrôle visuel du niveau des liquides",
                    "Contrôle de l’état des pneus",
                    "Contrôle des éclairages",
                ],
            },
            {
                tier: "Platine",
                price: 210,
                duration: "≈ 4h30",
                includes: "Standard",
                features: [
                    "Nettoyage de la baie de pare-brise",
                    "Contrôle visuel du niveau des liquides",
                    "Contrôle de l’état des pneus",
                    "Contrôle des éclairages",
                ],
            },
            {
                tier: "Premium",
                price: 320,
                duration: "≈ 8h",
                includes: "Platine",
                features: [
                    "Remise à niveau des liquides",
                    "Contrôle visuel complet",
                    "Dégraissage hydrophobe du compartiment moteur",
                    "Journée complète",
                ],
            },
        ],
    },
];

export const serviceOptions = [
    ...pricingGroups.flatMap((group) =>
        group.tiers.map(
            (tier) => `${group.title} — ${tier.tier} · ${tier.price} €`,
        ),
    ),
    "Option : Traitement odeurs · 30 €",
    "Option : Nettoyage moteur · 45 €",
    "Option : Rénovation phares · 65 €",
    "Option : Lustrage peinture · 150 €",
    "Autre / sur devis",
];

export const pricingOptions = [
    ["Traitement odeurs", "30 €"],
    ["Nettoyage moteur", "45 €"],
    ["Rénovation des phares", "65 €"],
    ["Lustrage peinture", "150 €"],
];
