const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/secureguard';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
    console.log('✅ Connected to MongoDB');
});

// MongoDB Schemas
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    photoURL: String,
    googleId: String,
    isEmailVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date, default: Date.now },
    settings: {
        pin: String,
        secretAccessEnabled: { type: Boolean, default: true },
        gpsAccuracy: { type: String, default: 'high' },
        locationUpdateInterval: { type: Number, default: 10000 },
        alarmSound: { type: String, default: 'default' },
        vibrationIntensity: { type: Number, default: 1 },
        language: { type: String, default: 'ar' }
    }
});

const DeviceSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    model: String,
    brand: String,
    systemVersion: String,
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    batteryLevel: { type: Number, default: 1.0 },
    networkType: String,
    isRooted: { type: Boolean, default: false }
});

const LocationSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: Number,
    altitude: Number,
    speed: Number,
    heading: Number,
    address: String,
    timestamp: { type: Date, default: Date.now }
});

const AlertSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    type: { type: String, enum: ['theft_attempt', 'unauthorized_access', 'manual_trigger'], required: true },
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    },
    photos: [{
        url: String,
        camera: { type: String, enum: ['front', 'back'] },
        timestamp: Date
    }],
    isResolved: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

const PhotoSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert' },
    url: { type: String, required: true },
    camera: { type: String, enum: ['front', 'back'], required: true },
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    },
    timestamp: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', UserSchema);
const Device = mongoose.model('Device', DeviceSchema);
const Location = mongoose.model('Location', LocationSchema);
const Alert = mongoose.model('Alert', AlertSchema);
const Photo = mongoose.model('Photo', PhotoSchema);

// WebSocket connections storage
const clients = new Map();

// WebSocket connection handling
wss.on('connection', function connection(ws, req) {
    console.log('New WebSocket connection');
    
    ws.on('message', function incoming(message) {
        try {
            const data = JSON.parse(message);
            handleWebSocketMessage(ws, data);
        } catch (error) {
            console.error('Invalid WebSocket message:', error);
        }
    });
    
    ws.on('close', function close() {
        // Remove client from connections
        for (let [deviceId, client] of clients.entries()) {
            if (client === ws) {
                clients.delete(deviceId);
                break;
            }
        }
        console.log('WebSocket connection closed');
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to SecureGuard server'
    }));
});

// Handle WebSocket messages
function handleWebSocketMessage(ws, data) {
    switch (data.type) {
        case 'register_device':
            clients.set(data.deviceId, ws);
            console.log(`Device ${data.deviceId} registered`);
            break;
        case 'location_update':
            handleLocationUpdate(data);
            break;
        case 'device_status':
            handleDeviceStatus(data);
            break;
        default:
            console.log('Unknown WebSocket message type:', data.type);
    }
}

// Broadcast message to specific device
function broadcastToDevice(deviceId, message) {
    const client = clients.get(deviceId);
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
        return true;
    }
    return false;
}

// Broadcast message to all connected clients
function broadcastToAll(message) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// JWT Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication routes
app.post('/auth/register', async (req, res) => {
    try {
        const { user, token, deviceId } = req.body;
        
        // Check if user already exists
        let existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
            // Create new user
            existingUser = new User({
                email: user.email,
                name: user.name,
                photoURL: user.photoURL,
                googleId: user.id,
                isEmailVerified: false
            });
            await existingUser.save();
        }
        
        // Register or update device
        await Device.findOneAndUpdate(
            { deviceId },
            {
                deviceId,
                userId: existingUser._id,
                isOnline: true,
                lastSeen: new Date()
            },
            { upsert: true }
        );
        
        res.json({ success: true, userId: existingUser._id });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/auth/send-verification', async (req, res) => {
    try {
        const { email, language } = req.body;
        
        // In a real implementation, you would send an actual email
        console.log(`Sending verification email to ${email} in ${language}`);
        
        res.json({ success: true, message: 'Verification email sent' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Failed to send verification email' });
    }
});

app.get('/auth/check-verification/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email });
        
        res.json({ verified: user ? user.isEmailVerified : false });
    } catch (error) {
        console.error('Verification check error:', error);
        res.status(500).json({ error: 'Failed to check verification' });
    }
});

