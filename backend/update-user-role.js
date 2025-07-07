// Quick script to update user role
require('dotenv').config();
const { User } = require('./src/models');

async function updateUserRole() {
  try {
    const user = await User.findOne({ 
      where: { email: 'biwillzcomp@gmail.com' } 
    });
    
    if (user) {
      console.log(`Current role: ${user.role}`);
      
      // Update to admin
      await user.update({ role: 'admin' });
      console.log(`✓ Updated role to: admin`);
    } else {
      console.log('User not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateUserRole();
