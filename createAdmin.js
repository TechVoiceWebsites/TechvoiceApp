const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const adminData = {
            empId: 'admin01',
            name: 'System Admin',
            firstName: 'System',
            lastName: 'Admin',
            email: 'admin@techvoice.com',
            password: 'admin123',
            role: 'admin',
            designation: 'Administrator',
            address: '123 Admin Street',
            dob: new Date('1990-01-01'),
            district: 'Theni',
            phone: '9876543210'
        };

        const admin = await User.findOneAndUpdate(
            { empId: 'admin01' },
            { $set: adminData },
            { upsert: true, new: true }
        );

        console.log('Admin user created/updated successfully');
        console.log('EmpID:', admin.empId);
        console.log('District:', admin.district);
        console.log('Phone:', admin.phone);

    } catch (error) {
        if (error.code === 11000) {
            console.log('Admin user likely already exists (duplicate key error).');
        } else {
            console.error('Error creating admin:', error);
        }
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

createAdmin();
