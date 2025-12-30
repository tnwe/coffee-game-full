import { useEffect, useRef, useState } from "react";

export default function NewGame() {
  const [players, setPlayers] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [played, setPlayed] = useState({});
  const [payer, setPayer] = useState(null);
  const [fetcher, setFetcher] = useState(null);

  const [mode, setMode] = useState("manual"); // manual | draw
  const [step, setStep] = useState("payer"); // payer | fetcher | done
  const [running, setRunning] = useState(false);
  const [blink, setBlink] = useState(false);

  const [newPlayer, setNewPlayer] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  /* ===== RANDOM PICKER ===== */
  const listRef = useRef(null);
  const intervalRef = useRef(null);
  const speedRef = useRef(40);
  const indexRef = useRef(0);

  /* ===== LOAD PLAYERS ===== */
  function loadPlayers() {
    fetch("/api/players/")
      .then((r) => r.json())
      .then(setPlayers);
  }

  useEffect(() => {
    loadPlayers();
  }, []);

  /* ===== HELPERS ===== */
  function togglePlayed(id) {
    setPlayed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) {
        if (payer === id) setPayer(null);
        if (fetcher === id) setFetcher(null);
      }
      return next;
    });
  }

  function participants() {
    return players.filter((p) => played[p.id]);
  }

  /* ===== PICKER ===== */
  function startOrStop() {
    if (running) stopPicker();
    else startPicker();
  }

  function startPicker() {
    const list = participants();
    if (list.length === 0) {
      setError("Sélectionne au moins un joueur.");
      return;
    }

    setError(null);
    setRunning(true);
    speedRef.current = 40;
    indexRef.current = 0;

    intervalRef.current = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % list.length;
      listRef.current.style.transform = `translateY(-${indexRef.current * 3}rem)`;
    }, speedRef.current);
  }

  function stopPicker() {
    const list = participants();

    const slowDown = setInterval(() => {
      speedRef.current *= 1.15;

      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        indexRef.current = (indexRef.current + 1) % list.length;
        listRef.current.style.transform = `translateY(-${indexRef.current * 3}rem)`;
      }, speedRef.current);

      if (speedRef.current > 320) {
        clearInterval(slowDown);
        clearInterval(intervalRef.current);
        setRunning(false);

        const winner = list[indexRef.current];

        if (step === "payer") {
          setPayer(winner.id);
          triggerBlink(() => setStep("fetcher"));
        } else {
          setFetcher(winner.id);
          setStep("done");
          if (winner.id === payer) triggerConfetti();
        }
      }
    }, 200);
  }

  function triggerBlink(next) {
    let count = 0;
    const i = setInterval(() => {
      setBlink((b) => !b);
      count++;
      if (count === 6) {
        clearInterval(i);
        setBlink(false);
        next();
      }
    }, 250);
  }

  function triggerConfetti() {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3500);
  }

  /* ===== SUBMIT ===== */
  async function submit(e) {
    e.preventDefault();
    setError(null);

    const selectedPlayers = Object.keys(played).filter((id) => played[id]);

    if (selectedPlayers.length === 0) {
      setError("Sélectionne au moins un joueur.");
      return;
    }

    if (mode === "draw" && (!payer || !fetcher)) {
      setError("Le tirage doit être terminé avant l’enregistrement.");
      return;
    }

    const payload = {
      date,
      players: selectedPlayers.map(Number),
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
      setPayer(null);
      setFetcher(null);
      setStep("payer");
      setMode("manual");
    } else {
      setError("Erreur lors de l'enregistrement");
    }
  }

  /* ===== ADD PLAYER ===== */
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
    }
    setAdding(false);
  }

  const disableSubmit = mode === "draw" && (!payer || !fetcher);

  /* ===== RENDER ===== */
  return (
    <div className="max-w-4xl mx-auto p-4 relative overflow-hidden">
      {showConfetti && <Confetti />}

      <h2 className="text-lg font-semibold mb-4">Nouvelle partie</h2>

      <form onSubmit={submit} className="bg-white p-4 rounded shadow">
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3">
            {error}
          </div>
        )}

        {/* MODE */}
        <div className="flex gap-4 mb-4">
          {["manual", "draw"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded ${
                mode === m ? "bg-coffee text-white" : "bg-gray-200"
              }`}
            >
              {m === "manual" ? "Mode manuel" : "Mode tirage"}
            </button>
          ))}
        </div>

        {/* DATE */}
        <label className="block mb-3">
          Date
          <input
            className="border p-2 ml-3"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        {/* TABLE */}
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Joueur</th>
              <th className="p-2 text-center">Joue</th>
              <th className="p-2 text-center">Paie</th>
              <th className="p-2 text-center">Cherche</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const hasPlayed = !!played[p.id];
              return (
                <tr key={p.id} className={!hasPlayed ? "opacity-50" : ""}>
                  <td className="p-2">{p.name}</td>
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={hasPlayed}
                      onChange={() => togglePlayed(p.id)}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="radio"
                      name="payer"
                      disabled={!hasPlayed || mode === "draw"}
                      checked={payer === p.id}
                      onChange={() => setPayer(p.id)}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="radio"
                      name="fetcher"
                      disabled={!hasPlayed || mode === "draw"}
                      checked={fetcher === p.id}
                      onChange={() => setFetcher(p.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* DRAW MODE */}
        {mode === "draw" && (
          <div className="mb-6 text-center">
            <h3 className="font-semibold mb-2">
              {step === "payer" ? "💳 Qui paye ?" : "🚶 Qui va chercher ?"}
            </h3>

            {payer && step !== "payer" && (
              <p
                className={`mb-2 font-bold transition ${
                  blink ? "opacity-0" : "opacity-100"
                }`}
              >
                💳 Qui paye :{" "}
                {players.find((p) => p.id === payer)?.name}
              </p>
            )}

            <div className="h-12 overflow-hidden border rounded mb-3 bg-gray-50">
              <div ref={listRef}>
                {participants().map((p) => (
                  <div
                    key={p.id}
                    className="h-12 flex items-center justify-center font-bold"
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={startOrStop}
              className={`px-6 py-2 rounded text-white ${
                running ? "bg-red-600" : "bg-green-600"
              }`}
            >
              {running ? "🛑 Stop" : "▶ Lancer"}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="bg-blue-50 p-3 rounded mb-3">
            💳 Qui paye : {players.find((p) => p.id === payer)?.name}
            <br />
            🚶 Qui va chercher :{" "}
            {players.find((p) => p.id === fetcher)?.name}
            {payer === fetcher && (
              <div className="mt-2 font-bold text-yellow-700">
                🎉 Doublette !
              </div>
            )}
          </div>
        )}

        <button
          className="bg-coffee text-white px-4 py-2 rounded disabled:opacity-40"
          type="submit"
          disabled={disableSubmit}
        >
          Enregistrer
        </button>
      </form>

      {/* ADD PLAYER */}
      <div className="bg-white p-4 rounded shadow mt-6 flex gap-3">
        <input
          className="border p-2 flex-1"
          placeholder="Nouveau joueur"
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
        />
        <button
          type="button"
          onClick={addPlayer}
          disabled={adding}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}

/* ===== CONFETTI COMPONENT ===== */
function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: Math.random() * 100 + "%",
            animationDelay: Math.random() * 2 + "s",
          }}
        />
      ))}
      <style>{`
        .confetti {
          position: absolute;
          top: -10px;
          width: 8px;
          height: 8px;
          background: hsl(${Math.random() * 360}, 70%, 60%);
          animation: fall 3s linear forwards;
        }
        @keyframes fall {
          to {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
