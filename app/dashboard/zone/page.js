"use client";

import { useEffect, useState } from "react";
import { database } from "@/lib/firebaseConfig";
import { ref, set, onValue, remove, push } from "firebase/database";

export default function Zone() {
  const [showModal, setShowModal] = useState(false);
  const [zone, setZone] = useState("");
  const [designation, setDesignation] = useState("");
  const [lots, setLots] = useState(0);
  const [unites, setUnites] = useState(0);
  const [zoneData, setZoneData] = useState({});
  const [produits, setProduits] = useState({});
  const [zoneFilter, setZoneFilter] = useState("");
  const [unitParLot, setUnitParLot] = useState(0); // dynamique selon produit

  // Charger les zones
  useEffect(() => {
    const zoneRefs = ref(database, "zone");
    const unsubscribe = onValue(zoneRefs, (snapshot) => {
      setZoneData(snapshot.val() || {});
    });
    return () => unsubscribe();
  }, []);

  // Charger les produits
  useEffect(() => {
    const produitsRefs = ref(database, "produits");
    const unsubscribe = onValue(produitsRefs, (snapshot) => {
      setProduits(snapshot.val() || {});
    });
    return () => unsubscribe();
  }, []);

  const zoneRefs = Object.entries(zoneData);
  const produitsRefs = Object.entries(produits);

  // Quand on change le produit, récupérer son qte_par_lot
  useEffect(() => {
    if (designation) {
      const prod = Object.values(produits).find(
        (p) => p.designation === designation
      );
      if (prod && prod.qte_par_lot) {
        setUnitParLot(parseInt(prod.qte_par_lot));
      }
    }
  }, [designation, produits]);

  // Ajouter une zone
  const handleAddProduit = async (e) => {
    e.preventDefault();
    try {
      const totalUnites =
        parseInt(lots || 0) * parseInt(unitParLot || 0) +
        parseInt(unites || 0);

      const uid_client = "1FEvCO3AMPUXBEHXkW5O73pkw9h2";

      await set(push(ref(database, "zone/")), {
        zone,
        qte_total_unites: totalUnites,
        designation_prod: designation,
        ref_client: uid_client,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        unite_par_lot: unitParLot, // on enregistre la valeur utilisée
        status_stock: totalUnites > 0 ? 1 : 0,
      });

      alert("✅ Enregistrement effectué !");
      setLots(0);
      setUnites(0);
      setZone("");
      setDesignation("");
      setShowModal(false);
    } catch (error) {
      alert("❌ Erreur : " + error.message);
    }
  };

  // Supprimer une zone
  const handleDeleteZone = async (id) => {
    if (confirm("Supprimer cette zone ?")) {
      const userRef = ref(database, "zone/" + id);
      await remove(userRef);
      alert("🗑️ Suppression effectuée !");
    }
  };

  // Mettre à jour directement la quantité
  const handleUpdateQuantity = async (id, lotsValue, unitesValue) => {
    const currentZone = zoneData[id];
    if (!currentZone) return;

    // On prend le unitParLot propre à cette zone (enregistré)
    const unitesParLotZone = currentZone.unite_par_lot || 20;

    const totalUnites =
      parseInt(lotsValue || 0) * unitesParLotZone + parseInt(unitesValue || 0);

    await set(ref(database, "zone/" + id), {
      ...currentZone,
      qte_total_unites: totalUnites,
      modifiedAt: new Date().toISOString(),
      status_stock: totalUnites > 0 ? 1 : 0,
    });
  };

  // Convertit les unités totales vers lots + unités pour affichage
  const convertirLotsEtUnites = (total, unite_par_lot = 20) => {
    const lots = Math.floor(total / unite_par_lot);
    const unites = total % unite_par_lot;
    return { lots, unites };
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Liste des zones et stocks
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white font-medium px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition-all"
        >
          + Ajouter
        </button>
      </div>

      {/* Filtre */}
      <div className="mb-4">
        <label className="mr-2 font-medium">Filtrer par zone :</label>
        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Toutes les zones</option>
          {[...new Set(zoneRefs.map(([_, z]) => z.zone))].map((z, idx) => (
            <option key={idx} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>

      {/* Tableau */}
      <table className="w-full border overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-3 text-left">Zone</th>
            <th className="border p-3 text-left">Produit</th>
            <th className="border p-3 text-left">Quantité</th>
            <th className="border p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {zoneRefs
            .filter(([_, z]) => !zoneFilter || z.zone === zoneFilter)
            .map(([uid, user]) => {
              const { lots, unites } = convertirLotsEtUnites(
                user.qte_total_unites || 0,
                user.unite_par_lot || 20
              );

              return (
                <tr key={uid}>
                  <td className="border p-2">{user.zone}</td>
                  <td className="border p-2">{user.designation_prod}</td>
                  <td className="border p-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={lots}
                        onChange={(e) =>
                          handleUpdateQuantity(uid, e.target.value, unites)
                        }
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-center"
                      />
                      <span>lots</span>
                      <input
                        type="number"
                        min={0}
                        value={unites}
                        onChange={(e) =>
                          handleUpdateQuantity(uid, lots, e.target.value)
                        }
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-center"
                      />
                      <span>unités</span>
                    </div>
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={() => handleDeleteZone(uid)}
                      className="bg-red-600 text-white font-medium px-3 py-1 rounded-lg shadow hover:bg-red-700 transition"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {/* MODAL AJOUT */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl animate-fadeInUp">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Ajouter une Zone
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddProduit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Zone</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Produit
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required
                >
                  <option value="">-- Choisir un produit --</option>
                  {produitsRefs.map(([id, prod]) => (
                    <option key={id} value={prod.designation}>
                      {prod.designation}
                    </option>
                  ))}
                </select>
              </div>

              {unitParLot > 0 && (
                <p className="text-sm text-gray-600">
                  Ce produit contient <b>{unitParLot}</b> unités par lot.
                </p>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-700 mb-1">
                    Lots
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={lots}
                    onChange={(e) => setLots(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-700 mb-1">
                    Unités
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={unites}
                    onChange={(e) => setUnites(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
