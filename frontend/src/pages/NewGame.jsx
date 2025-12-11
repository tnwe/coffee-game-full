import { useEffect, useState } from "react";

export default function NewGame() {
  const [players, setPlayers] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [played, setPlayed] = useState({}); // {playerId: true}
  const [payer, setPayer] = useState(null);
  const [fetcher, setFetcher] = useState(null);

  useEffect(() => {
    fetch("/api/players")
      .then(r => r.json())
      .then(setPlayers)
      .catch(() => setPlayers([]));
  }, []);

  function togglePlayed(id) {
    setPlayed(p => ({ ...p, [id]: !p[id] }));
  }

  async function submit(e) {
    e.preventDefault();
    const payload = {
      date,
      players: Object.keys(played).filter(id => played[id]).map(id => Number(id)),
      payer: payer ? Number(payer) : null,
      fetcher: fetcher ? Number(fetcher) : null
    };

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert("Partie enregistrée");
      // reset
      setPlayed({});
      setPayer(null);
      setFetcher(null);
    } else {
      alert("Erreur lors de l'enregistrement");
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-lg font-semibold mb-4">Nouvelle partie</h2>

      <form onSubmit={submit} className="bg-white p-4 rounded shadow">
        <label className="block mb-3">
          Date
          <input className="border p-2 ml-3" type="date" value={date} onChange={e=>setDate(e.target.value)} />
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
            {players.map(p => (
              <tr key={p.id} className="border-b">
                <td className="p-2">{p.name}</td>
                <td className="p-2 text-center">
                  <input type="checkbox" checked={!!played[p.id]} onChange={()=>togglePlayed(p.id)} />
                </td>
                <td className="p-2 text-center">
                  <input type="radio" name="payer" checked={payer==p.id} onChange={()=>setPayer(p.id)} />
                </td>
                <td className="p-2 text-center">
                  <input type="radio" name="fetcher" checked={fetcher==p.id} onChange={()=>setFetcher(p.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex gap-3">
          <button className="bg-coffee text-white px-4 py-2 rounded" type="submit">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}
