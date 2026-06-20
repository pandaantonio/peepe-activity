// pages/game/blackjack.js
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { GiCardAceSpades } from 'react-icons/gi';
import { FiArrowLeft } from 'react-icons/fi';

/* ─────────────────────────────────────────────
   CONSTANTES DO BARALHO
───────────────────────────────────────────── */
const SUITS  = ['♠', '♥', '♦', '♣'];
const RANKS  = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RED    = new Set(['♥', '♦']);

/* ─────────────────────────────────────────────
   FUNÇÕES UTILITÁRIAS
───────────────────────────────────────────── */
function buildDeck() {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) d.push({ s, r });
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function cardVal(c) {
  if (['J', 'Q', 'K'].includes(c.r)) return 10;
  if (c.r === 'A') return 11;
  return parseInt(c.r);
}

function handValue(hand) {
  let v = 0, aces = 0;
  for (const c of hand) { v += cardVal(c); if (c.r === 'A') aces++; }
  while (v > 21 && aces > 0) { v -= 10; aces--; }
  return v;
}

function fmt(n) {
  return '$' + n.toLocaleString('pt-BR');
}

/* ─────────────────────────────────────────────
   COMPONENTE: CARD VISUAL
───────────────────────────────────────────── */
function PlayingCard({ card, hidden = false, delay = 0 }) {
  const isRed = !hidden && RED.has(card.s);

  if (hidden) {
    return (
      <div
        className="card-back relative w-16 h-24 rounded-xl border-2 border-white/20 overflow-hidden"
        style={{
          background: 'repeating-linear-gradient(45deg,#1a3a8a 0px,#1a3a8a 6px,#122a6b 6px,#122a6b 12px)',
          animationDelay: `${delay}ms`,
        }}
      />
    );
  }

  return (
    <div
      className="card-enter relative w-16 h-24 rounded-xl bg-white shadow-xl flex flex-col justify-between p-1.5 select-none"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`text-xs font-bold leading-tight ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        {card.r}<br />{card.s}
      </div>
      <div className={`text-2xl text-center leading-none ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        {card.s}
      </div>
      <div className={`text-xs font-bold leading-tight rotate-180 ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        {card.r}<br />{card.s}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMPONENTE: FICHA
───────────────────────────────────────────── */
const CHIPS = [
  { value: 5,   label: '$5',   bg: 'bg-red-500',    border: 'border-red-300' },
  { value: 10,  label: '$10',  bg: 'bg-blue-500',   border: 'border-blue-300' },
  { value: 25,  label: '$25',  bg: 'bg-green-600',  border: 'border-green-300' },
  { value: 50,  label: '$50',  bg: 'bg-purple-600', border: 'border-purple-300' },
  { value: 100, label: '$100', bg: 'bg-orange-500', border: 'border-orange-300' },
];

function Chip({ value, label, bg, border, onClick, disabled }) {
  return (
    <button
      onClick={() => onClick(value)}
      disabled={disabled}
      className={`
        w-12 h-12 rounded-full ${bg} border-4 border-dashed ${border}
        text-white text-xs font-bold
        flex items-center justify-center
        transition-all duration-150
        hover:scale-110 hover:brightness-110
        active:scale-95
        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
      `}
    >
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────
   COMPONENTE: BOTÃO DE AÇÃO
───────────────────────────────────────────── */
function ActionBtn({ onClick, disabled, children, variant = 'default' }) {
  const base = 'px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed';
  const variants = {
    default: 'bg-white/10 border border-white/20 text-white hover:bg-white/20',
    primary: 'bg-green-500 text-white hover:bg-green-400 shadow-lg shadow-green-500/30',
    danger:  'bg-red-600/70 border border-red-500/50 text-white hover:bg-red-600/90',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   COMPONENTE: OVERLAY DE RESULTADO
───────────────────────────────────────────── */
function ResultOverlay({ result, onNext }) {
  if (!result) return null;

  const cfg = {
    blackjack:   { emoji: '🃏', title: 'Blackjack!',        color: 'text-yellow-300', sub: `+${fmt(result.gain)}` },
    'dealer-bust':{ emoji: '🎉', title: 'Dealer estourou!',  color: 'text-green-300',  sub: `+${fmt(result.gain)}` },
    win:         { emoji: '✅', title: 'Você Ganhou!',       color: 'text-green-300',  sub: `+${fmt(result.gain)}` },
    push:        { emoji: '🤝', title: 'Empate',             color: 'text-yellow-300', sub: 'Aposta devolvida' },
    bust:        { emoji: '💥', title: 'Passou de 21!',      color: 'text-red-400',    sub: `-${fmt(result.lost)}` },
    lose:        { emoji: '❌', title: 'Dealer Venceu',      color: 'text-red-400',    sub: `-${fmt(result.lost)}` },
  }[result.type] || {};

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 rounded-2xl backdrop-blur-sm">
      <div className="bg-[#0c0c18]/95 border border-white/10 rounded-2xl px-10 py-8 text-center shadow-2xl">
        <div className="text-5xl mb-3">{cfg.emoji}</div>
        <div className={`text-3xl font-bold mb-1 ${cfg.color}`}>{cfg.title}</div>
        <div className="text-gray-400 text-sm mb-6">{cfg.sub}</div>
        <button
          onClick={onNext}
          className="px-8 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-400 transition-colors shadow-lg shadow-green-500/30"
        >
          Jogar Novamente
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PÁGINA PRINCIPAL
───────────────────────────────────────────── */
export default function BlackjackPage() {
  const [deck,        setDeck]        = useState([]);
  const [playerHand,  setPlayerHand]  = useState([]);
  const [dealerHand,  setDealerHand]  = useState([]);
  const [balance,     setBalance]     = useState(1000);
  const [bet,         setBet]         = useState(0);
  const [phase, setPhase] = useState('betting'); // 'betting' | 'playing' | 'dealer' | 'result'
  const [result,      setResult]      = useState(null);
  const [hideSecond,  setHideSecond]  = useState(true);

  // Inicializa o baralho
  useEffect(() => { setDeck(buildDeck()); }, []);

  /* ── APOSTA ── */
  const addBet = useCallback((v) => {
    if (phase !== 'betting') return;
    setBet(prev => {
      const next = prev + v;
      return next > balance ? prev : next;
    });
  }, [phase, balance]);

  const clearBet = () => { if (phase === 'betting') setBet(0); };

  /* ── DISTRIBUIR ── */
  const deal = useCallback(() => {
    if (bet === 0 || phase !== 'betting') return;

    let d = deck.length < 15 ? buildDeck() : [...deck];
    const ph = [d.pop(), d.pop()];
    const dh = [d.pop(), d.pop()];

    setDeck(d);
    setPlayerHand(ph);
    setDealerHand(dh);
    setBalance(b => b - bet);
    setHideSecond(true);
    setResult(null);

    if (handValue(ph) === 21) {
      // Blackjack imediato — revela dealer depois de um delay
      setPhase('dealer');
      setTimeout(() => runDealer(dh, ph, d, bet, true), 600);
    } else {
      setPhase('playing');
    }
  }, [bet, phase, deck]);

  /* ── PEDIR ── */
  const hit = useCallback(() => {
    if (phase !== 'playing') return;
    let d = [...deck];
    const ph = [...playerHand, d.pop()];
    setDeck(d);
    setPlayerHand(ph);
    const v = handValue(ph);
    if (v > 21) { setHideSecond(false); finish('bust', bet, ph, dealerHand); }
    else if (v === 21) { setPhase('dealer'); setTimeout(() => runDealer(dealerHand, ph, d, bet), 600); }
  }, [phase, deck, playerHand, dealerHand, bet]);

  /* ── PARAR ── */
  const stand = useCallback(() => {
    if (phase !== 'playing') return;
    setPhase('dealer');
    setTimeout(() => runDealer(dealerHand, playerHand, deck, bet), 400);
  }, [phase, dealerHand, playerHand, deck, bet]);

  /* ── DOBRAR ── */
  const doubleDown = useCallback(() => {
    if (phase !== 'playing' || balance < bet) return;
    let d = [...deck];
    const ph = [...playerHand, d.pop()];
    const newBet = bet * 2;
    setDeck(d);
    setPlayerHand(ph);
    setBet(newBet);
    setBalance(b => b - bet); // cobra o bet adicional
    if (handValue(ph) > 21) { setHideSecond(false); finish('bust', newBet, ph, dealerHand); }
    else { setPhase('dealer'); setTimeout(() => runDealer(dealerHand, ph, d, newBet), 400); }
  }, [phase, balance, bet, deck, playerHand, dealerHand]);

  /* ── LOOP DO DEALER ── */
  function runDealer(dh, ph, d, currentBet, playerBJ = false) {
    setHideSecond(false);

    function step(hand, deckSnap) {
      const v = handValue(hand);
      if (v < 17) {
        const newDeck = [...deckSnap];
        const newHand = [...hand, newDeck.pop()];
        setDealerHand(newHand);
        setDeck(newDeck);
        setTimeout(() => step(newHand, newDeck), 550);
      } else {
        const pv = handValue(ph);
        const dv = handValue(hand);
        const dealerBJ = dv === 21 && hand.length === 2;

        if      (playerBJ && !dealerBJ)  finish('blackjack',    currentBet, ph, hand);
        else if (playerBJ && dealerBJ)   finish('push',         currentBet, ph, hand);
        else if (dv > 21)                finish('dealer-bust',  currentBet, ph, hand);
        else if (pv > dv)                finish('win',          currentBet, ph, hand);
        else if (pv === dv)              finish('push',         currentBet, ph, hand);
        else                             finish('lose',         currentBet, ph, hand);
      }
    }
    step(dh, d);
  }

  /* ── RESULTADO FINAL ── */
  function finish(type, currentBet, ph, dh) {
    setDealerHand(dh);
    setPhase('result');

    let won = 0;
    if      (type === 'blackjack')   won = Math.floor(currentBet * 2.5);
    else if (type === 'dealer-bust') won = currentBet * 2;
    else if (type === 'win')         won = currentBet * 2;
    else if (type === 'push')        won = currentBet;

    setBalance(b => {
      const newB = b + won;
      if (newB === 0) setTimeout(() => setBalance(1000), 1500);
      return newB;
    });

    setResult({
      type,
      gain: won > currentBet ? won - currentBet : (type === 'push' ? 0 : 0),
      lost: type !== 'push' && won === 0 ? currentBet : 0,
    });
  }

  /* ── NOVA RODADA ── */
  const newRound = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setBet(0);
    setResult(null);
    setHideSecond(true);
    setPhase('betting');
    if (deck.length < 15) setDeck(buildDeck());
  };

  /* ── COMPUTED ── */
  const pv = playerHand.length ? handValue(playerHand) : 0;
  const dv = dealerHand.length ? handValue(dealerHand) : 0;
  const isPlaying = phase === 'playing';
  const isBetting = phase === 'betting';

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#04040a] flex flex-col items-center justify-start pt-10 pb-16 px-4">
      {/* Nebulosa de fundo */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(34,197,94,0.10), transparent 45%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.08), transparent 45%)',
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 w-full max-w-2xl flex items-center justify-between mb-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <FiArrowLeft size={16} />
          Voltar ao hub
        </Link>
        <div className="flex items-center gap-2 text-green-300 font-semibold text-lg">
          <GiCardAceSpades size={22} />
          Blackjack
        </div>
        <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm font-semibold text-yellow-300">
          {fmt(balance)}
        </div>
      </div>

      {/* Mesa */}
      <div className="relative z-10 w-full max-w-2xl">
        <div
          className="relative rounded-2xl overflow-hidden p-6"
          style={{
            background: 'radial-gradient(ellipse 90% 70% at 50% 50%, #1e7d45 0%, #155c33 60%, #0f4224 100%)',
            border: '2px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px -10px rgba(0,0,0,0.8)',
          }}
        >
          {/* Anel interno da mesa */}
          <div
            className="absolute inset-3 rounded-xl pointer-events-none"
            style={{ border: '1.5px solid rgba(255,255,255,0.1)' }}
          />

          {/* ── ZONA DO DEALER ── */}
          <div className="relative mb-4">
            <p className="text-center text-xs text-white/40 tracking-widest uppercase mb-3">Dealer</p>
            <div className="flex gap-2 justify-center flex-wrap min-h-[96px] items-center">
              {dealerHand.length === 0
                ? <span className="text-white/20 text-sm">Aguardando...</span>
                : dealerHand.map((c, i) => (
                    <PlayingCard
                      key={i}
                      card={c}
                      hidden={hideSecond && i === 1}
                      delay={i * 80}
                    />
                  ))
              }
            </div>
            {dealerHand.length > 0 && (
              <div className="mt-2 text-center">
                <span className="inline-block bg-black/40 border border-white/15 text-white text-xs rounded-full px-3 py-0.5">
                  {hideSecond ? '?' : dv}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 my-4" />

          {/* ── ZONA DO JOGADOR ── */}
          <div className="relative mb-5">
            <p className="text-center text-xs text-white/40 tracking-widest uppercase mb-3">Você</p>
            <div className="flex gap-2 justify-center flex-wrap min-h-[96px] items-center">
              {playerHand.length === 0
                ? <span className="text-white/20 text-sm">Faça sua aposta</span>
                : playerHand.map((c, i) => (
                    <PlayingCard key={i} card={c} delay={i * 80} />
                  ))
              }
            </div>
            {playerHand.length > 0 && (
              <div className="mt-2 text-center">
                <span className={`inline-block border text-xs rounded-full px-3 py-0.5 ${
                  pv > 21
                    ? 'bg-red-500/20 border-red-400/40 text-red-300'
                    : pv === 21
                    ? 'bg-yellow-400/20 border-yellow-300/40 text-yellow-200'
                    : 'bg-black/40 border-white/15 text-white'
                }`}>
                  {pv}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 mb-4" />

          {/* ── APOSTA E FICHAS ── */}
          <div className="text-center mb-4">
            <p className="text-xs text-white/40 tracking-widest uppercase mb-1">Aposta</p>
            <p className="text-3xl font-semibold text-yellow-300 mb-3">{fmt(bet)}</p>
            <div className="flex gap-2 justify-center flex-wrap mb-4">
              {CHIPS.map(c => (
                <Chip key={c.value} {...c} onClick={addBet} disabled={!isBetting} />
              ))}
            </div>
          </div>

          {/* ── BOTÕES DE AÇÃO ── */}
          <div className="flex gap-2 justify-center flex-wrap">
            <ActionBtn onClick={clearBet}    disabled={!isBetting}    variant="default">Limpar</ActionBtn>
            <ActionBtn onClick={deal}        disabled={!isBetting || bet === 0} variant="primary">Distribuir</ActionBtn>
            <ActionBtn onClick={hit}         disabled={!isPlaying}    variant="default">Pedir</ActionBtn>
            <ActionBtn onClick={stand}       disabled={!isPlaying}    variant="default">Parar</ActionBtn>
            <ActionBtn onClick={doubleDown}  disabled={!isPlaying || balance < bet} variant="danger">Dobrar</ActionBtn>
          </div>

          {/* ── OVERLAY DE RESULTADO ── */}
          <ResultOverlay result={result} onNext={newRound} />
        </div>

        {/* Legenda de regras */}
        <p className="text-center text-xs text-gray-600 mt-4">
          Blackjack paga 2.5× · Dealer para em 17 · Sem divisão de mãos
        </p>
      </div>

      {/* Animações */}
      <style jsx global>{`
        @keyframes dealIn {
          from { opacity: 0; transform: translateY(-16px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .card-enter {
          animation: dealIn 0.2s ease both;
        }
        .card-back {
          animation: dealIn 0.2s ease both;
        }
      `}</style>
    </div>
  );
}