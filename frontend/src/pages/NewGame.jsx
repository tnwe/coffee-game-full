import { useEffect, useRef, useState } from "react";

export default function NewGame() {
  const [players, setPlayers] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [played, setPlayed] = useState({});
  const [payer, setPayer] = useState(null);
  const [fetcher, setFetcher] = useState(null);

  const [mode, setMode] = useState("manual"); // manual | draw
  const [step, setStep] = useState("idle"); // idle | payer | fetcher | done

  const [rollingIndex, setRollingIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [blink, setBlink] = useState(false);

  const [liveStats, setLiveStats] = useState({});
  const intervalRef = useRef(null);
  const drawRef = useRef(null);

  const [newPlayer, setNewPlayer] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  /* ======================
     LOAD PLAYERS
  ====================== */
  function loadPlayers() {
    fetch("/api/players/")
      .then((r) => r.json())
      .then(setPlayers);
  }

  useEffect(loadPlayers, []);

  const participants = () =>
    players.filter((p) => played[p.id]);

  /* ======================
     TOGGLE PLAYED
  ====================== */
  function togglePlayed(id) {
    setPlayed((p) => {
      const n = { ...p, [id]: !p[id] };
      if (!n[id]) {
        if (payer === id) setPayer(null);
        if (fetcher === id) setFetcher(null);
      }
      return n;
    });
  }

  /* ======================
     DRAW LOGIC
  ====================== */
  function startOrStop() {
    if (running) return stopDraw();

    if (participants().length === 0) {
      setError("Sélectionne au moins un joueur.");
      return;
    }

    setError(null);
    setRunning(true);

    const stats = {};
    participants().forEach((p) => (stats[p.id] = 0));
    setLiveStats(stats);

    intervalRef.current = setInterval(() => {
      setRollingIndex((i) => (i + 1) % participants().length);
      const id = participants()[rollingIndex]?.id;
      if (id) {
        setLiveStats((s) => ({
          ...s,
          [id]: (s[id] || 0) + 1,
        }));
      }
    }, 80);
  }

  function stopDraw() {
    clearInterval(intervalRef.current);
    setRunning(false);

    const winner = participants()[rollingIndex];
    if (!winner) return;

    setBlink(true);
    setTimeout(() => setBlink(false), 900);

    if (step === "idle" || step === "payer") {
      setPayer(winner.id);
      setStep("fetcher");
      setTimeout(startOrStop, 800);
    } else {
      setFetcher(winner.id);
      setStep("done");
      explodeConfetti();
    }
  }

  /* ======================
     CONFETTI EXPLOSION
  ====================== */
  function explodeConfetti() {
    if (!drawRef.current) return;

    for (let i = 0; i < 25; i++) {
      const el = document.createElement("span");
      el.className = "confetti";
      el.style.left = "50%";
      el.style.top = "50%";
      el.style.setProperty("--x", `${Math.random() * 200 - 100}px`);
      el.style.setProperty("--y", `${Math.random() * -200 - 50}px`);
      drawRef.current.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }
  }

  /* ======================
     SUBMIT
  ====================== */
  async function submit(e) {
    e.preventDefault();
    setError(null);

    if (participants().length === 0) {
      setError("Aucun joueur sélectionné.");
      return;
    }

    if (mode === "draw" && (!payer || !fetcher)) {
      setError("Tirage incomplet.");
      return;
    }

    const payload = {
      date,
      players: participants().map((p) => p.id),
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
      setStep("idle");
    } else setError("Erreur");
  }

  async function addPlayer() {
    if (!newPlayer.trim()) return;
    setAdding(true);
    await fetch(`/api/players/?name=${newPlayer}`, { method: "POST" });
    setNewPlayer("");
    loadPlayers();
    setAdding(false);
  }

  const doublette = payer && fetcher && payer === fetcher;

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="font-semibold text-lg mb-4">Nouvelle partie</h2>

      {/* MODE */}
      <div className="flex gap-3 mb-4">
        {["manual", "draw"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 rounded ${
              mode === m ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {m === "manual" ? "Mode manuel" : "Mode tirage"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="bg-white p-4 rounded shadow">
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3">
            {error}
          </div>
        )}

        <label className="block mb-3">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border ml-3 p-1"
          />
        </label>

        {/* TABLE */}
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th>Joueur</th>
              <th className="text-center">Joue</th>
              <th className="text-center">Paie</th>
              <th className="text-center">Cherche</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className={!played[p.id] ? "opacity-50" : ""}>
                <td className="p-2">{p.name}</td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={!!played[p.id]}
                    onChange={() => togglePlayed(p.id)}
                  />
                </td>
                <td className="text-center">
                  <input
                    type="radio"
                    disabled={!played[p.id] || mode === "draw"}
                    checked={payer === p.id}
                    onChange={() => setPayer(p.id)}
                  />
                </td>
                <td className="text-center">
                  <input
                    type="radio"
                    disabled={!played[p.id] || mode === "draw"}
                    checked={fetcher === p.id}
                    onChange={() => setFetcher(p.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* RESULT PAYEUR */}
        {payer && (
          <div className="bg-green-100 p-3 rounded mb-3 flex justify-between items-center">
            <p>💳 Qui paye : {players.find(p => p.id === payer)?.name}</p>
            <span className="text-green-600 font-bold">✔</span>
          </div>
        )}

        {/* DRAW */}
        {mode === "draw" && step !== "done" && (
          <div
            ref={drawRef}
            className="relative bg-gray-50 p-4 rounded mb-3 text-center overflow-hidden"
          >
            <p className="font-semibold mb-2">
              {step === "fetcher"
                ? "🚶 Qui va chercher ?"
                : "💳 Qui paye ?"}
            </p>

            <div
              className={`text-2xl font-bold h-10 ${
                blink ? "animate-pulse text-green-600" : ""
              }`}
            >
              {participants()[rollingIndex]?.name || "—"}
            </div>

            <button
              type="button"
              onClick={startOrStop}
              className={`mt-3 px-4 py-2 rounded text-white ${
                running ? "bg-red-600" : "bg-coffee"
              }`}
            >
              {running ? "🛑 Stop" : "Lancer la roulette"}
            </button>
          </div>
        )}

        {/* RESULT FETCHER */}
        {fetcher && (
          <div className="bg-blue-50 p-3 rounded mb-3">
            <p>🚶 Qui va chercher : {players.find(p => p.id === fetcher)?.name}</p>
          </div>
        )}

        <button
          className="bg-coffee text-white px-4 py-2 rounded"
          disabled={mode === "draw" && (!payer || !fetcher)}
        >
          Enregistrer
        </button>
      </form>

      {/* ADD PLAYER */}
      <div className="bg-white p-4 rounded shadow mt-6 flex gap-3">
        <input
          className="border p-2 flex-1"
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
          placeholder="Nouveau joueur"
        />
        <button
          onClick={addPlayer}
          disabled={adding}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Ajouter
        </button>
      </div>

      {/* CONFETTI CSS */}
      <style>{`
        .confetti {
          position: absolute;
          width: 8px;
          height: 8px;
          background: hsl(${Math.random() * 360}, 90%, 60%);
          border-radius: 2px;
          animation: pop 1.1s ease-out forwards;
        }
        @keyframes pop {
          to {
            transform: translate(var(--x), var(--y)) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
