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
      ...stats.payers.map((p) => p[0]),
      ...stats.fetchers.map((f) => f[0]),
      ...stats.participations.map((p) => p[0]),
    ])
  );

  const scoreData = playerNames.map((name) => {
    const paid = payMap[name] || 0;
    const fetched = fetchMap[name] || 0;
    return {
      name,
      payé: paid,
      cherché: fetched,
      score: paid + fetched,
    };
  });

  const podium = [...scoreData]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const selectedStats = selectedPlayer
    ? {
        participations: partMap[selectedPlayer] || 0,
        payé: payMap[selectedPlayer] || 0,
        cherché: fetchMap[selectedPlayer] || 0,
        score:
          (payMap[selectedPlayer] || 0) +
          (fetchMap[selectedPlayer] || 0),
      }
    : null;

  /* =======================
     RENDER
  ======================= */

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4">
      <h2 className="text-lg font-semibold mb-4 sm:mb-6">
        Statistiques
      </h2>

      {/* ===== RÉSUMÉ ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white p-3 sm:p-4 rounded shadow">
          <div className="text-gray-500 text-xs sm:text-sm">
            Parties enregistrées
          </div>
          <div className="text-xl sm:text-2xl font-bold">
            {totalGames}
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded shadow">
          <div className="text-gray-500 text-xs sm:text-sm">
            Cafés bus
          </div>
          <div className="text-xl sm:text-2xl font-bold">
            {coffeesDrunk}
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded shadow">
          <div className="text-gray-500 text-xs sm:text-sm mb-2">
            Podium
          </div>
          {podium.map((p, i) => (
            <div
              key={p.name}
              className={`flex justify-between py-1 cursor-pointer text-sm sm:text-base transition ${
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
        <div className="bg-blue-50 p-3 sm:p-4 rounded shadow mb-6 sm:mb-8 transition-all">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm sm:text-base">
              Détails – {selectedPlayer}
            </h3>
            <button
              className="text-xs sm:text-sm text-blue-600"
              onClick={() => setSelectedPlayer(null)}
            >
              fermer
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-center">
            {[
              ["Participations", selectedStats.participations],
              ["Payé", selectedStats.payé],
              ["Cherché", selectedStats.cherché],
              ["Score", selectedStats.score],
            ].map(([label, value]) => (
              <div
                key={label}
                className="bg-white p-3 rounded shadow-sm"
              >
                <div className="text-gray-500 text-xs sm:text-sm">
                  {label}
                </div>
                <div className="text-lg sm:text-xl font-bold">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== GRAPHE SCORE ===== */}
      <div className="bg-white p-3 sm:p-4 rounded shadow mb-6 sm:mb-8">
        <h3 className="font-semibold mb-3 text-sm sm:text-base">
          Score par joueur
        </h3>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={scoreData}>
            <XAxis
              dataKey="name"
              angle={-35}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis />
            <Tooltip />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
            />
            <Bar
              dataKey="payé"
              stackId="a"
              fill="#8b5cf6"
              opacity={(d) =>
                !selectedPlayer || d.name === selectedPlayer ? 1 : 0.25
              }
              onClick={(d) => setSelectedPlayer(d.name)}
            />
            <Bar
              dataKey="cherché"
              stackId="a"
              fill="#22c55e"
              opacity={(d) =>
                !selectedPlayer || d.name === selectedPlayer ? 1 : 0.25
              }
              onClick={(d) => setSelectedPlayer(d.name)}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ===== HISTORIQUE ===== */}
      <div className="bg-white p-3 sm:p-4 rounded shadow">
        <h3 className="font-semibold mb-3 text-sm sm:text-base">
          Historique des parties
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-[500px] w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Date</th>
                <th className="p-2">Participants</th>
                <th className="p-2">Payé</th>
                <th className="p-2">Cherché</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => {
                const isDoublette =
                  g.payer?.id && g.payer.id === g.fetcher?.id;

                const isSelected =
                  selectedPlayer &&
                  (g.payer?.name === selectedPlayer ||
                    g.fetcher?.name === selectedPlayer);

                return (
                  <tr
                    key={g.id}
                    className={`border-b ${
                      isDoublette ? "bg-yellow-50" : ""
                    } ${
                      selectedPlayer
                        ? isSelected
                          ? "bg-blue-100"
                          : "opacity-40"
                        : ""
                    }`}
                  >
                    <td className="p-2">{g.date}</td>
                    <td className="p-2 text-center">
                      {g.players?.length || 0}
                    </td>
                    <td className="p-2 text-center">
                      {g.payer?.name || "-"}
                    </td>
                    <td className="p-2 text-center">
                      {g.fetcher?.name || "-"}
                      {isDoublette && (
                        <span className="ml-1 text-[10px] bg-yellow-300 px-1.5 py-0.5 rounded">
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
