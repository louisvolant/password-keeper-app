// scheduler.js
const cron = require('node-cron');
const supabase = require('./config/supabase');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'scheduler_error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

const TABLE_TEMPORARY_CONTENT = "temporary_content";

async function deleteExpiredContent() {
  try {
    const now = new Date();
    const { data, error } = await supabase
      .from(TABLE_TEMPORARY_CONTENT)
      .select('identifier, max_date');

    if (error) {
      logger.error('Error fetching data for deletion:', error);
      return;
    }

    if (!data || data.length === 0) {
      logger.info('No data to check for expiration.');
      return;
    }

    for (const item of data) {
      if (new Date(item.max_date) < now) {
        const { error: deleteError } = await supabase
          .from(TABLE_TEMPORARY_CONTENT)
          .delete()
          .eq('identifier', item.identifier);

        if (deleteError) {
          logger.error('Error deleting expired content:', deleteError);
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
//cron.schedule('* * * * *', deleteExpiredContent); // Runs every minute
cron.schedule('0 * * * *', deleteExpiredContent); // Runs every hour
//cron.schedule('0 0 * * *', deleteExpiredContent); // Runs daily at midnight

module.exports = { deleteExpiredContent };