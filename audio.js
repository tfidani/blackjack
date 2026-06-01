var audioContexto = new AudioContext();
const $toggleSonidoButton = document.querySelector("#toggleSonido")
let sonidoOn = false;

function toggleSonido() {
    sonidoOn = !sonidoOn;
}

$toggleSonidoButton.addEventListener("click", toggleSonido)

const audioPlay = async url => {
    if(!sonidoOn) return;

    console.log("[audio] ", url)

    const source = audioContexto.createBufferSource();
    const audioBuffer = await fetch(url)
    .then(res => res.arrayBuffer())
    .then(ArrayBuffer => audioContexto.decodeAudioData(ArrayBuffer));

    source.buffer = audioBuffer;
    source.connect(audioContexto.destination);
    source.start();
};



function playSacarCartaAudio() {
    const audio = Math.random() > .5 ? "./sfx/darCarta1.mp3" : "./sfx/darCarta2.mp3"
    audioPlay(audio).then()
}

function playWoosh() {
    const audio = Math.random() > .5 ? "./sfx/woosh1.mp3" : "./sfx/woosh2.mp3"
    audioPlay("./sfx/cambiarJugador2.mp3").then()
}


export { audioPlay, toggleSonido, playSacarCartaAudio, playWoosh }