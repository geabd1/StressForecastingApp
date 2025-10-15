<?php
// about.php
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Us | CalmCast</title>
    <style>
        body {
            font-family: "Avenir", "Helvetica Neue", Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            text-align: center;
            background-color: #ffffff;
        }

        .about-container {
            max-width: 800px;
            margin: 80px auto;
            padding: 0 20px;
        }

        h1 {
            font-size: 3rem;
            margin-bottom: 40px;
        }

        p {
            font-size: 1.1rem;
            line-height: 1.8;
            color: #333;
            margin-bottom: 20px;
        }

        .signature {
            margin-top: 50px;
            font-style: italic;
        }
    </style>
</head>
<body>
    <!-- Include Navbar -->
    <?php include '../components/navbar.php'; ?>

    <!-- About Section -->
    <div class="about-container">
        <h1>About Us</h1>
        <p>
            CalmCast was created by three Computer Science students at Morgan State University with a mission
            to make stress easier to understand and manage. The app helps users detect their stress levels,
            visualize patterns like a “forecast,” and discover personalized ways to reduce tension. Our goal
            is to combine technology and wellness to promote healthier, calmer lifestyles.
        </p>

        <p>
            By turning stress into something trackable and predictable, CalmCast empowers users to take control
            of their mental well-being. Whether it’s through guided coping strategies, daily insights, or simply
            recognizing stress triggers, the app is designed to be both supportive and practical. We believe that
            understanding your “stress forecast” is the first step toward building resilience and balance in
            everyday life.
        </p>

        <p class="signature">— The CalmCast Team</p>
    </div>
</body>
</html>
