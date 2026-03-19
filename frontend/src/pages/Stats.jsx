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

let hasAnimatedOnce = false;

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [showAllPodium, setShowAllPodium] = useState(false);
  const [reversePodium, setReversePodium] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [playerFilter, setPlayerFilter] = useState("");
  const [showExtendedScores, setShowExtendedScores] = useState(false);

  // Composant pour animer les compteurs
  function AnimatedCounter({ value, duration = 1000, decimals = 0 }) {
  const [count, setCount] = useState(hasAnimatedOnce ? value : 0);
  const elementRef = useRef();

  useEffect(() => {
    // ✅ Si déjà animé → afficher direct sans animation
    if (hasAnimatedOnce) {
      setCount(value);
      return;
    }

    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          hasAnimatedOnce = true; // 🔥 on bloque pour toute la page

          let start = 0;
          const end = parseFloat(value);
          const increment = end / (duration / 16);

          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(start);
            }
          }, 16);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={elementRef} className="animate-count-up">
      {Number(count).toFixed(decimals)}
    </span>
  );
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

    const renderNameRaw = (name) => {
    return name;
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
            <AnimatedCounter value={totalGames} decimals={0} />
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow animate-slide-in-up">
          <div className="text-gray-500 text-sm">
            Cafés bus
          </div>
          <div className="text-2xl font-bold">
            <AnimatedCounter value={coffeesDrunk} decimals={0} />
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
                  <AnimatedCounter value={p.cafesPayes} duration={800} decimals={0} />
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">
            Score normé par nombre de parties jouées
          </h3>
          <button
            onClick={() => setShowExtendedScores(!showExtendedScores)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          >
            {showExtendedScores ? "Réduire" : "Étendre"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Participant</th>
                {showExtendedScores && (
                  <>
                    <th className="p-2 text-center">Parties jouées</th>
                    <th className="p-2 text-center">Score brut</th>
                  </>
                )}
                <th className="p-2 text-center">Score normé</th>
              </tr>
            </thead>
            <tbody>
              {normalizedRanking.map((player) => (
                <tr key={player.name} className="border-b">
                  <td className="p-2 font-medium">{player.name}</td>
                  {showExtendedScores && (
                    <>
                      <td className="p-2 text-center">{player.participations}</td>
                      <td className="p-2 text-center">{player.score}</td>
                    </>
                  )}
                  <td className="p-2 text-center font-semibold">
                    <AnimatedCounter value={player.scoreNorme} duration={800} decimals={2} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== GRAPHE ===== */}
      <div className="bg-white p-4 rounded shadow mb-8 animate-slide-in-up">
        <h3 className="font-semibold mb-4">
          Répartition des parties par joueur
        </h3>

        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={sortedScoreData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: -15, bottom: 5 }}
          >
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey="name"
              width={yAxisWidth}
              interval={0}
              tick={{ fontSize: 14 }}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey="participé sans payer ni chercher" stackId="a" fill="#050505" stroke="#cbd5e1" strokeWidth={1} />
            <Bar dataKey="payé" stackId="a" fill="#2563eb" />
            <Bar dataKey="cherché" stackId="a" fill="#e61010" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ===== HISTORIQUE ===== */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-4">
          Historique des parties
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
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
      Array.isArray(g.participants) && g.participants.length > 0
        ? g.participants
            .map((id) => renderNameRaw(idToName[id] || `#${id}`))
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

        <td className="p-2">
          {participants}
        </td>

        <td className="p-2 text-center">
          {renderNameRaw(g.payer_name) || "-"}
        </td>

        <td className="p-2 text-center">
          {renderNameRaw(g.fetcher_name) || "-"}
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
