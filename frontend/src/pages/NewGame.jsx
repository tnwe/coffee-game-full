import { useEffect, useRef, useState } from "react";

export default function NewGame() {
  const [players, setPlayers] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [played, setPlayed] = useState({});
  const [payer, setPayer] = useState(null);
  const [fetcher, setFetcher] = useState(null);

  const [mode, setMode] = useState("manual"); // manual | draw
  const [step, setStep] = useState("payer"); // payer | fetcher | done

  const [newPlayer, setNewPlayer] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  /* ===== ROULETTE ===== */
  const wheelRef = useRef(null);
  const spinInterval = useRef(null);
  const rotation = useRef(0);
  const speed = useRef(0);

  /* =======================
     LOAD PLAYERS
  ======================= */
  function loadPlayers() {
    fetch("/api/players/")
      .then((r) => r.json())
      .then(setPlayers);
  }

  useEffect(() => {
    loadPlayers();
  }, []);

  /* =======================
     HELPERS
  ======================= */
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

  /* =======================
     ROULETTE LOGIC
  ======================= */
  function spinWheel() {
    if (participants().length === 0) {
      setError("Sélectionne au moins un joueur.");
      return;
    }
    setError(null);

    speed.current = 25;

    spinInterval.current = setInterval(() => {
      rotation.current += speed.current;
      wheelRef.current.style.transform = `rotate(${rotation.current}deg)`;
    }, 16);
  }

  function stopWheel() {
    const slowDown = setInterval(() => {
      speed.current *= 0.97;

      if (speed.current < 0.5) {
        clearInterval(slowDown);
        clearInterval(spinInterval.current);

        const list = participants();
        const angle = rotation.current % 360;
        const slice = 360 / list.length;
        const index =
          Math.floor((360 - angle) / slice) % list.length;

        const winner = list[index];

        if (step === "payer") {
          setPayer(winner.id);
          setStep("fetcher");
        } else {
          setFetcher(winner.id);
          setStep("done");
        }
      }
    }, 30);
  }

  /* =======================
     SUBMIT
  ======================= */
  async function submit(e) {
    e.preventDefault();
    setError(null);

    const selectedPlayers = Object.keys(played).filter((id) => played[id]);
    if (selectedPlayers.length === 0) {
      setError("Sélectionne au moins un joueur.");
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

  /* =======================
     ADD PLAYER
  ======================= */
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

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-lg font-semibold mb-4">Nouvelle partie</h2>

      <form onSubmit={submit} className="bg-white p-4 rounded shadow">
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3">
            {error}
          </div>
        )}

        {/* MODE */}
        <div className="flex gap-4 mb-4">
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`px-4 py-2 rounded ${
              mode === "manual"
                ? "bg-coffee text-white"
                : "bg-gray-200"
            }`}
          >
            Mode manuel
          </button>
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={`px-4 py-2 rounded ${
              mode === "draw"
                ? "bg-coffee text-white"
                : "bg-gray-200"
            }`}
          >
            Mode tirage
          </button>
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
                <tr
                  key={p.id}
                  className={`border-b ${
                    !hasPlayed ? "opacity-50" : ""
                  }`}
                >
                  <td className="p-2">{p.name}</td>
                  <td className="p-2 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={hasPlayed}
                      onChange={() => togglePlayed(p.id)}
                    />
                  </td>
                  <td className="p-2 text-center align-middle">
                    <input
                      type="radio"
                      name="payer"
                      disabled={!hasPlayed || mode === "draw"}
                      checked={payer === p.id}
                      onChange={() => setPayer(p.id)}
                    />
                  </td>
                  <td className="p-2 text-center align-middle">
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

        {/* ROULETTE */}
        {mode === "draw" && (
          <div className="text-center mb-6">
            <div className="relative w-72 h-72 mx-auto mb-6">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl z-10">
                ▼
              </div>

              <div
                ref={wheelRef}
                className="w-full h-full rounded-full border-8 border-gray-700 shadow-lg relative overflow-hidden transition-transform"
              >
                {participants().map((p, i) => {
                  const total = participants().length;
                  const angle = 360 / total;
                  return (
                    <div
                      key={p.id}
                      className="absolute w-1/2 h-1/2 top-1/2 left-1/2 origin-bottom-left"
                      style={{
                        transform: `rotate(${angle * i}deg)`,
                        backgroundColor: `hsl(${(i * 360) / total},70%,60%)`,
                        clipPath:
                          "polygon(0 0,100% 0,0 100%)",
                      }}
                    >
                      <div
                        className="absolute left-2 top-6 text-xs font-bold text-white"
                        style={{
                          transform: `rotate(${angle / 2}deg)`,
                        }}
                      >
                        {p.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={spinWheel}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                🎯 Lancer la roulette
              </button>
              <button
                type="button"
                onClick={stopWheel}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                ⛔ Stop
              </button>
            </div>

            {payer && step === "fetcher" && (
              <p className="mt-4 font-bold">
                ☕ Payeur :{" "}
                {players.find((p) => p.id === payer)?.name}
              </p>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="bg-green-50 p-3 rounded mb-3">
            ☕ Paye : {players.find((p) => p.id === payer)?.name}
            <br />
            🚶‍♂️ Cherche :{" "}
            {players.find((p) => p.id === fetcher)?.name}
            {payer === fetcher && (
              <div className="mt-2 font-bold text-yellow-700">
                🎉 Doublette !
              </div>
            )}
          </div>
        )}

        <button
          className="bg-coffee text-white px-4 py-2 rounded"
          type="submit"
        >
          Enregistrer
        </button>
      </form>

      {/* AJOUT JOUEUR */}
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
