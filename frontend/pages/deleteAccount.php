<?php
session_start();
include '../../database/db.php';
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delete Account</title>
    <link rel="stylesheet" href="../styles/deleteAccount.css">
</head>
<body>
    <div class="container">
        <h2>Delete Account</h2>
        <p>Are you sure you want to delete your account? This action cannot be undone.</p>
        <div class="button-group">
                 <button class="btn btn-primary" onclick="window.location.href='dashboard.html'">Sign In</button>
        <div>

        <form method="POST" action="../../backend/deleteAccount.php">