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

// 1. CREAR SALA CON TIEMPO CONFIGURABLE
export const crearSala = async (nombreHost, avatarUrl, tiempoTurno = 30) => {
  const codigo = generarCodigo();
  await setDoc(doc(db, "salas", codigo), {
    codigo,
    estado: "LOBBY",
    config: { tiempoTurno: parseInt(tiempoTurno) }, // Guardamos la config (30, 60, etc)
    jugadores: [{ nombre: nombreHost, esHost: true, id: crypto.randomUUID(), avatar: avatarUrl }],
  });
  return codigo;
};

export const unirseSala = async (codigo, nombreJugador, avatarUrl) => {
  const salaRef = doc(db, "salas", codigo);
  const salaSnap = await getDoc(salaRef);
  if (!salaSnap.exists()) throw new Error("La sala no existe");
  const data = salaSnap.data();
  if (data.estado !== "LOBBY") throw new Error("Partida ya iniciada.");
  const existe = data.jugadores.some(j => j.nombre.toLowerCase() === nombreJugador.toLowerCase());
  if (existe) throw new Error("Ese nombre ya está en uso.");

  await updateDoc(salaRef, {
    jugadores: arrayUnion({ nombre: nombreJugador, esHost: false, id: crypto.randomUUID(), avatar: avatarUrl })
  });
};

export const salirDeSala = async (codigoSala, idJugador) => {
  const salaRef = doc(db, "salas", codigoSala);
  const salaSnap = await getDoc(salaRef);
  if (!salaSnap.exists()) return;
  const nuevosJugadores = salaSnap.data().jugadores.filter(j => j.id !== idJugador);
  await updateDoc(salaRef, { jugadores: nuevosJugadores });
};

export const escucharSala = (codigo, callback) => onSnapshot(doc(db, "salas", codigo), (doc) => doc.exists() && callback(doc.data()));

export const iniciarPartida = async (codigoSala) => {
  const salaRef = doc(db, "salas", codigoSala);
  const salaSnap = await getDoc(salaRef);
  const data = salaSnap.data();

  if (data.jugadores.length < 2) throw new Error("Mínimo 2 jugadores.");

  const impostorId = data.jugadores[Math.floor(Math.random() * data.jugadores.length)].id;
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
    ordenTurnos: data.jugadores.map(j => j.id),
    turnoIndex: 0,
    inicioTurno: Date.now(), // MARCA DE TIEMPO PARA EL TIMER
    votos: {}
  });
};

// ENVIAR PISTA NORMAL
export const enviarPistaTurno = async (codigoSala, nombreJugador, texto, turnoActual, totalJugadores) => {
  const salaRef = doc(db, "salas", codigoSala);
  const salaSnap = await getDoc(salaRef);
  const data = salaSnap.data();

  // Verificar victoria impostor (Snipe)
  const esImpostor = data.jugadores.find(j => j.nombre === nombreJugador).id === data.impostor;
  if (esImpostor && texto.trim().toLowerCase() === data.campeonActual.nombre.toLowerCase()) {
    await updateDoc(salaRef, { estado: "FINALIZADO", ganador: "IMPOSTOR", motivo: "ADIVINO" });
    return;
  }

  await updateDoc(salaRef, { mensajesRonda: arrayUnion({ nombre: nombreJugador, texto }) });
  avanzarTurno(salaRef, turnoActual, totalJugadores);
};

// NUEVO: SALTAR TURNO POR TIEMPO (El Host llama a esto)
export const saltarTurnoPorTiempo = async (codigoSala, turnoActual, totalJugadores) => {
  const salaRef = doc(db, "salas", codigoSala);
  // Agregamos mensaje de sistema
  await updateDoc(salaRef, { mensajesRonda: arrayUnion({ nombre: "SISTEMA", texto: "⌛ Tiempo Agotado" }) });
  avanzarTurno(salaRef, turnoActual, totalJugadores);
};

// Función auxiliar para avanzar (usada por las dos anteriores)
const avanzarTurno = async (salaRef, turnoActual, totalJugadores) => {
  const siguienteTurno = turnoActual + 1;
  if (siguienteTurno >= totalJugadores) {
    await updateDoc(salaRef, { fase: "VOTACION", turnoIndex: -1 });
  } else {
    // Reseteamos el reloj para el siguiente
    await updateDoc(salaRef, { turnoIndex: siguienteTurno, inicioTurno: Date.now() });
  }
};

export const enviarVoto = async (codigoSala, miId, idVotado) => {
  const salaRef = doc(db, "salas", codigoSala);
  await updateDoc(salaRef, { [`votos.${miId}`]: idVotado });
};

export const procesarVotacion = async (codigoSala, resultados, rondaActual) => {
  const salaRef = doc(db, "salas", codigoSala);
  if (resultados.expulsado) {
    await updateDoc(salaRef, { 
      estado: "FINALIZADO", ganador: resultados.esImpostor ? "TRIPULANTES" : "IMPOSTOR",
      expulsadoNombre: resultados.nombreExpulsado, motivo: "VOTACION"
    });
  } else {
    if (rondaActual >= 4) {
      await updateDoc(salaRef, { estado: "FINALIZADO", ganador: "IMPOSTOR", motivo: "TIEMPO" });
    } else {
      await updateDoc(salaRef, {
        fase: "PISTAS", ronda: rondaActual + 1, mensajesRonda: [], 
        turnoIndex: 0, inicioTurno: Date.now(), votos: {}
      });
    }
  }
};

export const reiniciarJuego = async (codigoSala) => {
  const salaRef = doc(db, "salas", codigoSala);
  await updateDoc(salaRef, {
    estado: "LOBBY", campeonActual: null, impostor: null, fase: null, ronda: 0,
    mensajesRonda: [], pistasImpostor: [], ordenTurnos: [], turnoIndex: 0, votos: {},
    ganador: null, motivo: null, expulsadoNombre: null
  });
};