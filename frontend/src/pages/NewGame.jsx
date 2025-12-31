import { useEffect, useRef, useState } from "react";

/* =======================
   DRAW ENGINE
======================= */
function useDraw(participants, onFinish) {
  const [running, setRunning] = useState(false);
  const [name, setName] = useState("???");
  const timer = useRef(null);
  const index = useRef(0);
  const speed = useRef(60);

  function clear() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  function tick() {
    index.current = (index.current + 1) % participants.length;
    setName(participants[index.current].name);
  }

  function start() {
    if (!participants.length) return;

    clear();
    speed.current = 60;
    setRunning(true);

    const loop = () => {
      tick();
      timer.current = setTimeout(loop, speed.current);
    };

    loop();
  }

  function stop() {
    clear();
    setRunning(false);

    const slowDown = () => {
      tick();
      speed.current += 50;

      if (speed.current < 450) {
        timer.current = setTimeout(slowDown, speed.current);
      } else {
        clear();
        const winner =
          participants[
            Math.floor(Math.random() * participants.length)
          ];
        setName(winner.name);
        onFinish(winner);
      }
    };

    slowDown();
  }

  return { name, running, start, stop };
}

/* =======================
   COMPONENT
======================= */
export default function NewGame() {
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [played, setPlayed] = useState({});
  const [payer, setPayer] = useState(null);
  const [fetcher, setFetcher] = useState(null);
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [mode, setMode] = useState("draw"); // draw | manual
  const [step, setStep] = useState("payer");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/players/")
      .then((r) => r.json())
      .then(setPlayers);

    fetch("/api/games/")
      .then((r) => r.json())
      .then(setGames);
  }, []);

  const participants = players.filter((p) => played[p.id]);

  const draw = useDraw(participants, (winner) => {
    if (step === "payer") {
      setPayer(winner.id);
      setTimeout(() => setStep("fetcher"), 5000);
    } else {
      setFetcher(winner.id);
      setStep("done");
    }
  });

  function alreadyExistsForDate() {
    return games.some((g) => g.date === date);
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);

    if (alreadyExistsForDate()) {
      setError("Une partie existe déjà pour cette date.");
      return;
    }

    if (!participants.length) {
      setError("Sélectionne au moins un joueur.");
      return;
    }

    if (!payer || !fetcher) {
      setError("Résultats incomplets.");
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

      <form
        onSubmit={submit}
        className="bg-white p-4 rounded shadow"
      >
        {error && (
          <div className="bg-red-100 p-2 mb-3 rounded">
            {error}
          </div>
        )}

        {/* MODE */}
        <div className="flex gap-4 mb-4">
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={`px-3 py-1 rounded ${
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
            className={`px-3 py-1 rounded ${
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
          Date
          <input
            type="date"
            className="border p-2 ml-3"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        {/* TABLE */}
        <table className="w-full mb-6 text-center">
          <thead>
            <tr className="bg-gray-100 text-lg">
              <th className="p-2">Joueur</th>
              <th className="p-2">Joue</th>
              {mode === "manual" && (
                <>
                  <th className="p-2">Paye</th>
                  <th className="p-2">Cherche</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="border-b">
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

                {mode === "manual" && (
                  <>
                    <td>
                      <input
                        type="radio"
                        name="payer"
                        disabled={!played[p.id]}
                        checked={payer === p.id}
                        onChange={() => setPayer(p.id)}
                      />
                    </td>
                    <td>
                      <input
                        type="radio"
                        name="fetcher"
                        disabled={!played[p.id]}
                        checked={fetcher === p.id}
                        onChange={() => setFetcher(p.id)}
                      />
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* DRAW UI */}
        {mode === "draw" && step !== "done" && (
          <div className="text-center mb-4">
            <div className="text-3xl font-bold h-12 mb-2">
              {draw.name}
            </div>

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
          </div>
        )}

        <button
          type="submit"
          className="bg-coffee text-white px-4 py-2 rounded"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
