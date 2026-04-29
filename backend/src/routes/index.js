const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');

router.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.redirect('/auth/login');
});

router.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard');
});

module.exports = router;
