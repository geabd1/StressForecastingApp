// js/userData.js 
class UserDataManager {
    constructor() {
        this.API_BASE = 'https://stressforecastingapp.onrender.com';
        this.token = localStorage.getItem('calmcast_token');
        this.currentUser = JSON.parse(localStorage.getItem('calmcast_user') || 'null');
        
        // Initialize default user data structure
        if (this.currentUser && !this.currentUser.mood_data) {
            this.currentUser.mood_data = [];
            this.currentUser.recent_activities = [];
            this.saveLocalUserData();
        }
    }

    async apiCall(endpoint, options = {}) {
        const url = `${this.API_BASE}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token && !endpoint.includes('/login') && !endpoint.includes('/register')) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (options.body) {
            config.body = options.body;
        }

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                this.logout();
                window.location.href = 'index.html';
                throw new Error('Session expired');
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || data.error || `API request failed: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            const result = await this.apiCall('/users/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            this.token = result.access_token;
            this.currentUser = result.user;
            
            // Add local data structure
            this.currentUser.mood_data = [];
            this.currentUser.recent_activities = [];
            this.currentUser.fitbit_connected = result.user.fitbit_connected || false;
            
            localStorage.setItem('calmcast_token', this.token);
            localStorage.setItem('calmcast_user', JSON.stringify(this.currentUser));
            
            return result;
        } catch (error) {
            throw error;
        }
    }

    async login(credentials) {
        try {
            const result = await this.apiCall('/users/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
            
            this.token = result.access_token;
            this.currentUser = result.user;
            
            // Ensure local data structure exists
            if (!this.currentUser.mood_data) this.currentUser.mood_data = [];
            if (!this.currentUser.recent_activities) this.currentUser.recent_activities = [];
            if (!this.currentUser.fitbit_connected) this.currentUser.fitbit_connected = false;
            
            localStorage.setItem('calmcast_token', this.token);
            localStorage.setItem('calmcast_user', JSON.stringify(this.currentUser));
            
            return result;
        } catch (error) {
            throw error;
        }
    }

    // ADD THESE MISSING METHODS:
    async addMoodRating(rating) {
        if (!this.currentUser) throw new Error('No user logged in');
        
        const moodEntry = {
            rating: parseInt(rating),
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString()
        };
        
        this.currentUser.mood_data.push(moodEntry);
        
        // Add to recent activities
        this.currentUser.recent_activities.unshift({
            type: 'Mood Check-in',
            description: `Rated mood as ${rating}/10`,
            timestamp: new Date().toISOString()
        });
        
        this.saveLocalUserData();
        return moodEntry;
    }

    getFitbitAuthUrl() {
        // Use your actual Fitbit OAuth endpoint
        return `${this.API_BASE}/fitbit/login`;
    }

    saveLocalUserData() {
        if (this.currentUser) {
            localStorage.setItem('calmcast_user', JSON.stringify(this.currentUser));
        }
    }

    async getFitbitData(date = null) {
        try {
            if (!date) {
                date = new Date().toISOString().split('T')[0];
            }

            // Try to get real Fitbit data from your backend
            const [stepsData, sleepData, heartRateData] = await Promise.all([
                this.apiCall(`/fitbit/steps?date=${date}`).catch(() => ({ steps: 0 })),
                this.apiCall(`/fitbit/sleep?date=${date}`).catch(() => ({ total_minutes_asleep: 450 })),
                this.apiCall(`/fitbit/heartrate?date=${date}`).catch(() => ({ resting_heart_rate: 72 }))
            ]);

            const fitbitData = {
                steps: stepsData.steps || 0,
                sleep_hours: this.calculateSleepHours(sleepData),
                heart_rate: heartRateData.resting_heart_rate || 72,
                calories_burned: Math.floor(stepsData.steps * 0.04) || 0,
                last_sync: new Date().toISOString(),
                is_simulated: false
            };

            // Update user's Fitbit connection status
            if (this.currentUser) {
                this.currentUser.fitbit_connected = true;
                this.currentUser.fitbit_last_sync = new Date().toISOString();
                this.saveLocalUserData();
            }

            return fitbitData;

        } catch (error) {
            console.error('Failed to get Fitbit data, using simulated data:', error);
            return this.getSimulatedFitbitData();
        }
    }

    calculateSleepHours(sleepData) {
        if (!sleepData || !sleepData.total_minutes_asleep) return 7.5;
        return parseFloat((sleepData.total_minutes_asleep / 60).toFixed(1));
    }

    getSimulatedFitbitData() {
        const simulatedData = {
            steps: Math.floor(Math.random() * 8000) + 2000,
            sleep_hours: parseFloat((Math.random() * 3 + 6).toFixed(1)),
            heart_rate: Math.floor(Math.random() * 20) + 65,
            calories_burned: Math.floor(Math.random() * 800) + 1800,
            last_sync: new Date().toISOString(),
            is_simulated: true
        };
        
        return simulatedData;
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('calmcast_token');
        localStorage.removeItem('calmcast_user');
    }

    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Mood data methods
    getAverageMood(days = 7) {
        if (!this.currentUser.mood_data || this.currentUser.mood_data.length === 0) {
            return 5;
        }
        
        const recentMoods = this.currentUser.mood_data
            .slice(-days)
            .map(entry => entry.rating)
            .filter(rating => rating !== null);
            
        if (recentMoods.length === 0) return 5;
        
        return recentMoods.reduce((sum, rating) => sum + rating, 0) / recentMoods.length;
    }

    getWeeklyMoodData() {
        if (!this.currentUser.mood_data || this.currentUser.mood_data.length === 0) {
            return this.getDefaultWeeklyData();
        }
        
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            
            const dayEntry = this.currentUser.mood_data.find(entry => {
                const entryDate = new Date(entry.timestamp).toDateString();
                return entryDate === dateStr;
            });
                
            last7Days.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                rating: dayEntry ? dayEntry.rating : null
            });
        }
        
        return last7Days;
    }

    getDefaultWeeklyData() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date().getDay();
        const orderedDays = days.slice(today + 1).concat(days.slice(0, today + 1));
        return orderedDays.map(day => ({ date: day, rating: null }));
    }
}

const userManager = new UserDataManager();