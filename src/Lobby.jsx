import { useState, useEffect } from 'react';
import { crearSala, unirseSala } from './services/gameService';
import { obtenerCampeones } from './services/riotService';

function Lobby({ alEntrarEnSala }) {
  const [nombre, setNombre] = useState("");
  const [codigoSala, setCodigoSala] = useState("");
  const [error, setError] = useState("");
  
  // Para el selector de avatares
  const [avatares, setAvatares] = useState([]);
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(null);
  const [cargandoAvatares, setCargandoAvatares] = useState(true);

  // UNIFICAMOS TODO EN UN SOLO EFFECT PARA EVITAR ERRORES Y CARGAS DOBLES
  useEffect(() => {
    // 1. Definimos la lista aquí dentro para evitar advertencias de React
    const ICONOS_CLASICOS = [
      29, // La Rosa
      502, // Tibbers / Osito
      588, // Poro
      6,  // Minion Azul
      7,  // Minion Rojo
      28, // Espada Alada
    ];

    const inicializar = async () => {
      try {
        // A. Cargar campeones (TODOS, sin limitar cantidad para que salga Rakan)
        const listaChamps = await obtenerCampeones();
        
        // B. Crear objetos para los iconos clásicos manuales
        const version = "14.1.1"; // Versión base para los iconos estáticos
        const listaClasicos = ICONOS_CLASICOS.map(id => ({
          id: `icon-${id}`,
          nombre: "Clásico",
          imagen: `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${id}.png`
        }));

        // C. Unir todo (Clásicos primero + Todos los Campeones)
        const listaFinal = [...listaClasicos, ...listaChamps];
        
        setAvatares(listaFinal); 
        // Seleccionamos el primero (La Rosa) por defecto si hay lista
        if (listaFinal.length > 0) {
            setAvatarSeleccionado(listaFinal[0].imagen);
        }
        setCargandoAvatares(false);

        // D. Detectar Link de Invitación en la URL (ej: ?sala=ABCD)
        const params = new URLSearchParams(window.location.search);
        const codigoUrl = params.get("sala");
        if (codigoUrl) {
            setCodigoSala(codigoUrl);
        }

      } catch (e) {
        console.error("Error cargando lobby:", e);
        setError("Error cargando recursos del juego.");
      }
    };

    inicializar();
  }, []);

  const handleCrear = async () => {
    if (!nombre) return setError("¡Necesitas un nombre!");
    try {
      // Pasamos el avatar seleccionado
      const codigo = await crearSala(nombre, avatarSeleccionado);
      alEntrarEnSala(codigo, nombre);
    } catch (error) {
      console.error(error);
      setError("Error: " + error.message);
    }
  };

  const handleUnirse = async () => {
    if (!nombre || !codigoSala) return setError("Faltan datos");
    try {
      await unirseSala(codigoSala.toUpperCase(), nombre, avatarSeleccionado);
      alEntrarEnSala(codigoSala.toUpperCase(), nombre);
    } catch (error) {
      console.error(error);
      setError("No pudimos entrar. Verifica el código.");
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '30px', padding: '20px' }}>
      <h1 style={{ fontSize: '3rem', color: '#C8AA6E', textShadow: '0 0 10px #785A28' }}>
        LoL Impostor
      </h1>
      
      <div style={{ 
        maxWidth: '400px', margin: '0 auto', 
        backgroundColor: '#091428', border: '2px solid #C8AA6E', 
        padding: '30px', borderRadius: '4px',
        boxShadow: '0 0 20px rgba(0,0,0,0.8)'
      }}>
        
        {/* SELECTOR DE AVATAR */}
        <h3 style={{ color: '#0AC8B9', marginBottom: '10px' }}>Elige tu Icono</h3>
        {cargandoAvatares ? <p>Cargando iconos...</p> : (
          <div style={{ 
            display: 'flex', overflowX: 'auto', gap: '10px', padding: '10px', 
            marginBottom: '20px', border: '1px solid #333', borderRadius: '4px',
            background: 'rgba(0,0,0,0.3)'
          }}>
            {avatares.map(champ => (
              <img 
                key={champ.id}
                src={champ.imagen}
                alt={champ.nombre}
                onClick={() => setAvatarSeleccionado(champ.imagen)}
                style={{ 
                  width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer',
                  border: avatarSeleccionado === champ.imagen ? '3px solid #0AC8B9' : '2px solid #333',
                  opacity: avatarSeleccionado === champ.imagen ? 1 : 0.6,
                  flexShrink: 0 // Importante para que no se aplasten
                }}
              />
            ))}
          </div>
        )}

        <input 
          type="text" 
          placeholder="Tu Nombre de Invocador" 
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={{ width: '90%', marginBottom: '20px', fontSize: '1.1rem', textAlign: 'center' }}
        />

        {/* SI HAY CÓDIGO (Link detectado) SOLO MOSTRAMOS UNIRSE */}
        {codigoSala ? (
          <div>
            <p style={{color: '#C8AA6E'}}>Entrando a sala: <strong>{codigoSala}</strong></p>
            <button onClick={handleUnirse} style={{ width: '100%', backgroundColor: '#0AC8B9', color: 'black', fontWeight: 'bold' }}>
              UNIRSE AHORA
            </button>
            <button onClick={() => setCodigoSala("")} style={{ marginTop: '10px', background: 'transparent', border: 'none', color: '#666', fontSize: '0.8rem' }}>
              Cancelar y crear sala propia
            </button>
          </div>
        ) : (
          <div>
            <button onClick={handleCrear} style={{ width: '100%', marginBottom: '15px' }}>
              CREAR NUEVA SALA
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#463714' }}></div>
              <span style={{ color: '#666' }}>O unirse</span>
              <div style={{ flex: 1, height: '1px', background: '#463714' }}></div>
            </div>

            <input 
              type="text" 
              placeholder="CÓDIGO" 
              value={codigoSala}
              onChange={(e) => setCodigoSala(e.target.value)}
              style={{ width: '90%', marginBottom: '10px', textTransform: 'uppercase', textAlign: 'center' }}
            />
            <button onClick={handleUnirse} style={{ width: '100%' }}>
              UNIRSE
            </button>
          </div>
        )}
      </div>

      {error && <p style={{ color: '#ff4d4d', marginTop: '20px' }}>{error}</p>}
    </div>
  );
}

export default Lobby;