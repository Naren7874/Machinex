import mongoose from 'mongoose';
import logger from '../utils/logger';

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

class Database {
    private static instance: Database;
    private retries = 0;
    private isConnected = false;

    private constructor() { }

    static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    async connect(): Promise<void> {
        if (this.isConnected) {
            logger.info('MongoDB already connected');
            return;
        }

        try {
            const mongoUri = process.env.MONGODB_URI;

            if (!mongoUri) {
                throw new Error('MONGODB_URI is not defined in environment variables');
            }

            await mongoose.connect(mongoUri, {
                maxPoolSize: 10,
                minPoolSize: 5,
                socketTimeoutMS: 45000,
                serverSelectionTimeoutMS: 5000,
            });

            this.isConnected = true;
            this.retries = 0;
            logger.info('✅ MongoDB connected successfully');

            // Connection event handlers
            mongoose.connection.on('error', (error) => {
                logger.error('MongoDB connection error:', error);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected. Attempting to reconnect...');
                this.isConnected = false;
                this.handleReconnect();
            });

            mongoose.connection.on('reconnected', () => {
                logger.info('✅ MongoDB reconnected');
                this.isConnected = true;
                this.retries = 0;
            });

        } catch (error) {
            logger.error('❌ MongoDB connection failed:', error);
            await this.handleReconnect();
        }
    }

    private async handleReconnect(): Promise<void> {
        if (this.retries < MAX_RETRIES) {
            this.retries++;
            logger.info(`Retry ${this.retries}/${MAX_RETRIES} in ${RETRY_DELAY}ms`);

            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            await this.connect();
        } else {
            logger.error('Max retries reached. Could not connect to MongoDB.');
            process.exit(1);
        }
    }

    async disconnect(): Promise<void> {
        try {
            await mongoose.disconnect();
            this.isConnected = false;
            logger.info('MongoDB disconnected');
        } catch (error) {
            logger.error('Error disconnecting MongoDB:', error);
        }
    }

    getConnectionStatus(): string {
        const states: { [key: number]: string } = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
        };
        return states[mongoose.connection.readyState] || 'unknown';
    }
}

export default Database.getInstance();
