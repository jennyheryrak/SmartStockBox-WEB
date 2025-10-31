"use client";

import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, database } from "@/lib/firebaseConfig";
import { ref, set, onValue, remove } from "firebase/database";

export default function UsersPage() {
    const [showModal, setShowModal] = useState(false);
    const [email, setEmail] = useState("");
    const [uidDel, setUidDel] = useState("");
    const [users, setUsers] = useState({});
    useEffect(() => {
        const usersRef = ref(database, "users"); // chemin dans ta Realtime DB
        const unsubscribe = onValue(usersRef, (snapshot) => {
            setUsers(snapshot.val() || {});
        });

        return () => unsubscribe();
    }, []);

    const userEntries = Object.entries(users);

    

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, "123456789");
            const user = userCredential.user;
            setShowModal(false);
            await set(ref(database, "users/" + user.uid), {
                email: email,
                role: 'user',
                createdAt: new Date().toISOString(),
            })
            setEmail("");
        } catch (error) {
            alert("❌ Erreur : " + error.message);
        }
    };

    const handleDelete = async () => {
        const userRef = ref(database, "users/" + uidDel);
        remove(userRef);
        setUidDel("");
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            {/* Header avec bouton */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                    Liste des utilisateurs
                </h2>
                <button
                    onClick={() => setShowModal(true)}
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
                        <th className="border p-3 text-left">E-mail</th>
                        <th className="border p-3 text-left">Rôle</th>
                        <th className="border p-3 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {userEntries.map(([uid, user]) => (
                        <tr key={uid}>
                            <td className="border p-2">
                                {user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
                            </td>
                            <td className="border p-2">{user.email}</td>
                            <td className="border p-2">{user.role || "Utilisateur"}</td>
                            <td className="border p-2">
                                <button onClick={() => {
                                    setUidDel(uid);
                                    handleDelete();
                                }} className="bg-red-600 text-white font-medium px-5 py-2 rounded-lg shadow hover:bg-red-700 transition-all">Supprimer</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* MODAL style Bootstrap */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl animate-fadeInUp">
                        {/* Header */}
                        <div className="flex justify-between items-center border-b p-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Ajouter un utilisateur
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleAddUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">
                                    Adresse e-mail
                                </label>
                                <input
                                    type="email"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Footer */}
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
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Animation CSS */}
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
