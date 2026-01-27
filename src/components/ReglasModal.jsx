// src/components/ReglasModal.jsx
import React from 'react';

const ReglasModal = ({ cerrar }) => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: '#091428', border: '2px solid #C8AA6E',
        padding: '30px', borderRadius: '8px', maxWidth: '500px', width: '90%',
        color: '#F0E6D2', position: 'relative', boxShadow: '0 0 20px #C8AA6E'
      }}>
        {/* Botón Cerrar (X) */}
        <button 
          onClick={cerrar}
          style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'transparent', border: 'none', color: '#C8AA6E',
            fontSize: '1.5rem', cursor: 'pointer'
          }}
        >
          ✖
        </button>

        <h2 style={{ color: '#C8AA6E', textAlign: 'center', marginTop: 0 }}>📜 REGLAMENTO</h2>
        
        <div style={{ textAlign: 'left', fontSize: '0.95rem', lineHeight: '1.5' }}>
          <h3 style={{ color: '#0AC8B9', marginBottom: '5px' }}>🚀 Tripulantes</h3>
          <ul style={{ marginTop: '0', paddingLeft: '20px' }}>
            <li>Todos ven al campeón secreto y sus datos.</li>
            <li>Deben describir al campeón con <strong>pistas sutiles</strong>.</li>
            <li><strong>Objetivo:</strong> Descubrir al mentiroso y expulsarlo en la votación.</li>
          </ul>

          <h3 style={{ color: '#ff4d4d', marginBottom: '5px' }}>🕵️ Impostor</h3>
          <ul style={{ marginTop: '0', paddingLeft: '20px' }}>
            <li>No conoce al campeón. Solo recibe pistas parciales.</li>
            <li>Debe fingir que sabe quién es para no ser descubierto.</li>
            <li><strong>Formas de ganar:</strong>
              <ol>
                <li>Sobrevivir a las 4 rondas sin ser expulsado.</li>
                <li>Escribir el <strong>nombre exacto</strong> del campeón en el chat (Snipe).</li>
              </ol>
            </li>
          </ul>
        </div>

        <button 
          onClick={cerrar}
          style={{
            marginTop: '20px', width: '100%', padding: '10px',
            backgroundColor: '#1E2328', border: '1px solid #C8AA6E', color: '#C8AA6E',
            cursor: 'pointer'
          }}
        >
          ENTENDIDO
        </button>
      </div>
    </div>
  );
};

export default ReglasModal;