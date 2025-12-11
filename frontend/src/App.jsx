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
        <div className="flex gap-3 mb-4">
          <button className={`px-3 py-2 rounded ${view==="new" ? "bg-coffee text-white" : "bg-white"}`} onClick={()=>setView("new")}>Nouvelle partie</button>
          <button className={`px-3 py-2 rounded ${view==="stats" ? "bg-coffee text-white" : "bg-white"}`} onClick={()=>setView("stats")}>Statistiques</button>
        </div>

        {view === "new" ? <NewGame /> : <Stats />}
      </div>
    </div>
  );
}
