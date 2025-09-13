const { User, Achievement, UserAchievement, PintSession } = require('../models');

class AchievementsService {
  
  /**
   * Initialize achievements in the database
   * Called during server startup
   */
  static async initializeAchievements() {
    const defaultAchievements = [
      {
        key: 'first_pint',
        name: 'First Pint',
        description: 'Attended your first pint session',
        iconUrl: '🍺'
      },
      {
        key: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Attended 5 different pint sessions',
        iconUrl: '🦋'
      },
      {
        key: 'host_master',
        name: 'Host Master',
        description: 'Hosted 10 pint sessions',
        iconUrl: '🎯'
      },
      {
        key: 'pub_crawler',
        name: 'Pub Crawler',
        description: 'Visited 5 different pubs',
        iconUrl: '🍻'
      },
      {
        key: 'pint_pioneer',
        name: 'Pint Pioneer',
        description: 'One of the first 100 users to join Pint',
        iconUrl: '🚀'
      },
      {
        key: 'pint_ambassador',
        name: 'Pint Ambassador',
        description: 'Referred a friend who successfully joined Pint',
        iconUrl: '🎖️'
      }
    ];

    for (const achievementData of defaultAchievements) {
      await Achievement.findOrCreate({
        where: { key: achievementData.key },
        defaults: achievementData
      });
    }
  }

  /**
   * Check and award achievements for a user after they join a session
   */
  static async checkSessionJoinAchievements(userId) {
    try {
      // Check for "First Pint" achievement
      await this.checkFirstPintAchievement(userId);
      
      // Check for "Social Butterfly" achievement (5 sessions attended)
      await this.checkSocialButterflyAchievement(userId);
      
      // Check for "Pub Crawler" achievement (5 different pubs)
      await this.checkPubCrawlerAchievement(userId);
      
    } catch (error) {
      console.error('Error checking session join achievements:', error);
    }
  }

  /**
   * Check and award achievements for a user after they create a session
   */
  static async checkSessionCreateAchievements(userId) {
    try {
      // Check for "Host Master" achievement (10 sessions hosted)
      await this.checkHostMasterAchievement(userId);
      
    } catch (error) {
      console.error('Error checking session create achievements:', error);
    }
  }

  /**
   * Award an achievement to a user if they don't already have it
   */
  static async awardAchievement(userId, achievementKey) {
    try {
      const achievement = await Achievement.findOne({ where: { key: achievementKey } });
      if (!achievement) {
        console.error(`Achievement with key ${achievementKey} not found`);
        return null;
      }

      const [userAchievement, created] = await UserAchievement.findOrCreate({
        where: {
          userId: userId,
          achievementId: achievement.id
        },
        defaults: {
          userId: userId,
          achievementId: achievement.id
        }
      });

      if (created) {
        console.log(`Achievement ${achievementKey} awarded to user ${userId}`);
        return {
          achievement,
          dateEarned: userAchievement.dateEarned
        };
      }
      
      return null; // Achievement already earned
    } catch (error) {
      console.error('Error awarding achievement:', error);
      return null;
    }
  }

  /**
   * Get all achievements for a user
   */
  static async getUserAchievements(userId) {
    try {
      const userAchievements = await UserAchievement.findAll({
        where: { userId },
        include: {
          model: Achievement,
          attributes: ['id', 'name', 'description', 'iconUrl', 'key']
        },
        order: [['dateEarned', 'DESC']]
      });

      return userAchievements.map(ua => ({
        id: ua.Achievement.id,
        name: ua.Achievement.name,
        description: ua.Achievement.description,
        iconUrl: ua.Achievement.iconUrl,
        key: ua.Achievement.key,
        dateEarned: ua.dateEarned
      }));
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  // Private helper methods for specific achievement checks

  static async checkFirstPintAchievement(userId) {
    const user = await User.findByPk(userId, {
      include: {
        model: PintSession,
        as: 'attendedSessions'
      }
    });

    if (user && user.attendedSessions && user.attendedSessions.length === 1) {
      return await this.awardAchievement(userId, 'first_pint');
    }
    return null;
  }

  static async checkSocialButterflyAchievement(userId) {
    const user = await User.findByPk(userId, {
      include: {
        model: PintSession,
        as: 'attendedSessions'
      }
    });

    if (user && user.attendedSessions && user.attendedSessions.length >= 5) {
      return await this.awardAchievement(userId, 'social_butterfly');
    }
    return null;
  }

  static async checkHostMasterAchievement(userId) {
    const hostedSessionsCount = await PintSession.count({
      where: { initiatorId: userId }
    });

    if (hostedSessionsCount >= 10) {
      return await this.awardAchievement(userId, 'host_master');
    }
    return null;
  }

  static async checkPubCrawlerAchievement(userId) {
    const user = await User.findByPk(userId, {
      include: {
        model: PintSession,
        as: 'attendedSessions',
        attributes: ['pubName']
      }
    });

    if (user && user.attendedSessions) {
      const uniquePubs = new Set(user.attendedSessions.map(session => session.pubName));
      if (uniquePubs.size >= 5) {
        return await this.awardAchievement(userId, 'pub_crawler');
      }
    }
    return null;
  }

  /**
   * Award the Pint Ambassador achievement for successful referrals
   */
  static async awardPintAmbassadorAchievement(referrerId) {
    try {
      return await this.awardAchievement(referrerId, 'pint_ambassador');
    } catch (error) {
      console.error('Error awarding Pint Ambassador achievement:', error);
      return null;
    }
  }
}

module.exports = AchievementsService;