import { Wheel } from "react-custom-roulette";
import { useState } from "react";

export default function WheelDraw({ players, onResult }) {
  const [spinning, setSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState(null);

  const data = players.map(p => ({ option: p.name }));

  function spin() {
    const idx = Math.floor(Math.random() * players.length);
    setWinnerIndex(idx);
    setSpinning(true);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Wheel
        mustStartSpinning={spinning}
        prizeNumber={winnerIndex}
        data={data}
        onStopSpinning={() => {
          setSpinning(false);
          onResult(players[winnerIndex]);
        }}
      />
      <button
        onClick={spin}
        className="bg-coffee text-white px-4 py-2 rounded"
      >
        Tirer au sort
      </button>
    </div>
  );
}
