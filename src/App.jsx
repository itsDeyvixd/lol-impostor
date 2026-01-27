import { useEffect, useState } from 'react';
import Lobby from './Lobby';
import Footer from './Footer'; // Asegúrate de tener el Footer del paso anterior
import ReglasModal from './components/ReglasModal'; // --- NUEVO: Importar Modal

import { 
  escucharSala, iniciarPartida, enviarPistaTurno, enviarVoto, procesarVotacion, reiniciarJuego, salirDeSala, saltarTurnoPorTiempo 
} from './services/gameService';

// --- COMPONENTE LISTA JUGADORES ---
const ListaJugadores = ({ salaActual, miNombre }) => {
  return (
    <div style={{ 
      backgroundColor: '#1E2328', padding: '10px', borderRadius: '8px', border: '1px solid #463714',
      display: 'flex', flexDirection: 'column', gap: '8px',
      maxHeight: '400px', overflowY: 'auto'
    }}>
      <h4 style={{margin: '0 0 10px 0', color: '#C8AA6E', borderBottom: '1px solid #444', paddingBottom: '5px'}}>JUGADORES</h4>
      {salaActual.jugadores.map((jugador, index) => {
        let estadoClase = {};
        let iconoEstado = null;
        
        const idJugadorEnTurno = salaActual.ordenTurnos?.[salaActual.turnoIndex];
        const esSuTurno = salaActual.estado === "JUGANDO" && salaActual.fase === "PISTAS" && jugador.id === idJugadorEnTurno;
        const indiceJugador = salaActual.ordenTurnos?.indexOf(jugador.id);
        const yaEscribio = salaActual.estado === "JUGANDO" && salaActual.fase === "PISTAS" && indiceJugador < salaActual.turnoIndex;

        if (esSuTurno) {
          estadoClase = { border: '2px solid #0AC8B9', backgroundColor: 'rgba(10, 200, 185, 0.1)' };
          iconoEstado = "✏️";
        } else if (yaEscribio) {
          estadoClase = { opacity: 0.6, borderLeft: '3px solid #4dff88' };
          iconoEstado = "✅";
        }

        return (
          <div key={jugador.id} style={{ 
            display: 'flex', alignItems: 'center', gap: '10px', padding: '8px',
            backgroundColor: '#091428', borderRadius: '5px', transition: 'all 0.3s',
            ...estadoClase
          }}>
            <span style={{ color: '#666', fontWeight: 'bold', width: '20px' }}>{index + 1}</span>
            <img src={jugador.avatar || "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/29.png"} style={{ width: '30px', height: '30px', borderRadius: '50%' }} alt="avatar" />
            <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ color: jugador.nombre === miNombre ? '#0AC8B9' : '#F0E6D2', fontSize: '0.9rem' }}>
                {jugador.nombre}
              </span>
            </div>
            {iconoEstado && <span>{iconoEstado}</span>}
          </div>
        );
      })}
    </div>
  );
};

