import { useEffect, useRef, useState } from "react";

export default function NewGame() {
  const [players, setPlayers] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [played, setPlayed] = useState({});
  const [payer, setPayer] = useState(null);
  const [fetcher, setFetcher] = useState(null);

  const [mode, setMode] = useState("manual"); // manual | draw
  const [step, setStep] = useState("select"); // select | payer | fetcher | done

  const [newPlayer, setNewPlayer] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  /* ===== ROULETTE ===== */
  const wheelRef = useRef(null);
  const angleRef = useRef(0);
  const speedRef = useRef(0);
  const slowingRef = useRef(false);
  const rafRef = useRef(null);

  function loadPlayers() {
    fetch("/api/players/")
      .then((r) => r.json())
      .then(setPlayers);
  }

  useEffect(() => {
    loadPlayers();
  }, []);

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

  /* ===== ROULETTE LOGIC ===== */
  function spinWheel() {
    if (participants().length === 0) {
      setError("Sélectionne au moins un joueur.");
      return;
    }

    setError(null);
    speedRef.current = 0.3;
    slowingRef.current = false;

    function animate() {
      angleRef.current += speedRef.current;
      if (slowingRef.current) {
        speedRef.current *= 0.985;
        if (speedRef.current < 0.002) {
          stopWheel();
          return;
        }
      }
      wheelRef.current.style.transform =
        `rotate(${angleRef.current}rad)`;
      rafRef.current = requestAnimationFrame(animate);
    }

    animate();
  }

  function stopWheel() {
    slowingRef.current = true;

    setTimeout(() => {
      cancelAnimationFrame(rafRef.current);

      const items = participants();
      const slice = (2 * Math.PI) / items.length;
      const index =
        items.length -
        Math.floor((angleRef.current % (2 * Math.PI)) / slice) - 1;

      const winner = items[(index + items.length) % items.length];

      if (step === "payer") {
        setPayer(winner.id);
        setStep("fetcher");
      } else {
        setFetcher(winner.id);
        setStep("done");
      }
    }, 1200);
  }

  /* ===== SUBMIT ===== */
  async function submit(e) {
    e.preventDefault();

    const selectedPlayers = Object.keys(played).filter((id) => played[id]);
    if (!selectedPlayers.length) {
      setError("Sélectionne au moins un joueur.");
      return;
    }

    await fetch("/api/games/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        players: selectedPlayers.map(Number),
        payer,
        fetcher,
      }),
    });

    alert("Partie enregistrée");
    setPlayed({});
    setPayer(null);
    setFetcher(null);
    setStep("select");
  }

  const payerName = players.find((p) => p.id === payer)?.name;
  const fetcherName = players.find((p) => p.id === fetcher)?.name;
  const doublette = payer && fetcher && payer === fetcher;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-lg font-semibold mb-4">Nouvelle partie</h2>

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
            className="border p-2 ml-3"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        {/* MODE */}
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`px-3 py-1 rounded ${
              mode === "manual" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Mode manuel
          </button>
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={`px-3 py-1 rounded ${
              mode === "draw" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Mode tirage
          </button>
        </div>

        {/* TABLE */}
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th>Joueur</th>
              <th>Joue</th>
              <th>Paye</th>
              <th>Cherche</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className={!played[p.id] ? "opacity-50" : ""}>
                <td>{p.name}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={!!played[p.id]}
                    onChange={() => togglePlayed(p.id)}
                  />
                </td>
                <td>
                  <input
                    type="radio"
                    disabled={mode === "draw"}
                    checked={payer === p.id}
                    onChange={() => setPayer(p.id)}
                  />
                </td>
                <td>
                  <input
                    type="radio"
                    disabled={mode === "draw"}
                    checked={fetcher === p.id}
                    onChange={() => setFetcher(p.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ROULETTE */}
        {mode === "draw" && (
          <div className="text-center mb-4">
            <div className="relative w-64 h-64 mx-auto mb-4">
              <div
                ref={wheelRef}
                className="w-full h-full rounded-full border-4 border-coffee relative transition-transform"
              >
                {participants().map((p, i) => (
                  <div
                    key={p.id}
                    className="absolute left-1/2 top-1/2 origin-left text-sm"
                    style={{
                      transform: `rotate(${(360 / participants().length) * i}deg) translateX(120px)`,
                    }}
                  >
                    {p.name}
                  </div>
                ))}
              </div>
              <div className="absolute top-[-10px] left-1/2 -translate-x-1/2">
                ▲
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep("payer");
                  spinWheel();
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Lancer la roulette
              </button>
              <button
                type="button"
                onClick={stopWheel}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Stop
              </button>
            </div>

            {step !== "select" && payerName && (
              <p className="mt-3 font-bold">☕ Payeur : {payerName}</p>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="bg-green-50 p-3 rounded text-center mb-3">
            <p className="font-bold">☕ Paye : {payerName}</p>
            <p className="font-bold">🚶‍♂️ Cherche : {fetcherName}</p>
            {doublette && (
              <p className="mt-2 text-sm bg-yellow-200 inline-block px-3 py-1 rounded">
                🎉 Doublette !
              </p>
            )}
          </div>
        )}

        <button className="bg-coffee text-white px-4 py-2 rounded">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
