import { useEffect, useRef, useState } from "react";

export default function NewGame() {
  const [players, setPlayers] = useState([]);
  const [played, setPlayed] = useState({});
  const [payer, setPayer] = useState(null);
  const [fetcher, setFetcher] = useState(null);

  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [mode, setMode] = useState("manual"); // manual | draw
  const [step, setStep] = useState("idle"); // idle | payer | fetcher | done

  const [rollingIndex, setRollingIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [blink, setBlink] = useState(false);
  const [holdName, setHoldName] = useState(false);

  const intervalRef = useRef(null);
  const speedRef = useRef(60);
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
  function startDraw() {
    if (participants().length === 0) {
      setError("Sélectionne au moins un joueur.");
      return;
    }

    setError(null);
    setRunning(true);
    speedRef.current = 60;

    function spin() {
      setRollingIndex((i) => (i + 1) % participants().length);
      intervalRef.current = setTimeout(spin, speedRef.current);
    }

    spin();
  }

  function stopDraw() {
    clearTimeout(intervalRef.current);

    function slowDown() {
      speedRef.current += 35;

      if (speedRef.current > 420) {
        finalizeDraw();
        return;
      }

      setRollingIndex((i) => (i + 1) % participants().length);
      intervalRef.current = setTimeout(slowDown, speedRef.current);
    }

    slowDown();
  }

  function finalizeDraw() {
    clearTimeout(intervalRef.current);
    setRunning(false);
    setHoldName(true);

    const winner = participants()[rollingIndex];
    if (!winner) return;

    setBlink(true);
    setTimeout(() => setBlink(false), 900);

    if (step === "idle" || step === "payer") {
      setPayer(winner.id);
      setStep("fetcher");
    } else if (step === "fetcher") {
      setFetcher(winner.id);
      setStep("done");
      if (payer === winner.id) explodeConfetti();
    }

    setTimeout(() => setHoldName(false), 5000);
  }

  /* ======================
     CONFETTI
  ====================== */
  function explodeConfetti() {
    if (!drawRef.current) return;

    const rect = drawRef.current.getBoundingClientRect();

    for (let i = 0; i < 50; i++) {
      const el = document.createElement("span");
      el.className = "confetti";
      el.style.left = `${rect.width / 2}px`;
      el.style.top = "70px";
      el.style.setProperty("--x", `${Math.random() * 300 - 150}px`);
      el.style.setProperty("--y", `${Math.random() * -300 - 120}px`);
      drawRef.current.appendChild(el);
      setTimeout(() => el.remove(), 1300);
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

  const currentName =
    participants()[rollingIndex]?.name || "???";

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="font-semibold text-lg mb-4">
        Nouvelle partie
      </h2>

      {/* MODE */}
      <div className="flex gap-3 mb-4">
        {["manual", "draw"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 rounded ${
              mode === m
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
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

        {/* DATE */}
        <label className="block mb-4 text-sm">
          Date
          <input
            type="date"
            className="border p-2 ml-3"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        {/* TABLE */}
        <table className="w-full table-fixed mb-4">
          <thead>
            <tr className="bg-gray-100 text-lg font-semibold">
              <th className="w-1/4 text-center p-2">Joueur</th>
              <th className="w-1/4 text-center p-2">Joue</th>
              <th className="w-1/4 text-center p-2">Paie</th>
              <th className="w-1/4 text-center p-2">Cherche</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const highlighted =
                p.id === payer || p.id === fetcher;

              return (
                <tr
                  key={p.id}
                  className={`border-b transition ${
                    highlighted ? "bg-yellow-100" : ""
                  }`}
                >
                  <td className="text-center p-2">{p.name}</td>
                  <td className="text-center p-2">
                    <input
                      type="checkbox"
                      checked={!!played[p.id]}
                      onChange={() => togglePlayed(p.id)}
                    />
                  </td>
                  <td className="text-center p-2">
                    <input
                      type="radio"
                      disabled={!played[p.id] || mode === "draw"}
                      checked={payer === p.id}
                      onChange={() => setPayer(p.id)}
                    />
                  </td>
                  <td className="text-center p-2">
                    <input
                      type="radio"
                      disabled={!played[p.id] || mode === "draw"}
                      checked={fetcher === p.id}
                      onChange={() => setFetcher(p.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* RESULT BLOCKS */}
        {payer && (
          <div className="bg-green-100 p-3 rounded mb-3 flex justify-between">
            <p>💳 Qui paye : {players.find(p => p.id === payer)?.name}</p>
            <span className="text-green-600 font-bold">✔</span>
          </div>
        )}

        {fetcher && (
          <div className="bg-blue-100 p-3 rounded mb-3 flex justify-between">
            <p>🚶 Qui va chercher : {players.find(p => p.id === fetcher)?.name}</p>
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
              {running || holdName ? currentName : "???"}
            </div>

            {!fetcher && (
              <button
                type="button"
                onClick={running ? stopDraw : startDraw}
                className={`mt-3 px-4 py-2 rounded text-white ${
                  running ? "bg-red-600" : "bg-coffee"
                }`}
              >
                {running ? "🛑 Stop" : "Lancer la roulette"}
              </button>
            )}
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

      <style>{`
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 2px;
          background: hsl(${Math.random() * 360}, 90%, 60%);
          animation: explode 1.2s cubic-bezier(.2,.8,.2,1) forwards;
        }
        @keyframes explode {
          to {
            transform: translate(var(--x), var(--y)) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
