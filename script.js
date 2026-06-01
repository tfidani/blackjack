import { calcularValorMano, calcularValorManoDisplay, delay } from "./helpers.js";
import { audioPlay, playSacarCartaAudio, playWoosh } from "./audio.js";

const $dealerDiv = document.querySelector("#dealer");
const $jugadoresDiv = document.querySelector("#jugadores")
const [$pedir, $doblar, $plantarse] = document.querySelectorAll("button");


class Juego {
    barajaID = null;
    jugadores = [];
    apuestaMinima = 100;

    turno_jugador = 1;

    añadirJugador(jugador) {
        if (jugador.isDealer === false && this.jugadores.length === 0) {
            console.log("El primer jugador debe ser dealer");
        }

        this.jugadores.push(jugador);

    } 

    async iniciarJuego() {

        if (this.barajaID === null) {
            const res = await fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1");
            const data = await res.json();
            
            if (data.success) {
                this.barajaID = data.deck_id;
                console.log(`Creada baraja ${this.barajaID}: Cartas restantes ${data.remaining}`)
            }
        }

        // await this.repartirCartasIniciales();
        await this.repartirCartasConAnimacion();
    }

    // No usar, no tiene animaciones
    async repartirCartasIniciales() {
        const totalCartas = 2 * this.jugadores.length;
        const cartas = await this.sacarCartas(totalCartas);

        if (!cartas) return;

        for (let i = 0; i < this.jugadores.length; i++) {
            this.jugadores[i].cartas = [];
            if (i === 0) { continue; } // El dealer no apuesta nunca

            this.jugadores[i].apuestaActual = this.apuestaMinima;
        }

        // hacemos 2 rondas, porque se da una carta por ronda
        for (let ronda = 0; ronda < 2; ronda++) {
            // empezamos por el indice 1 porq es el primer jugador hasta el ultimo
            for (let i = 1; i < this.jugadores.length; i++) {
                this.jugadores[i].cartas.push(cartas.shift());
            }

            // al final de repartirle a todos los jugadores
            // le damos una carta al dealer
            this.jugadores[0].cartas.push(cartas.shift());
        }

        this.render();

    }

    async sacarCartas(cantidad = 1) {
        const res = await fetch(`https://deckofcardsapi.com/api/deck/${this.barajaID}/draw/?count=${cantidad}`);
        const data = await res.json();

        if (!data.success) return null;

        return data.cards;
    
    }

    // Esta función tiene varios chequeos para que se puedan mostrar jugadores tengan o no cartas
    render() {
        $dealerDiv.innerHTML = "";
        $jugadoresDiv.innerHTML = "";
        
        // toReversed para q los jugadores vayan de derecha primero a izq ultimo
        this.jugadores.toReversed().forEach((jugador, index) => {
            // Indice real
            const idx = this.jugadores.length - 1 - index;
            const tieneCartas = jugador.cartas && jugador.cartas.length > 0;
            let cartasHTML = "";
            let valorMano = 0;
            let valorManoDisplay = "";

            // El dealer esta al final del array
            if (index === this.jugadores.length-1) { // * REVISA QUE SEA JUGADOR
                if (tieneCartas) {
                    //! Esconde la segunda carta si el turno no es el del dealer
                    // Revisa que tenga 2 o más cartas (no se puede ocultar una carta que el dealer no tiene xd)
                    if (this.turno_jugador !== 0 && jugador.cartas.length >= 2) {
                        cartasHTML = `
                            <img class="carta" src="/img/${jugador.cartas[0].code}.png" alt="">
                            <img class="carta" src="/img/back.png" alt="">
                        `;
                        valorMano = calcularValorMano([jugador.cartas[0]])
                        valorManoDisplay = calcularValorManoDisplay([jugador.cartas[0]]);
                    } else {
                        cartasHTML = jugador.cartas.map((carta) => `<img class="carta" src="/img/${carta.code}.png" alt="">`).join("");
                        valorMano = calcularValorMano(jugador.cartas)
                        valorManoDisplay = calcularValorManoDisplay(jugador.cartas);
                    }
                }

                $dealerDiv.innerHTML = `
                    <div class="jugador ${this.turno_jugador === idx ? "turnoActual" : ""}">
                        <p>${jugador.nombre}: ${jugador.puntos - jugador.apuestaActual}</p>
                        <p>Apuesta: ${jugador.apuestaActual}</p>
                        <div class="cartas">
                            ${cartasHTML}
                        </div>
                        <p>${valorManoDisplay}</p>
                    </div>
                `;
            
            } else { // * NO ES JUGADOR
                if (tieneCartas) {
                    valorMano = calcularValorMano(jugador.cartas)
                    valorManoDisplay = calcularValorManoDisplay(jugador.cartas);
                }

                $jugadoresDiv.innerHTML += `
                    <div class="jugador ${this.turno_jugador === idx ? "turnoActual" : ""} ${valorMano>21 ? "bust" : ""}">
                        <p>${jugador.nombre}: ${jugador.puntos - jugador.apuestaActual}</p>
                        <p>Apuesta: ${jugador.apuestaActual}</p>
                        <div class="cartas">
                            ${jugador.cartas.map((carta) => `<img class="carta" src="/img/${carta.code}.png" alt="">`).join("")}
                        </div>
                        <p>${this.turno_jugador === idx ? valorManoDisplay : valorMano}</p>
                    </div>
                `;


                // Correr solo la logica de deshabilitar el boton de doblar (si pedis una carta ya no podes doblar)
                // Solo cuando el jugador es el q tiene el turno
                if (this.turno_jugador === idx) {
                    if (jugador.cartas.length === 2) {
                        $doblar.disabled = false;
                        $doblar.classList.value = "enabled";
                    } else {
                        $doblar.classList.value = "disabled";
                        $doblar.disabled = true;
                    }
                }
            }
        });
    }

