import { useEffect, useRef, useState } from "react";

/* =======================
   DRAW HOOK
======================= */
function useDraw(participants, renderName, onFinish) {
  const [running, setRunning] = useState(false);
  const [name, setName] = useState("???");
  const [isSlowing, setIsSlowing] = useState(false);
  const [winnerSelected, setWinnerSelected] = useState(false);

  const timer = useRef(null);
  const index = useRef(0);
  const speed = useRef(60);
  const slowing = useRef(false);

  function clear() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  function tick() {
    if (!participants.length) return;
    index.current = (index.current + 1) % participants.length;
    setName(renderName(participants[index.current].name));
  }

  function start() {
    if (!participants.length) return;
    clear();
    slowing.current = false;
    speed.current = 60;
    setRunning(true);
    setIsSlowing(false);
    setWinnerSelected(false);

    const loop = () => {
      tick();
      timer.current = setTimeout(loop, speed.current);
    };
    loop();
  }

  function stop() {
    if (!running) return;
    slowing.current = true;
    setIsSlowing(true);
    clear();

    const slow = () => {
      tick();
      speed.current += 40;
      if (speed.current < 500) {
        timer.current = setTimeout(slow, speed.current);
      } else {
        clear();
        setRunning(false);
        setIsSlowing(false);
        const winner =
          participants[Math.floor(Math.random() * participants.length)];
        setName(renderName(winner.name));
        setWinnerSelected(true);
        setTimeout(() => {
          onFinish(winner);
          setWinnerSelected(false);
        }, 1000); // Délai pour montrer l'animation de victoire
      }
    };
    slow();
  }

  function reset() {
    clear();
    setRunning(false);
    setIsSlowing(false);
    setWinnerSelected(false);
    setName("???");
  }

  return { name, running, isSlowing, winnerSelected, start, stop, reset };
}

