import React from 'react';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaRobot, FaBrain, FaSkull } from 'react-icons/fa';
import styles from '@/styles/TicTacToe.module.css';

export default function TicTacToeSelection() {
  const router = useRouter();

  const difficulties = [
    {
      id: 'easy',
      title: 'Modo Fácil',
      description: 'A IA toma decisões majoritariamente aleatórias. Ideal para aquecimento.',
      icon: <FaRobot size={32} style={{ color: '#4ade80' }} />,
      path: '/game/tttai/easy',
    },
    {
      id: 'medium',
      title: 'Modo Médio',
      description: 'Equilíbrio tático. A IA calcula algumas jogadas, mas ainda comete deslizes humanos.',
      icon: <FaBrain size={32} style={{ color: '#fbbf24' }} />,
      path: '/game/tttai/medium',
    },
    {
      id: 'impossible',
      title: 'Modo Impossível',
      description: 'Minimax puro e implacável. O algoritmo prevê todos os cenários. O melhor resultado é o empate.',
      icon: <FaSkull size={32} style={{ color: '#f87171' }} />,
      path: '/game/tttai/impossible',
    },
  ];

  return (
    <div className={styles.container}>
      {/* Background ambient luminoso padrão do seu app */}
      <div className={styles.bgGradient}>
        <div className={styles.bgBlur1} />
        <div className={styles.bgBlur2} />
      </div>

      {/* Topbar Base */}
      <div className={styles.topbar}>
        <div className={styles.topbarContent}>
          <button onClick={() => router.push('/')} className={styles.iconButton} title="Voltar para a Home">
            <FaArrowLeft size={18} />
          </button>
          <div className={styles.statusContainer}>
            <div className={styles.statusBox}>
              <span className={styles.statusText}>SELECIONE A DIFICULDADE DA IA</span>
            </div>
          </div>
          <div style={{ width: 40 }} /> {/* Espaçador estrutural para simetria */}
        </div>
      </div>

      {/* Menu com Grid de Cards */}
      <div className={styles.mainContent} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          width: '100%',
          maxWidth: '1000px',
          padding: '20px'
        }}>
          {difficulties.map((diff) => (
            <div
              key={diff.id}
              className={styles.glassCard}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '32px',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onClick={() => router.push(diff.path)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '50%' }}>
                {diff.icon}
              </div>
              <h2 className={styles.scoreTitle} style={{ marginBottom: '12px' }}>{diff.title}</h2>
              <p className={styles.tipText} style={{ fontSize: '14px', lineHeight: '1.5', flexGrow: 1 }}>{diff.description}</p>
              <button 
                className={styles.overlayButton} 
                style={{ marginTop: '24px', width: '100%', position: 'static' }}
              >
                Iniciar Vetor
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}