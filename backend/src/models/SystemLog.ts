import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemLog extends Document {
    // Log Identification
    logId: string;
    level: 'info' | 'warn' | 'error' | 'debug' | 'critical';
    module: string;

    // Content
    message: string;
    data?: Record<string, unknown>;
    stackTrace?: string;

    // Context
    userId?: mongoose.Types.ObjectId;
    userPhone?: string;
    ipAddress?: string;
    userAgent?: string;

    // Metadata
    requestId?: string;
    sessionId?: string;

    // Schema Version
    schemaVersion: number;

    // Timestamps
    timestamp: Date;
    createdAt: Date;
}

const systemLogSchema = new Schema<ISystemLog>(
    {
        // Log Identification
        logId: {
            type: String,
            unique: true,
            index: true,
            default: () => {
                const timestamp = Date.now().toString(36);
                const random = Math.random().toString(36).substring(2, 8);
                return `log-${timestamp}-${random}`;
            },
        },
        level: {
            type: String,
            enum: ['info', 'warn', 'error', 'debug', 'critical'],
            required: true,
            index: true,
        },
        module: {
            type: String,
            required: true,
            index: true,
        },

        // Content
        message: {
            type: String,
            required: true,
        },
        data: {
            type: Schema.Types.Mixed,
        },
        stackTrace: {
            type: String,
        },

        // Context
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        userPhone: {
            type: String,
            index: true,
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },

        // Metadata
        requestId: {
            type: String,
        },
        sessionId: {
            type: String,
        },

        // Schema Version
        schemaVersion: {
            type: Number,
            default: 1,
        },

        // Timestamps
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
systemLogSchema.index({ level: 1, timestamp: -1 });
systemLogSchema.index({ module: 1, timestamp: -1 });
systemLogSchema.index({ userPhone: 1, timestamp: -1 });
systemLogSchema.index({ createdAt: -1 });

// TTL index for auto-deletion (keep logs for 90 days)
// systemLogSchema.index({ level: 1, timestamp: -1 }); // Keeping compound index
// systemLogSchema.index({ module: 1, timestamp: -1 }); // Keeping compound index
// systemLogSchema.index({ userPhone: 1, timestamp: -1 }); // Keeping compound index
// Note: createdAt -1 already defined above at line 115
systemLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const SystemLog = mongoose.model<ISystemLog>('SystemLog', systemLogSchema);
export default SystemLog;
