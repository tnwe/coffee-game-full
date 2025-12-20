import { useEffect, useState } from "react";

export default function NewGame() {
  const [players, setPlayers] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [played, setPlayed] = useState({});
  const [payer, setPayer] = useState(null);
  const [fetcher, setFetcher] = useState(null);

  const [newPlayer, setNewPlayer] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  // tirage au sort
  const [step, setStep] = useState("select"); 
  // select | draw_payer | draw_fetcher | done
  const [rollingName, setRollingName] = useState(null);
  const [rolling, setRolling] = useState(false);

  function loadPlayers() {
    fetch("/api/players/")
      .then((r) => r.json())
      .then(setPlayers)
      .catch(() => setPlayers([]));
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
      const err = await res.json();
      alert(err.detail || "Erreur lors de l'ajout du joueur");
    }
    setAdding(false);
  }

  function getParticipants() {
    return players.filter((p) => played[p.id]);
  }

  function startDraw(type) {
    const participants = getParticipants();
    if (participants.length === 0) {
      setError("Sélectionne au moins un joueur avant le tirage.");
      return;
    }

    setError(null);
    setRolling(true);
    setRollingName(null);

    let i = 0;
    const interval = setInterval(() => {
      setRollingName(participants[i % participants.length].name);
      i++;
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      const winner =
        participants[Math.floor(Math.random() * participants.length)];

      setRolling(false);
      setRollingName(winner.name);

      if (type === "payer") {
        setPayer(winner.id);
        setStep("draw_fetcher");
      } else {
        setFetcher(winner.id);
        setStep("done");
      }
    }, 2000);
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);

    const selectedPlayers = Object.keys(played).filter((id) => played[id]);

    if (selectedPlayers.length === 0) {
      setError("Sélectionne au moins un joueur ayant participé à la partie.");
      return;
    }

    const payload = {
      date,
      players: selectedPlayers.map(Number),
      payer: payer ? Number(payer) : null,
      fetcher: fetcher ? Number(fetcher) : null,
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
      setStep("select");
    } else {
      setError("Erreur lors de l'enregistrement");
    }
  }

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
            className="border p-2 ml-3"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        {/* TABLEAU JOUEURS */}
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Joueur</th>
              <th className="p-2">A joué</th>
              <th className="p-2">A payé</th>
              <th className="p-2">Est allé chercher</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const hasPlayed = !!played[p.id];

              return (
                <tr
                  key={p.id}
                  className={`border-b ${!hasPlayed ? "opacity-50" : ""}`}
                >
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
                      disabled={!hasPlayed}
                      checked={payer === p.id}
                      onChange={() => setPayer(p.id)}
                    />
                  </td>

                  <td className="p-2 text-center">
                    <input
                      type="radio"
                      name="fetcher"
                      disabled={!hasPlayed}
                      checked={fetcher === p.id}
                      onChange={() => setFetcher(p.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* TIRAGES AU SORT */}
        {step === "select" && (
          <button
            type="button"
            onClick={() => setStep("draw_payer")}
            className="bg-blue-600 text-white px-4 py-2 rounded mb-3"
          >
            🎲 Tirer au sort
          </button>
        )}

        {(step === "draw_payer" || step === "draw_fetcher") && (
          <div className="bg-gray-50 p-4 rounded mb-3 text-center">
            <h3 className="font-semibold mb-2">
              {step === "draw_payer"
                ? "Qui paye le café ?"
                : "Qui va chercher le café ?"}
            </h3>

            <div className="text-2xl font-bold h-10">
              {rollingName || "—"}
            </div>

            {!rolling && (
              <button
                type="button"
                onClick={() =>
                  startDraw(step === "draw_payer" ? "payer" : "fetcher")
                }
                className="mt-3 bg-coffee text-white px-4 py-2 rounded"
              >
                Lancer le tirage
              </button>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="bg-green-50 p-4 rounded mb-3">
            <p>☕ Payeur : {players.find(p => p.id === payer)?.name}</p>
            <p>🚶‍♂️ Chercheur : {players.find(p => p.id === fetcher)?.name}</p>
          </div>
        )}

        <button
          className="bg-coffee text-white px-4 py-2 rounded"
          type="submit"
        >
          Enregistrer
        </button>
      </form>

      {/* AJOUT JOUEUR — TOUT EN BAS */}
      <div className="bg-white p-4 rounded shadow mt-6 flex gap-3 items-center">
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
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}
