"use client";

import { useEffect, useState } from "react";
import { ref, set, onValue, remove, push } from "firebase/database";
import { database } from "@/lib/firebaseConfig";

export default function Settings() {
    const [showModal, setShowModal] = useState(false);
    const [isUpdate, setIsUpdate] = useState(false); // ajout vs update
    const [currentUid, setCurrentUid] = useState("");

    const [designation, setDesignation] = useState("");
    const [poidsU, setPoidsU] = useState(0);
    const [qteLot, setQteLot] = useState(0);
    const [poidsT, setPoidsT] = useState(0);
    const [produits, setProduits] = useState({});

    useEffect(() => {
        const produitsRefs = ref(database, "produits");
        const unsubscribe = onValue(produitsRefs, (snapshot) => {
            setProduits(snapshot.val() || {});
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const total = parseFloat(poidsU || 0) * parseFloat(qteLot || 0);
        setPoidsT(total.toFixed(2));
    }, [poidsU, qteLot]);

    const produitsRefs = Object.entries(produits);

    const openAddModal = () => {
        setIsUpdate(false);
        setCurrentUid("");
        setDesignation("");
        setPoidsU(0);
        setQteLot(0);
        setPoidsT(0);
        setShowModal(true);
    };

    const openUpdateModal = (uid, produit) => {
        setIsUpdate(true);
        setCurrentUid(uid);
        setDesignation(produit.designation);
        setPoidsU(produit.poids_unitaire);
        setQteLot(produit.qte_par_lot);
        setPoidsT(produit.poids_total);
        setShowModal(true);
    };

    const handleSubmitProduit = async (e) => {
        e.preventDefault();
        try {
            const uid_client = "1FEvCO3AMPUXBEHXkW5O73pkw9h2";
            if (isUpdate) {
                // Update produit existant
                await set(ref(database, "produits/" + currentUid), {
                    designation,
                    poids_unitaire: poidsU,
                    poids_total: poidsT,
                    qte_par_lot: qteLot,
                    ref_client: uid_client,
                    createdAt: produits[currentUid]?.createdAt || new Date().toISOString(),
                });
                alert("Produit mis à jour !");
            } else {
                // Ajout nouveau produit
                await set(push(ref(database, "produits/")), {
                    designation,
                    poids_unitaire: poidsU,
                    poids_total: poidsT,
                    qte_par_lot: qteLot,
                    ref_client: uid_client,
                    createdAt: new Date().toISOString(),
                });
                alert("Produit ajouté !");
            }
            setShowModal(false);
            setDesignation("");
            setPoidsU(0);
            setQteLot(0);
            setPoidsT(0);
            setCurrentUid("");
        } catch (error) {
            alert("❌ Erreur : " + error.message);
        }
    };

    const handleDeleteProduit = async (id) => {
        if (confirm("Supprimer ce produit ?")) {
            await remove(ref(database, "produits/" + id));
            alert("Produit supprimé !");
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Liste des produits</h2>
                <button
                    onClick={openAddModal}
                    className="bg-blue-600 text-white font-medium px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition-all"
                >
                    + Ajouter
                </button>
            </div>

            {/* Tableau */}
            <table className="w-full border overflow-hidden">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-3 text-left">Date de création</th>
                        <th className="border p-3 text-left">Désignation</th>
                        <th className="border p-3 text-left">Poids unitaire</th>
                        <th className="border p-3 text-left">Quantité par lot</th>
                        <th className="border p-3 text-left">Poids total</th>
                        <th className="border p-3 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {produitsRefs.map(([uid, user]) => (
                        <tr key={uid}>
                            <td className="border p-2">
                                {user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
                            </td>
                            <td className="border p-2">{user.designation}</td>
                            <td className="border p-2">{user.poids_unitaire}</td>
                            <td className="border p-2">{user.qte_par_lot}</td>
                            <td className="border p-2">{user.poids_total}</td>
                            <td className="border p-2 flex gap-2">
                                <button
                                    onClick={() => openUpdateModal(uid, user)}
                                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                                >
                                    Modifier
                                </button>
                                <button
                                    onClick={() => handleDeleteProduit(uid)}
                                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                >
                                    Supprimer
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl animate-fadeInUp">
                        <div className="flex justify-between items-center border-b p-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {isUpdate ? "Modifier produit" : "Ajouter produit"}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmitProduit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Désignation</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    value={designation}
                                    onChange={(e) => setDesignation(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Poids unitaire</label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    value={poidsU}
                                    onChange={(e) => setPoidsU(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Quantité par lot</label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    value={qteLot}
                                    onChange={(e) => setQteLot(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Poids total</label>
                                <input
                                    type="text"
                                    readOnly
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    value={poidsT}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 shadow transition"
                                >
                                    {isUpdate ? "Mettre à jour" : "Enregistrer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}
