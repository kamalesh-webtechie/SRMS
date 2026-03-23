const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Dynamic CORS for production
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://srms-sage.vercel.app',
    process.env.FRONTEND_URL  // Future Vercel URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.some(allowed => {
            // Check exact match or if the allowed origin matches the start of the origin
            // (e.g., to handle trailing slashes or subdomains if needed)
            return origin === allowed || origin.startsWith(allowed);
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            // For disallowed origins, we just return false instead of an error
            // to avoid triggering the 500 error handler on preflight (OPTIONS)
            console.log(`CORS blocked for origin: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true
}));


app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            "img-src": ["'self'", "data:", "https:"],
            "connect-src": ["'self'", "https://srms-sog2.onrender.com", "https://srms-sage.vercel.app"],
            "font-src": ["'self'", "https://fonts.gstatic.com"],
            "object-src": ["'none'"],
            "upgrade-insecure-requests": [],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/faculty', require('./routes/facultyRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/academic', require('./routes/academicRoutes'));
app.use('/api/system', require('./routes/systemRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/sections', require('./routes/sectionRoutes'));
app.use('/api/teaching-assignments', require('./routes/assignmentRoutes'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/result-publications', require('./routes/resultPublicationRoutes'));
app.use('/api/marks', require('./routes/markRoutes'));
app.use('/api/timetable', require('./routes/timetableRoutes'));
app.use('/api/hod', require('./routes/hodRoutes'));

// Basic Route
app.get('/', (req, res) => {
    res.send('SRMS API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    console.error(err.stack);

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Increase timeout for bulk uploads
server.timeout = 300000;


// Trigger restart again
