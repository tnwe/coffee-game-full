import { useEffect, useState } from "react";

export default function NewGame() {
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [rollingName, setRollingName] = useState(null);
  const [rolling, setRolling] = useState(false);

  const [payer, setPayer] = useState(null);
  const [fetcher, setFetcher] = useState(null);

  const [step, setStep] = useState("select"); // select | draw_payer | draw_fetcher | done

  useEffect(() => {
    fetch("/api/players/")
      .then((r) => r.json())
      .then(setPlayers);
  }, []);

  function getPlayerName(id) {
    return players.find((p) => p.id === id)?.name;
  }

  function togglePlayer(id) {
    setSelectedPlayers((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id]
    );
  }

  function startDraw(type) {
    if (rolling) return;

    setRolling(true);
    let i = 0;

    const interval = setInterval(() => {
      setRollingName(
        getPlayerName(
          selectedPlayers[Math.floor(Math.random() * selectedPlayers.length)]
        )
      );
      i++;
    }, 80);

    setTimeout(() => {
      clearInterval(interval);

      const chosen =
        selectedPlayers[Math.floor(Math.random() * selectedPlayers.length)];

      setRollingName(null);
      setRolling(false);

      if (type === "payer") {
        setPayer(chosen);
        setStep("draw_fetcher");
      } else {
        setFetcher(chosen);
        setStep("done");
      }
    }, 1800);
  }

  async function saveGame() {
    await fetch("/api/games/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        players: selectedPlayers,
        payer,
        fetcher,
      }),
    });

    setSelectedPlayers([]);
    setPayer(null);
    setFetcher(null);
    setStep("select");
  }

  const isDoublette = payer && fetcher && payer === fetcher;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6 relative overflow-hidden">

      {/* 🎉 CONFETTIS */}
      {isDoublette && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="confetti" />
        </div>
      )}

      <h2 className="text-lg font-semibold">Nouvelle partie</h2>

      {/* ===== SÉLECTION ===== */}
      {step === "select" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlayer(p.id)}
                className={`p-2 rounded border transition-all ${
                  selectedPlayers.includes(p.id)
                    ? "bg-coffee text-white scale-105"
                    : "bg-white"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <button
            disabled={selectedPlayers.length < 2}
            onClick={() => setStep("draw_payer")}
            className="w-full bg-coffee text-white py-2 rounded disabled:opacity-40"
          >
            Lancer les tirages
          </button>
        </>
      )}

      {/* ===== TIRAGES ===== */}
      {(step === "draw_payer" || step === "draw_fetcher") && (
        <div className="bg-gray-50 p-4 rounded text-center space-y-4">

          {/* PAYEUR FIXÉ */}
          {payer && (
            <div className="animate-pop bg-green-100 text-green-700 py-2 rounded font-semibold">
              ☕ Paye : {getPlayerName(payer)}
            </div>
          )}

          {/* FETCHER FIXÉ */}
          {fetcher && (
            <div className="animate-pop bg-blue-100 text-blue-700 py-2 rounded font-semibold">
              🚶 Cherche : {getPlayerName(fetcher)}
            </div>
          )}

          <h3 className="font-semibold">
            {step === "draw_payer"
              ? "Qui paye le café ?"
              : "Qui va chercher le café ?"}
          </h3>

          {/* ANIMATION */}
          <div className="text-3xl font-bold h-10 animate-pulse">
            {rollingName || "—"}
          </div>

          {!rolling && (
            <button
              onClick={() =>
                startDraw(step === "draw_payer" ? "payer" : "fetcher")
              }
              className="bg-coffee text-white px-4 py-2 rounded"
            >
              Lancer le tirage
            </button>
          )}
        </div>
      )}

      {/* ===== RÉSULTAT FINAL ===== */}
      {step === "done" && (
        <div
          className={`p-4 rounded shadow text-center space-y-3 animate-pop ${
            isDoublette ? "bg-yellow-100" : "bg-white"
          }`}
        >
          <div className="font-semibold text-lg">
            ☕ Paye : {getPlayerName(payer)}
          </div>
          <div className="font-semibold text-lg">
            🚶 Cherche : {getPlayerName(fetcher)}
          </div>

          {isDoublette && (
            <div className="text-yellow-700 font-bold">
              🎉 DOUBLETTE ! Cas spécial !
            </div>
          )}

          <button
            onClick={saveGame}
            className="bg-coffee text-white px-4 py-2 rounded"
          >
            Enregistrer la partie
          </button>
        </div>
      )}

      {/* ===== STYLES CONFETTIS ===== */}
      <style>{`
        .animate-pop {
          animation: pop 0.4s ease-out;
        }
        @keyframes pop {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .confetti::before {
          content: "🎉 🎊 🎉 🎊 🎉 🎊 🎉 🎊";
          position: absolute;
          top: -10px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 2rem;
          animation: fall 1.5s linear infinite;
        }

        @keyframes fall {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
