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

// Form Submission
if (document.getElementById('sign-in')) {
    document.getElementById('sign-in').addEventListener('submit', (e) => {
        e.preventDefault();
        // In a real application, you would handle authentication here
        alert('Sign In functionality would be implemented here');
        // Redirect to home page
        window.location.href = 'home.html';
    });
}

if (document.getElementById('sign-up')) {
    document.getElementById('sign-up').addEventListener('submit', (e) => {
        e.preventDefault();
        // In a real application, you would handle registration here
        alert('Sign Up functionality would be implemented here');
        // Redirect to home page
        window.location.href = 'home.html';
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
// Example last 7 days (replace with backend or localStorage data)
const moodData = [
  { date: "Mon", rating: 6 },
  { date: "Tue", rating: 7 },
  { date: "Wed", rating: 8 },
  { date: "Thu", rating: 6 },
  { date: "Fri", rating: 9 },
  { date: "Sat", rating: 7 },
  { date: "Sun", rating: 8 },
];

const ctx = document.getElementById("moodChart").getContext("2d");

const moodChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: moodData.map(entry => entry.date),
    datasets: [
      {
        label: "Mood Rating (1–10)",
        data: moodData.map(entry => entry.rating),
        borderColor: "#4caf50",
        backgroundColor: "rgba(76, 175, 80, 0.2)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: "#388e3c"
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 10,
        title: {
          display: true,
          text: "Mood Level"
        }
      },
      x: {
        title: {
          display: true,
          text: "Day of Week"
        }
      }
    },
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Your Mood Trends This Week"
      }
    }
  }
});


// Chart Implementation for Forecast Page
if (document.getElementById('stressChart')) {
    const ctx = document.getElementById('stressChart').getContext('2d');
    
    const stressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Stress Level',
                data: [7, 5, 6, 8, 4, 3, 2],
                borderColor: '#ff7e5f',
                backgroundColor: 'rgba(255, 126, 95, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Stress Level (1-10)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Day of Week'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Weekly Stress Pattern'
                }
            }
        }
    });
}