app.get('/auth/validate', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// Location routes
app.post('/location/update', async (req, res) => {
    try {
        const { location, timestamp } = req.body;
        
        // Save location to database
        const locationDoc = new Location({
            deviceId: location.deviceId,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            altitude: location.altitude,
            speed: location.speed,
            heading: location.heading,
            address: location.address,
            timestamp: new Date(timestamp)
        });
        
        await locationDoc.save();
        
        // Update device status
        await Device.findOneAndUpdate(
            { deviceId: location.deviceId },
            { 
                isOnline: true,
                lastSeen: new Date()
            }
        );
        
        // Broadcast location update to web clients
        broadcastToAll({
            type: 'location_update',
            location: location
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Location update error:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
});

app.get('/location/history', authenticateToken, async (req, res) => {
    try {
        const { period = '24h' } = req.query;
        
        // Calculate time range
        const now = new Date();
        let startTime;
        
        switch (period) {
            case '1h':
                startTime = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '6h':
                startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
                break;
            case '24h':
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            default:
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        
        const locations = await Location.find({
            timestamp: { $gte: startTime }
        }).sort({ timestamp: -1 }).limit(100);
        
        res.json(locations);
    } catch (error) {
        console.error('Location history error:', error);
        res.status(500).json({ error: 'Failed to get location history' });
    }
});

// Device routes
app.get('/device/status', authenticateToken, async (req, res) => {
    try {
        // In a real implementation, you would get the device ID from the user
        const device = await Device.findOne().sort({ lastSeen: -1 });
        
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        // Get latest location
        const latestLocation = await Location.findOne({ deviceId: device.deviceId })
            .sort({ timestamp: -1 });
        
        res.json({
            isOnline: device.isOnline,
            lastUpdate: device.lastSeen,
            batteryLevel: device.batteryLevel,
            gpsAccuracy: latestLocation ? latestLocation.accuracy : 0,
            networkType: device.networkType || 'Unknown',
            location: latestLocation
        });
    } catch (error) {
        console.error('Device status error:', error);
        res.status(500).json({ error: 'Failed to get device status' });
    }
});

app.post('/device/activate-alarm', authenticateToken, async (req, res) => {
    try {
        // Get device ID (in real implementation, from user's devices)
        const device = await Device.findOne().sort({ lastSeen: -1 });
        
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        // Send alarm activation command to device
        const success = broadcastToDevice(device.deviceId, {
            type: 'activate_alarm',
            timestamp: new Date().toISOString()
        });
        
        if (success) {
            res.json({ success: true, message: 'Alarm activation sent' });
        } else {
            res.status(503).json({ error: 'Device not connected' });
        }
    } catch (error) {
        console.error('Alarm activation error:', error);
        res.status(500).json({ error: 'Failed to activate alarm' });
    }
});

app.post('/device/locate', authenticateToken, async (req, res) => {
    try {
        const device = await Device.findOne().sort({ lastSeen: -1 });
        
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        // Get latest location
        const latestLocation = await Location.findOne({ deviceId: device.deviceId })
            .sort({ timestamp: -1 });
        
        if (latestLocation) {
            res.json(latestLocation);
        } else {
            res.status(404).json({ error: 'No location data available' });
        }
    } catch (error) {
        console.error('Device locate error:', error);
        res.status(500).json({ error: 'Failed to locate device' });
    }
});

app.post('/device/capture-photo', authenticateToken, async (req, res) => {
    try {
        const device = await Device.findOne().sort({ lastSeen: -1 });
        
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        // Send photo capture command to device
        const success = broadcastToDevice(device.deviceId, {
            type: 'capture_photo',
            timestamp: new Date().toISOString()
        });
        
        if (success) {
            res.json({ success: true, message: 'Photo capture request sent' });
        } else {
            res.status(503).json({ error: 'Device not connected' });
        }
    } catch (error) {
        console.error('Photo capture error:', error);
        res.status(500).json({ error: 'Failed to request photo capture' });
    }
});

app.post('/device/lock', authenticateToken, async (req, res) => {
    try {
        const device = await Device.findOne().sort({ lastSeen: -1 });
        
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        // Send lock command to device
        const success = broadcastToDevice(device.deviceId, {
            type: 'lock_device',
            timestamp: new Date().toISOString()
        });
        
        if (success) {
            res.json({ success: true, message: 'Device lock request sent' });
        } else {
            res.status(503).json({ error: 'Device not connected' });
        }
    } catch (error) {
        console.error('Device lock error:', error);
        res.status(500).json({ error: 'Failed to lock device' });
    }
});

// Photo routes
app.post('/alerts/photo', upload.single('file'), async (req, res) => {
    try {
        const { photoId, alertId, camera, timestamp, location } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const photoUrl = `/uploads/${req.file.filename}`;
        const locationData = location ? JSON.parse(location) : null;
        
        // Save photo to database
        const photo = new Photo({
            deviceId: req.body.deviceId || 'unknown',
            alertId: alertId || null,
            url: photoUrl,
            camera,
            location: locationData,
            timestamp: new Date(timestamp)
        });
        
        await photo.save();
        
        // Broadcast new photo to web clients
        broadcastToAll({
            type: 'photo_captured',
            photo: {
                id: photo._id,
                url: photoUrl,
                camera,
                timestamp,
                location: locationData
            }
        });
        
        res.json({ success: true, photoId: photo._id, url: photoUrl });
    } catch (error) {
        console.error('Photo upload error:', error);
        res.status(500).json({ error: 'Failed to upload photo' });
    }
});

app.get('/photos/recent', authenticateToken, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const photos = await Photo.find()
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));
        
        res.json(photos);
    } catch (error) {
        console.error('Recent photos error:', error);
        res.status(500).json({ error: 'Failed to get recent photos' });
    }
});

// Alert routes
app.post('/alerts/notification', async (req, res) => {
    try {
        const { alert, timestamp, priority } = req.body;
        
        // Save alert to database
        const alertDoc = new Alert({
            deviceId: alert.deviceId || 'unknown',
            type: alert.type,
            location: alert.location,
            photos: alert.photos || [],
            isResolved: false,
            timestamp: new Date(timestamp)
        });
        
        await alertDoc.save();
        
        // Broadcast alert to web clients
        broadcastToAll({
            type: 'alert',
            alert: {
                id: alertDoc._id,
                type: alert.type,
                location: alert.location,
                timestamp,
                isResolved: false
            }
        });
        
        res.json({ success: true, alertId: alertDoc._id });
    } catch (error) {
        console.error('Alert notification error:', error);
        res.status(500).json({ error: 'Failed to process alert notification' });
    }
});

app.put('/alerts/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { alert } = req.body;
        
        const updatedAlert = await Alert.findByIdAndUpdate(
            id,
            {
                isResolved: alert.isResolved,
                photos: alert.photos
            },
            { new: true }
        );
        
        if (!updatedAlert) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        
        res.json({ success: true, alert: updatedAlert });
    } catch (error) {
        console.error('Alert update error:', error);
        res.status(500).json({ error: 'Failed to update alert' });
    }
});

