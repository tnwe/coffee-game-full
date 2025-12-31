import { useEffect, useRef, useState } from "react";

/* =======================
   HOOK : RANDOM DRAW
======================= */
function useRandomDraw(participants, onFinish) {
  const [running, setRunning] = useState(false);
  const [currentName, setCurrentName] = useState("???");
  const [winner, setWinner] = useState(null);
  const speedRef = useRef(60);
  const timerRef = useRef(null);
  const indexRef = useRef(0);

  function start() {
    if (!participants.length) return;

    setWinner(null);
    setRunning(true);
    speedRef.current = 60;
    indexRef.current = 0;

    roll();
  }

  function roll() {
    timerRef.current = setTimeout(() => {
      indexRef.current =
        (indexRef.current + 1) % participants.length;
      setCurrentName(participants[indexRef.current].name);

      if (running) {
        roll();
      }
    }, speedRef.current);
  }

  function stop() {
    if (!running) return;
    setRunning(false);

    // décélération réaliste
    const slowDown = () => {
      speedRef.current += 40;

      if (speedRef.current < 400) {
        timerRef.current = setTimeout(() => {
          indexRef.current =
            (indexRef.current + 1) % participants.length;
          setCurrentName(participants[indexRef.current].name);
          slowDown();
        }, speedRef.current);
      } else {
        const final =
          participants[
            Math.floor(Math.random() * participants.length)
          ];
        setCurrentName(final.name);
        setWinner(final);
        onFinish(final);
      }
    };

    slowDown();
  }

  return {
    running,
    currentName,
    winner,
    start,
    stop,
  };
}

/* =======================
   COMPONENT
======================= */
export default function NewGame() {
  const [players, setPlayers] = useState([]);
  const [played, setPlayed] = useState({});
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [mode, setMode] = useState("draw"); // draw | manual
  const [payer, setPayer] = useState(null);
  const [fetcher, setFetcher] = useState(null);
  const [step, setStep] = useState("payer"); // payer | fetcher | done
  const [error, setError] = useState(null);

  /* ===== LOAD PLAYERS ===== */
  useEffect(() => {
    fetch("/api/players/")
      .then((r) => r.json())
      .then(setPlayers);
  }, []);

  const participants = players.filter((p) => played[p.id]);

  /* ===== DRAW HOOK ===== */
  const draw = useRandomDraw(participants, (winner) => {
    if (step === "payer") {
      setPayer(winner.id);
      setTimeout(() => setStep("fetcher"), 800);
    } else {
      setFetcher(winner.id);
      setStep("done");
    }
  });

  /* ===== STATS LIVE ===== */
  const statsLive = {
    participants: participants.length,
    payeur: payer
      ? players.find((p) => p.id === payer)?.name
      : "-",
    fetcher: fetcher
      ? players.find((p) => p.id === fetcher)?.name
      : "-",
  };

  /* ===== SUBMIT ===== */
  async function submit(e) {
    e.preventDefault();

    if (mode === "draw" && step !== "done") {
      setError("Tirage incomplet");
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
      setPayer(null);
      setFetcher(null);
      setStep("payer");
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-lg font-semibold mb-4">
        Nouvelle partie
      </h2>

      {/* MODE */}
      <div className="flex gap-4 mb-4">
        {["draw", "manual"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded ${
              mode === m
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            {m === "draw" ? "🎲 Tirage" : "✍️ Manuel"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="bg-white p-4 rounded shadow">
        {error && (
          <div className="bg-red-100 p-2 mb-3 rounded">
            {error}
          </div>
        )}

        {/* DATE */}
        <label className="block mb-3">
          Date
          <input
            type="date"
            className="border p-2 ml-3"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        {/* TABLE */}
        <table className="w-full mb-4 text-center">
          <thead>
            <tr className="bg-gray-100 text-lg">
              <th className="p-2">Joueur</th>
              <th className="p-2">Joue</th>
              <th className="p-2">Payeur</th>
              <th className="p-2">Cherche</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr
                key={p.id}
                className={`border-b ${
                  draw.winner?.id === p.id
                    ? "bg-blue-100 animate-pulse"
                    : ""
                }`}
              >
                <td className="p-2">{p.name}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={!!played[p.id]}
                    onChange={() =>
                      setPlayed((v) => ({
                        ...v,
                        [p.id]: !v[p.id],
                      }))
                    }
                  />
                </td>
                <td>
                  <input
                    type="radio"
                    disabled={!played[p.id]}
                    checked={payer === p.id}
                    onChange={() => setPayer(p.id)}
                  />
                </td>
                <td>
                  <input
                    type="radio"
                    disabled={!played[p.id]}
                    checked={fetcher === p.id}
                    onChange={() => setFetcher(p.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* DRAW MODE */}
        {mode === "draw" && (
          <div className="mb-4 text-center">
            <div className="text-3xl font-bold h-12">
              {draw.currentName}
            </div>

            {/* STATS LIVE */}
            <div className="text-sm text-gray-500 mt-2">
              Participants : {statsLive.participants}
            </div>

            {step !== "done" && (
              <button
                type="button"
                onClick={draw.running ? draw.stop : draw.start}
                className={`mt-4 px-6 py-3 rounded text-white ${
                  draw.running
                    ? "bg-red-600"
                    : "bg-green-600"
                }`}
              >
                {draw.running ? "🛑 Stop" : "▶️ Lancer"}
              </button>
            )}
          </div>
        )}

        {/* RESULT */}
        {step === "done" && (
          <div className="bg-blue-50 p-4 rounded mb-4">
            <div className="flex justify-between">
              <span>
                💳 Qui paye :{" "}
                {
                  players.find((p) => p.id === payer)
                    ?.name
                }
              </span>
              <span>✔️</span>
            </div>
            <div className="flex justify-between mt-2">
              <span>
                🚶 Qui va chercher :{" "}
                {
                  players.find((p) => p.id === fetcher)
                    ?.name
                }
              </span>
              <span>✔️</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={mode === "draw" && step !== "done"}
          className="bg-coffee text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
