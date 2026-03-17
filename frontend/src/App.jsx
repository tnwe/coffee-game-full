import Navbar from "./components/Navbar";
import NewGame from "./pages/NewGame";
import Stats from "./pages/Stats";
import { useState } from "react";

export default function App() {
  const [view, setView] = useState("new");

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            className={`w-full sm:w-auto px-3 py-2 rounded transition-all duration-300 ${
              view === "new" ? "bg-coffee text-white shadow-lg" : "bg-white hover:bg-gray-50"
            }`}
            onClick={() => setView("new")}
          >
            Nouvelle partie
          </button>
          <button
            className={`w-full sm:w-auto px-3 py-2 rounded transition-all duration-300 ${
              view === "stats" ? "bg-coffee text-white shadow-lg" : "bg-white hover:bg-gray-50"
            }`}
            onClick={() => setView("stats")}
          >
            Statistiques
          </button>
        </div>

        <div className="transition-opacity duration-500 ease-in-out">
          {view === "new" ? <NewGame /> : <Stats />}
        </div>
      </div>
    </div>
  );
}