/* =======================
   COMPONENT
======================= */
export default function NewGame() {
  const [players, setPlayers] = useState([]);
  const [played, setPlayed] = useState({});
  const [immune, setImmune] = useState({});
  const [payer, setPayer] = useState(null);
  const [fetcher, setFetcher] = useState(null);
  const [payerResults, setPayerResults] = useState([]);
  const [showDoublette, setShowDoublette] = useState(false);
  const [existingDates, setExistingDates] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [mode, setMode] = useState("draw"); // draw | manual
  const [step, setStep] = useState("payer"); // payer | fetcher | done
  const [error, setError] = useState(null);

  const [newPlayer, setNewPlayer] = useState("");
  const [adding, setAdding] = useState(false);

  const renderName = (name) => {
    return name === "Experto" ? `${name} 👑` : name;
  };

  useEffect(() => {
    loadPlayers();
    loadGames();
  }, []);

  async function loadGames() {
    const res = await fetch("/api/games/");
    const games = await res.json();

    const dates = games.map((g) => g.date);
    setExistingDates(dates);
  }

  function loadPlayers() {
    fetch("/api/players/")
      .then((r) => r.json())
      .then((players) => {
        setPlayers(players);
        // Initialize immune state with players who have immunity
        const immuneState = {};
        players.forEach((p) => {
          if (p.has_immunity) {
            immuneState[p.id] = true;
          }
        });
        setImmune(immuneState);
      });
  }

  const participants = players.filter((p) => played[p.id]);

  const draw = useDraw(participants, renderName, (winner) => {
    if (step === "payer") {
      const hasImmunity = immune[winner.id];

      setPayerResults((prev) => [
        ...prev,
        { id: winner.id, immune: hasImmunity },
      ]);

      if (hasImmunity) {
        setImmune({});
        // Update backend: remove immunity
        fetch(`/api/players/${winner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ has_immunity: false }),
        }).catch(console.error);
        draw.reset();
        setTimeout(draw.start, 800);
      } else {
        setPayer(winner.id);
        setTimeout(() => {
          draw.reset();
          setStep("fetcher");
        }, 1500);
      }
    } else if (step === "fetcher") {
      setFetcher(winner.id);
      setStep("done");

      if (winner.id === payer) {
        setShowDoublette(true);
        setTimeout(() => setShowDoublette(false), 2200);
      }
    }
  });

  async function submit(e) {
    e.preventDefault();
    setError(null);

async function submit(e) {
  e.preventDefault();

    if (submitting) return; // 🔒 bloque double clic

    setSubmitting(true);
    setError(null);

    if (!participants.length) {
      setError("Sélectionne au moins un joueur.");
      setSubmitting(false);
      return;
    }

    if (!payer || !fetcher) {
      setError("Tirage incomplet.");
      setSubmitting(false);
      return;
    }

    if (existingDates.includes(date)) {
      setError("Une partie existe déjà à cette date.");
      setSubmitting(false);
      return;
    }

    const payload = {
      date,
      players: participants.map((p) => p.id),
      payer,
      fetcher,
    };

    const res = await fetch("/api/games/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("Partie enregistrée");
      setPlayed({});
      setImmune({});
      setPayer(null);
      setFetcher(null);
      setPayerResults([]);
      setStep("payer");
      draw.reset();

      // 🔁 recharge les dates
      loadGames();
    } else {
      setError("Erreur lors de l'enregistrement");
    }

    setSubmitting(false);
  }

    if (existingDates.includes(date)) {
      setError("Une partie existe déjà à cette date.");
      return;
}
    if (!participants.length) {
      setError("Sélectionne au moins un joueur.");
      return;
    }

    if (!payer || !fetcher) {
      setError("Tirage incomplet.");
      return;
    }

    const payload = {
      date,
      players: participants.map((p) => p.id),
      payer,
      fetcher,
    };

    const res = await fetch("/api/games/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("Partie enregistrée");
      setPlayed({});
      setImmune({});
      setPayer(null);
      setFetcher(null);
      setPayerResults([]);
      setStep("payer");
      draw.reset();
    } else {
      setError("Erreur lors de l'enregistrement");
    }
  }

  async function addPlayer() {
    if (!newPlayer.trim()) return;
    setAdding(true);

    const res = await fetch(
      `/api/players/?name=${encodeURIComponent(newPlayer)}`,
      { method: "POST" }
    );

    if (res.ok) {
      setNewPlayer("");
      loadPlayers();
    } else {
      alert("Erreur ajout joueur");
    }
    setAdding(false);
  }


  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4">
      <h2 className="text-lg font-semibold mb-4">Nouvelle partie</h2>

      <form onSubmit={submit} className="bg-white p-4 rounded shadow">
       

        {/* MODE */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={`w-full sm:w-auto px-3 py-1 rounded ${
              mode === "draw"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            🎲 Tirage
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`w-full sm:w-auto px-3 py-1 rounded ${
              mode === "manual"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            ✍️ Manuel
          </button>
        </div>

        {/* DATE */}
        <label className="block mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span>Date</span>
            <input
              type="date"
              className="border p-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </label>

        {/* TABLE JOUEURS */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full min-w-[320px] text-center table-fixed">
            <thead>
              <tr className="bg-gray-100 text-sm sm:text-base">
                <th className="p-1 sm:p-2 w-1/3">Joueur</th>
                <th className="p-1 sm:p-2 w-1/6">Joue</th>
                {mode === "draw" && <th className="p-1 sm:p-2 w-1/6">Immunité</th>}
                {mode === "manual" && (
                  <>
                    <th className="p-1 sm:p-2 w-1/6">Paye</th>
                    <th className="p-1 sm:p-2 w-1/6">Cherche</th>
                  </>
                )}
              </tr>
            </thead>
          <tbody>
            {players.map((p) => {
              const hasPlayed = !!played[p.id];
              const isSelected =
                p.id === payer || p.id === fetcher;

              return (
                <tr
                  key={p.id}
                  className={`border-b ${
                    isSelected ? "bg-blue-100" : ""
                  }`}
                >
                  <td className="p-1 sm:p-2 text-sm sm:text-base">{renderName(p.name)} {p.has_immunity && "🛡️"}</td>
                  <td className="p-1 sm:p-2">
                    <input
                      type="checkbox"
                      checked={hasPlayed}
                      onChange={() =>
                        setPlayed((v) => ({
                          ...v,
                          [p.id]: !v[p.id],
                        }))
                      }
                      className="w-4 h-4"
                    />
                  </td>

                  {mode === "draw" && (
                    <td className="p-1 sm:p-2">
                      <input
                        type="checkbox"
                        disabled={!hasPlayed || !p.has_immunity}
                        checked={!!immune[p.id]}
                        onChange={() =>
                          setImmune((v) => ({
                            ...v,
                            [p.id]: !v[p.id],
                          }))
                        }
                        className="w-4 h-4"
                      />
                    </td>
                  )}

                  {mode === "manual" && (
                    <>
                      <td className="p-1 sm:p-2">
                        <input
                          type="radio"
                          name="payer"
                          disabled={!hasPlayed}
                          checked={payer === p.id}
                          onChange={() => setPayer(p.id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="p-1 sm:p-2">
                        <input
                          type="radio"
                          name="fetcher"
                          disabled={!hasPlayed}
                          checked={fetcher === p.id}
                          onChange={() => setFetcher(p.id)}
                          className="w-4 h-4"
                        />
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

        {/* ===== TIRAGE ===== */}
        {mode === "draw" && (
<div className="bg-gray-50 p-4 rounded text-center relative">
        {showDoublette && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="text-5xl animate-bounce">🎉</div>

            <div className="absolute inset-0">
              {Array.from({ length: 20 }).map((_, i) => (
                <span 
                  key={i} 
                  className="sparkle" 
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    background: ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'][Math.floor(Math.random() * 5)]
                  }}
                />
              ))}
            </div>

            <div className="bg-white/90 px-5 py-3 rounded-2xl shadow-lg border border-yellow-300 text-yellow-700 font-semibold text-lg animate-pulse">
              Doublette !
            </div>
          </div>
        )}

            <h3 className="font-semibold text-lg mb-2">
              {step === "payer"
                ? "💳 Qui paye le café ?"
                : step === "fetcher"
                ? "🚶 Qui va chercher le café ?"
                : ""}
            </h3>

            <div className={`text-4xl font-bold h-14 mb-3 transition-all duration-300 ${
              draw.running ? 'animate-fade-in-out' : 
              draw.winnerSelected ? 'text-green-600 animate-pulse' : ''
            }`}>
              {draw.name}
            </div>

            {step !== "done" && (
              <button
                type="button"
                onClick={
                  draw.running ? draw.stop : draw.start
                }
                className={`px-6 py-3 rounded text-white transition-all duration-300 ${
                  draw.running
                    ? "bg-red-600 animate-pulse-glow"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {draw.running ? "🛑 Stop" : "▶️ Lancer"}
              </button>
            )}

            <div className="mt-4 space-y-2 text-left">
              {payerResults.map((r, i) => (
                <div
                  key={i}
                  className="bg-blue-100 p-2 rounded animate-slide-in-up"
                >
                  💳 Résultat {i + 1} :{" "}
                  <strong>
                    {renderName(
                      players.find(
                        (p) => p.id === r.id
                      )?.name
                    )}
                  </strong>{" "}
                  {r.immune && <span className="animate-shield-break inline-block">🛡️</span>}
                </div>
              ))}

              {fetcher && (
                <div className="bg-green-100 p-2 rounded animate-slide-in-up">
                  🚶 Qui va chercher :{" "}
                  <strong>
                    {renderName(
                      players.find(
                        (p) => p.id === fetcher
                      )?.name
                    )}
                  </strong>{" "}
                  ✅
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="bg-coffee text-white px-4 py-2 rounded mt-4"
        >
          {submitting ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
        {error && (
          <div className="bg-red-100 p-2 mb-3 rounded text-red-700">
            {error}
          </div>
        )}
        
      {/* AJOUT JOUEUR */}
      <div className="bg-white p-4 rounded shadow mt-6 flex flex-col sm:flex-row gap-3">
        <input
          className="border p-2 flex-1 w-full"
          placeholder="Nouveau joueur"
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
        />
        <button
          type="button"
          onClick={addPlayer}
          disabled={adding}
          className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}
