"use client";

import { database } from "@/lib/firebaseConfig";
import { ref, onValue, get, remove } from "firebase/database";
import { useEffect, useState } from "react";

export default function SyntheseLots() {
    const [poidsData, setPoidsData] = useState({});
    const [produitsData, setProduitsData] = useState({});
    const [zoneData, setZoneData] = useState({});
    const [zoneFilter, setZoneFilter] = useState("");

    // Charger les données
    useEffect(() => {
        const poidsRef = ref(database, "poids");
        const produitsRef = ref(database, "produits");
        const zoneRef = ref(database, "zone");

        const unsubPoids = onValue(poidsRef, (snap) => setPoidsData(snap.val() || {}));
        const unsubProduits = onValue(produitsRef, (snap) => setProduitsData(snap.val() || {}));
        const unsubZone = onValue(zoneRef, (snap) => setZoneData(snap.val() || {}));

        return () => {
            unsubPoids();
            unsubProduits();
            unsubZone();
        };
    }, []);

    const zoneEntries = Object.entries(zoneData);
    const poidsEntries = Object.entries(poidsData);
    const produitsEntries = Object.entries(produitsData);

    // Fonction utilitaire : convertir unités totales -> {lots, unites}
    const convertirLotsEtUnites = (totalUnites = 0, qteParLot = 1) => {
        const total = Math.max(0, Math.round(totalUnites)); // sécurité, entier >=0
        const lots = Math.floor(total / qteParLot);
        const unites = total % qteParLot;
        return { lots, unites };
    };

    // Fonction utilitaire : formater affichage "X lot(s) Y unité(s)" ou "-" si tout = 0
    const formatLotsUnitesAffichage = (totalUnites = 0, qteParLot = 1) => {
        const { lots, unites } = convertirLotsEtUnites(totalUnites, qteParLot);
        if (lots === 0 && unites === 0) return "-";
        return `${lots > 0 ? `${lots} lot(s)` : ""}${lots > 0 && unites > 0 ? " " : ""}${unites > 0 ? `${unites} unité(s)` : ""}`;
    };

    // ✅ Fonction pour réinitialiser les poids d’un produit dans une zone
    const resetPoidsParProduitEtZone = async (produit, zone) => {
        if (!produit || !zone) {
            alert("Veuillez spécifier un produit et une zone.");
            return;
        }

        if (!confirm(`Réinitialiser les poids pour ${produit} (${zone}) ?`)) return;

        const poidsRef = ref(database, "poids");
        const snapshot = await get(poidsRef);

        if (!snapshot.exists()) {
            alert("Aucun poids trouvé.");
            return;
        }

        const data = snapshot.val();
        let deleted = 0;

        for (const [key, p] of Object.entries(data)) {
            const prodMatch =
                String(p.prod_sortie || "").toLowerCase() === produit.toLowerCase();
            const zoneMatch =
                String(p.zone_prod || "").toLowerCase() === zone.toLowerCase();

            if (prodMatch && zoneMatch) {
                await remove(ref(database, `poids/${key}`));
                deleted++;
            }
        }

        alert(`${deleted} enregistrement(s) supprimé(s) pour ${produit} (${zone})`);
    };

    // 🔹 Calcul synthèse
    const synthese = zoneEntries
        .map(([zoneId, z]) => {
            const produit = produitsEntries.find(
                ([_, p]) =>
                    String(p.designation).trim().toLowerCase() ===
                    String(z.designation_prod).trim().toLowerCase()
            );

            if (!produit) return null;

            const poidsUnitaire = parseFloat(produit[1].poids_unitaire) || 0;
            const qteParLot = parseInt(produit[1].qte_par_lot) || 1;

            const totalUnites = parseInt(z.qte_total_unites) || 0;
            // totalLots (affichage ou calcul) — on arrondit à l'entier pour l'affichage si besoin
            const totalLots = Math.floor(totalUnites / qteParLot);

            const poidsParLot = poidsUnitaire * qteParLot;

            // 🔸 Total poids sorties (pour ce produit et cette zone)
            const totalPoidsSortie = poidsEntries
                .filter(
                    ([_, p]) =>
                        String(p.prod_sortie || "").trim().toLowerCase() ===
                        String(z.designation_prod || "").trim().toLowerCase() &&
                        String(p.zone_prod || "").trim().toLowerCase() ===
                        String(z.zone || "").trim().toLowerCase()
                )
                .reduce((sum, [_, p]) => sum + parseFloat(p.poids || 0), 0);

            // 🔸 Conversion du poids total sorti → unités sorties (précision)
            const totalUnitesSorties = poidsUnitaire > 0
                ? totalPoidsSortie / poidsUnitaire
                : 0;

            // éviter négatifs, arrondir raisonnablement
            const totalUnitesSortiesRounded = Math.max(0, Math.round(totalUnitesSorties));

            const { lots: lotsSortis, unites: unitesSorties } = convertirLotsEtUnites(
                totalUnitesSortiesRounded,
                qteParLot
            );

            // Restant en unités (peut être fractionnel si on ne souhaite pas arrondir sorties)
            const unitesRestantesFloat = totalUnites - totalUnitesSorties;
            const unitesRestantesRounded = Math.max(0, Math.round(unitesRestantesFloat));
            const { lots: lotsRestants, unites: unitesRestantes } = convertirLotsEtUnites(
                unitesRestantesRounded,
                qteParLot
            );

            return {
                id: zoneId,
                zone: z.zone,
                designation: z.designation_prod,
                totalLots, // entier
                totalUnites,
                lotsSortis,
                unitesSorties,
                lotsRestants,
                unitesRestantes,
                status_stock: unitesRestantesRounded > 0 ? 1 : 0,
                qteParLot,
            };
        })
        .filter((item) => item !== null)
        .filter((item) => !zoneFilter || item.zone === zoneFilter);

    const zonesDisponibles = [...new Set(zoneEntries.map(([_, z]) => z.zone))];

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Synthèse des stocks (lots et unités)
            </h2>

            {/* Filtre par zone */}
            <div className="mb-4">
                <label className="mr-2 font-medium">Filtrer par zone :</label>
                <select
                    value={zoneFilter}
                    onChange={(e) => setZoneFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                >
                    <option value="">Toutes les zones</option>
                    {zonesDisponibles.map((z, i) => (
                        <option key={i} value={z}>{z}</option>
                    ))}
                </select>
            </div>

            {/* Tableau */}
            <table className="w-full border overflow-hidden">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-3 text-left">Zone</th>
                        <th className="border p-3 text-left">Produit</th>
                        <th className="border p-3 text-left">Stock initial</th>
                        <th className="border p-3 text-left">Sorties</th>
                        <th className="border p-3 text-left">Restant</th>
                        <th className="border p-3 text-left">État</th>
                        <th className="border p-3 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {synthese.map((item) => (
                        <tr key={item.id}>
                            <td className="border p-2">{item.zone}</td>
                            <td className="border p-2">{item.designation}</td>

                            {/* Stock initial : formaté comme pour le restant */}
                            <td className="border p-2">
                                {formatLotsUnitesAffichage(item.totalUnites, item.qteParLot)}
                            </td>

                            {/* Sorties */}
                            <td className="border p-2">
                                {item.lotsSortis > 0 || item.unitesSorties > 0
                                    ? `${item.lotsSortis > 0 ? `${item.lotsSortis} lot(s)` : ""}${item.lotsSortis > 0 && item.unitesSorties > 0 ? " " : ""}${item.unitesSorties > 0 ? `${item.unitesSorties} unité(s)` : ""}`
                                    : "-"}
                            </td>

                            {/* Restant */}
                            <td className="border p-2">
                                {item.lotsRestants > 0 || item.unitesRestantes > 0
                                    ? `${item.lotsRestants > 0 ? `${item.lotsRestants} lot(s)` : ""}${item.lotsRestants > 0 && item.unitesRestantes > 0 ? " " : ""}${item.unitesRestantes > 0 ? `${item.unitesRestantes} unité(s)` : ""}`
                                    : "-"}
                            </td>

                            <td
                                className={`border p-2 font-semibold text-white ${item.status_stock ? "bg-green-500" : "bg-red-500"}`}
                            >
                                {item.status_stock ? "En stock" : "Épuisé"}
                            </td>

                            <td className="border p-2 text-center">
                                <button
                                    onClick={() => resetPoidsParProduitEtZone(item.designation, item.zone)}
                                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                >
                                    Réinitialiser
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
