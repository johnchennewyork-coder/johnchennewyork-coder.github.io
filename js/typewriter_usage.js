var app = document.getElementById('app');

var typewriter = new Typewriter(app, {
    loop: true,
    typingSpeed: 75,
    deleteSpeed: 25
});

const speed = 2000;

typewriter.typeString('systems hacker')
    .pauseFor(speed)
    .deleteAll()
    .typeString('AI researcher')
    .pauseFor(speed)
    .deleteAll()
    .typeString('web developer')
    .pauseFor(speed)
    .deleteAll()
    .changeTypingSpeed(50)
    .typeString('early adopter of the next web')
    .pauseFor(speed + 1000)
    .start();

// var typed = new Typed('.element', {
//     strings: ["First sentence.", "Second sentence."],
//     typeSpeed: 30
// });