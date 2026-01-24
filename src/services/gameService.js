import { db } from "./firebase";
import { 
  doc, setDoc, updateDoc, getDoc, arrayUnion, onSnapshot 
} from "firebase/firestore";
import { obtenerCampeones } from './riotService';

const generarCodigo = () => {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let codigo = "";
  for (let i = 0; i < 4; i++) codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  return codigo;
};

export const crearSala = async (nombreHost, avatarUrl) => { // Agregamos avatarUrl
  const codigo = generarCodigo();
  await setDoc(doc(db, "salas", codigo), {
    codigo,
    estado: "LOBBY",
    jugadores: [{ 
      nombre: nombreHost, 
      esHost: true, 
      id: crypto.randomUUID(),
      avatar: avatarUrl // Guardamos la foto
    }],
  });
  return codigo;
};

export const unirseSala = async (codigo, nombreJugador, avatarUrl) => { // Agregamos avatarUrl
  const salaRef = doc(db, "salas", codigo);
  const salaSnap = await getDoc(salaRef);
  if (!salaSnap.exists()) throw new Error("Sala no encontrada");
  await updateDoc(salaRef, {
    jugadores: arrayUnion({ 
      nombre: nombreJugador, 
      esHost: false, 
      id: crypto.randomUUID(),
      avatar: avatarUrl // Guardamos la foto
    })
  });
};

export const escucharSala = (codigo, callback) => onSnapshot(doc(db, "salas", codigo), (doc) => doc.exists() && callback(doc.data()));

export const iniciarPartida = async (codigoSala) => {
  const salaRef = doc(db, "salas", codigoSala);
  const salaSnap = await getDoc(salaRef);
  const data = salaSnap.data();

  const jugadores = data.jugadores;
  const impostorId = jugadores[Math.floor(Math.random() * jugadores.length)].id;
  
  const listaCampeones = await obtenerCampeones();
  const campeonElegido = listaCampeones[Math.floor(Math.random() * listaCampeones.length)];
  const pistasMezcladas = [...campeonElegido.pistas].sort(() => Math.random() - 0.5);

  await updateDoc(salaRef, {
    estado: "JUGANDO",
    fase: "PISTAS",
    ronda: 1,
    impostor: impostorId,
    campeonActual: campeonElegido,
    pistasImpostor: pistasMezcladas,
    mensajesRonda: [],
    ordenTurnos: jugadores.map(j => j.id),
    turnoIndex: 0,
    votos: {}
  });
};

// --- AQUÍ ESTÁ LA NUEVA LÓGICA DE "ADIVINAR NOMBRE" ---
export const enviarPistaTurno = async (codigoSala, nombreJugador, texto, turnoActual, totalJugadores) => {
  const salaRef = doc(db, "salas", codigoSala);
  
  // 1. Traemos los datos para verificar si es un intento de victoria
  const salaSnap = await getDoc(salaRef);
  const data = salaSnap.data();
  const esImpostor = data.jugadores.find(j => j.nombre === nombreJugador).id === data.impostor;
  
  // Normalizamos textos (quitamos espacios y mayúsculas para comparar)
  const textoLimpio = texto.trim().toLowerCase();
  const nombreCampeon = data.campeonActual.nombre.toLowerCase();

  // 2. ¿El Impostor adivinó el nombre?
  if (esImpostor && textoLimpio === nombreCampeon) {
    await updateDoc(salaRef, {
      estado: "FINALIZADO",
      ganador: "IMPOSTOR",
      motivo: "ADIVINO", // Para mostrar un mensaje especial
      expulsadoNombre: null
    });
    return; // Terminamos la función aquí
  }

  // 3. Flujo normal (si no ganó)
  await updateDoc(salaRef, {
    mensajesRonda: arrayUnion({ nombre: nombreJugador, texto })
  });

  const siguienteTurno = turnoActual + 1;
  if (siguienteTurno >= totalJugadores) {
    await updateDoc(salaRef, { fase: "VOTACION", turnoIndex: -1 });
  } else {
    await updateDoc(salaRef, { turnoIndex: siguienteTurno });
  }
};

export const enviarVoto = async (codigoSala, miId, idVotado) => {
  const salaRef = doc(db, "salas", codigoSala);
  await updateDoc(salaRef, { [`votos.${miId}`]: idVotado });
};

// --- AQUÍ ESTÁ LA NUEVA LÓGICA DE "SUPERVIVENCIA" ---
export const procesarVotacion = async (codigoSala, resultados, rondaActual) => {
  const salaRef = doc(db, "salas", codigoSala);
  
  if (resultados.expulsado) {
    await updateDoc(salaRef, { 
      estado: "FINALIZADO",
      ganador: resultados.esImpostor ? "TRIPULANTES" : "IMPOSTOR",
      expulsadoNombre: resultados.nombreExpulsado,
      motivo: "VOTACION"
    });
  } else {
    // Nadie fue expulsado.
    
    // ¿Ya pasamos la ronda 4? (Máximo de pistas) -> Gana Impostor por Supervivencia
    if (rondaActual >= 4) {
      await updateDoc(salaRef, {
        estado: "FINALIZADO",
        ganador: "IMPOSTOR",
        motivo: "TIEMPO", // Sobrevivió todas las rondas
        expulsadoNombre: null
      });
    } else {
      // Siguiente ronda normal
      await updateDoc(salaRef, {
        fase: "PISTAS",
        ronda: rondaActual + 1,
        mensajesRonda: [],
        turnoIndex: 0,
        votos: {}
      });
    }
  }
};

export const reiniciarJuego = async (codigoSala) => {
  const salaRef = doc(db, "salas", codigoSala);
  
  // RESET TOTAL: Limpiamos todas las variables de juego para evitar bugs
  await updateDoc(salaRef, {
    estado: "LOBBY",
    campeonActual: null,
    impostor: null,
    fase: null,
    ronda: 0,
    mensajesRonda: [],
    pistasImpostor: [],
    ordenTurnos: [],
    turnoIndex: 0,
    votos: {},
    ganador: null,
    motivo: null,
    expulsadoNombre: null
  });
};