app.get('/alerts/history', authenticateToken, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const alerts = await Alert.find()
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));
        
        res.json(alerts);
    } catch (error) {
        console.error('Alerts history error:', error);
        res.status(500).json({ error: 'Failed to get alerts history' });
    }
});

// Handle location updates from WebSocket
async function handleLocationUpdate(data) {
    try {
        const { deviceId, location } = data;
        
        // Save to database
        const locationDoc = new Location({
            deviceId,
            ...location,
            timestamp: new Date()
        });
        
        await locationDoc.save();
        
        // Update device status
        await Device.findOneAndUpdate(
            { deviceId },
            { 
                isOnline: true,
                lastSeen: new Date()
            }
        );
        
        // Broadcast to web clients
        broadcastToAll({
            type: 'location_update',
            location: {
                deviceId,
                ...location
            }
        });
    } catch (error) {
        console.error('Location update handling error:', error);
    }
}

// Handle device status updates from WebSocket
async function handleDeviceStatus(data) {
    try {
        const { deviceId, status } = data;
        
        // Update device in database
        await Device.findOneAndUpdate(
            { deviceId },
            {
                ...status,
                isOnline: true,
                lastSeen: new Date()
            },
            { upsert: true }
        );
        
        // Broadcast to web clients
        broadcastToAll({
            type: 'device_status',
            status: {
                deviceId,
                ...status
            }
        });
    } catch (error) {
        console.error('Device status handling error:', error);
    }
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 SecureGuard server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🌐 Dashboard available at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        mongoose.connection.close();
        process.exit(0);
    });
});

module.exports = app;