    async repartirCartasConAnimacion() {
        const totalCartas = 2 * this.jugadores.length;
        const cartas = await this.sacarCartas(totalCartas);

        if (!cartas) return;

        // Vacia las cartas de todos los jugadores
        for (let i = 0; i < this.jugadores.length; i++) {
            this.jugadores[i].cartas = [];

            this.jugadores[i].apuestaActual = this.apuestaMinima;
        }

        // Render inicial
        this.render();
        await delay(500); 

        // En blackjack se reparten 1 por ronda en vez de 2 a la vez
        for (let ronda = 0; ronda < 2; ronda++) {

            // Vamos desde el indice 1 al final para saltear al dealer que esta en indice 0
            for (let i = 1; i < this.jugadores.length; i++) {
                playSacarCartaAudio()
                this.jugadores[i].cartas.push(cartas.shift());
                this.render();
                await delay(500);
            }

            // Le damos la carta al dealer porque lo saltamos previamente
            this.jugadores[0].cartas.push(cartas.shift());
            playSacarCartaAudio()
            this.render();
            await delay(500);
        }
    }

    // Según la API, es buena practica reshufflear todas las cartas
    // y no crear una nueva baraja para reiniciar el juego
    async reiniciarBaraja() {
        const res = await fetch(`https://deckofcardsapi.com/api/deck/${this.barajaID}/shuffle/`);
        const data = await res.json();

        if (data.success) {
            this.barajaID = data.deck_id;
            console.log(`Creada baraja ${this.barajaID}: Cartas restantes ${data.remaining}`)
        }
    }

    async reiniciarJuego() {
        this.turno_jugador = 1;
        
        this.reiniciarBaraja().then(() => {
            this.repartirCartasConAnimacion().then();
        })

    }

