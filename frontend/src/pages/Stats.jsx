import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    fetch("/api/stats/")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));

    fetch("/api/games/")
      .then((r) => r.json())
      .then(setGames)
      .catch(() => setGames([]));

    fetch("/api/players/")
      .then((r) => r.json())
      .then(setPlayers)
      .catch(() => setPlayers([]));
  }, []);

  if (!stats) return <div className="p-4">Chargement…</div>;

  /* =======================
     HELPERS
  ======================= */

  const safeArray = (v) => (Array.isArray(v) ? v : []);

  /* =======================
     MAP ID → NAME
  ======================= */

  const idToName = useMemo(() => {
    const map = {};
    players.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [players]);

  const resolveName = (v) => {
    if (!v) return "-";
    if (typeof v === "object" && v.name) return v.name;
    if (typeof v === "number") return idToName[v] || `#${v}`;
    return String(v);
  };

  /* =======================
     CALCULS
  ======================= */

  const participationsArr = safeArray(stats.participations);
  const payersArr = safeArray(stats.payers);
  const fetchersArr = safeArray(stats.fetchers);

  const totalGames = stats.total_games || 0;

  const coffeesDrunk = participationsArr.reduce(
    (sum, [, count]) => sum + count,
    0
  );

  const payMap = Object.fromEntries(payersArr);
  const fetchMap = Object.fromEntries(fetchersArr);
  const partMap = Object.fromEntries(participationsArr);

  const playerNames = Array.from(
    new Set([
      ...participationsArr.map((p) => p[0]),
      ...payersArr.map((p) => p[0]),
      ...fetchersArr.map((f) => f[0]),
    ])
  );

  const scoreData = playerNames.map((name) => {
    const participations = partMap[name] || 0;
    const paid = payMap[name] || 0;
    const fetched = fetchMap[name] || 0;

    return {
      name,
      joué: Math.max(participations - paid - fetched, 0),
      payé: paid,
      cherché: fetched,
      score: paid + fetched,
    };
  });

  /* =======================
     RENDER
  ======================= */

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-lg font-semibold mb-6">Statistiques</h2>

      {/* ===== RÉSUMÉ ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">
            Parties enregistrées
          </div>
          <div className="text-2xl font-bold">{totalGames}</div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">
            Cafés bus
          </div>
          <div className="text-2xl font-bold">{coffeesDrunk}</div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm mb-2">Podium</div>
          {[...scoreData]
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((p, i) => (
              <div key={p.name} className="flex justify-between">
                <span>{i + 1}. {p.name}</span>
                <span className="font-semibold">{p.score}</span>
              </div>
            ))}
        </div>
      </div>

      {/* ===== GRAPHE ===== */}
      <div className="bg-white p-4 rounded shadow mb-8">
        <h3 className="font-semibold mb-4">
          Répartition des parties par joueur
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scoreData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="joué" stackId="a" fill="#e5e7eb" />
            <Bar dataKey="payé" stackId="a" fill="#8b5cf6" />
            <Bar dataKey="cherché" stackId="a" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ===== HISTORIQUE ===== */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-4">
          Historique des parties
        </h3>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Participants</th>
              <th className="p-2 text-center">Payé</th>
              <th className="p-2 text-center">Cherché</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => {
              const participants =
                Array.isArray(g.players)
                  ? g.players.map(resolveName).join(", ")
                  : "-";

              const isDoublette =
                g.payer && g.fetcher && g.payer === g.fetcher;

              return (
                <tr
                  key={g.id}
                  className={`border-b ${
                    isDoublette ? "bg-yellow-50" : ""
                  }`}
                >
                  <td className="p-2">{g.date}</td>
                  <td className="p-2">{participants}</td>
                  <td className="p-2 text-center">
                    {resolveName(g.payer)}
                  </td>
                  <td className="p-2 text-center">
                    {resolveName(g.fetcher)}
                    {isDoublette && (
                      <span className="ml-2 text-xs bg-yellow-300 px-2 py-0.5 rounded">
                        Doublette
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
