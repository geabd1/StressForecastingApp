// js/profile.js
document.addEventListener('DOMContentLoaded', function() {
    if (!userManager.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    const user = userManager.getCurrentUser();
    
    // Update profile header with actual user data
    updateProfileHeader(user);
    
    // Update Fitbit status
    updateFitbitStatus();

    // Load user stats and activity
    updateUserStats(user);
    updateRecentActivity(user);

    // Setup event listeners
    setupEventListeners();
});

function updateProfileHeader(user) {
    // Update avatar with user's first initial
    const userAvatar = document.getElementById('user-avatar');
    userAvatar.textContent = user.name.charAt(0).toUpperCase();
    
    // Update profile name
    document.getElementById('profile-name').textContent = `${user.name}'s Profile`;
    
    // Add subtle animation to welcome the user
    userAvatar.style.transform = 'scale(1.1)';
    setTimeout(() => {
        userAvatar.style.transform = 'scale(1)';
    }, 300);
}

function updateFitbitStatus() {
    const user = userManager.getCurrentUser();
    const fitbitStatus = document.getElementById('fitbit-status');
    const connectBtn = document.getElementById('connect-fitbit-btn');
    const fitbitSetting = document.getElementById('fitbit-setting');
    
    if (user.fitbit_connected) {
        fitbitStatus.className = 'status-badge status-connected';
        fitbitStatus.textContent = 'Connected';
        connectBtn.textContent = 'Sync Now';
        fitbitSetting.classList.add('fitbit-connected');
        connectBtn.onclick = syncFitbitData;
        
        // Add last sync time if available
        if (user.fitbit_last_sync) {
            const syncTime = new Date(user.fitbit_last_sync).toLocaleDateString();
            fitbitStatus.title = `Last synced: ${syncTime}`;
        }
    } else {
        fitbitStatus.className = 'status-badge status-disconnected';
        fitbitStatus.textContent = 'Not Connected';
        connectBtn.textContent = 'Connect Fitbit';
        fitbitSetting.classList.remove('fitbit-connected');
        connectBtn.onclick = connectFitbit;
    }
}

async function connectFitbit() {
    const connectBtn = document.getElementById('connect-fitbit-btn');
    const originalText = connectBtn.textContent;
    
    try {
        connectBtn.textContent = 'Connecting...';
        connectBtn.disabled = true;

        const authUrl = await userManager.getFitbitAuthUrl();
        
        // Open Fitbit authorization in a popup window
        const popup = window.open(authUrl, 'fitbit_auth', 'width=600,height=700,scrollbars=yes');
        
        // Check for popup closure to detect completion
        const checkPopup = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkPopup);
                // Simulate successful connection for demo
                simulateFitbitConnection();
            }
        }, 500);
        
    } catch (error) {
        alert('Failed to connect Fitbit: ' + error.message);
        connectBtn.textContent = originalText;
        connectBtn.disabled = false;
    }
}

function simulateFitbitConnection() {
    // Simulate Fitbit connection for demo purposes
    const user = userManager.getCurrentUser();
    user.fitbit_connected = true;
    user.fitbit_last_sync = new Date().toISOString();
    userManager.saveLocalUserData();
    
    updateFitbitStatus();
    updateRecentActivity(user);
    
    alert('✅ Fitbit connected successfully! Your data will now sync automatically.');
}

async function syncFitbitData() {
    const connectBtn = document.getElementById('connect-fitbit-btn');
    const originalText = connectBtn.textContent;
    
    try {
        connectBtn.textContent = '🔄 Syncing...';
        connectBtn.disabled = true;

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const fitbitData = await userManager.getFitbitData();
        
        // Update user data with sync timestamp
        const user = userManager.getCurrentUser();
        user.fitbit_last_sync = new Date().toISOString();
        userManager.saveLocalUserData();
        
        // Add sync activity
        if (!user.recent_activities) user.recent_activities = [];
        user.recent_activities.unshift({
            type: 'Fitbit Sync',
            description: `Synced ${fitbitData.steps} steps, ${fitbitData.sleep_hours} hrs sleep`,
            timestamp: new Date().toISOString()
        });
        
        updateFitbitStatus();
        updateRecentActivity(user);
        
        alert(`✅ Fitbit data synced successfully!\n\n📊 Today's Data:\n• ${fitbitData.steps} steps\n• ${fitbitData.sleep_hours} hours sleep\n• ${fitbitData.heart_rate} bpm heart rate`);
        
    } catch (error) {
        alert('Failed to sync Fitbit data: ' + error.message);
    } finally {
        connectBtn.textContent = originalText;
        connectBtn.disabled = false;
    }
}

