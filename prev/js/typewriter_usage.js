var app = document.getElementById('app');

var typewriter = new Typewriter(app, {
    loop: true,
    typingSpeed: 75,
    deleteSpeed: 25
});

const speed = 2000;

typewriter.typeString('data scientist')
    .pauseFor(speed)
    .deleteAll()
    .typeString('AI researcher')
    .pauseFor(speed)
    .deleteAll()
    .typeString('Full stack developer')
    .pauseFor(speed)
    .deleteAll()
    .changeTypingSpeed(50)
    .typeString('PhD student')
    .pauseFor(speed + 1000)
    .start();

// var typed = new Typed('.element', {
//     strings: ["First sentence.", "Second sentence."],
//     typeSpeed: 30
// });