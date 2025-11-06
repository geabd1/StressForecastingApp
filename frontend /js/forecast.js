// js/forecast.js 
document.addEventListener('DOMContentLoaded', function() {
    if (!userManager.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    const user = userManager.getCurrentUser();
    
    // Update welcome message
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Hello ${user.name}, here's your stress forecast based on your recent data.`;
    }
    
    // Load forecast data
    loadForecastData();
    
    // Setup refresh button
    const refreshBtn = document.getElementById('refresh-forecast');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadForecastData);
    }
});

async function loadForecastData() {
    const refreshBtn = document.getElementById('refresh-forecast');
    const originalText = refreshBtn ? refreshBtn.textContent : '';
    
    try {
        if (refreshBtn) {
            refreshBtn.textContent = '🔄 Loading...';
            refreshBtn.disabled = true;
        }

        // Get Fitbit data from your backend
        const fitbitData = await userManager.getFitbitData();
        const user = userManager.getCurrentUser();
        
        // Generate forecast based on the data
        const forecast = generateForecast(fitbitData, user);
        
        // Update the UI with forecast data
        updateForecastUI(forecast, fitbitData);
        
        // Update last updated timestamp
        const lastUpdated = document.getElementById('last-updated');
        if (lastUpdated) {
            lastUpdated.textContent = new Date().toLocaleString();
        }
        
    } catch (error) {
        console.error('Failed to load forecast:', error);
        alert('Failed to load forecast data: ' + error.message);
    } finally {
        if (refreshBtn) {
            refreshBtn.textContent = originalText;
            refreshBtn.disabled = false;
        }
    }
}

function generateForecast(fitbitData, user) {
    const avgMood = userManager.getAverageMood();
    const weeklyMoodData = userManager.getWeeklyMoodData();
    
    // Calculate stress score (1-10)
    let stressScore = calculateStressScore(fitbitData, avgMood, weeklyMoodData);
    
    // Determine stress level
    let stressLevel, stressDescription, stressColor;
    if (stressScore >= 8) {
        stressLevel = 'High';
        stressDescription = 'You may be experiencing significant stress. Consider taking proactive steps to manage it.';
        stressColor = 'mood-low';
    } else if (stressScore >= 5) {
        stressLevel = 'Moderate';
        stressDescription = 'You\'re managing well, but there might be some underlying stress factors.';
        stressColor = 'mood-medium';
    } else {
        stressLevel = 'Low';
        stressDescription = 'Great job maintaining low stress levels! Keep up your healthy habits.';
        stressColor = 'mood-high';
    }
    
    // Generate daily insights
    const dailyInsights = generateDailyInsights(fitbitData, avgMood);
    const weeklyInsights = generateWeeklyInsights(weeklyMoodData, fitbitData);
    
    return {
        stressScore,
        stressLevel,
        stressDescription,
        stressColor,
        dailyInsights,
        weeklyInsights,
        factors: identifyStressFactors(fitbitData, weeklyMoodData)
    };
}

function calculateStressScore(fitbitData, avgMood, weeklyMoodData) {
    let score = 5; // Base score
    
    // Mood impact (40% weight)
    const moodImpact = (10 - avgMood) * 0.4;
    
    // Sleep impact (25% weight)
    const sleepImpact = fitbitData.sleep_hours < 7 ? (7 - fitbitData.sleep_hours) * 0.5 : 0;
    
    // Activity impact (20% weight)
    const activityImpact = fitbitData.steps < 5000 ? (5000 - fitbitData.steps) / 5000 * 2 : 0;
    
    // Heart rate impact (15% weight)
    const heartRateImpact = fitbitData.heart_rate > 75 ? (fitbitData.heart_rate - 75) * 0.1 : 0;
    
    // Calculate final score (1-10 scale)
    score += moodImpact + sleepImpact + activityImpact + heartRateImpact;
    
    // Ensure score stays within 1-10 range
    return Math.min(Math.max(Math.round(score), 1), 10);
}

