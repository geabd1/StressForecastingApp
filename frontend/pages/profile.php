<?php
session_start();

// Check if user is logged in, redirect if not
if (!isset($_SESSION['user_id'])) {
    header('Location: signin.php');
    exit();
}

// Sample user data - in real app, this would come from database
$userData = [
    'user_id' => $_SESSION['user_id'],
    'username' => $_SESSION['username'] ?? 'Jane',
    'email' => $_SESSION['email'] ?? 'jane@example.com',
    'join_date' => $_SESSION['join_date'] ?? 'January 2024'
];

// Sample recent activity - in real app, this would come from database
$recentActivity = [
    ['action' => 'Created new weather forecast for weekend', 'time' => '2 hours ago'],
    ['action' => 'Updated location preferences', 'time' => '3 hours ago'],
    ['action' => 'Connected FitBit device', 'time' => '1 day ago'],
    ['action' => 'Completed profile setup', 'time' => '2 days ago']
];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($userData['username']); ?>'s Profile</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <?php include '../components/navbar.php'; ?>

    <!-- Profile Content -->
    <div class="max-w-2xl mx-auto px-4 py-8">
        <!-- Profile Header -->
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800"><?php echo htmlspecialchars($userData['username']); ?>'s Profile</h1>
            <p class="text-gray-600">Member since <?php echo htmlspecialchars($userData['join_date']); ?></p>
        </div>

        <!-- Connect to FitBit -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-bold text-gray-800 mb-2">Connect to FitBit</h2>
                    <p class="text-gray-600">Get more accurate data when connected</p>
                </div>
                <button class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">
                    Connect
                </button>
            </div>
        </div>

        <!-- User Settings -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-bold text-gray-800 mb-2">User Settings</h2>
                    <p class="text-gray-600">Change username, password, email</p>
                </div>
                <a href="settings.php" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors">
                    Edit
                </a>
            </div>
        </div>

        <!-- Delete Account -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6 border border-red-200">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-bold text-gray-800 mb-2">Delete Account</h2>
                    <p class="text-gray-600">Erase your information and deactivate</p>
                </div>
                <button class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors" 
                        onclick="confirmDelete()">
                    Delete
                </button>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
            <div class="space-y-4">
                <?php foreach ($recentActivity as $activity): ?>
                <div class="flex justify-between items-center py-2 border-b border-gray-100">
                    <span class="text-gray-700"><?php echo htmlspecialchars($activity['action']); ?></span>
                    <span class="text-gray-500 text-sm"><?php echo htmlspecialchars($activity['time']); ?></span>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <script>
    function confirmDelete() {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            // Redirect to delete account script
            window.location.href = 'delete_account.php';
        }
    }
    </script>
</body>
</html>