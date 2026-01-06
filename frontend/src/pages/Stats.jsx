alert("Stats mounted");
import { useEffect, useState } from "react";

export default function Stats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("/api/stats/")
      .then(r => r.json())
      .then(setStats)
      .catch(err => {
        console.error("stats error", err);
        setStats({ error: true });
      });
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Statistiques</h2>

      {!stats && <p>Chargement…</p>}

      {stats?.error && (
        <p className="text-red-600">Erreur API stats</p>
      )}

      {stats && !stats.error && (
        <pre className="mt-4 bg-gray-100 p-3 rounded">
          {JSON.stringify(stats, null, 2)}
        </pre>
      )}
    </div>
  );
}
