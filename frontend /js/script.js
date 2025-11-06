// js/script.js
// DOM Elements for Auth Page
const signInBtn = document.getElementById('sign-in-btn');
const signUpBtn = document.getElementById('sign-up-btn');
const signInForm = document.getElementById('sign-in-form');
const signUpForm = document.getElementById('sign-up-form');
const signInLink = document.getElementById('sign-in-link');
const signUpLink = document.getElementById('sign-up-link');
const hero = document.querySelector('.hero');

// Show Sign In Form
if (signInBtn) {
    signInBtn.addEventListener('click', () => {
        hero.classList.add('hidden');
        signUpForm.classList.add('hidden');
        signInForm.classList.remove('hidden');
    });
}

// Show Sign Up Form
if (signUpBtn) {
    signUpBtn.addEventListener('click', () => {
        hero.classList.add('hidden');
        signInForm.classList.add('hidden');
        signUpForm.classList.remove('hidden');
    });
}

// Switch to Sign In Form
if (signInLink) {
    signInLink.addEventListener('click', (e) => {
        e.preventDefault();
        signUpForm.classList.add('hidden');
        signInForm.classList.remove('hidden');
    });
}

// Switch to Sign Up Form
if (signUpLink) {
    signUpLink.addEventListener('click', (e) => {
        e.preventDefault();
        signInForm.classList.add('hidden');
        signUpForm.classList.remove('hidden');
    });
}

// Mood Rating Interaction (Home Page)
if (document.querySelector('.rating-scale')) {
    const ratingBars = document.querySelectorAll('.rating-bar');
    const currentRating = document.getElementById('current-rating');
    
    const ratingDescriptions = {
        1: '1 – Very Rough Day: High stress, little energy, struggling to get through tasks',
        2: '2 – Rough Day: Significant stress, low energy, difficulty focusing',
        3: '3 – Difficult Day: Noticeable stress, reduced productivity',
        4: '4 – Challenging Day: Some stress, but manageable',
        5: '5 – Neutral Day: Balanced mood, normal stress levels',
        6: '6 – Okay Day: Generally positive with minor stressors',
        7: '7 – Good Day: Positive mood, good energy levels',
        8: '8 – Very Good Day: High energy, minimal stress',
        9: '9 – Great Day: Excellent mood, highly productive',
        10: '10 – Excellent Day: Peak performance, completely stress-free'
    };
    
    ratingBars.forEach(bar => {
        bar.addEventListener('click', () => {
            // Remove selected class from all bars
            ratingBars.forEach(b => b.classList.remove('selected'));
            // Add selected class to clicked bar
            bar.classList.add('selected');
            
            // Update rating description
            const rating = bar.getAttribute('data-rating');
            currentRating.textContent = ratingDescriptions[rating];
        });
    });
}

// Utility function to format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

// Utility function to format time ago
function timeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDate(timestamp);
}