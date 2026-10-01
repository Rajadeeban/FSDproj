require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const renewableRoutes = require('./routes/renewableRoutes');
const hydrogenRoutes = require('./routes/hydrogenRoutes');
const storageRoutes = require('./routes/storageRoutes');
const optimizationRoutes = require('./routes/optimizationRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const alertRoutes = require('./routes/alertRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api', limiter);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'GreenH2 API is running' }));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/renewable', renewableRoutes);
app.use('/api/hydrogen', hydrogenRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/optimization', optimizationRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/analytics', forecastRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`GreenH2 API listening on port ${PORT}`);
});

module.exports = app;
