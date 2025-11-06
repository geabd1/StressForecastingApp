// js/userData.js
class UserDataManager {
    constructor() {
        this.API_BASE = 'http://localhost:8000';
        this.token = localStorage.getItem('calmcast_token');
        this.currentUser = JSON.parse(localStorage.getItem('calmcast_user') || 'null');
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

        // Add Authorization header if token exists
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            // Handle unauthorized (token expired)
            if (response.status === 401) {
                this.logout();
                window.location.href = 'index.html';
                throw new Error('Session expired. Please log in again.');
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || `API request failed: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    // User authentication
    async register(userData) {
        try {
            const result = await this.apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            this.token = result.access_token;
            this.currentUser = result.user;
            
            // Store in localStorage
            localStorage.setItem('calmcast_token', this.token);
            localStorage.setItem('calmcast_user', JSON.stringify(this.currentUser));
            
            return result;
        } catch (error) {
            throw error;
        }
    }

    async login(credentials) {
        try {
            const result = await this.apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
            
            this.token = result.access_token;
            this.currentUser = result.user;
            
            localStorage.setItem('calmcast_token', this.token);
            localStorage.setItem('calmcast_user', JSON.stringify(this.currentUser));
            
            return result;
        } catch (error) {
            throw error;
        }
    }

    logout() {
        // Try to call logout endpoint (but don't block if it fails)
        if (this.token) {
            this.apiCall('/auth/logout', { method: 'POST' }).catch(() => {});
        }
        
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('calmcast_token');
        localStorage.removeItem('calmcast_user');
    }

    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }

    // Mood tracking
    async addMoodRating(rating, notes = '') {
        try {
            const result = await this.apiCall(`/api/users/${this.currentUser.user_id}/mood`, {
                method: 'POST',
                body: JSON.stringify({ rating: parseInt(rating), notes })
            });
            
            // Update local user data
            if (!this.currentUser.mood_data) {
                this.currentUser.mood_data = [];
            }
            this.currentUser.mood_data.push({
                rating: parseInt(rating),
                notes,
                timestamp: new Date().toISOString()
            });
            this.saveLocalUserData();
            
            return result;
        } catch (error) {
            throw error;
        }
    }

    // Fitbit integration
    async getFitbitAuthUrl() {
        try {
            const result = await this.apiCall('/api/fitbit/auth-url');
            return result.auth_url;
        } catch (error) {
            throw error;
        }
    }

    async connectFitbit(authCode) {
        try {
            const result = await this.apiCall('/api/fitbit/connect', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: this.currentUser.user_id,
                    auth_code: authCode
                })
            });
            
            this.currentUser.fitbit_connected = true;
            this.saveLocalUserData();
            
            return result;
        } catch (error) {
            throw error;
        }
    }

    async getFitbitData() {
        try {
            const result = await this.apiCall(`/api/fitbit/data/${this.currentUser.user_id}`);
            return result.data;
        } catch (error) {
            console.log('Using simulated Fitbit data');
            // Fallback to simulated data
            const simulated = await this.apiCall('/api/fitbit/simulated-data');
            return simulated.data;
        }
    }

    // Stress prediction
    async getStressPrediction(userData) {
        try {
            const result = await this.apiCall('/api/predict', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: this.currentUser.user_id,
                    data: userData
                })
            });
            return result;
        } catch (error) {
            console.error('Prediction API failed, using fallback:', error);
            return this.getSimulatedPrediction(userData);
        }
    }

    getSimulatedPrediction(userData) {
        // Simple simulation based on data patterns
        let stressLevel = 'Low';
        let confidence = 0.7;
        
        if (userData.heart_rate > 85 || userData.sleep_hours < 6 || userData.steps < 5000) {
            stressLevel = 'High';
            confidence = 0.8;
        } else if (userData.heart_rate > 75 || userData.sleep_hours < 7) {
            stressLevel = 'Medium';
            confidence = 0.75;
        }
        
        return {
            status: 'success',
            prediction: stressLevel,
            confidence: confidence,
            raw_prediction: stressLevel === 'High' ? 1 : 0
        };
    }

    // User data management
    saveLocalUserData() {
        localStorage.setItem('calmcast_user', JSON.stringify(this.currentUser));
    }

    getAverageMood(days = 7) {
        if (!this.currentUser.mood_data || this.currentUser.mood_data.length === 0) {
            return 5; // Default neutral
        }
        
        const recentMoods = this.currentUser.mood_data
            .slice(-days)
            .map(entry => entry.rating);
            
        return recentMoods.reduce((sum, rating) => sum + rating, 0) / recentMoods.length;
    }

    getWeeklyMoodData() {
        if (!this.currentUser.mood_data) {
            return this.getDefaultWeeklyData();
        }
        
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            
            // Find mood entry for this date
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

    getCurrentUser() {
        return this.currentUser;
    }
}

// Create global instance
const userManager = new UserDataManager();