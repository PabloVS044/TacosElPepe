module.exports = {
  secret: process.env.SESSION_SECRET || 'tacos_secret_dev',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8,
    sameSite: 'lax',
    secure: false,
  },
};
