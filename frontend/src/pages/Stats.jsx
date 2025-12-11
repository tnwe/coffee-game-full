import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend);

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [games, setGames] = useState([]);

  useEffect(() => {
    fetch("/api/stats").then(r=>r.json()).then(setStats);
    fetch("/api/games").then(r=>r.json()).then(setGames);
  }, []);

  if (!stats) return <div className="p-4">Loading...</div>;

  const payersLabels = stats.payers.map(p => p[0]);
  const payersData = stats.payers.map(p => p[1]);

  const dblLabels = stats.doublettes_by_player.map(d => d[0]);
  const dblData = stats.doublettes_by_player.map(d => d[1]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold">Résumé</h2>
        <p>Total parties : {stats.total_games}</p>
        <p>Doublettes totales : {stats.total_doublettes}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Paiements par personne</h3>
          <Bar data={{
            labels: payersLabels,
            datasets: [{ label: "Paiements", data: payersData, backgroundColor: "#6F4E37" }]
          }} />
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Doublettes par personne</h3>
          <Doughnut data={{
            labels: dblLabels,
            datasets: [{ data: dblData, backgroundColor: ["#6F4E37", "#C4A484", "#D9B99B", "#8C6B4B"] }]
          }} />
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Historique</h3>
        <ul className="space-y-2">
          {games.map(g => (
            <li key={g.id} className="p-2 border rounded">
              <strong>{g.date}</strong> — payé : <b>{g.payer_name}</b>, fetch : <b>{g.fetcher_name}</b>
              {g.payer_id === g.fetcher_id && <span className="ml-3 inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Doublette</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
