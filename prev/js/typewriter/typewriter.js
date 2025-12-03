// Typewriter Effect
(function() {
    const words = ['hacker', 'developer', 'researcher', 'innovator'];
    let currentWord = 0;
    let currentChar = 0;
    let isDeleting = false;
    const element = document.getElementById('app');
    
    if (!element) return;
    
    function typeWriter() {
        const word = words[currentWord];
        
        if (!isDeleting) {
            element.textContent = word.substring(0, currentChar + 1);
            currentChar++;
            
            if (currentChar === word.length) {
                isDeleting = true;
                setTimeout(typeWriter, 1500);
                return;
            }
        } else {
            element.textContent = word.substring(0, currentChar - 1);
            currentChar--;
            
            if (currentChar === 0) {
                isDeleting = false;
                currentWord = (currentWord + 1) % words.length;
                setTimeout(typeWriter, 500);
                return;
            }
        }
        
        setTimeout(typeWriter, isDeleting ? 100 : 150);
    }
    
    typeWriter();
})();