function App() {
  const [codigoSala, setCodigoSala] = useState(() => {
    const sesion = sessionStorage.getItem("lol-impostor-session");
    return sesion ? JSON.parse(sesion).codigo : null;
  });

  const [miNombre, setMiNombre] = useState(() => {
    const sesion = sessionStorage.getItem("lol-impostor-session");
    return sesion ? JSON.parse(sesion).nombre : "";
  });

  const [salaActual, setSalaActual] = useState(null);
  const [soyHost, setSoyHost] = useState(false);
  const [miId, setMiId] = useState(null);
  const [miPista, setMiPista] = useState("");
  const [timer, setTimer] = useState(30);
  
  const [mostrarReglas, setMostrarReglas] = useState(false); // --- NUEVO: Estado para el modal

  useEffect(() => {
    if (codigoSala) {
      const desuscribir = escucharSala(codigoSala, (datos) => {
        setSalaActual(datos);
        const yo = datos.jugadores.find(j => j.nombre === miNombre);
        if (yo) { 
          setSoyHost(yo.esHost); 
          setMiId(yo.id); 
        } else { 
          sessionStorage.removeItem("lol-impostor-session"); 
          setSalaActual(null); 
          setCodigoSala(null); 
          alert("Desconectado."); 
        }
      });
      return () => desuscribir();
    }
  }, [codigoSala, miNombre]);

  useEffect(() => {
    if (salaActual?.estado === "JUGANDO" && salaActual?.fase === "PISTAS") {
      const intervalo = setInterval(() => {
        const tiempoLimite = (salaActual.config?.tiempoTurno || 30) * 1000;
        const tiempoPasado = Date.now() - (salaActual.inicioTurno || Date.now());
        const restante = Math.max(0, Math.ceil((tiempoLimite - tiempoPasado) / 1000));
        
        setTimer(restante);

        if (restante === 0 && soyHost) {
          saltarTurnoPorTiempo(codigoSala, salaActual.turnoIndex, salaActual.jugadores.length);
        }
      }, 1000);
      return () => clearInterval(intervalo);
    }
  }, [salaActual, soyHost, codigoSala]);

  useEffect(() => {
    if (soyHost && salaActual?.fase === "VOTACION" && salaActual?.votos) {
      const total = salaActual.jugadores.length;
      if (Object.keys(salaActual.votos).length === total) {
        const conteo = {}; 
        Object.values(salaActual.votos).forEach(v => conteo[v] = (conteo[v] || 0) + 1);
        
        let masVotadoId = null; 
        let maxVotos = -1;
        Object.entries(conteo).forEach(([id, num]) => { 
          if(num > maxVotos){ maxVotos=num; masVotadoId=id; } 
          else if(num===maxVotos){ masVotadoId="EMPATE"; } 
        });
        
        if (masVotadoId === "SKIP" || masVotadoId === "EMPATE") {
          procesarVotacion(codigoSala, {expulsado:null}, salaActual.ronda);
        } else {
          const expulsado = salaActual.jugadores.find(j => j.id === masVotadoId);
          procesarVotacion(codigoSala, {
            expulsado:true, 
            nombreExpulsado: expulsado ? expulsado.nombre : "Desconocido", 
            esImpostor: salaActual.impostor === masVotadoId
          }, salaActual.ronda);
        }
      }
    }
  }, [salaActual, soyHost, codigoSala]);

  const entrarEnSala = (codigo, nombre) => { 
    setCodigoSala(codigo); 
    setMiNombre(nombre); 
    sessionStorage.setItem("lol-impostor-session", JSON.stringify({ codigo, nombre })); 
  };

  const handleSalir = async () => { if(confirm("¿Salir?")) await salirDeSala(codigoSala, miId); };
  const handleExpulsar = async (id, n) => { if(confirm(`¿Echar a ${n}?`)) await salirDeSala(codigoSala, id); };
  const handleEnviarPista = async () => { if(!miPista.trim()) return; await enviarPistaTurno(codigoSala, miNombre, miPista, salaActual.turnoIndex, salaActual.jugadores.length); setMiPista(""); };
  const handleVotar = async (id) => { await enviarVoto(codigoSala, miId, id); };
  const copiarLink = () => { navigator.clipboard.writeText(`${window.location.origin}/?sala=${salaActual.codigo}`); alert("Link copiado"); };

  if (!salaActual) return <Lobby alEntrarEnSala={entrarEnSala} />;

  // --- VISTA FINAL (GAME OVER) ---
  if (salaActual.estado === "FINALIZADO") {
    const ganaronTripulantes = salaActual.ganador === "TRIPULANTES";
    
    // --- NUEVO: ENCONTRAR EL NOMBRE DEL IMPOSTOR PARA MOSTRARLO ---
    const nombreImpostor = salaActual.jugadores.find(j => j.id === salaActual.impostor)?.nombre || "Desconocido";

    return (
      <div style={{ textAlign: 'center', color: '#F0E6D2', padding: '50px' }}>
        <h1 style={{ color: ganaronTripulantes ? '#0AC8B9' : '#ff4d4d' }}>Ganan los {salaActual.ganador}</h1>
        <h3>{salaActual.motivo}</h3>
        
        {/* --- NUEVO: MOSTRAR QUIÉN ERA EL IMPOSTOR --- */}
        <div style={{ margin: '15px 0', fontSize: '1.2rem' }}>
          🕵️ El Impostor era: <strong style={{color: '#ff4d4d', textTransform: 'uppercase'}}>{nombreImpostor}</strong>
        </div>

        <div style={{ margin: '30px auto', padding: '20px', backgroundColor: '#091428', border: '1px solid #C8AA6E', width: 'fit-content', borderRadius: '10px' }}>
          <img src={salaActual.campeonActual.imagen} style={{ borderRadius: '50%', border: '3px solid #C8AA6E', width: '100px' }} alt="campeon" />
          <h2 style={{ color: '#C8AA6E' }}>{salaActual.campeonActual.nombre}</h2>
        </div>
        {soyHost ? <button onClick={() => reiniciarJuego(codigoSala)}>Volver al Lobby</button> : <p>Esperando...</p>}
      </div>
    );
  }

  // --- VISTA JUEGO ---
  if (salaActual.estado === "JUGANDO") {
    const soyImpostor = salaActual.impostor === miId;
    const fase = salaActual.fase;
    const pistasVisibles = salaActual.pistasImpostor.slice(0, salaActual.ronda);
    const esMiTurno = miId === salaActual.ordenTurnos[salaActual.turnoIndex];
    const nombreJugadorActivo = salaActual.jugadores.find(j => j.id === salaActual.ordenTurnos[salaActual.turnoIndex])?.nombre;

    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', display: 'flex', gap: '20px', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
             <span style={{ background: '#1E2328', padding: '5px 10px', borderRadius: '5px', border: '1px solid #C8AA6E', marginRight: '10px' }}>Ronda {salaActual.ronda}/4</span>
             {fase === "PISTAS" && <span style={{ color: timer < 10 ? 'red' : 'gold', fontWeight: 'bold', fontSize: '1.2rem' }}>⏱️ {timer}s</span>}
          </div>
          <h2 style={{ color: soyImpostor ? '#ff4d4d' : '#0AC8B9', margin: 0 }}>{soyImpostor ? "IMPOSTOR" : "TRIPULANTE"}</h2>
        </div>

        <div className="game-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ order: 2 }}>
             <ListaJugadores salaActual={salaActual} miNombre={miNombre} />
          </div>

          <div style={{ order: 1 }}>
            <div style={{ padding: '15px', borderRadius: '10px', backgroundColor: '#091428', border: `2px solid ${soyImpostor ? '#ff4d4d' : '#0AC8B9'}`, marginBottom: '20px' }}>
              {soyImpostor ? (
                <div><h3>🤫 Pistas ({pistasVisibles.length}/4):</h3>{pistasVisibles.map((p, i) => <div key={i} style={{borderBottom:'1px solid #333', padding:'5px'}}>{p}</div>)}</div>
              ) : (
                <div>
                  <img src={salaActual.campeonActual.imagen} style={{ width: '60px', borderRadius: '50%', border: '2px solid #C8AA6E' }} alt="campeon" />
                  <h3 style={{ margin: '5px 0', color: '#C8AA6E' }}>{salaActual.campeonActual.nombre}</h3>
                  <div style={{ fontSize: '0.9rem', textAlign: 'left' }}>{salaActual.campeonActual.pistas.map((p, i) => <li key={i}>{p}</li>)}</div>
                </div>
              )}
            </div>

            {fase === "PISTAS" && (
              <div>
                <div style={{ textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px', marginBottom: '15px', minHeight: '150px' }}>
                  {salaActual.mensajesRonda?.map((msg, i) => (
                    <div key={i} style={{ marginBottom: '5px' }}>
                      <strong style={{ color: msg.nombre === "SISTEMA" ? 'yellow' : '#C8AA6E' }}>{msg.nombre}:</strong> {msg.texto}
                    </div>
                  ))}
                </div>
                {esMiTurno ? (
                  <div style={{ animation: 'pulse 1s infinite' }}>
                    <p style={{ color: '#0AC8B9' }}>🟢 ¡ES TU TURNO! ({timer}s)</p>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <input type="text" value={miPista} onChange={(e) => setMiPista(e.target.value)} placeholder="Escribe..." style={{ flex: 1, padding: '10px' }} />
                      <button onClick={handleEnviarPista}>Enviar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '15px', backgroundColor: '#1E2328', borderRadius: '5px', color: '#888' }}>
                    ⏳ Esperando a <strong>{nombreJugadorActivo}</strong> ({timer}s)...
                  </div>
                )}
              </div>
            )}

            {fase === "VOTACION" && (
              <div style={{ marginTop: '20px', backgroundColor: '#1E2328', padding: '20px', borderRadius: '10px', border: '1px solid #ff4d4d' }}>
                <h2>🗳️ VOTACIÓN</h2>
                
                <div style={{ textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '10px', marginBottom: '15px', maxHeight: '150px', overflowY: 'auto' }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#C8AA6E', fontSize: '0.9rem' }}>📜 Historial de esta ronda:</h4>
                  {salaActual.mensajesRonda?.map((msg, i) => (
                    <div key={i} style={{ marginBottom: '5px', fontSize: '0.9rem' }}>
                      <strong style={{ color: msg.nombre === "SISTEMA" ? 'yellow' : '#C8AA6E' }}>{msg.nombre}:</strong> {msg.texto}
                    </div>
                  ))}
                </div>

                {salaActual.votos?.[miId] ? <p>✅ Voto enviado.</p> : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {salaActual.jugadores.map(j => j.id !== miId && <button key={j.id} onClick={() => handleVotar(j.id)} style={{ padding: '15px', border: '1px solid #555' }}>💀 {j.nombre}</button>)}
                    <button onClick={() => handleVotar("SKIP")} style={{ gridColumn: 'span 2', borderColor: '#0AC8B9' }}>💨 Blanco</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

// --- LOBBY (Sala de Espera) ---
  return (
    <div style={{ textAlign: 'center', color: '#F0E6D2', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* HEADER MEJORADO: SALIR + TÍTULO + REGLAS */}
      <div style={{ position: 'relative', marginBottom: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        
        {/* 1. Botón Salir (Absoluto a la izquierda) */}
        <button 
          onClick={handleSalir} 
          style={{ 
            position: 'absolute', 
            left: 0, 
            background: 'transparent', 
            border: 'none', 
            color: '#666', 
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            zIndex: 10,
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.color = '#ff4d4d'}
          onMouseOut={(e) => e.target.style.color = '#666'}
        >
          ← SALIR
        </button>

        {/* 2. Contenedor Central (Título + Botón Reglas) */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '15px', 
          flexWrap: 'wrap'
        }}>
           <h2 style={{ color: '#C8AA6E', margin: 0, fontSize: '2rem', textShadow: '0 0 10px #785A28' }}>SALA DE ESPERA</h2>
           
           {/* Botón Hextech Rectangular */}
           <button 
            onClick={() => setMostrarReglas(true)}
            style={{
              background: '#091428', 
              border: '1px solid #C8AA6E', 
              color: '#C8AA6E',
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              fontFamily: 'Roboto, sans-serif',
              letterSpacing: '1px',
              boxShadow: '0 0 5px rgba(200, 170, 110, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#1E2328';
              e.currentTarget.style.boxShadow = '0 0 10px #C8AA6E';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#091428';
              e.currentTarget.style.boxShadow = '0 0 5px rgba(200, 170, 110, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{fontSize: '1rem'}}>📜</span> REGLAS
          </button>
        </div>
      </div>

      <div style={{ fontSize: '3rem', fontFamily: 'Cinzel', border: '1px solid #C8AA6E', display: 'inline-block', padding: '0 20px', backgroundColor: 'rgba(0,0,0,0.3)' }}>{salaActual.codigo}</div>
      <div style={{marginTop:'10px'}}><button onClick={copiarLink}>🔗 Copiar Link</button></div>

      <div style={{ margin: '30px 0' }}>
        <h3>Invocadores ({salaActual.jugadores.length}):</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {salaActual.jugadores.map(j => (
            <div key={j.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img src={j.avatar || "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/29.png"} style={{ width: '60px', borderRadius: '50%', border: j.esHost?'3px solid gold':'3px solid #444', boxShadow: j.esHost ? '0 0 15px gold' : 'none' }} alt="avatar" />
              <span style={{ marginTop: '5px' }}>{j.nombre}</span>
              {soyHost && !j.esHost && <button onClick={() => handleExpulsar(j.id, j.nombre)} style={{position:'absolute', top:0, right:-5, background:'red', borderRadius:'50%', width:'20px', height:'20px', padding:0, border:'1px solid white', color:'white', cursor:'pointer'}}>X</button>}
            </div>
          ))}
        </div>
      </div>
      
      {soyHost ? <button onClick={() => iniciarPartida(codigoSala)} style={{ padding: '15px 40px', fontSize: '1.5rem', backgroundColor: '#091428', border: '2px solid #0AC8B9', color: '#0AC8B9' }}>INICIAR PARTIDA</button> : <p style={{color: '#888', fontStyle: 'italic'}}>Esperando al líder...</p>}

      <Footer />
      
      {mostrarReglas && <ReglasModal cerrar={() => setMostrarReglas(false)} />}
    </div>
  );
}

export default App;