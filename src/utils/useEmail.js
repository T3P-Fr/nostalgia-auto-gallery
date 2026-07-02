import { useEffect, useState } from "react";
import { site } from "../data.js";

/**
 * Réassemble l'adresse e-mail APRÈS hydratation, à partir de ses deux parties
 * (emailUser + emailDomain) stockées séparément dans content.json.
 *
 * Objectif : l'adresse complète n'apparaît jamais en clair dans le HTML livré
 * (statique après pré-rendu), ce qui gêne la collecte automatique par les robots
 * spammeurs. Les vrais visiteurs (JavaScript actif) obtiennent un lien mailto
 * pleinement fonctionnel.
 * @returns {{address: string, href: string} | null} L'e-mail assemblé, ou null avant montage.
 */
export function useEmail() {
    const [email, setEmail] = useState(null);

    useEffect(() => {
        const address = `${site.emailUser}@${site.emailDomain}`;
        setEmail({ address, href: `mailto:${address}` });
    }, []);

    return email;
}
