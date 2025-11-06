// js/auth.js 
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication state
    if (userManager.isAuthenticated() && window.location.pathname.endsWith('index.html')) {
        window.location.href = 'home.html';
    } else if (!userManager.isAuthenticated() && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
    }

    // Setup sign out buttons
    const signOutBtns = document.querySelectorAll('#sign-out-btn');
    signOutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to sign out?')) {
                userManager.logout();
                window.location.href = 'index.html';
            }
        });
    });

    // Authentication form handling
    const signInForm = document.getElementById('sign-in');
    const signUpForm = document.getElementById('sign-up');

    if (signInForm) {
        signInForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const submitBtn = signInForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.textContent = 'Signing In...';
                submitBtn.disabled = true;

                await userManager.login({
                    username: username,
                    password: password
                });
                
                window.location.href = 'home.html';
            } catch (error) {
                alert('Login failed: ' + error.message);
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    if (signUpForm) {
        signUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userData = {
                username: document.getElementById('new-username').value,
                email: document.getElementById('email').value,
                password: document.getElementById('new-password').value,
                name: document.getElementById('name').value
            };

            const submitBtn = signUpForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.textContent = 'Creating Account...';
                submitBtn.disabled = true;

                await userManager.register(userData);
                window.location.href = 'home.html';
            } catch (error) {
                alert('Registration failed: ' + error.message);
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});