function generateDailyInsights(fitbitData, avgMood) {
    const insights = [];
    const tips = [];
    const factors = [];
    
    // Analyze sleep
    if (fitbitData.sleep_hours < 6) {
        insights.push('You had less than 6 hours of sleep last night.');
        tips.push('Aim for 7-9 hours of quality sleep tonight');
        factors.push('Sleep Deprivation');
    } else if (fitbitData.sleep_hours >= 8) {
        insights.push('Great job getting enough sleep!');
        tips.push('Maintain your consistent sleep schedule');
    }
    
    // Analyze activity
    if (fitbitData.steps < 3000) {
        insights.push('Low activity level detected.');
        tips.push('Try to incorporate a 15-minute walk today');
        factors.push('Sedentary Lifestyle');
    } else if (fitbitData.steps > 10000) {
        insights.push('Excellent activity level!');
        tips.push('Your active lifestyle is helping manage stress');
    }
    
    // Analyze heart rate
    if (fitbitData.heart_rate > 80) {
        insights.push('Elevated resting heart rate observed.');
        tips.push('Practice deep breathing exercises for 5 minutes');
        factors.push('Elevated Heart Rate');
    }
    
    // Analyze mood
    if (avgMood < 4) {
        insights.push('Your recent mood ratings have been low.');
        tips.push('Consider talking to a friend or trying mindfulness');
        factors.push('Low Mood');
    } else if (avgMood > 7) {
        insights.push('Your mood has been consistently positive!');
        tips.push('Keep doing what makes you happy');
    }
    
    // Default tips if no specific issues
    if (tips.length === 0) {
        tips.push('Maintain your current healthy habits');
        tips.push('Stay hydrated throughout the day');
        tips.push('Take short breaks during work');
    }
    
    return {
        insights: insights.length > 0 ? insights : ['Your daily metrics look balanced overall.'],
        tips,
        factors: factors.length > 0 ? factors : ['No major stress factors identified']
    };
}

function generateWeeklyInsights(weeklyMoodData, fitbitData) {
    const moodTrends = analyzeMoodTrends(weeklyMoodData);
    const insights = [];
    const tips = [];
    const patterns = [];
    
    // Mood trend analysis
    if (moodTrends.volatility > 2) {
        insights.push('Your mood has been fluctuating significantly this week.');
        tips.push('Try establishing a more consistent daily routine');
        patterns.push('Mood Volatility');
    }
    
    if (moodTrends.trend === 'declining') {
        insights.push('Your mood shows a declining trend this week.');
        tips.push('Identify and address potential stress sources');
        patterns.push('Declining Mood Trend');
    } else if (moodTrends.trend === 'improving') {
        insights.push('Your mood is improving - great progress!');
        tips.push('Continue with your current stress management strategies');
    }
    
    // Activity consistency
    if (fitbitData.steps < 4000) {
        insights.push('Consider increasing your daily activity for better stress management.');
        tips.push('Aim for at least 30 minutes of moderate activity daily');
        patterns.push('Low Activity Pattern');
    }
    
    // Default weekly insights
    if (insights.length === 0) {
        insights.push('Your weekly patterns show good stability.');
        tips.push('Continue monitoring your metrics for early stress detection');
        patterns.push('Stable Patterns');
    }
    
    return {
        insights,
        tips,
        patterns: patterns.length > 0 ? patterns : ['Consistent Weekly Patterns']
    };
}

