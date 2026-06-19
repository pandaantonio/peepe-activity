import { useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { IoArrowBack } from 'react-icons/io5';

const LEVELS = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 },
};

const NUMBER_COLORS = {
    1: 'text-blue-600',
    2: 'text-green-600',
    3: 'text-red-600',
    4: 'text-indigo-700',
    5: 'text-amber-700',
    6: 'text-cyan-600',
    7: 'text-black',
    8: 'text-gray-600',
};

function createEmptyBoard(rows, cols) {
    return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
            mine: false,
            revealed: false,
            flagged: false,
            neighbors: 0,
        }))
    );
}

function placeMines(board, rows, cols, mines, avoidRow, avoidCol) {
    let placed = 0;
    while (placed < mines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        const isSafeZone = Math.abs(r - avoidRow) <= 1 && Math.abs(c - avoidCol) <= 1;
        if (board[r][c].mine || isSafeZone) continue;
        board[r][c].mine = true;
        placed++;
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].mine) continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) {
                        count++;
                    }
                }
            }
            board[r][c].neighbors = count;
        }
    }
    return board;
}

export default function Minesweeper() {
    const [level, setLevel] = useState('easy');
    const { rows, cols, mines } = LEVELS[level];

    const [board, setBoard] = useState(() => createEmptyBoard(rows, cols));
    const [started, setStarted] = useState(false);
    const [gameState, setGameState] = useState('playing'); // playing | won | lost
    const [flagsUsed, setFlagsUsed] = useState(0);

    const restart = useCallback((newLevel) => {
        const cfg = LEVELS[newLevel || level];
        setLevel(newLevel || level);
        setBoard(createEmptyBoard(cfg.rows, cfg.cols));
        setStarted(false);
        setGameState('playing');
        setFlagsUsed(0);
    }, [level]);

    function revealEmptyNeighbors(board, r, c, rowsN, colsN) {
        const stack = [[r, c]];
        const visited = new Set();
        while (stack.length) {
            const [cr, cc] = stack.pop();
            const key = `${cr}-${cc}`;
            if (visited.has(key)) continue;
            visited.add(key);
            const cell = board[cr][cc];
            if (cell.flagged) continue;
            cell.revealed = true;
            if (cell.neighbors === 0) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = cr + dr;
                        const nc = cc + dc;
                        if (nr >= 0 && nr < rowsN && nc >= 0 && nc < colsN && !(dr === 0 && dc === 0)) {
                            if (!board[nr][nc].revealed && !board[nr][nc].mine) {
                                stack.push([nr, nc]);
                            }
                        }
                    }
                }
            }
        }
    }

    function checkWin(board, rowsN, colsN) {
        for (let r = 0; r < rowsN; r++) {
            for (let c = 0; c < colsN; c++) {
                const cell = board[r][c];
                if (!cell.mine && !cell.revealed) return false;
            }
        }
        return true;
    }

    function handleCellClick(r, c) {
        if (gameState !== 'playing') return;
        if (board[r][c].flagged || board[r][c].revealed) return;

        let newBoard = board.map((row) => row.map((cell) => ({ ...cell })));

        if (!started) {
            newBoard = placeMines(newBoard, rows, cols, mines, r, c);
            setStarted(true);
        }

        if (newBoard[r][c].mine) {
            for (let ri = 0; ri < rows; ri++) {
                for (let ci = 0; ci < cols; ci++) {
                    if (newBoard[ri][ci].mine) newBoard[ri][ci].revealed = true;
                }
            }
            setBoard(newBoard);
            setGameState('lost');
            return;
        }

        revealEmptyNeighbors(newBoard, r, c, rows, cols);
        setBoard(newBoard);

        if (checkWin(newBoard, rows, cols)) {
            setGameState('won');
        }
    }

    function toggleFlag(e, r, c) {
        e.preventDefault();
        if (gameState !== 'playing') return;
        if (board[r][c].revealed) return;

        const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
        const cell = newBoard[r][c];

        if (!cell.flagged && flagsUsed >= mines) return;

        cell.flagged = !cell.flagged;
        setFlagsUsed((prev) => prev + (cell.flagged ? 1 : -1));
        setBoard(newBoard);
    }

    const minesRemaining = mines - flagsUsed;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 bg-slate-800">
            <Head>
                <title>Minesweeper</title>
            </Head>

            <Link href="/" className="fixed top-4 left-4">
                <button className="p-2 bg-slate-700 text-slate-100 rounded-full hover:bg-slate-600">
                    <IoArrowBack size={24} />
                </button>
            </Link>

            <h1 className="text-3xl font-bold text-slate-100 tracking-wide">💣 Minesweeper</h1>

            <div className="flex flex-wrap gap-2 justify-center">
                {Object.keys(LEVELS).map((key) => (
                    <button
                        key={key}
                        onClick={() => restart(key)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${level === key
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                            }`}
                    >
                        {key}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-4 bg-slate-900 rounded-lg px-4 py-2 shadow-md">
                <div className="flex items-center gap-2 text-slate-100 font-mono text-lg">
                    🚩 <span>{minesRemaining}</span>
                </div>

                <button
                    onClick={() => restart()}
                    className="text-2xl px-3 py-1 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors"
                    title="Restart"
                >
                    {gameState === 'lost' ? '😵' : gameState === 'won' ? '😎' : '🙂'}
                </button>

                <div className="text-slate-100 font-mono text-sm w-24 text-right">
                    {gameState === 'won' && <span className="text-emerald-400">You won!</span>}
                    {gameState === 'lost' && <span className="text-red-400">Game over</span>}
                </div>
            </div>

            <div
                className="grid gap-[2px] bg-slate-900 p-2 rounded-lg shadow-xl overflow-auto max-w-full"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
                {board.map((row, r) =>
                    row.map((cell, c) => {
                        let content = '';
                        let extraClasses = 'bg-slate-400 hover:bg-slate-300 cursor-pointer';

                        if (cell.revealed) {
                            extraClasses = cell.mine ? 'bg-red-500' : 'bg-slate-200';
                            if (cell.mine) content = '💣';
                            else if (cell.neighbors > 0) content = cell.neighbors;
                        } else if (cell.flagged) {
                            content = '🚩';
                        }

                        const numberColor = !cell.mine && cell.neighbors > 0 ? NUMBER_COLORS[cell.neighbors] : '';

                        return (
                            <button
                                key={`${r}-${c}`}
                                onClick={() => handleCellClick(r, c)}
                                onContextMenu={(e) => toggleFlag(e, r, c)}
                                disabled={gameState !== 'playing' && cell.revealed}
                                className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sm font-bold select-none rounded-sm transition-colors ${extraClasses} ${numberColor}`}
                            >
                                {content}
                            </button>
                        );
                    })
                )}
            </div>

            <p className="text-slate-400 text-sm text-center max-w-sm">
                Left click to reveal a cell. Right click to place/remove a flag.
            </p>
        </div>
    );
}