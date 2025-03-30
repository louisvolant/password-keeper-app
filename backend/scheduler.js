// scheduler.js
const cron = require('node-cron');
const winston = require('winston');
const { TemporaryContentModel } = require('./dao/userDao'); // Import Mongoose model

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'scheduler_error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

async function deleteExpiredContent() {
  try {
    const now = new Date();

    // Fetch all temporary content from MongoDB
    const contents = await TemporaryContentModel.find(
      {}, // No filter to get all documents
      'identifier max_date' // Select only necessary fields
    );

    if (!contents || contents.length === 0) {
      logger.info('No data to check for expiration.');
      return;
    }

    // Delete expired content
    for (const item of contents) {
      if (new Date(item.max_date) < now) {
        const result = await TemporaryContentModel.deleteOne({ identifier: item.identifier });

        if (result.deletedCount === 0) {
          logger.error('Error deleting expired content: Not found', { identifier: item.identifier });
        } else {
          logger.info('Expired content deleted by scheduler:', { identifier: item.identifier });
        }
      }
    }

    logger.info("Expired data deletion scheduler ran successfully");
  } catch (err) {
    logger.error('Unexpected error in deleteExpiredContent:', err);
  }
}

// Schedule the task
// cron.schedule('* * * * *', deleteExpiredContent); // Runs every minute
cron.schedule('0 * * * *', deleteExpiredContent); // Runs every hour
// cron.schedule('0 0 * * *', deleteExpiredContent); // Runs daily at midnight

module.exports = { deleteExpiredContent };