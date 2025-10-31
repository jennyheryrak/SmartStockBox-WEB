"use client"

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";


export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess("");
        setError("");
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            setSuccess("Connecté");
            const token = await user.getIdToken();

            // Stocker dans un cookie ici

            // rediriger vers dashboard
            router.push("/dashboard/mouvement");

        } catch (err) {
            console.error(err);
            switch (err.code) {
                case "auth/invalid-credential":
                    setError("Adresse e-mail ou mot de passe invalide.");
                    break;
                case "auth/user-disabled":
                    setError("Compte désactivé.");
                    break;
                case "auth/user-not-found":
                    setError("Aucun utilisateur trouvé avec cet e-mail.");
                    break;
                case "auth/wrong-password":
                    setError("Mot de passe incorrect.");
                    break;
                default:
                    setError("Erreur inconnue, réessayez.");
            }
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="min-h-screen flex justify-center bg-gray-100">
            <form onSubmit={handleLogin} className="p-8 w-full md:w-1/2 lg:w-1/3 mt-10">
                <div className="mb-5">
                    <label className="block text-gray-700 mb-1">E-mail</label>
                    <input
                        className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none text-gray-700 focus:ring-2 focus:ring-blue-400"
                        type="email"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-5">
                    <label className="block text-gray-700 mb-1">Mot de passe</label>
                    <input
                        className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none text-gray-700 focus:ring-2 focus:ring-blue-400"
                        type="password"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-4">
                    <input
                        type="checkbox"
                    />&nbsp;Afficher mot de passe
                </div>
                <div className="mb-5">
                    <button
                        type="submit"
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        {loading ? "En attente..." : "Se connecter"}
                    </button>
                </div>

                {error && (
                    <p className="text-red-500 mb-4 font-medium">{error}</p>
                )}
                {success && (
                    <p className="text-green-500 mb-4 font-medium">{success}</p>
                )}
            </form>
        </div>
    );
}