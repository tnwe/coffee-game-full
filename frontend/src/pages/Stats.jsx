import { useEffect, useState } from "react";
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
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    fetch("/api/stats/")
      .then((r) => r.json())
      .then(setStats);

    fetch("/api/games/")
      .then((r) => r.json())
      .then(setGames);
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

  const payMap = Object.fromEntries(stats.payers);
  const fetchMap = Object.fromEntries(stats.fetchers);
  const partMap = Object.fromEntries(stats.participations);

  const playerNames = Array.from(
    new Set([
      ...stats.participations.map((p) => p[0]),
      ...stats.payers.map((p) => p[0]),
      ...stats.fetchers.map((f) => f[0]),
    ])
  );

  const scoreData = playerNames.map((name) => {
    const participations = partMap[name] || 0;
    const paid = payMap[name] || 0;
    const fetched = fetchMap[name] || 0;

    return {
      name,
      joué_sans_role: Math.max(
        participations - paid - fetched,
        0
      ),
      payé: paid,
      cherché: fetched,
      participations,
      score: paid + fetched,
    };
  });

  const podium = [...scoreData]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const selectedStats = selectedPlayer
    ? scoreData.find((p) => p.name === selectedPlayer)
    : null;

  /* =======================
     RENDER
  ======================= */

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4">
      <h2 className="text-lg font-semibold mb-6">
        Statistiques
      </h2>

      {/* ===== RÉSUMÉ ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">
            Parties enregistrées
          </div>
          <div className="text-2xl font-bold">
            {totalGames}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">
            Cafés bus
          </div>
          <div className="text-2xl font-bold">
            {coffeesDrunk}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm mb-2">
            Podium
          </div>
          {podium.map((p, i) => (
            <div
              key={p.name}
              className={`flex justify-between cursor-pointer ${
                selectedPlayer === p.name
                  ? "font-bold text-blue-600"
                  : "hover:underline"
              }`}
              onClick={() => setSelectedPlayer(p.name)}
            >
              <span>
                {i + 1}. {p.name}
              </span>
              <span>{p.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== DÉTAIL JOUEUR ===== */}
      {selectedStats && (
        <div className="bg-blue-50 p-4 rounded shadow mb-8">
          <div className="flex justify-between mb-3">
            <h3 className="font-semibold">
              Détails – {selectedPlayer}
            </h3>
            <button
              className="text-sm text-blue-600"
              onClick={() => setSelectedPlayer(null)}
            >
              fermer
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              ["Parties", selectedStats.participations],
              ["Payé", selectedStats.payé],
              ["Cherché", selectedStats.cherché],
              ["Score", selectedStats.score],
            ].map(([label, value]) => (
              <div
                key={label}
                className="bg-white p-3 rounded shadow-sm"
              >
                <div className="text-gray-500 text-sm">
                  {label}
                </div>
                <div className="text-xl font-bold">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== GRAPHE ===== */}
      <div className="bg-white p-4 rounded shadow mb-8">
        <h3 className="font-semibold mb-4">
          Répartition des parties par joueur
        </h3>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={scoreData}>
            <XAxis
              dataKey="name"
              angle={-35}
              textAnchor="end"
              interval={0}
              height={70}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="joué_sans_role"
              stackId="a"
              fill="#e5e7eb"
              name="Joué"
              onClick={(d) => setSelectedPlayer(d.name)}
            />
            <Bar
              dataKey="payé"
              stackId="a"
              fill="#8b5cf6"
              name="Payé"
              onClick={(d) => setSelectedPlayer(d.name)}
            />
            <Bar
              dataKey="cherché"
              stackId="a"
              fill="#22c55e"
              name="Cherché"
              onClick={(d) => setSelectedPlayer(d.name)}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ===== HISTORIQUE ===== */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-4">
          Historique des parties
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full text-sm">
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
                const isDoublette =
                  g.payer?.id &&
                  g.fetcher?.id &&
                  g.payer.id === g.fetcher.id;

                const isHighlighted =
                  selectedPlayer &&
                  g.players?.some(
                    (p) => p.name === selectedPlayer
                  );

                return (
                  <tr
                    key={g.id}
                    className={`border-b ${
                      isDoublette ? "bg-yellow-50" : ""
                    } ${
                      selectedPlayer
                        ? isHighlighted
                          ? "bg-blue-100"
                          : "opacity-40"
                        : ""
                    }`}
                  >
                    <td className="p-2">{g.date}</td>

                    <td className="p-2">
                      {g.players
                        ?.map((p) => p.name)
                        .join(", ") || "-"}
                    </td>

                    <td className="p-2 text-center">
                      {g.payer?.name || "-"}
                    </td>

                    <td className="p-2 text-center">
                      {g.fetcher?.name || "-"}
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
    </div>
  );
}
