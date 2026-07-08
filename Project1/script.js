// --- MOBILE NAV MENU TOGGLE ---
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');

menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const icon = menuBtn.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-xmark');
});

// Close menu cleanly upon selection
document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = menuBtn.querySelector('i');
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-xmark');
    });
});

// --- ACTIVE LINK ON SCROLL HIGHLIGHT ---
const sections = document.querySelectorAll('section');
const navItems = document.querySelectorAll('.nav-item');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= (sectionTop - sectionHeight / 3)) {
            current = section.getAttribute('id');
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href').slice(1) === current) {
            item.classList.add('active');
        }
    });
});

// --- CONTACT FORM SUBMISSION WITH EMAIL INTERACTION ---
const form = document.getElementById('portfolioForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let isValid = true;

    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const message = document.getElementById('message');

    // Reset Error Displays
    document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');

    // Name check
    if (!name.value.trim()) {
        document.getElementById('nameError').style.display = 'block';
        isValid = false;
    }

    // Email check
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value.trim())) {
        document.getElementById('emailError').style.display = 'block';
        isValid = false;
    }

    // Message check
    if (!message.value.trim()) {
        document.getElementById('messageError').style.display = 'block';
        isValid = false;
    }

    if (isValid) {
        const formData = new FormData(form);
        
        try {
            const response = await fetch(form.action, {
                method: form.method,
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                alert('Thank you, Sagar! Your message was sent successfully to sagarrawat.12107@gmail.com.');
                form.reset();
            } else {
                alert('Oops! There was a problem sending your message. Please try again.');
            }
        } catch (error) {
            alert('Connection error! Could not send message.');
        }
    }
});