function updateUserStats(user) {
    // Calculate user statistics
    const totalMoodEntries = user.mood_data ? user.mood_data.length : 0;
    const avgMood = userManager.getAverageMood();
    const accountAge = Math.floor((new Date() - new Date(user.created_at || new Date())) / (1000 * 60 * 60 * 24));
    
    // You can display these stats in the profile if you add elements for them
    console.log('User Stats:', {
        totalMoodEntries,
        avgMood,
        accountAge,
        fitbitConnected: user.fitbit_connected
    });
}

function updateRecentActivity(user) {
    const activityList = document.getElementById('recent-activity');
    activityList.innerHTML = '';

    const activities = [];
    
    // Add mood check-ins (most recent first)
    if (user.mood_data && user.mood_data.length > 0) {
        user.mood_data.slice(-5).reverse().forEach(entry => {
            const moodEmojis = {
                1: '😢', 2: '😔', 3: '😐', 4: '😕', 5: '😊',
                6: '😊', 7: '😄', 8: '😄', 9: '🌟', 10: '🎉'
            };
            
            activities.push({
                type: 'Mood Check-in',
                description: `Rated mood as ${entry.rating}/10 ${moodEmojis[entry.rating]}`,
                time: new Date(entry.timestamp),
                icon: '😊'
            });
        });
    }
    
    // Add Fitbit activities
    if (user.fitbit_connected) {
        activities.push({
            type: 'Fitbit Connected',
            description: 'Your Fitbit is connected and syncing data',
            time: new Date(user.fitbit_last_sync || new Date()),
            icon: '⌚'
        });
    }
    
    // Add profile activities
    activities.push({
        type: 'Profile Created',
        description: `Joined CalmCast as ${user.name}`,
        time: new Date(user.created_at || new Date()),
        icon: '🎉'
    });

    // Add forecast views if available
    if (user.forecast_views) {
        user.forecast_views.slice(-2).forEach(view => {
            activities.push({
                type: 'Forecast Viewed',
                description: 'Checked stress forecast and insights',
                time: new Date(view.timestamp),
                icon: '📊'
            });
        });
    }

    // Sort by time (most recent first)
    activities.sort((a, b) => b.time - a.time);
    
    // Take last 6 activities
    const recentActivities = activities.slice(0, 6);
    
    if (recentActivities.length === 0) {
        // Show welcome message if no activities
        const li = document.createElement('li');
        li.className = 'activity-item';
        li.innerHTML = `
            <div class="activity-content">
                <strong>🎉 Welcome to CalmCast!</strong>
                <p>Start tracking your mood to see your activity history here</p>
            </div>
            <span class="activity-time">Just now</span>
        `;
        activityList.appendChild(li);
    } else {
        // Display recent activities
        recentActivities.forEach(activity => {
            const li = document.createElement('li');
            li.className = 'activity-item';
            li.innerHTML = `
                <div class="activity-content">
                    <strong>${activity.icon} ${activity.type}</strong>
                    <p>${activity.description}</p>
                </div>
                <span class="activity-time">${timeAgo(activity.time)}</span>
            `;
            activityList.appendChild(li);
        });
    }
    
    // Update activity count in settings section if needed
    updateActivityStats(recentActivities.length);
}

function updateActivityStats(activityCount) {
    // You can update any stats display here
    console.log(`Total activities: ${activityCount}`);
}

function setupEventListeners() {
    // Modal elements
    const settingsModal = document.getElementById('settings-modal');
    const deleteModal = document.getElementById('delete-modal');
    
    // Settings modal
    document.getElementById('edit-settings-btn').addEventListener('click', openSettingsModal);
    document.getElementById('close-settings-modal').addEventListener('click', closeSettingsModal);
    document.getElementById('cancel-settings').addEventListener('click', closeSettingsModal);
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    
    // Delete account modal
    document.getElementById('delete-account-btn').addEventListener('click', openDeleteModal);
    document.getElementById('close-delete-modal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);
    document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
    
    // Delete confirmation validation
    const confirmDeleteInput = document.getElementById('confirm-delete');
    confirmDeleteInput.addEventListener('input', function() {
        document.getElementById('confirm-delete-btn').disabled = this.value !== 'DELETE';
    });
    
    // Add enter key support for delete confirmation
    confirmDeleteInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value === 'DELETE') {
            confirmDelete();
        }
    });
}

