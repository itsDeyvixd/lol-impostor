import { useState, useEffect } from 'react';
import { crearSala, unirseSala } from './services/gameService';
import { obtenerCampeones } from './services/riotService';
import Footer from './Footer';
import ReglasModal from './components/ReglasModal'; // --- NUEVO

function Lobby({ alEntrarEnSala }) {
  const [nombre, setNombre] = useState("");
  const [codigoSala, setCodigoSala] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [tiempoConfig, setTiempoConfig] = useState("30"); 

  const [avatares, setAvatares] = useState([]);
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(null);
  const [cargandoAvatares, setCargandoAvatares] = useState(true);

  const [mostrarReglas, setMostrarReglas] = useState(false); // --- NUEVO

  useEffect(() => {
    const ICONOS_CLASICOS = [29, 502, 588, 6, 7, 28];
    const inicializar = async () => {
      try {
        const listaChamps = await obtenerCampeones();
        const version = "14.1.1";
        const listaClasicos = ICONOS_CLASICOS.map(id => ({
          id: `icon-${id}`,
          nombre: "Clásico",
          imagen: `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${id}.png`
        }));
        const listaFinal = [...listaClasicos, ...listaChamps];
        setAvatares(listaFinal); 
        if (listaFinal.length > 0) setAvatarSeleccionado(listaFinal[0].imagen);
        setCargandoAvatares(false);

        const params = new URLSearchParams(window.location.search);
        const codigoUrl = params.get("sala");
        if (codigoUrl) setCodigoSala(codigoUrl);
      } catch (e) {
        console.error(e); setError("Error cargando recursos.");
      }
    };
    inicializar();
  }, []);

  const handleCrear = async () => {
    if (!nombre) return setError("¡Necesitas un nombre!");
    setCargando(true);
    try {
      const codigo = await crearSala(nombre, avatarSeleccionado, tiempoConfig);
      alEntrarEnSala(codigo, nombre);
    } catch (error) { setError(error.message); setCargando(false); }
  };

  const handleUnirse = async () => {
    if (!nombre || !codigoSala) return setError("Faltan datos");
    setCargando(true);
    try {
      await unirseSala(codigoSala.toUpperCase(), nombre, avatarSeleccionado);
      alEntrarEnSala(codigoSala.toUpperCase(), nombre);
    } catch (error) { setError(error.message); setCargando(false); }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '30px', padding: '20px' }}>
      
      {/* HEADER CON BOTÓN DE REGLAS */}
{/* HEADER CORREGIDO: FLEXBOX PARA ALINEACIÓN PERFECTA */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '20px', // Espacio seguro entre Título y Botón
        marginBottom: '30px',
        flexWrap: 'wrap' // En móviles muy pequeños, el botón bajará ordenadamente
      }}>
          <h1 style={{ 
            fontSize: '3rem', 
            color: '#C8AA6E', 
            textShadow: '0 0 10px #785A28', 
            margin: 0, // Quitamos margen para que se alinee con el botón
            lineHeight: 1
          }}>
            LoL Impostor
          </h1>
          
          <button 
            onClick={() => setMostrarReglas(true)}
            style={{
              // ESTILO HEXTECH RECTANGULAR
              background: '#091428', 
              border: '1px solid #C8AA6E', 
              color: '#C8AA6E',
              borderRadius: '4px',
              padding: '8px 15px', // Un poco más grande para que respire
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              fontFamily: 'Roboto, sans-serif',
              letterSpacing: '1px',
              boxShadow: '0 0 5px rgba(200, 170, 110, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              height: 'fit-content' // Para que no se estire raro
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#1E2328';
              e.currentTarget.style.boxShadow = '0 0 15px #C8AA6E'; // Más brillo al pasar el mouse
              e.currentTarget.style.transform = 'translateY(-2px)'; // Efecto de elevación
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#091428';
              e.currentTarget.style.boxShadow = '0 0 5px rgba(200, 170, 110, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{fontSize: '1.2rem'}}>📜</span> REGLAS
          </button>
      </div>
      
      <div style={{ maxWidth: '400px', margin: '0 auto', backgroundColor: '#091428', border: '2px solid #C8AA6E', padding: '30px', borderRadius: '4px', boxShadow: '0 0 20px rgba(0,0,0,0.8)' }}>
        
        {/* SELECTOR AVATAR */}
        <h3 style={{ color: '#0AC8B9', marginBottom: '10px' }}>Elige tu Icono</h3>
        {cargandoAvatares ? <p>Cargando...</p> : (
          <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', padding: '10px', marginBottom: '20px', border: '1px solid #333', borderRadius: '4px', background: 'rgba(0,0,0,0.3)' }}>
            {avatares.map(champ => (
              <img key={champ.id} src={champ.imagen} onClick={() => setAvatarSeleccionado(champ.imagen)}
                style={{ width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', border: avatarSeleccionado === champ.imagen ? '3px solid #0AC8B9' : '2px solid #333', opacity: avatarSeleccionado === champ.imagen ? 1 : 0.6, flexShrink: 0 }} />
            ))}
          </div>
        )}

        <input type="text" placeholder="Tu Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: '90%', marginBottom: '20px', fontSize: '1.1rem', textAlign: 'center' }} />

        {!codigoSala && (
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
             <label style={{color: '#C8AA6E', fontWeight: 'bold'}}>⏱️ Turno:</label>
             <select value={tiempoConfig} onChange={(e) => setTiempoConfig(e.target.value)} style={{ padding: '8px', borderRadius: '4px', backgroundColor: '#091428', color: '#F0E6D2', border: '1px solid #C8AA6E', fontFamily: 'Roboto', cursor: 'pointer', outline: 'none' }}>
               <option value="15">🔥 15s (Flash)</option>
               <option value="30">⚖️ 30s (Normal)</option>
               <option value="45">🤔 45s (Pensar)</option>
               <option value="60">🐢 60s (Lento)</option>
             </select>
          </div>
        )}

        {codigoSala ? (
          <div>
            <p style={{color: '#C8AA6E'}}>Sala: <strong>{codigoSala}</strong></p>
            <button onClick={handleUnirse} disabled={cargando} style={{ width: '100%', backgroundColor: '#0AC8B9', color: 'black', fontWeight: 'bold', opacity: cargando ? 0.5 : 1 }}>{cargando ? "ENTRANDO..." : "UNIRSE"}</button>
            <button onClick={() => setCodigoSala("")} disabled={cargando} style={{ marginTop: '10px', background: 'transparent', border: 'none', color: '#666' }}>Cancelar</button>
          </div>
        ) : (
          <div>
            <button onClick={handleCrear} disabled={cargando} style={{ width: '100%', marginBottom: '15px', opacity: cargando ? 0.5 : 1 }}>{cargando ? "CREANDO..." : "CREAR SALA"}</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#463714' }}></div><span style={{ color: '#666' }}>O unirse</span><div style={{ flex: 1, height: '1px', background: '#463714' }}></div>
            </div>
            <input type="text" placeholder="CÓDIGO" value={codigoSala} onChange={(e) => setCodigoSala(e.target.value)} style={{ width: '90%', marginBottom: '10px', textTransform: 'uppercase', textAlign: 'center' }} />
            <button onClick={handleUnirse} disabled={cargando} style={{ width: '100%', opacity: cargando ? 0.5 : 1 }}>{cargando ? "CONECTANDO..." : "UNIRSE"}</button>
          </div>
        )}
      </div>
      
      {error && <p style={{ color: '#ff4d4d', marginTop: '20px' }}>{error}</p>}
      
      <Footer />
      
      {/* --- NUEVO: MODAL EN EL LOGIN --- */}
      {mostrarReglas && <ReglasModal cerrar={() => setMostrarReglas(false)} />}
    </div>
  );
}
export default Lobby;