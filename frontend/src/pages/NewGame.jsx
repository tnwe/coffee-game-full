import { useEffect, useRef, useState } from "react";

/* =======================
   DRAW HOOK
======================= */
function useDraw(participants, onFinish) {
  const [running, setRunning] = useState(false);
  const [name, setName] = useState("???");

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

    const loop = () => {
      tick();
      timer.current = setTimeout(loop, speed.current);
    };
    loop();
  }

  function stop() {
    if (!running) return;
    slowing.current = true;
    clear();

    const slow = () => {
      tick();
      speed.current += 40;
      if (speed.current < 500) {
        timer.current = setTimeout(slow, speed.current);
      } else {
        clear();
        setRunning(false);
        const winner =
          participants[Math.floor(Math.random() * participants.length)];
        setName(renderName(winner.name));
        onFinish(winner);
      }
    };
    slow();
  }

  function reset() {
    clear();
    setRunning(false);
    setName("???");
  }

  return { name, running, start, stop, reset };
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
  }, []);

  function loadPlayers() {
    fetch("/api/players/")
      .then((r) => r.json())
      .then(setPlayers);
  }

  const participants = players.filter((p) => played[p.id]);

  const draw = useDraw(participants, (winner) => {
    if (step === "payer") {
      const hasImmunity = immune[winner.id];

      setPayerResults((prev) => [
        ...prev,
        { id: winner.id, immune: hasImmunity },
      ]);

      if (hasImmunity) {
        setImmune({});
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
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-lg font-semibold mb-4">Nouvelle partie</h2>

      <form onSubmit={submit} className="bg-white p-4 rounded shadow">
        {error && (
          <div className="bg-red-100 p-2 mb-3 rounded text-red-700">
            {error}
          </div>
        )}

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
          <table className="w-full min-w-[480px] text-center table-fixed">
            <thead>
              <tr className="bg-gray-100 text-lg">
                <th>Joueur</th>
                <th>Joue</th>
                {mode === "draw" && <th>Immunité</th>}
                {mode === "manual" && (
                  <>
                    <th>Paye</th>
                    <th>Cherche</th>
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
                  <td className="p-2">{renderName(p.name)}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={hasPlayed}
                      onChange={() =>
                        setPlayed((v) => ({
                          ...v,
                          [p.id]: !v[p.id],
                        }))
                      }
                    />
                  </td>

                  {mode === "draw" && (
                    <td>
                      <input
                        type="checkbox"
                        disabled={!hasPlayed}
                        checked={!!immune[p.id]}
                        onChange={() =>
                          setImmune((v) => ({
                            ...v,
                            [p.id]: !v[p.id],
                          }))
                        }
                      />
                    </td>
                  )}

                  {mode === "manual" && (
                    <>
                      <td>
                        <input
                          type="radio"
                          name="payer"
                          disabled={!hasPlayed}
                          checked={payer === p.id}
                          onChange={() => setPayer(p.id)}
                        />
                      </td>
                      <td>
                        <input
                          type="radio"
                          name="fetcher"
                          disabled={!hasPlayed}
                          checked={fetcher === p.id}
                          onChange={() => setFetcher(p.id)}
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
              {Array.from({ length: 12 }).map((_, i) => (
                <span key={i} className="confetti sparkle" />
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

            <div className="text-4xl font-bold h-14 mb-3">
              {draw.name}
            </div>

            {step !== "done" && (
              <button
                type="button"
                onClick={
                  draw.running ? draw.stop : draw.start
                }
                className={`px-6 py-3 rounded text-white ${
                  draw.running
                    ? "bg-red-600"
                    : "bg-green-600"
                }`}
              >
                {draw.running ? "🛑 Stop" : "▶️ Lancer"}
              </button>
            )}

            <div className="mt-4 space-y-2 text-left">
              {payerResults.map((r, i) => (
                <div
                  key={i}
                  className="bg-blue-100 p-2 rounded"
                >
                  💳 Résultat {i + 1} :{" "}
                  <strong>
                    {renderName(
                      players.find(
                        (p) => p.id === r.id
                      )?.name
                    )}
                  </strong>{" "}
                  {r.immune && "🛡️"}
                </div>
              ))}

              {fetcher && (
                <div className="bg-green-100 p-2 rounded">
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
          Enregistrer
        </button>
      </form>

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
