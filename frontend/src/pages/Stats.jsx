import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function Stats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("/api/stats/")
      .then(r => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <div className="p-4">Chargement…</div>;

  /* =======================
     CALCULS
  ======================= */

  const totalGames = stats.total_games;

  const coffeesDrunk = stats.participations.reduce(
    (sum, [, count]) => sum + count,
    0
  );

  // map name -> counts
  const payMap = Object.fromEntries(stats.payers);
  const fetchMap = Object.fromEntries(stats.fetchers);

  const players = Array.from(
    new Set([
      ...stats.payers.map(p => p[0]),
      ...stats.fetchers.map(f => f[0]),
      ...stats.participations.map(p => p[0])
    ])
  );

  const scoreData = players.map(name => {
    const paid = payMap[name] || 0;
    const fetched = fetchMap[name] || 0;
    return {
      name,
      payé: paid,
      cherché: fetched,
      score: paid + fetched
    };
  });

  const podium = [...scoreData]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  /* =======================
     RENDER
  ======================= */

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-lg font-semibold mb-6">Statistiques</h2>

      {/* ===== RÉSUMÉ ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">Parties enregistrées</div>
          <div className="text-2xl font-bold">{totalGames}</div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">Cafés bus</div>
          <div className="text-2xl font-bold">{coffeesDrunk}</div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm mb-2">Podium</div>
          {podium.map((p, i) => (
            <div key={p.name} className="flex justify-between">
              <span>{i + 1}. {p.name}</span>
              <span className="font-semibold">{p.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== GRAPHE SCORE ===== */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-4">Score par joueur</h3>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={scoreData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="payé" stackId="a" fill="#8b5cf6" />
            <Bar dataKey="cherché" stackId="a" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>

{/* ===== HISTORIQUE ===== */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-4">Historique des parties</h3>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Date</th>
              <th className="p-2">Participants</th>
              <th className="p-2">Payé</th>
              <th className="p-2">Cherché</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.id} className="border-b">
                <td className="p-2">{g.date}</td>
                <td className="p-2 text-center">
                  {g.players?.length || 0}
                </td>
                <td className="p-2 text-center">
                  {players.find((p) => p.id === g.payer)?.name || "-"}
                </td>
                <td className="p-2 text-center">
                  {players.find((p) => p.id === g.fetcher)?.name || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
