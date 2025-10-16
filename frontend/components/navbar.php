<?php
// navbar.php
session_start();

?>

<nav>
    <ul class="nav-links">
        <li><a href="index.php" class="<?= basename($_SERVER['PHP_SELF']) == 'dashboard.php' ? 'active' : '' ?>">Home</a></li>
        <li><a href="forecast.php" class="<?= basename($_SERVER['PHP_SELF']) == 'forecast.php' ? 'active' : '' ?>">My Forecast</a></li>
        <li><a href="about.php" class="<?= basename($_SERVER['PHP_SELF']) == 'about.php' ? 'active' : '' ?>">About</a></li>
    </ul>

    <div class="nav-right">
        <?php if (isset($_SESSION['user'])): ?>
            <a href="profile.php">
                <img src="<?= htmlspecialchars($_SESSION['user']['profile_pic'] ?? 'images/default-profile.png') ?>" 
                     alt="Profile" class="profile-icon">
            </a>
        <?php else: ?>
            <div class="auth-buttons">
                <a href="signin.php" class="btn">Sign In</a>
                <a href="signup.php" class="btn btn-outline">Sign Up</a>
            </div>
        <?php endif; ?>
    </div>

    <style>
        nav {
            background-color: #d9f7fc;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 60px;
            font-size: 1.3rem;
            box-sizing: border-box;
        }

        .nav-links {
            list-style-type: none;
            display: flex;
            gap: 40px;
            margin: 0;
            padding: 0;
        }

        .nav-links li a {
            text-decoration: none;
            color: black;
            font-weight: 400;
        }

        .nav-links li a.active {
            font-weight: 700;
        }

        .nav-right {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .profile-icon {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #aaa;
        }

        .auth-buttons .btn {
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            transition: all 0.2s ease;
        }

        .btn {
            background-color: #008CBA;
            color: white;
        }

        .btn:hover {
            background-color: #007bb3;
        }

        .btn-outline {
            background-color: transparent;
            border: 2px solid #008CBA;
            color: #008CBA;
        }

        .btn-outline:hover {
            background-color: #008CBA;
            color: white;
        }
    </style>
</nav>
