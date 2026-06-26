// Point d'entrée CommonJS pour Phusion Passenger (o2switch).
//
// Passenger charge le fichier de démarrage via require(). Or l'application est
// en ESM ("type": "module" dans package.json), ce que require() refuse
// ("require is not defined in ES module scope"). Ce wrapper, en .cjs (donc
// toujours interprété en CommonJS), importe dynamiquement l'application ESM.
//
// On expose aussi le global PhusionPassenger (s'il existe) pour que server/index.js
// puisse utiliser le reverse port binding via app.listen("passenger").

if (typeof PhusionPassenger !== "undefined") {
    global.PhusionPassenger = PhusionPassenger;
}

import("./server/index.js").catch((error) => {
    console.error(error);
    process.exit(1);
});