function analyzeMoodTrends(weeklyMoodData) {
    const validRatings = weeklyMoodData.filter(day => day.rating !== null).map(day => day.rating);
    
    if (validRatings.length < 2) {
        return { trend: 'stable', volatility: 0 };
    }
    
    // Calculate trend
    const firstHalf = validRatings.slice(0, Math.floor(validRatings.length / 2));
    const secondHalf = validRatings.slice(Math.floor(validRatings.length / 2));
    
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    let trend = 'stable';
    if (avgSecond > avgFirst + 0.5) trend = 'improving';
    else if (avgSecond < avgFirst - 0.5) trend = 'declining';
    
    // Calculate volatility (standard deviation)
    const mean = validRatings.reduce((a, b) => a + b, 0) / validRatings.length;
    const volatility = Math.sqrt(validRatings.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validRatings.length);
    
    return { trend, volatility };
}

function identifyStressFactors(fitbitData, weeklyMoodData) {
    const factors = [];
    
    // Sleep factors
    if (fitbitData.sleep_hours < 6) factors.push('Insufficient Sleep');
    else if (fitbitData.sleep_hours > 9) factors.push('Oversleeping');
    
    // Activity factors
    if (fitbitData.steps < 3000) factors.push('Low Physical Activity');
    
    // Heart rate factors
    if (fitbitData.heart_rate > 80) factors.push('Elevated Resting Heart Rate');
    
    // Mood factors
    const recentMoods = weeklyMoodData.filter(day => day.rating !== null).map(day => day.rating);
    if (recentMoods.length > 0) {
        const avgRecentMood = recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length;
        if (avgRecentMood < 4) factors.push('Low Mood Levels');
    }
    
    return factors.length > 0 ? factors : ['No specific stress factors identified'];
}

function updateForecastUI(forecast, fitbitData) {
    const user = userManager.getCurrentUser();
    
    // Update Daily Report
    updateDailyReport(forecast, user);
    
    // Update Weekly Report
    updateWeeklyReport(forecast, user);
    
    // Update Data Grid
    updateDataGrid(forecast, fitbitData, user);
}

function updateDailyReport(forecast, user) {
    const dailyMood = document.getElementById('daily-mood');
    const dailyDescription = document.getElementById('daily-description');
    const dailyTips = document.getElementById('daily-tips');
    const dailyFactors = document.getElementById('daily-factors');
    
    if (dailyMood) {
        dailyMood.className = `mood-indicator ${forecast.stressColor}`;
        dailyMood.innerHTML = `📊 Today's Stress Level: ${forecast.stressLevel} (${forecast.stressScore}/10)`;
    }
    
    if (dailyDescription) {
        dailyDescription.textContent = forecast.stressDescription;
    }
    
    if (dailyTips) {
        dailyTips.innerHTML = forecast.dailyInsights.tips.map(tip => `<li>${tip}</li>`).join('');
    }
    
    if (dailyFactors) {
        dailyFactors.innerHTML = `<strong>Primary Stress Factors:</strong> ${forecast.dailyInsights.factors.map(factor => `<span class="stress-factor">${factor}</span>`).join('')}`;
    }
}

function updateWeeklyReport(forecast, user) {
    const weeklyMood = document.getElementById('weekly-mood');
    const weeklyDescription = document.getElementById('weekly-description');
    const weeklyTips = document.getElementById('weekly-tips');
    const weeklyFactors = document.getElementById('weekly-factors');
    
    // Update mood indicator
    const avgMood = userManager.getAverageMood();
    let weeklyColor = 'mood-high';
    if (avgMood < 4) weeklyColor = 'mood-low';
    else if (avgMood < 7) weeklyColor = 'mood-medium';
    
    if (weeklyMood) {
        weeklyMood.className = `mood-indicator ${weeklyColor}`;
        weeklyMood.innerHTML = `📈 Weekly Average Mood: ${avgMood.toFixed(1)}/10`;
    }
    
    if (weeklyDescription) {
        weeklyDescription.textContent = forecast.weeklyInsights.insights.join(' ');
    }
    
    if (weeklyTips) {
        weeklyTips.innerHTML = forecast.weeklyInsights.tips.map(tip => `<li>${tip}</li>`).join('');
    }
    
    if (weeklyFactors) {
        weeklyFactors.innerHTML = `<strong>Common Stress Patterns:</strong> ${forecast.weeklyInsights.patterns.map(pattern => `<span class="stress-factor">${pattern}</span>`).join('')}`;
    }
}

