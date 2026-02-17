const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const updateAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const admin = await User.findOne({ empId: 'admin01' });

        if (admin) {
            // Updating password directly (now it won't be hashed because the hook is gone)
            admin.password = 'admin123';
            await admin.save();
            console.log('Admin password updated to plain text: admin123');
        } else {
            console.log('Admin user not found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

updateAdmin();
