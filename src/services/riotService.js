import datosExtra from '../data/champions_extended.json';

const VERSION = "14.1.1"; // Puedes cambiarla a una más reciente si Riot la soporta
const BASE_URL = `https://ddragon.leagueoflegends.com/cdn/${VERSION}/data/es_ES/champion.json`;
const IMG_URL = `https://ddragon.leagueoflegends.com/cdn/${VERSION}/img/champion`;

// Diccionario para traducir roles (¡Lo recuperamos!)
const ROL_TRADUCCION = {
  Fighter: "Luchador",
  Tank: "Tanque",
  Mage: "Mago",
  Assassin: "Asesino",
  Support: "Soporte",
  Marksman: "Tirador"
};

export const obtenerCampeones = async () => {
  try {
    const response = await fetch(BASE_URL);
    const data = await response.json();
    const campeonesMap = data.data;

    const lista = Object.values(campeonesMap).map(champ => {
      const extra = datosExtra.find(e => e.id === champ.id) || {};
      const pistasGeneradas = [];

      // 1. Pistas de nuestra base de datos "Hardcore"
      if (extra.species) pistasGeneradas.push(`Especie: ${extra.species}`);
      if (extra.region) pistasGeneradas.push(`Región: ${extra.region}`);
      if (extra.year) pistasGeneradas.push(`Lanzamiento: Año ${extra.year}`);

      // 2. Pistas técnicas de Riot
      const recurso = champ.partype;
      if (recurso && recurso !== "None") pistasGeneradas.push(`Usa recurso: ${recurso}`);

      // 3. Roles traducidos
      const rolesTraducidos = champ.tags.map(tag => ROL_TRADUCCION[tag] || tag).join(", ");
      pistasGeneradas.push(`Roles: ${rolesTraducidos}`);

      pistasGeneradas.push(`Título: ${champ.title}`);

      // 4. Dato Curioso (Sin regalarla)
      if (extra.funFact) pistasGeneradas.push(`💡 Dato Curioso: ${extra.funFact}`);

      // NOTA: Eliminamos el Lore (Blurb) para evitar "mucho texto"

      return {
        id: champ.id,
        nombre: champ.name,
        imagen: `${IMG_URL}/${champ.image.full}`,
        pistas: pistasGeneradas
      };
    });

    return lista;
  } catch (error) {
    console.error("Error obteniendo campeones:", error);
    return [];
  }
};