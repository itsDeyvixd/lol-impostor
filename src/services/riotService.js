// src/services/riotService.js

const ROL_TRADUCCION = {
  Fighter: "Luchador",
  Tank: "Tanque",
  Mage: "Mago",
  Assassin: "Asesino",
  Support: "Soporte",
  Marksman: "Tirador"
};

const generarPistas = (champ) => {
  const pistas = [];

  // Pista 1: Roles
  const rolesEsp = champ.tags.map(tag => ROL_TRADUCCION[tag] || tag).join(" y ");
  pistas.push(`Su rol principal es: ${rolesEsp}`);

  // Pista 2: Recurso
  const recurso = champ.partype;
  if (recurso === "Mana") pistas.push("Usa Maná");
  else if (recurso === "None" || recurso === "Manaless") pistas.push("No usa recurso");
  else if (recurso === "Energy") pistas.push("Usa Energía");
  else pistas.push(`Su recurso es: ${recurso}`);

  // Pista 3: Rango
  if (champ.stats.attackrange < 300) {
    pistas.push("Es Melé (cuerpo a cuerpo)");
  } else {
    pistas.push("Es de Rango");
  }

  // Pista 4: Título
  pistas.push(`Se le conoce como: "${champ.title}"`);

  return pistas;
};

export const obtenerCampeones = async () => {
  try {
    // 1. Buscamos la versión más nueva
    const versionResp = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versiones = await versionResp.json();
    const version = versiones[0];

    // 2. Descargamos los datos
    const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/es_ES/champion.json`);
    const data = await response.json();
    
    // 3. Limpiamos y traducimos
    const listaLimpia = Object.values(data.data).map(champ => ({
      id: champ.id,
      nombre: champ.name,
      titulo: champ.title,
      // Construimos la url de la imagen
      imagen: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image.full}`,
      pistas: generarPistas(champ)
    }));

    return listaLimpia;

  } catch (error) {
    console.error("Error cargando campeones:", error);
    return [];
  }
};