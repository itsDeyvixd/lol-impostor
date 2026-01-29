# 🕵️ LoL Impostor - Social Deduction Game

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

> Un juego multijugador en tiempo real inspirado en la mecánica de "Spyfall" y "Among Us", ambientado en el universo de League of Legends. Desarrollado con React y Firebase.

---

## 🎮 ¡Juega Ahora!

Puedes probar la versión desplegada y jugar con tus amigos aquí:

### 🚀 [https://lol-impostor.vercel.app/](https://lol-impostor.vercel.app/)

---

## 📋 Sobre el Proyecto

**LoL Impostor** es un juego de deducción social diseñado para grupos de amigos. La premisa es simple: Todos conocen al Campeón secreto, excepto uno (el Impostor).

El objetivo es descubrir al mentiroso a través de preguntas y pistas, mientras el Impostor intenta pasar desapercibido o adivinar el campeón secreto para ganar la partida instantáneamente.

### ✨ Características Principales

* **Multijugador en Tiempo Real:** Sincronización instantánea de estado de juego, chat y votaciones usando **Firebase Firestore**.
* **Sistema de Salas:** Creación de lobbies privados con códigos únicos (ej: `XJ9Z`) y enlaces de invitación directos.
* **Lógica de Turnos y Timer:** Sistema de turnos estilo "Pinturillo" con cronómetro configurable por el host para mantener el ritmo del juego.
* **Roles Dinámicos:**
    * **Tripulante:** Ve al campeón completo y sus datos.
    * **Impostor:** Solo recibe pistas parciales progresivas (1 por ronda).
* **Condiciones de Victoria Estratégicas:**
    * *Snipe:* El Impostor gana si escribe el nombre exacto del campeón en el chat.
    * *Supervivencia:* El Impostor gana si sobrevive 4 rondas.
    * *Expulsión:* Los tripulantes ganan si votan mayoritariamente al impostor.
* **Diseño Hextech:** Interfaz oscura y dorada inspirada en el cliente de League of Legends, totalmente responsiva (Móvil/Desktop).
* **Integración con API:** Carga dinámica de iconos de invocador y datos de campeones usando **DataDragon**.

---

## 🛠️ Tecnologías Usadas

* **Frontend:** React.js + (Vite)
* **Backend / DB:** Firebase Firestore (NoSQL, Realtime updates)
* **Estilos:** CSS3 (Variables, Flexbox, Grid, Animaciones)
* **Deploy:** Vercel CI/CD
* **Control de Versiones:** Git & GitHub

---

## ⚙️ Instalación Local

Si deseas clonar y correr este proyecto en tu máquina :

1.  **Clonar el repositorio**
    ```bash
    git clone [https://github.com/itsDeyvixd/lol-impostor.git](https://github.com/itsDeyvixd/lol-impostor.git)
    cd lol-impostor
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

3.  **Configurar Firebase**
    * Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
    * Crea un archivo `src/services/firebase.js` con tus credenciales.

4.  **Correr el servidor de desarrollo**
    ```bash
    npm run dev
    ```

---

## 👤 Autor

Desarrollado con ❤️ y mucho café por **Deyvi Ardila Forero**.

* 🐙 **GitHub:** [@itsDeyvixd](https://github.com/itsDeyvixd)
* 💼 **LinkedIn:** [Deyvi Ardila Forero](https://www.linkedin.com/in/deyvi-ardila-forero-792154253/)

---

_Este proyecto no está afiliado con **Riot Games**. League of Legends y sus recursos son propiedad de Riot Games, Inc._