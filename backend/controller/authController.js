const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../model/Admin');

/**
 * Handle admin registration
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
/**
 * Handle admin login
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find admin
        const admin = await Admin.findByUsername(username);
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            admin: {
                id: admin.id,
                username: admin.username
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during login' });
    }
};

module.exports = {
    login
};