function openSettingsModal() {
    const user = userManager.getCurrentUser();
    
    // Populate form with current user data
    document.getElementById('settings-username').value = user.username;
    document.getElementById('settings-email').value = user.email;
    
    // Clear password fields
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    
    // Show modal with animation
    const modal = document.getElementById('settings-modal');
    modal.style.display = 'block';
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function openDeleteModal() {
    const user = userManager.getCurrentUser();
    
    // Update modal with user-specific information
    const stats = getUserStatsSummary(user);
    
    const modal = document.getElementById('delete-modal');
    const warningText = modal.querySelector('.modal-body p:first-child');
    warningText.innerHTML = `Are you sure you want to delete <strong>${user.name}'s</strong> account? This action cannot be undone.`;
    
    // Show user stats in the warning
    const statsElement = document.createElement('div');
    statsElement.className = 'user-stats-warning';
    statsElement.innerHTML = `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 10px; margin: 10px 0;">
            <strong>📊 You will lose:</strong>
            <div style="margin-top: 5px;">
                ${stats.moodEntries} mood check-ins<br>
                ${stats.accountAge} days of progress<br>
                ${stats.fitbitData}
            </div>
        </div>
    `;
    
    const existingStats = modal.querySelector('.user-stats-warning');
    if (existingStats) {
        existingStats.remove();
    }
    modal.querySelector('.modal-body').insertBefore(statsElement, modal.querySelector('.modal-body ul'));
    
    modal.style.display = 'block';
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.display = 'none';
        // Reset confirmation input
        document.getElementById('confirm-delete').value = '';
        document.getElementById('confirm-delete-btn').disabled = true;
    }, 300);
}

function getUserStatsSummary(user) {
    const moodEntries = user.mood_data ? user.mood_data.length : 0;
    const accountAge = Math.floor((new Date() - new Date(user.created_at || new Date())) / (1000 * 60 * 60 * 24));
    const fitbitData = user.fitbit_connected ? 'All Fitbit connection data' : 'No Fitbit data';
    
    return {
        moodEntries: `${moodEntries} mood check-in${moodEntries !== 1 ? 's' : ''}`,
        accountAge: `${accountAge} day${accountAge !== 1 ? 's' : ''}`,
        fitbitData: fitbitData
    };
}

async function saveSettings() {
    const saveBtn = document.getElementById('save-settings');
    const originalText = saveBtn.textContent;
    
    try {
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        const username = document.getElementById('settings-username').value;
        const email = document.getElementById('settings-email').value;
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Basic validation
        if (!username || !email) {
            throw new Error('Username and email are required');
        }

        if (newPassword && newPassword !== confirmPassword) {
            throw new Error('New passwords do not match');
        }

        if (newPassword && !currentPassword) {
            throw new Error('Current password is required to set a new password');
        }

        // Update user data locally
        const user = userManager.getCurrentUser();
        const originalName = user.name;
        
        user.username = username;
        user.email = email;
        
        // Only update name if it's different (you might want to add a name field to the form)
        // For now, we'll keep the original name
        
        userManager.saveLocalUserData();
        
        // Add settings update activity
        if (!user.recent_activities) user.recent_activities = [];
        user.recent_activities.unshift({
            type: 'Settings Updated',
            description: 'Updated profile information',
            timestamp: new Date().toISOString()
        });

        // Update the profile header if name changed
        if (user.name !== originalName) {
            updateProfileHeader(user);
        }

        updateRecentActivity(user);
        closeSettingsModal();
        
        alert('✅ Profile settings updated successfully!');
        
    } catch (error) {
        alert('Failed to save settings: ' + error.message);
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

function confirmDelete() {
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const originalText = confirmBtn.textContent;
    
    try {
        confirmBtn.textContent = 'Deleting...';
        confirmBtn.disabled = true;

        // Simulate API call for account deletion
        setTimeout(() => {
            // Clear all user data
            userManager.logout();
            
            alert('😢 Your account has been deleted. Thank you for using CalmCast!');
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        alert('Failed to delete account: ' + error.message);
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
    }
}

// Enhanced timeAgo function for profile page
function timeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInSeconds / 3600);
    const diffInDays = Math.floor(diffInSeconds / 86400);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    
    return past.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: diffInDays > 365 ? 'numeric' : undefined
    });
}