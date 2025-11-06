// js/home.js
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!userManager.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    const user = userManager.getCurrentUser();
    
    // Update welcome message with real user name
    document.getElementById('welcome-message').textContent = `Hello, ${user.name}`;
    
    // Update mood data
    updateMoodData();
    
    // Setup mood check-in
    setupMoodCheckIn();
});

function updateMoodData() {
    const user = userManager.getCurrentUser();
    
    // Update last week review
    const avgMood = userManager.getAverageMood();
    const reviewText = document.getElementById('weekly-summary');
    const avgMoodElement = document.getElementById('avg-mood');
    const checkinCountElement = document.getElementById('checkin-count');
    
    if (user.mood_data && user.mood_data.length > 0) {
        const totalCheckins = user.mood_data.length;
        const weeklyCheckins = user.mood_data.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return entryDate > weekAgo;
        }).length;
        
        reviewText.textContent = `Based on your ${totalCheckins} total check-ins, your average mood is ${avgMood.toFixed(1)}/10. ${getMoodTrend()}`;
        avgMoodElement.textContent = `${avgMood.toFixed(1)}/10`;
        checkinCountElement.textContent = `${weeklyCheckins} days`;
        
        // Update progress bar
        document.querySelector('.rating-bar-small .bar-fill').style.width = `${avgMood * 10}%`;
    } else {
        reviewText.textContent = 'Start tracking your mood to see insights here! Check in daily to build your stress forecast.';
        avgMoodElement.textContent = '-/-';
        checkinCountElement.textContent = '0 days';
        document.querySelector('.rating-bar-small .bar-fill').style.width = '0%';
    }
    
    // Update chart with real user data
    updateMoodChart();
}

function setupMoodCheckIn() {
    const ratingBars = document.querySelectorAll('.rating-bar');
    const checkInBtn = document.getElementById('check-in-btn');
    
    if (checkInBtn) {
        checkInBtn.addEventListener('click', async () => {
            const selectedBar = document.querySelector('.rating-bar.selected');
            if (selectedBar) {
                const rating = selectedBar.getAttribute('data-rating');
                const originalText = checkInBtn.textContent;
                
                try {
                    checkInBtn.textContent = 'Checking In...';
                    checkInBtn.disabled = true;

                    await userManager.addMoodRating(rating);
                    
                    // Show success message
                    alert(`✅ Mood check-in recorded: ${rating}/10`);
                    
                    // Refresh the display
                    updateMoodData();
                    
                    // Reset selection
                    ratingBars.forEach(b => b.classList.remove('selected'));
                    document.getElementById('current-rating').textContent = 'Please select a rating';
                    
                } catch (error) {
                    alert('Failed to save mood rating: ' + error.message);
                } finally {
                    checkInBtn.textContent = originalText;
                    checkInBtn.disabled = false;
                }
            } else {
                alert('Please select a mood rating first');
            }
        });
    }
}

function getMoodTrend() {
    const user = userManager.getCurrentUser();
    if (!user.mood_data || user.mood_data.length < 2) {
        return 'Keep tracking to see trends!';
    }
    
    const recentMoods = user.mood_data.slice(-7).map(m => m.rating);
    const previousMoods = user.mood_data.slice(-14, -7).map(m => m.rating);
    
    if (previousMoods.length === 0) return 'This is your first week tracking!';
    
    const currentAvg = recentMoods.reduce((a, b) => a + b) / recentMoods.length;
    const previousAvg = previousMoods.reduce((a, b) => a + b) / previousMoods.length;
    
    const difference = currentAvg - previousAvg;
    
    if (difference > 1) return 'Great improvement from last week! 📈';
    if (difference > 0.2) return 'Slight improvement from last week. ↗️';
    if (difference < -1) return 'Your mood has decreased recently. 📉';
    if (difference < -0.2) return 'Slight decrease from last week. ↘️';
    
    return 'Stable compared to last week. →';
}

