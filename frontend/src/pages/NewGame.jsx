import { useEffect, useRef, useState } from "react";

/* =======================
   RANDOM DRAW HOOK
======================= */
function useRandomDraw(participants, onFinish) {
  const [running, setRunning] = useState(false);
  const [currentName, setCurrentName] = useState("???");
  const timerRef = useRef(null);
  const speedRef = useRef(60);
  const indexRef = useRef(0);

  function tick() {
    indexRef.current =
      (indexRef.current + 1) % participants.length;
    setCurrentName(participants[indexRef.current].name);
  }

  function start() {
    if (!participants.length) return;

    clearTimeout(timerRef.current);
    speedRef.current = 60;
    setRunning(true);

    const loop = () => {
      tick();
      timerRef.current = setTimeout(loop, speedRef.current);
    };

    loop();
  }

  function stop() {
    setRunning(false);

    const slowDown = () => {
      speedRef.current += 40;
      tick();

      if (speedRef.current < 400) {
        timerRef.current = setTimeout(
          slowDown,
          speedRef.current
        );
      } else {
        const winner =
          participants[
            Math.floor(Math.random() * participants.length)
          ];
        setCurrentName(winner.name);
        onFinish(winner);
      }
    };

    slowDown();
  }

  return { running, currentName, start, stop };
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

  const [payer, setPayer] = useState(null);
  const [fetcher, setFetcher] = useState(null);
  const [step, setStep] = useState("payer"); // payer → fetcher → done
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/players/")
      .then((r) => r.json())
      .then(setPlayers);
  }, []);

  const participants = players.filter((p) => played[p.id]);

  const draw = useRandomDraw(participants, (winner) => {
    if (step === "payer") {
      setPayer(winner.id);
      setTimeout(() => setStep("fetcher"), 600);
    } else {
      setFetcher(winner.id);
      setStep("done");
    }
  });

  async function submit(e) {
    e.preventDefault();

    if (step !== "done") {
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

      <form
        onSubmit={submit}
        className="bg-white p-4 rounded shadow"
      >
        {error && (
          <div className="bg-red-100 p-2 mb-3 rounded">
            {error}
          </div>
        )}

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
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr
                key={p.id}
                className={`border-b ${
                  draw.currentName === p.name
                    ? "bg-blue-100"
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
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAYEUR BLOQUÉ APRÈS 1ER TIRAGE */}
        <div className="bg-green-50 p-3 rounded mb-4 flex justify-between">
          <span>
            💳 Qui paye le café :{" "}
            {payer
              ? players.find((p) => p.id === payer)?.name
              : "???"}
          </span>
          {payer && <span>✔️</span>}
        </div>

        {/* FETCHER */}
        <div className="bg-blue-50 p-3 rounded mb-4 flex justify-between">
          <span>
            🚶 Qui va chercher le café :{" "}
            {fetcher
              ? players.find((p) => p.id === fetcher)?.name
              : "???"}
          </span>
          {fetcher && <span>✔️</span>}
        </div>

        {/* DRAW */}
        {step !== "done" && (
          <div className="text-center mb-4">
            <div className="text-3xl font-bold h-12 mb-2">
              {draw.currentName}
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
          disabled={step !== "done"}
          className="bg-coffee text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
