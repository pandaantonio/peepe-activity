import { useMemo, useState } from "react";
import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";

// --- Configurações e Lógica ---
const GRID_SIZE = 5;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const HOUSE_EDGE = 0.99;
const OPCOES_MINAS = [1, 3, 5, 10, 15, 24];

const calcMultiplier = (minas, acertos) => {
  if (acertos <= 0) return 1;
  let mult = 1;
  for (let i = 0; i < acertos; i++) {
    mult *= (TOTAL_TILES - i) / (TOTAL_TILES - minas - i);
  }
  return mult * HOUSE_EDGE;
};

const formatCurrency = (val) => val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatMult = (val) => `${val.toFixed(2)}x`;

// --- Componente Principal ---
export default function Mines() {
  const [saldo, setSaldo] = useState(1000);
  const [aposta, setAposta] = useState(10);
  const [numMinas, setNumMinas] = useState(3);
  const [minasSet, setMinasSet] = useState(new Set());
  const [reveladas, setReveladas] = useState(new Set());
  const [jogando, setJogando] = useState(false);
  const [perdeu, setPerdeu] = useState(false);
  const [acertos, setAcertos] = useState(0);

  const multAtual = useMemo(() => calcMultiplier(numMinas, acertos), [numMinas, acertos]);
  const ganhoAtual = aposta * multAtual;

  const iniciarJogo = () => {
    if (aposta > saldo || aposta <= 0) return;
    setSaldo((s) => s - aposta);
    const novasMinas = new Set();
    while (novasMinas.size < numMinas) novasMinas.add(Math.floor(Math.random() * TOTAL_TILES));
    setMinasSet(novasMinas);
    setReveladas(new Set());
    setAcertos(0);
    setPerdeu(false);
    setJogando(true);
  };

  const revelarTile = (index) => {
    if (!jogando || reveladas.has(index)) return;
    const novasReveladas = new Set(reveladas).add(index);
    if (minasSet.has(index)) {
      setReveladas(novasReveladas);
      setPerdeu(true);
      setJogando(false);
    } else {
      setReveladas(novasReveladas);
      setAcertos((a) => a + 1);
      if (acertos + 1 === TOTAL_TILES - numMinas) {
        setSaldo((s) => s + (aposta * calcMultiplier(numMinas, acertos + 1)));
        setJogando(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center">
      {/* Botão Voltar */}
      <Link href="/" className="self-start mb-4">
        <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition">
          <IoArrowBack size={20} /> Voltar
        </button>
      </Link>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        <div className="bg-slate-800 p-6 rounded-xl shadow-xl flex flex-col gap-4">
          <h2 className="text-xl font-bold">Configurações</h2>
          <div className="text-2xl font-bold text-emerald-400">{formatCurrency(saldo)}</div>
          
          <input type="number" value={aposta} onChange={(e) => setAposta(Number(e.target.value))} disabled={jogando} className="bg-slate-700 p-2 rounded w-full"/>
          
          <select value={numMinas} onChange={(e) => setNumMinas(Number(e.target.value))} disabled={jogando} className="bg-slate-700 p-2 rounded">
            {OPCOES_MINAS.map(n => <option key={n} value={n}>{n} minas</option>)}
          </select>

          {!jogando ? (
            <button onClick={iniciarJogo} className="bg-emerald-500 py-3 rounded font-bold hover:bg-emerald-600">Apostar</button>
          ) : (
            <button onClick={() => { setSaldo(s => s + ganhoAtual); setJogando(false); }} className="bg-blue-500 py-3 rounded font-bold hover:bg-blue-600">Sacar {formatCurrency(ganhoAtual)}</button>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: TOTAL_TILES }).map((_, i) => {
            const revelado = reveladas.has(i);
            const ehMina = minasSet.has(i);
            return (
              <button
                key={i}
                onClick={() => revelarTile(i)}
                disabled={!jogando || revelado}
                className={`aspect-square rounded-lg flex items-center justify-center text-2xl transition ${
                  revelado ? (ehMina ? "bg-red-500" : "bg-emerald-500") : "bg-slate-700 hover:bg-slate-600"
                }`}
              >
                {revelado ? (ehMina ? "💣" : "💎") : ""}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}