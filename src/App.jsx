import { useEffect, useState } from 'react';
import Lobby from './Lobby';
import { 
  escucharSala, iniciarPartida, enviarPistaTurno, enviarVoto, procesarVotacion, reiniciarJuego 
} from './services/gameService';

function App() {
  const [salaActual, setSalaActual] = useState(null);
  const [codigoSala, setCodigoSala] = useState(null);
  const [miNombre, setMiNombre] = useState("");
  const [soyHost, setSoyHost] = useState(false);
  const [miId, setMiId] = useState(null);
  
  const [miPista, setMiPista] = useState("");

  // --- ESCUCHAR SALA ---
  useEffect(() => {
    if (codigoSala) {
      const desuscribir = escucharSala(codigoSala, (datos) => {
        setSalaActual(datos);
        const yo = datos.jugadores.find(j => j.nombre === miNombre);
        if (yo) {
          setSoyHost(yo.esHost);
          setMiId(yo.id);
        }
      });
      return () => desuscribir();
    }
  }, [codigoSala, miNombre]);

  // --- CEREBRO VOTACIÓN HOST ---
  useEffect(() => {
    if (soyHost && salaActual?.fase === "VOTACION" && salaActual?.votos) {
      const totalJugadores = salaActual.jugadores.length;
      const votosRecibidos = Object.keys(salaActual.votos).length;

      if (votosRecibidos === totalJugadores) {
        const conteo = {};
        Object.values(salaActual.votos).forEach(voto => conteo[voto] = (conteo[voto] || 0) + 1);

        let masVotadoId = null;
        let maxVotos = -1;
        Object.entries(conteo).forEach(([id, num]) => {
          if (num > maxVotos) { maxVotos = num; masVotadoId = id; } 
          else if (num === maxVotos) { masVotadoId = "EMPATE"; }
        });

        if (masVotadoId === "SKIP" || masVotadoId === "EMPATE") {
          procesarVotacion(codigoSala, { expulsado: null }, salaActual.ronda);
        } else {
          const jugadorExpulsado = salaActual.jugadores.find(j => j.id === masVotadoId);
          const esImpostor = salaActual.impostor === masVotadoId;
          procesarVotacion(codigoSala, { expulsado: true, nombreExpulsado: jugadorExpulsado.nombre, esImpostor }, salaActual.ronda);
        }
      }
    }
  }, [salaActual, soyHost, codigoSala]);

  // --- ACCIONES ---
  const handleEnviarPista = async () => {
    if (!miPista.trim()) return;
    await enviarPistaTurno(codigoSala, miNombre, miPista, salaActual.turnoIndex, salaActual.jugadores.length);
    setMiPista("");
  };

  const handleVotar = async (idVotado) => {
    await enviarVoto(codigoSala, miId, idVotado);
  };

  // Función nueva para copiar link
  const copiarLink = () => {
    const url = `${window.location.origin}/?sala=${salaActual.codigo}`;
    navigator.clipboard.writeText(url);
    alert("¡Link copiado al portapapeles!");
  };

  // --- VISTA 0: LOBBY INICIAL (Login) ---
  if (!salaActual) return <Lobby alEntrarEnSala={(c, n) => { setCodigoSala(c); setMiNombre(n); }} />;

  // --- VISTA 1: FINAL DEL JUEGO ---
  if (salaActual.estado === "FINALIZADO") {
    const ganaronTripulantes = salaActual.ganador === "TRIPULANTES";
    let mensajeMotivo = "";
    if (salaActual.motivo === "ADIVINO") mensajeMotivo = "¡El Impostor adivinó el nombre exacto!";
    if (salaActual.motivo === "TIEMPO") mensajeMotivo = "El Impostor sobrevivió a todas las rondas.";
    if (salaActual.motivo === "VOTACION") mensajeMotivo = `Expulsaron a: ${salaActual.expulsadoNombre}`;

    return (
      <div style={{ textAlign: 'center', color: '#F0E6D2', padding: '50px' }}>
        <h1 style={{ fontSize: '3rem', color: ganaronTripulantes ? '#0AC8B9' : '#ff4d4d' }}>
          Ganan los {salaActual.ganador}
        </h1>
        <h3 style={{ color: '#aaa' }}>{mensajeMotivo}</h3>
        
        <div style={{ margin: '30px auto', maxWidth: '300px', padding: '20px', backgroundColor: '#091428', borderRadius: '10px', border: '1px solid #C8AA6E' }}>
          <p>El campeón era:</p>
          <img src={salaActual.campeonActual.imagen} style={{ borderRadius: '50%', border: '3px solid #C8AA6E', width: '100px' }} />
          <h2 style={{ color: '#C8AA6E' }}>{salaActual.campeonActual.nombre}</h2>
        </div>

        {soyHost && (
          <button onClick={() => reiniciarJuego(codigoSala)}>
            Volver al Lobby
          </button>
        )}
      </div>
    );
  }

  // --- VISTA 2: JUEGO ACTIVO ---
  if (salaActual.estado === "JUGANDO") {
    const soyImpostor = salaActual.impostor === miId;
    const fase = salaActual.fase;
    const pistasVisibles = salaActual.pistasImpostor.slice(0, salaActual.ronda);
    const idJugadorActivo = salaActual.ordenTurnos[salaActual.turnoIndex];
    const esMiTurno = miId === idJugadorActivo;
    const nombreJugadorActivo = salaActual.jugadores.find(j => j.id === idJugadorActivo)?.nombre;

    return (
      <div style={{ textAlign: 'center', color: '#F0E6D2', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <span style={{ backgroundColor: '#1E2328', padding: '5px 10px', borderRadius: '5px', border: '1px solid #C8AA6E' }}>Ronda {salaActual.ronda}/4</span>
           <h2 style={{ color: soyImpostor ? '#ff4d4d' : '#0AC8B9', margin: 0 }}>
             {soyImpostor ? "IMPOSTOR" : "TRIPULANTE"}
           </h2>
        </div>

        <div style={{ marginTop: '15px', padding: '15px', borderRadius: '10px', backgroundColor: '#091428', border: `2px solid ${soyImpostor ? '#ff4d4d' : '#0AC8B9'}` }}>
          {soyImpostor ? (
            <div>
              <h3>🤫 Tus Pistas:</h3>
              {pistasVisibles.map((p, i) => <div key={i} style={{borderBottom: '1px solid #333', padding: '5px'}}>{p}</div>)}
            </div>
          ) : (
            <div>
              <img src={salaActual.campeonActual.imagen} style={{ width: '60px', borderRadius: '50%', border: '2px solid #C8AA6E' }} />
              <h3 style={{ margin: '5px 0', color: '#C8AA6E' }}>{salaActual.campeonActual.nombre}</h3>
              <div style={{ fontSize: '0.9rem', textAlign: 'left', padding: '10px' }}>
                {salaActual.campeonActual.pistas.map((p, i) => <li key={i}>{p}</li>)}
              </div>
            </div>
          )}
        </div>

        {fase === "PISTAS" && (
          <div style={{ marginTop: '20px' }}>
            <h3>📝 Fase de Pistas</h3>
            <div style={{ textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px', marginBottom: '15px', minHeight: '100px' }}>
              {salaActual.mensajesRonda?.map((msg, i) => (
                <div key={i} style={{ marginBottom: '5px' }}>
                  <strong style={{ color: '#C8AA6E' }}>{msg.nombre}:</strong> {msg.texto}
                </div>
              ))}
            </div>

            {esMiTurno ? (
              <div style={{ animation: 'pulse 2s infinite' }}>
                <p style={{ color: '#0AC8B9' }}>🟢 ¡Es tu turno!</p>
                {soyImpostor && <p style={{fontSize:'0.8rem', color:'#ff4d4d'}}>💡 Si escribes el nombre exacto del campeón, ganas.</p>}
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input type="text" value={miPista} onChange={(e) => setMiPista(e.target.value)} placeholder="Escribe tu pista..." style={{ flex: 1 }} />
                  <button onClick={handleEnviarPista}>Enviar</button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '15px', backgroundColor: '#1E2328', borderRadius: '5px', color: '#888' }}>
                ⏳ Esperando a que escriba <strong>{nombreJugadorActivo}</strong>...
              </div>
            )}
          </div>
        )}

        {fase === "VOTACION" && (
          <div style={{ marginTop: '20px', backgroundColor: '#1E2328', padding: '20px', borderRadius: '10px', border: '1px solid #ff4d4d' }}>
            <h2>🗳️ ¡A VOTAR!</h2>
            {salaActual.votos && salaActual.votos[miId] ? (
              <div style={{ padding: '20px', color: '#aaa' }}><p>✅ Voto enviado. Esperando...</p></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {salaActual.jugadores.map(j => j.id !== miId && (
                    <button key={j.id} onClick={() => handleVotar(j.id)} style={{ padding: '15px', border: '1px solid #555' }}>💀 {j.nombre}</button>
                ))}
                <button onClick={() => handleVotar("SKIP")} style={{ gridColumn: 'span 2', marginTop: '10px', borderColor: '#0AC8B9' }}>💨 Voto en Blanco</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- VISTA 3: LOBBY DE ESPERA ---
  return (
    <div style={{ textAlign: 'center', color: '#F0E6D2', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#C8AA6E', marginBottom: '5px' }}>SALA DE ESPERA</h2>
        <div style={{ 
          fontSize: '3rem', fontFamily: 'Cinzel', color: 'white', 
          border: '1px solid #C8AA6E', display: 'inline-block', padding: '0 20px',
          background: 'rgba(0,0,0,0.5)'
        }}>
          {salaActual.codigo}
        </div>
        
        <div style={{ marginTop: '10px' }}>
            <button onClick={copiarLink} style={{ fontSize: '0.9rem', padding: '8px 15px' }}>
                🔗 Copiar Link de Invitación
            </button>
        </div>
        <div style={{ 
        marginTop: '50px', paddingTop: '20px', 
        borderTop: '1px solid #463714', fontSize: '0.8rem', color: '#666' 
      }}>
        <p>Hecho con ⚡ y ☕ por <strong style={{color: '#C8AA6E'}}>Deyvi Ardila Forero</strong></p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <a href="https://github.com/itsDeyvixd" target="_blank" rel="noreferrer" style={{ color: '#0AC8B9', textDecoration: 'none' }}>
            GitHub
          </a>
          <span>|</span>
          <a href="https://www.linkedin.com/in/deyvi-ardila-forero-792154253/" target="_blank" rel="noreferrer" style={{ color: '#0AC8B9', textDecoration: 'none' }}>
            LinkedIn
          </a>
        </div>
      </div>

      </div>

      <div style={{ margin: '30px 0' }}>
        <h3>Invocadores Conectados:</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {salaActual.jugadores.map(j => (
            <div key={j.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src={j.avatar || "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/29.png"} 
                  alt={j.nombre}
                  style={{ 
                    width: '70px', height: '70px', borderRadius: '50%', 
                    border: j.esHost ? '3px solid #C8AA6E' : '3px solid #444',
                    boxShadow: j.esHost ? '0 0 15px #C8AA6E' : 'none'
                  }} 
                />
                {j.esHost && <span style={{ position: 'absolute', top: -10, right: -5, fontSize: '1.5rem' }}>👑</span>}
              </div>
              <span style={{ marginTop: '5px', color: j.nombre === miNombre ? '#0AC8B9' : '#F0E6D2' }}>
                {j.nombre}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ 
        textAlign: 'left', backgroundColor: 'rgba(9, 20, 40, 0.8)', padding: '20px', 
        borderRadius: '4px', border: '1px solid #463714', margin: '0 auto', maxWidth: '600px'
      }}>
         <h3 style={{ marginTop: 0, color: '#C8AA6E' }}>📜 Instrucciones</h3>
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4 style={{ color: '#0AC8B9', margin: '5px 0' }}>Tripulantes</h4>
            <p style={{ fontSize: '0.9rem', margin: 0 }}>Describan al campeón con pistas sutiles. ¡Descubran al mentiroso!</p>
          </div>
          <div>
            <h4 style={{ color: '#ff4d4d', margin: '5px 0' }}>Impostor</h4>
            <p style={{ fontSize: '0.9rem', margin: 0 }}>Miente para sobrevivir 4 rondas o escribe el nombre exacto del campeón para ganar ya.</p>
          </div>
        </div>
      </div>
      
      {soyHost ? (
        <button onClick={() => iniciarPartida(codigoSala)} style={{ 
          marginTop: '30px', padding: '15px 50px', fontSize: '1.5rem', 
          backgroundColor: '#091428', border: '2px solid #0AC8B9', color: '#0AC8B9' 
        }}>
          INICIAR PARTIDA
        </button>
      ) : (
        <p style={{ color: '#888', fontStyle: 'italic', marginTop: '30px' }}>Esperando al líder...</p>
      )}
    </div>
  );
}

export default App;