    siguienteTurno() {
        playWoosh()

        if (this.turno_jugador === 0) {
            // Esta logica se ejecuta cuando se llama a siguienteTurno() y el turno actual es el dealer
            // Osea vuelve al primer jugador pero no deberiamos volver al primer jugador
            // Sino que calcular las manos que ganaron y perdieron y reiniciar la baraja!

            // Valor final del dealer
            const valorManoDealer = calcularValorMano(this.jugadores[0].cartas);

            // Saltamos dealer
            for (let i = 1; i < this.jugadores.length; i++) {
                const jugador = this.jugadores[i];
                const valorManoJugador = calcularValorMano(jugador.cartas)
                
                // BUST
                if (valorManoJugador > 21) {
                    jugador.puntos -= jugador.apuestaActual;
                    jugador.apuestaActual = 0; // Solo para temas de render
                    continue;
                }

                 if (valorManoDealer > 21) {
                    // blackjack natural
                    if (valorManoJugador === 21 && jugador.cartas.length === 2) {
                        jugador.puntos += jugador.apuestaActual * 1.5;
                    } else {
                        jugador.puntos += jugador.apuestaActual;
                    }

                    jugador.apuestaActual = 0;
                    continue;
                }



                // Ganó jugador
                if (valorManoJugador > valorManoDealer) {
                    // Blackjack natural 1.5x
                    if (valorManoJugador === 21 && jugador.cartas.length === 2) {
                        jugador.puntos += jugador.apuestaActual * 1.5;
                    } else {
                        jugador.puntos += jugador.apuestaActual;
                    }
                } else if (valorManoJugador === valorManoDealer) {
                    // Iguales empate
                    jugador.apuestaActual = 0; // Solo para temas de render
                    continue;
                } else {
                    // Ganó dealer
                    jugador.puntos -= jugador.apuestaActual;
                }

                jugador.apuestaActual = 0; // Solo para temas de render
            }

            // finalizar juego

            delay(2000).then(() => {
                // TODO: Poner algun audio de chips y tal xd
                this.reiniciarJuego().then()
            });

            return;
        }

        this.turno_jugador = (this.turno_jugador+1) % this.jugadores.length;
    }

    async pedirCarta() {

        const cartaPedida = await this.sacarCartas(1);

        this.jugadores[this.turno_jugador].cartas.push(cartaPedida[0])

        if (calcularValorMano(this.jugadores[this.turno_jugador].cartas) > 21) {
            console.log("Jugador se pasó de 21");
            this.siguienteTurno();
        } else if (calcularValorMano(this.jugadores[this.turno_jugador].cartas) === 21) {
            console.log("Blackjack!!!");
            this.siguienteTurno();
        }

        this.render();

    }

    async doblar() {

        if($doblar.disabled) {return;}

        const jugador = this.jugadores[this.turno_jugador];
        jugador.apuestaActual *= 2;
        const carta = await this.sacarCartas(1);
        
        jugador.cartas.push(carta[0]);
        this.render();
        await delay(500);
        
        this.siguienteTurno();
        this.render();
    }

    async plantarse() {
        this.siguienteTurno()
        this.render()
    }



    getJugadores() {
        return this.jugadores;
    }


}

const dealer = {
    id: crypto.randomUUID(),
    isDealer: true,
    nombre: "Dealer",
    puntos: -1,
    apuestaActual: 0,
    cartas: []
};

const j1 = {
    id: crypto.randomUUID(),
    isDealer: false,
    nombre: "ticua",
    puntos: 1000,
    apuestaActual: 0,
    cartas: []
};

const j2 = {
    id: crypto.randomUUID(),
    isDealer: false,
    nombre: "ticua 2",
    puntos: 1000,
    apuestaActual: 0,
    cartas: []
};

const juego = new Juego();
juego.añadirJugador(dealer);
juego.añadirJugador(j1);
juego.añadirJugador(j2);

juego.iniciarJuego().then(() => {
    juego.getJugadores().forEach((jugador) => {
        console.log({
            isDealer: jugador.isDealer,
            nombre: jugador.nombre,
            valorCartas: calcularValorMano(jugador.cartas)            
        });
    })
});


$pedir.addEventListener("click", () => {
    playSacarCartaAudio()

    $pedir.disabled = true;
    juego.pedirCarta().then(() => {
        $pedir.disabled = false;
    })
})

let doblarDeshabilitado = false;
$doblar.addEventListener("click", () => {
    if(doblarDeshabilitado) { return; }

    playSacarCartaAudio()
    doblarDeshabilitado = true;

    juego.doblar().then(() => {
        doblarDeshabilitado = false;
    });

})

$plantarse.addEventListener("click", () => {
    $plantarse.disabled = true;
    juego.plantarse().then(() => {
        $plantarse.disabled = false;
    })
})