function updateMoodChart() {
    const moodData = userManager.getWeeklyMoodData();
    const ctx = document.getElementById("moodChart");
    
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (ctx.chart) {
        ctx.chart.destroy();
    }

    // Get user's name for personalized chart title
    const user = userManager.getCurrentUser();
    const userName = user.name.split(' ')[0]; // Use first name only

    // Check if we have any actual mood data
    const hasMoodData = moodData.some(entry => entry.rating !== null);
    
    if (!hasMoodData) {
        // Show empty state chart
        ctx.chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: moodData.map(entry => entry.date),
                datasets: [
                    {
                        label: "No Data Yet",
                        data: moodData.map(() => null),
                        borderColor: "#cccccc",
                        backgroundColor: "rgba(204, 204, 204, 0.1)",
                        borderWidth: 2,
                        borderDash: [5, 5],
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0,
                        max: 10,
                        title: {
                            display: true,
                            text: "Mood Level"
                        },
                        ticks: {
                            stepSize: 2,
                            callback: function(value) {
                                return value;
                            }
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
                        text: `${userName}'s Mood Trends - Start Tracking!`
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
        return;
    }

    // Create chart with actual user data
    ctx.chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: moodData.map(entry => entry.date),
            datasets: [
                {
                    label: "Mood Rating",
                    data: moodData.map(entry => entry.rating),
                    borderColor: getMoodLineColor(moodData),
                    backgroundColor: getMoodFillColor(moodData),
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: getPointRadius(moodData),
                    pointBackgroundColor: getPointColors(moodData),
                    pointBorderColor: "#ffffff",
                    pointBorderWidth: 2,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 10,
                    title: {
                        display: true,
                        text: "Mood Level",
                        font: {
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            const moodLabels = {
                                1: '😢 1', 2: '😔 2', 3: '😐 3', 4: '😕 4', 5: '😊 5',
                                6: '😊 6', 7: '😄 7', 8: '😄 8', 9: '🌟 9', 10: '🎉 10'
                            };
                            return moodLabels[value] || value;
                        },
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Day of Week",
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: { 
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: `${userName}'s Mood Trends This Week`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: 20
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: getMoodLineColor(moodData),
                    borderWidth: 2,
                    callbacks: {
                        label: function(context) {
                            const rating = context.parsed.y;
                            if (rating === null) return 'No data';
                            
                            const moodDescriptions = {
                                1: 'Very Rough', 2: 'Rough', 3: 'Difficult', 4: 'Challenging',
                                5: 'Neutral', 6: 'Okay', 7: 'Good', 8: 'Very Good', 9: 'Great', 10: 'Excellent'
                            };
                            return `Mood: ${rating}/10 - ${moodDescriptions[rating]}`;
                        },
                        afterLabel: function(context) {
                            const rating = context.parsed.y;
                            if (rating === null) return '';
                            
                            if (rating >= 8) return '🌟 Great day!';
                            if (rating >= 6) return '😊 Good mood!';
                            if (rating >= 4) return '😐 Managing well';
                            return '💪 You got through it';
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animations: {
                tension: {
                    duration: 1000,
                    easing: 'linear'
                }
            }
        }
    });
}

// Helper functions for dynamic chart styling based on mood data
function getMoodLineColor(moodData) {
    const ratings = moodData.map(entry => entry.rating).filter(r => r !== null);
    if (ratings.length === 0) return "#4a6fa5";
    
    const avgMood = ratings.reduce((a, b) => a + b) / ratings.length;
    
    if (avgMood >= 8) return "#4caf50"; // Green for excellent mood
    if (avgMood >= 6) return "#8bc34a"; // Light green for good mood
    if (avgMood >= 4) return "#ff9800"; // Orange for neutral mood
    return "#f44336"; // Red for low mood
}

function getMoodFillColor(moodData) {
    const ratings = moodData.map(entry => entry.rating).filter(r => r !== null);
    if (ratings.length === 0) return "rgba(74, 111, 165, 0.1)";
    
    const avgMood = ratings.reduce((a, b) => a + b) / ratings.length;
    
    if (avgMood >= 8) return "rgba(76, 175, 80, 0.2)";
    if (avgMood >= 6) return "rgba(139, 195, 74, 0.2)";
    if (avgMood >= 4) return "rgba(255, 152, 0, 0.2)";
    return "rgba(244, 67, 54, 0.2)";
}

function getPointRadius(moodData) {
    return moodData.map(entry => entry.rating !== null ? 5 : 0);
}

function getPointColors(moodData) {
    return moodData.map(entry => {
        if (entry.rating === null) return 'transparent';
        
        if (entry.rating >= 8) return "#4caf50";
        if (entry.rating >= 6) return "#8bc34a";
        if (entry.rating >= 4) return "#ff9800";
        return "#f44336";
    });
}

// Add this function to userData.js to enhance the weekly data
function getEnhancedWeeklyMoodData() {
    const basicData = userManager.getWeeklyMoodData();
    const user = userManager.getCurrentUser();
    
    return basicData.map(day => {
        if (day.rating === null) return day;
        
        // Add emoji based on rating
        let emoji = '😊';
        if (day.rating >= 9) emoji = '🎉';
        else if (day.rating >= 8) emoji = '🌟';
        else if (day.rating >= 7) emoji = '😄';
        else if (day.rating >= 6) emoji = '🙂';
        else if (day.rating >= 5) emoji = '😐';
        else if (day.rating >= 4) emoji = '😕';
        else if (day.rating >= 3) emoji = '😔';
        else if (day.rating >= 2) emoji = '😢';
        else emoji = '😭';
        
        return {
            ...day,
            emoji: emoji
        };
    });
}