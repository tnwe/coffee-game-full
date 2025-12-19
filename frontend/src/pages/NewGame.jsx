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
