import { useEffect, useRef, useState } from "react";
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
  const [showAllPodium, setShowAllPodium] = useState(false);
  const [reversePodium, setReversePodium] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [playerFilter, setPlayerFilter] = useState("");

  // Composant pour animer les compteurs
  function AnimatedCounter({ value, duration = 1000 }) {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const elementRef = useRef();

    useEffect(() => {
      if (!hasAnimated && elementRef.current) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              setHasAnimated(true);
              let start = 0;
              const end = parseInt(value);
              const increment = end / (duration / 16);
              const timer = setInterval(() => {
                start += increment;
                if (start >= end) {
                  setCount(end);
                  clearInterval(timer);
                } else {
                  setCount(Math.floor(start));
                }
              }, 16);
            }
          },
          { threshold: 0.1 }
        );
        observer.observe(elementRef.current);
        return () => observer.disconnect();
      }
    }, [value, duration, hasAnimated]);

    return <span ref={elementRef} className="animate-count-up">{count}</span>;
  }

  useEffect(() => {
    fetch("/api/stats/")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);

    fetch("/api/games/")
      .then((r) => r.json())
      .then(setGames)
      .catch(console.error);

    fetch("/api/players/")
      .then((r) => r.json())
      .then(setPlayers)
      .catch(console.error);
  }, []);

  if (!stats) {
    return <div className="p-4">Chargement…</div>;
  }

  /* =======================
     HELPERS
  ======================= */

  const idToName = {};
  players.forEach((p) => {
    idToName[p.id] = p.name;
  });

  const resolveName = (v) => {
    if (!v) return "-";
    if (typeof v === "object" && v.name) return v.name;
    if (typeof v === "number") return idToName[v] || `#${v}`;
    return String(v);
  };

  const renderName = (name) => {
    return name === "Experto" ? `${name} 👑` : name;
  };

  /* =======================
     STATS CALCULATIONS
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
    const score = paid + fetched;
    const normalizedScore = participations > 0 ? score / participations : 0;

    return {
      name: renderName(name),
      "participé sans payer ni chercher": Math.max(participations - paid - fetched, 0),
      payé: paid,
      cherché: fetched,
      participations,
      score,
      scoreNorme: normalizedScore,
    };
  });


  const paidCoffeesMap = {};
  games.forEach((g) => {
    const participantCount = Array.isArray(g.participants)
      ? g.participants.length
      : 0;
    const payerName = g.payer_name || resolveName(g.payer_id);

    if (!payerName || payerName === "-" || participantCount === 0) {
      return;
    }

    paidCoffeesMap[payerName] = (paidCoffeesMap[payerName] || 0) + participantCount;
  });

  const podiumData = playerNames
    .map((name) => ({
      name: renderName(name),
      cafesPayes: paidCoffeesMap[name] || 0,
    }))
    .sort((a, b) => {
      const cmp = reversePodium ? a.cafesPayes - b.cafesPayes : b.cafesPayes - a.cafesPayes;
      if (cmp !== 0) return cmp;
      return a.name.localeCompare(b.name);
    });

    const sortedScoreData = [...scoreData].sort((a, b) => {
    const totalA = a.payé + a.cherché;
    const totalB = b.payé + b.cherché;

    if (totalB !== totalA) {
      return totalB - totalA;
    }

    return a.name.localeCompare(b.name);
  });

  const chartHeight = Math.max(340, sortedScoreData.length * 52);
  const yAxisWidth = Math.min(
    240,
    Math.max(
      130,
      ...sortedScoreData.map((p) => (p.name ? p.name.length * 8 : 130))
    )
  );

  const normalizedRanking = scoreData
    .filter((player) => player.participations > 0)
    .sort((a, b) => {
    if (b.scoreNorme !== a.scoreNorme) {
      return b.scoreNorme - a.scoreNorme;
    }
    if (b.participations !== a.participations) {
      return b.participations - a.participations;
    }
    return a.name.localeCompare(b.name);
    });

  const filteredGames = games.filter((g) => {
    const matchesDate = !dateFilter || g.date.includes(dateFilter);
    const matchesPlayer = !playerFilter || 
      (g.payer_name && g.payer_name.toLowerCase().includes(playerFilter.toLowerCase())) ||
      (g.fetcher_name && g.fetcher_name.toLowerCase().includes(playerFilter.toLowerCase())) ||
      (g.participants && g.participants.some(id => {
        const name = idToName[id];
        return name && name.toLowerCase().includes(playerFilter.toLowerCase());
      }));
    return matchesDate && matchesPlayer;
  });

  /* =======================
     RENDER
  ======================= */

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4">
      <h2 className="text-lg font-semibold mb-6">Statistiques</h2>

      {/* ===== RÉSUMÉ ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow animate-slide-in-up">
          <div className="text-gray-500 text-sm">
            Parties enregistrées
          </div>
          <div className="text-2xl font-bold">
            <AnimatedCounter value={totalGames} />
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow animate-slide-in-up">
          <div className="text-gray-500 text-sm">
            Cafés bus
          </div>
          <div className="text-2xl font-bold">
            <AnimatedCounter value={coffeesDrunk} />
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow animate-slide-in-up">
          <div className="text-gray-500 text-sm mb-2">
            Podium : nombre de cafés payés
          </div>
          {podiumData
            .slice(0, showAllPodium ? podiumData.length : 3)
            .map((p, i) => (
              <div key={p.name} className="flex justify-between animate-slide-in-up" style={{animationDelay: `${i * 0.1}s`}}>
                <span>
                  {i + 1}. {p.name}
                </span>
                <span className="font-semibold">
                  <AnimatedCounter value={p.cafesPayes} duration={800} />
                </span>
              </div>
            ))}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setShowAllPodium(!showAllPodium)}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors duration-200"
            >
              {showAllPodium ? "Afficher moins" : "Afficher plus"}
            </button>
            <button
              onClick={() => setReversePodium(!reversePodium)}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors duration-200"
            >
              {reversePodium ? "Classement normal" : "Inverser le classement"}
            </button>
          </div>
        </div>
      </div>

      {/* ===== SCORES NORMÉS ===== */}
      <div className="bg-white p-4 rounded shadow mb-8 animate-slide-in-up">
        <h3 className="font-semibold mb-4">
          Score normé par nombre de parties jouées
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Participant</th>
                <th className="p-2 text-center hidden sm:table-cell">Parties jouées</th>
                <th className="p-2 text-center hidden md:table-cell">Score brut</th>
                <th className="p-2 text-center">Score normé</th>
              </tr>
            </thead>
            <tbody>
              {normalizedRanking.map((player) => (
                <tr key={player.name} className="border-b">
                  <td className="p-2 font-medium">{player.name}</td>
                  <td className="p-2 text-center hidden sm:table-cell">{player.participations}</td>
                  <td className="p-2 text-center hidden md:table-cell">{player.score}</td>
                  <td className="p-2 text-center font-semibold">
                    <AnimatedCounter value={Math.round(player.scoreNorme * 100) / 100} duration={800} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== STATISTIQUES AVANCÉES ===== */}
      <div className="bg-white p-4 rounded shadow mb-8 animate-slide-in-up">
        <h3 className="font-semibold mb-4">
          Évolution temporelle
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique des parties par jour */}
          <div>
            <h4 className="text-sm font-medium mb-2">Parties par jour de la semaine</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  { day: 'Lundi', count: games.filter(g => new Date(g.date).getDay() === 1).length },
                  { day: 'Mardi', count: games.filter(g => new Date(g.date).getDay() === 2).length },
                  { day: 'Mercredi', count: games.filter(g => new Date(g.date).getDay() === 3).length },
                  { day: 'Jeudi', count: games.filter(g => new Date(g.date).getDay() === 4).length },
                  { day: 'Vendredi', count: games.filter(g => new Date(g.date).getDay() === 5).length },
                  { day: 'Samedi', count: games.filter(g => new Date(g.date).getDay() === 6).length },
                  { day: 'Dimanche', count: games.filter(g => new Date(g.date).getDay() === 0).length },
                ]}
                margin={{ top: 5, right: 20, left: -15, bottom: 5 }}
              >
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top joueurs du mois */}
          <div>
            <h4 className="text-sm font-medium mb-2">Top joueurs du mois dernier</h4>
            <div className="space-y-2">
              {playerNames
                .map(name => ({
                  name,
                  monthlyGames: games.filter(g => {
                    const gameDate = new Date(g.date);
                    const lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    return gameDate >= lastMonth && (
                      g.payer_name === name || 
                      g.fetcher_name === name || 
                      (g.participants && g.participants.some(id => idToName[id] === name))
                    );
                  }).length
                }))
                .filter(p => p.monthlyGames > 0)
                .sort((a, b) => b.monthlyGames - a.monthlyGames)
                .slice(0, 5)
                .map((player, i) => (
                  <div key={player.name} className="flex justify-between items-center animate-slide-in-up" style={{animationDelay: `${i * 0.1}s`}}>
                    <span className="flex items-center">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">
                        {i + 1}
                      </span>
                      {renderName(player.name)}
                    </span>
                    <span className="font-semibold">
                      <AnimatedCounter value={player.monthlyGames} duration={600} />
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== HISTORIQUE ===== */}
      <div className="bg-white p-4 rounded shadow animate-slide-in-up">
        <h3 className="font-semibold mb-4">
          Historique des parties
        </h3>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrer par joueur
            </label>
            <input
              type="text"
              value={playerFilter}
              onChange={(e) => setPlayerFilter(e.target.value)}
              placeholder="Nom du joueur..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrer par date
            </label>
            <input
              type="text"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="AAAA-MM-JJ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(playerFilter || dateFilter) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setPlayerFilter("");
                  setDateFilter("");
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
              >
                Effacer
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left hidden sm:table-cell">Participants</th>
                <th className="p-2 text-center">Payé</th>
                <th className="p-2 text-center hidden md:table-cell">Cherché</th>
              </tr>
            </thead>
<tbody>
  {filteredGames.map((g) => {
    const participants =
      Array.isArray(g.participants) && g.participants.length > 0
        ? g.participants
            .map((id) => renderName(idToName[id] || `#${id}`))
            .join(", ")
        : "-";

    const isDoublette =
      g.payer_id && g.fetcher_id && g.payer_id === g.fetcher_id;

    return (
      <tr
        key={g.id}
        className={`border-b ${
          isDoublette ? "bg-yellow-50" : ""
        }`}
      >
        <td className="p-2">{g.date}</td>

        <td className="p-2 hidden sm:table-cell">
          {participants}
        </td>

        <td className="p-2 text-center">
          {renderName(g.payer_name) || "-"}
        </td>

        <td className="p-2 text-center hidden md:table-cell">
          {renderName(g.fetcher_name) || "-"}
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
