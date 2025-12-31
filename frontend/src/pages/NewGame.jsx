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
    if (!participants.length) return;
    index.current = (index.current + 1) % participants.length;
    setName(participants[index.current].name);
  }

  function start() {
    if (!participants.length) return;

    clear();
    setRunning(true);
    speed.current = 60;

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
          participants[Math.floor(Math.random() * participants.length)];
        setName(winner.name);
        onFinish(winner);
      }
    };

    slowDown();
  }

  function reset() {
    clear();
    setName("???");
    setRunning(false);
  }

  return { name, running, start, stop, reset };
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
  const [step, setStep] = useState("payer"); // payer | fetcher | done
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
      setTimeout(() => {
        draw.reset();
        setStep("fetcher");
      }, 3000);
    } else {
      setFetcher(winner.id);
      setStep("done");
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
      setError("Tirages incomplets.");
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
      draw.reset();
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

        {/* TABLE JOUEURS */}
        <table className="w-full mb-6 text-center">
          <thead>
            <tr className="bg-gray-100 text-lg">
              <th className="p-2">Joueur</th>
              <th className="p-2">Joue</th>
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
              </tr>
            ))}
          </tbody>
        </table>

        {/* ===== TIRAGE UI ===== */}
        {mode === "draw" && (
          <div className="bg-gray-50 p-4 rounded mb-4 text-center">
            <h3 className="font-semibold text-lg mb-2">
              {step === "payer"
                ? "Qui paye le café ?"
                : "Qui va chercher le café ?"}
            </h3>

            <div className="text-3xl font-bold h-12 mb-3">
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

            <div className="mt-4 text-left">
              {payer && (
                <div className="bg-blue-100 p-2 rounded mb-2">
                  💳 Qui paye :{" "}
                  <strong>
                    {
                      players.find((p) => p.id === payer)
                        ?.name
                    }
                  </strong>{" "}
                  ✅
                </div>
              )}
              {fetcher && (
                <div className="bg-green-100 p-2 rounded">
                  🚶 Qui va chercher :{" "}
                  <strong>
                    {
                      players.find(
                        (p) => p.id === fetcher
                      )?.name
                    }
                  </strong>{" "}
                  ✅
                </div>
              )}
            </div>
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