function updateDataGrid(forecast, fitbitData, user) {
    // Sleep Quality
    const sleepCard = document.querySelector('.data-card:nth-child(1)');
    const sleepHours = document.getElementById('sleep-hours');
    const sleepDescription = document.getElementById('sleep-description');
    
    if (sleepHours) sleepHours.textContent = `${fitbitData.sleep_hours} hrs/night`;
    if (sleepCard && sleepDescription) {
        if (fitbitData.sleep_hours < 6) {
            sleepCard.className = 'data-card needs-improvement';
            sleepDescription.textContent = 'Consider improving sleep duration for better stress management';
        } else if (fitbitData.sleep_hours > 9) {
            sleepCard.className = 'data-card average';
            sleepDescription.textContent = 'Good sleep duration, maintain consistency';
        } else {
            sleepCard.className = 'data-card good';
            sleepDescription.textContent = 'Excellent sleep duration for stress recovery';
        }
    }
    
    // Activity Level
    const activityCard = document.querySelector('.data-card:nth-child(2)');
    const exerciseFrequency = document.getElementById('exercise-frequency');
    const exerciseDescription = document.getElementById('exercise-description');
    
    if (exerciseFrequency) exerciseFrequency.textContent = `${fitbitData.steps.toLocaleString()} steps/day`;
    if (activityCard && exerciseDescription) {
        if (fitbitData.steps < 3000) {
            activityCard.className = 'data-card needs-improvement';
            exerciseDescription.textContent = 'Low activity can contribute to stress buildup';
        } else if (fitbitData.steps < 7000) {
            activityCard.className = 'data-card average';
            exerciseDescription.textContent = 'Moderate activity helps manage daily stress';
        } else {
            activityCard.className = 'data-card good';
            exerciseDescription.textContent = 'High activity level supports stress resilience';
        }
    }
    
    // Heart Health
    const heartCard = document.querySelector('.data-card:nth-child(3)');
    const heartRateBpm = document.getElementById('heart-rate-bpm');
    const heartRateStatus = document.getElementById('heart-rate-status-card');
    const heartRateDescription = document.getElementById('heart-rate-description-card');
    
    if (heartRateBpm) heartRateBpm.textContent = `${fitbitData.heart_rate} bpm`;
    
    let heartStatus = 'Normal';
    let heartClass = 'heart-good';
    if (fitbitData.heart_rate > 80) {
        heartStatus = 'Elevated';
        heartClass = 'heart-high';
        if (heartRateDescription) heartRateDescription.textContent = 'Elevated heart rate may indicate stress';
    } else if (fitbitData.heart_rate > 75) {
        heartStatus = 'Slightly High';
        heartClass = 'heart-average';
        if (heartRateDescription) heartRateDescription.textContent = 'Monitor for stress-related changes';
    } else {
        if (heartRateDescription) heartRateDescription.textContent = 'Healthy resting heart rate';
    }
    
    if (heartCard) heartCard.className = `data-card ${heartClass}`;
    if (heartRateStatus) heartRateStatus.textContent = `${heartStatus} resting heart rate`;
    
    // Stress Level
    const stressCard = document.querySelector('.data-card:nth-child(4)');
    const stressScore = document.getElementById('stress-score');
    const stressDescription = document.getElementById('stress-description');
    
    if (stressScore) stressScore.textContent = `${forecast.stressScore}/10`;
    if (stressCard && stressDescription) {
        stressCard.className = `data-card ${forecast.stressScore >= 8 ? 'needs-improvement' : forecast.stressScore >= 5 ? 'average' : 'good'}`;
        stressDescription.textContent = forecast.stressDescription;
    }
}