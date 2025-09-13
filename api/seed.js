/**
 * Database Seeding Script for Pint Platform
 * 
 * This script sets up a fresh Pint database with:
 * - Default admin user (credentials from environment)
 * - Achievement definitions
 * - Sample data for development/testing
 * 
 * Usage:
 *   node seed.js [--environment=production|development]
 *   
 * Environment Variables Required:
 *   - ADMIN_EMAIL: Default admin user email
 *   - ADMIN_PASSWORD: Default admin user password
 *   - ADMIN_DISPLAY_NAME: Default admin user display name (optional)
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Achievement, Pub, PubOwner } = require('./models');

// Configuration
const environment = process.argv.find(arg => arg.startsWith('--environment='))?.split('=')[1] || 'development';
const isProduction = environment === 'production';

// Validate required environment variables
const requiredEnvVars = ['ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please set these variables before running the seed script.');
  process.exit(1);
}

// Admin user configuration
const adminConfig = {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
  displayName: process.env.ADMIN_DISPLAY_NAME || 'Platform Administrator',
  role: 'admin'
};

// Achievement definitions
const achievementDefinitions = [
  {
    key: 'first_pint',
    name: 'First Pint',
    description: 'Created your first pint session',
    iconUrl: '/icons/achievements/first-pint.svg'
  },
  {
    key: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Joined 10 different pint sessions',
    iconUrl: '/icons/achievements/social-butterfly.svg'
  },
  {
    key: 'local_legend',
    name: 'Local Legend',
    description: 'Visited 5 different pubs',
    iconUrl: '/icons/achievements/local-legend.svg'
  },
  {
    key: 'early_bird',
    name: 'Early Bird',
    description: 'Created a session before 6 PM',
    iconUrl: '/icons/achievements/early-bird.svg'
  },
  {
    key: 'night_owl',
    name: 'Night Owl',
    description: 'Created a session after 9 PM',
    iconUrl: '/icons/achievements/night-owl.svg'
  },
  {
    key: 'conversation_starter',
    name: 'Conversation Starter',
    description: 'Sent your first chat message',
    iconUrl: '/icons/achievements/conversation-starter.svg'
  },
  {
    key: 'popular_host',
    name: 'Popular Host',
    description: 'Had 5 or more people join your session',
    iconUrl: '/icons/achievements/popular-host.svg'
  },
  {
    key: 'reliable_friend',
    name: 'Reliable Friend',
    description: 'Attended 5 sessions you committed to',
    iconUrl: '/icons/achievements/reliable-friend.svg'
  },
  {
    key: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Created sessions on 3 consecutive weekends',
    iconUrl: '/icons/achievements/weekend-warrior.svg'
  },
  {
    key: 'community_builder',
    name: 'Community Builder',
    description: 'Added 10 friends to your network',
    iconUrl: '/icons/achievements/community-builder.svg'
  }
];

// Sample data for development environment only
const developmentSampleData = {
  sampleUsers: [
    {
      email: 'john.doe@example.com',
      password: 'SamplePassword123!',
      displayName: 'John Doe',
      favouriteTipple: 'IPA',
      role: 'user'
    },
    {
      email: 'jane.smith@example.com',
      password: 'SamplePassword123!',
      displayName: 'Jane Smith',
      favouriteTipple: 'Lager',
      role: 'user'
    },
    {
      email: 'pub.owner@example.com',
      password: 'PubOwnerPassword123!',
      displayName: 'Pub Owner',
      favouriteTipple: 'Bitter',
      role: 'pub_owner'
    }
  ],
  samplePubs: [
    {
      name: 'The Crown & Anchor',
      address: '123 High Street, London, UK',
      latitude: 51.5074,
      longitude: -0.1278,
      phoneNumber: '+44 20 7123 4567',
      website: 'https://crownanchor.co.uk',
      description: 'Traditional British pub with craft ales and hearty food'
    },
    {
      name: 'The Local Taphouse',
      address: '456 Queen Street, Manchester, UK',
      latitude: 53.4808,
      longitude: -2.2426,
      phoneNumber: '+44 161 123 4567',
      website: 'https://localtaphouse.co.uk',
      description: 'Modern craft beer pub with rotating taps'
    }
  ]
};

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  console.log(`Environment: ${environment}`);
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Sync database (create tables if they don't exist)
    console.log('🔄 Synchronizing database schema...');
    await sequelize.sync({ alter: !isProduction }); // Use alter in development for schema updates
    console.log('✅ Database schema synchronized');

    // 1. Create default admin user
    console.log('👨‍💼 Creating default admin user...');
    const hashedPassword = await bcrypt.hash(adminConfig.password, 10);
    
    const [adminUser, adminCreated] = await User.findOrCreate({
      where: { email: adminConfig.email },
      defaults: {
        email: adminConfig.email,
        password: hashedPassword,
        displayName: adminConfig.displayName,
        role: adminConfig.role,
        favouriteTipple: 'Coffee' // Admin might prefer coffee during work hours!
      }
    });

    if (adminCreated) {
      console.log(`✅ Admin user created: ${adminConfig.email}`);
    } else {
      console.log(`ℹ️  Admin user already exists: ${adminConfig.email}`);
    }

    // 2. Create achievement definitions
    console.log('🏆 Creating achievement definitions...');
    let achievementsCreated = 0;
    
    for (const achievementData of achievementDefinitions) {
      const [achievement, created] = await Achievement.findOrCreate({
        where: { key: achievementData.key },
        defaults: achievementData
      });
      
      if (created) {
        achievementsCreated++;
        console.log(`  ✅ Created achievement: ${achievementData.name}`);
      }
    }
    
    console.log(`✅ Achievements processed: ${achievementsCreated} created, ${achievementDefinitions.length - achievementsCreated} already existed`);

    // 3. Development-only sample data
    if (!isProduction) {
      console.log('🧪 Creating development sample data...');
      
      // Create sample users
      let sampleUsersCreated = 0;
      for (const userData of developmentSampleData.sampleUsers) {
        const hashedSamplePassword = await bcrypt.hash(userData.password, 10);
        const [user, created] = await User.findOrCreate({
          where: { email: userData.email },
          defaults: {
            ...userData,
            password: hashedSamplePassword
          }
        });
        
        if (created) {
          sampleUsersCreated++;
          console.log(`  ✅ Created sample user: ${userData.email}`);
        }
      }
      
      // Create sample pubs
      let samplePubsCreated = 0;
      for (const pubData of developmentSampleData.samplePubs) {
        const [pub, created] = await Pub.findOrCreate({
          where: { name: pubData.name },
          defaults: {
            ...pubData,
            coordinates: sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', pubData.longitude, pubData.latitude), 4326)
          }
        });
        
        if (created) {
          samplePubsCreated++;
          console.log(`  ✅ Created sample pub: ${pubData.name}`);
        }
      }
      
      console.log(`✅ Sample data created: ${sampleUsersCreated} users, ${samplePubsCreated} pubs`);
    } else {
      console.log('⚠️  Production mode: Skipping sample data creation');
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`- Environment: ${environment}`);
    console.log(`- Admin user: ${adminConfig.email}`);
    console.log(`- Achievements: ${achievementDefinitions.length} definitions`);
    if (!isProduction) {
      console.log(`- Sample users: ${developmentSampleData.sampleUsers.length}`);
      console.log(`- Sample pubs: ${developmentSampleData.samplePubs.length}`);
    }
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedDatabase();
    console.log('\n✅ Seeding script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding script failed:', error.message);
    if (environment === 'development') {
      console.error('Full error details:', error);
    }
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  seedDatabase,
  achievementDefinitions,
  adminConfig: {
    email: adminConfig.email,
    displayName: adminConfig.displayName,
    role: adminConfig.role
  }
};

// Run if called directly
if (require.main === module) {
  main();
}