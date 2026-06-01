function calcularValorMano(cartas) {
    let valorTotal = 0;
    let cantidadAses = 0;

    cartas.forEach((carta) => {
        switch(carta.value) {
            case "ACE": {
                cantidadAses++;
                break;
            }

            case "JACK":
            case "QUEEN":
            case "KING": {
                valorTotal += 10;
                break;
            }

            default: {
                // carta es un numero (parseInteger)
                const valorNumerico = parseInt(carta.value); // Asegurado que no falle la conversión
                valorTotal += valorNumerico;
                break;
            }
        }
    })

    // Se calculan los As al final para asegurar que ninguna carta extra se cuente
    // Despues de la elección de 1 o 11
    for (let i = 0; i < cantidadAses; i++) {
        if (valorTotal + 11 <= 21) {
            valorTotal += 11;
        } else {
            valorTotal += 1;
        }
    }

    return valorTotal;
}

// Función solo usada en el render
function calcularValorManoDisplay(cartas) {
    let valorTotal = 0;
    let cantidadAses = 0;

    cartas.forEach((carta) => {
        switch(carta.value) {
            case "ACE": {
                cantidadAses++;
                break;
            }

            case "JACK":
            case "QUEEN":
            case "KING": {
                valorTotal += 10;
                break;
            }

            default: {
                // carta es un numero (parseInteger)
                const valorNumerico = parseInt(carta.value); // Asegurado que no falle la conversión
                valorTotal += valorNumerico;
                break;
            }
        }
    })

    let valorMinimo = valorTotal;
    let valorMaximo = valorTotal;

    // Se calculan los As al final para asegurar que ninguna carta extra se cuente
    // Despues de la elección de 1 o 11
    for (let i = 0; i < cantidadAses; i++) {
        valorMinimo += 1;
        valorMaximo += 11;
    }

    // Blackjack natural
    if (valorMaximo === 21) {
        return valorMaximo
    }

    // Si el valor maximo se pasa no es importante para el usuario
    // Tambien si ambos son iguales solo mandar uno
    if (valorMaximo > 21 || valorMaximo === valorMinimo) {
        return valorMinimo;
    }

    return `${valorMinimo}/${valorMaximo}`
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));


export {delay, calcularValorMano, calcularValorManoDisplay}