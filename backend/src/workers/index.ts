import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import emailService from '../services/emailService';
import emailWorker from './emailWorker';

// ================================
// START WORKER
// ================================
async function startWorker() {
  console.log('═══════════════════════════════════════════');
  console.log('   🚀 ReachInbox Email Worker Starting...   ');
  console.log('═══════════════════════════════════════════');

  try {
    // Initialize email service (creates Ethereal account)
    await emailService.initialize();

    // Worker is already started via import
    console.log('\n✅ Worker is running and waiting for jobs!');
    console.log('   Press Ctrl+C to stop\n');

  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

// Start the worker
startWorker();

export default emailWorker;