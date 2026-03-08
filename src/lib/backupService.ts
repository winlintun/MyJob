import { supabaseServer } from './supabaseClient';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

interface BackupData {
  timestamp: string;
  users: any[];
  jobs: any[];
  income: any[];
  targets: any[];
  version: string;
}

export const createBackup = async (): Promise<boolean> => {
  try {
    // Fetch all data
    const [usersRes, jobsRes, incomeRes, targetsRes] = await Promise.all([
      supabaseServer.from('users').select('id, username, role, created_at'),
      supabaseServer.from('jobs').select('*'),
      supabaseServer.from('income').select('*'),
      supabaseServer.from('targets').select('*'),
    ]);

    const backupData: BackupData = {
      timestamp: new Date().toISOString(),
      users: usersRes.data || [],
      jobs: jobsRes.data || [],
      income: incomeRes.data || [],
      targets: targetsRes.data || [],
      version: '1.0',
    };

    const backupFileName = `backup-${Date.now()}.json`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

    // Keep only last 7 backups
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (backups.length > 7) {
      for (let i = 7; i < backups.length; i++) {
        fs.unlinkSync(path.join(BACKUP_DIR, backups[i]));
      }
    }

    console.log(`✅ Backup created: ${backupFileName}`);
    return true;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    return false;
  }
};

export const restoreBackup = async (backupFileName: string): Promise<boolean> => {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    if (!fs.existsSync(backupPath)) {
      console.error('❌ Backup file not found');
      return false;
    }

    const backupData: BackupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

    // Restore data
    if (backupData.users.length > 0) {
      await supabaseServer.from('users').delete().neq('id', -1);
      await supabaseServer.from('users').insert(backupData.users);
    }

    if (backupData.jobs.length > 0) {
      await supabaseServer.from('jobs').delete().neq('id', -1);
      await supabaseServer.from('jobs').insert(backupData.jobs);
    }

    if (backupData.income.length > 0) {
      await supabaseServer.from('income').delete().neq('id', -1);
      await supabaseServer.from('income').insert(backupData.income);
    }

    if (backupData.targets.length > 0) {
      await supabaseServer.from('targets').delete().neq('id', -1);
      await supabaseServer.from('targets').insert(backupData.targets);
    }

    console.log(`✅ Backup restored from: ${backupFileName}`);
    return true;
  } catch (error) {
    console.error('❌ Restore failed:', error);
    return false;
  }
};

export const getBackupList = (): string[] => {
  try {
    return fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .sort()
      .reverse();
  } catch (error) {
    console.error('❌ Failed to list backups:', error);
    return [];
  }
};

export const scheduleBackup = (intervalHours: number = 24) => {
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  // Run backup immediately
  createBackup();
  
  // Schedule daily backups
  setInterval(() => {
    createBackup();
  }, intervalMs);
  
  console.log(`⏰ Daily backup scheduled every ${intervalHours} hours`);
};
