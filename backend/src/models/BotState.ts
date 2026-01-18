import mongoose, { Document, Schema } from 'mongoose';

export interface IBotState extends Document {
    phone: string;
    currentFlow: 'sell' | 'buy' | 'help' | 'inquiry' | 'status' | 'none';
    currentStep: string;
    flowData: Record<string, unknown>;

    // Context
    currentListing?: mongoose.Types.ObjectId;
    currentOrder?: mongoose.Types.ObjectId;
    lastMessage?: string;

    // Session Management
    sessionId: string;
    isActive: boolean;
    lastInteraction: Date;
    expiresAt: Date;

    // Analytics
    totalMessages: number;
    completedFlows: number;

    // Metadata
    metadata?: Record<string, unknown>;

    // Schema Version
    schemaVersion: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;

    // Methods
    updateStep(step: string, data?: Record<string, unknown>): Promise<void>;
    resetFlow(): Promise<void>;
    isExpired(): boolean;
}

const botStateSchema = new Schema<IBotState>(
    {
        phone: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        currentFlow: {
            type: String,
            enum: ['sell', 'buy', 'help', 'inquiry', 'status', 'none'],
            default: 'none',
        },
        currentStep: {
            type: String,
            default: 'start',
        },
        flowData: {
            type: Schema.Types.Mixed,
            default: {},
        },

        // Context
        currentListing: {
            type: Schema.Types.ObjectId,
            ref: 'Listing',
        },
        currentOrder: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
        },
        lastMessage: {
            type: String,
        },

        // Session Management
        sessionId: {
            type: String,
            required: true,
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        lastInteraction: {
            type: Date,
            default: Date.now,
            index: true,
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            index: true,
        },

        // Analytics
        totalMessages: {
            type: Number,
            default: 0,
        },
        completedFlows: {
            type: Number,
            default: 0,
        },

        // Metadata
        metadata: {
            type: Schema.Types.Mixed,
        },

        // Schema Version
        schemaVersion: {
            type: Number,
            default: 1,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes
botStateSchema.index({ phone: 1, isActive: 1 });
botStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
botStateSchema.index({ lastInteraction: -1 });

// Methods
botStateSchema.methods.updateStep = async function (
    step: string,
    data?: Record<string, unknown>
): Promise<void> {
    this.currentStep = step;
    this.lastInteraction = new Date();
    this.totalMessages += 1;

    if (data) {
        this.flowData = { ...this.flowData, ...data };
    }

    await this.save();
};

botStateSchema.methods.resetFlow = async function (): Promise<void> {
    this.currentFlow = 'none';
    this.currentStep = 'start';
    this.flowData = {};
    this.currentListing = undefined;
    this.currentOrder = undefined;
    this.lastInteraction = new Date();

    await this.save();
};

botStateSchema.methods.isExpired = function (): boolean {
    return new Date() > this.expiresAt;
};

// Pre-save middleware
botStateSchema.pre('save', function () {
    // Update expiresAt on interaction
    if (this.isModified('lastInteraction')) {
        this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }

    // Increment completedFlows only when currentStep transitions to 'completed'
    if (this.isModified('currentStep') && this.currentStep === 'completed') {
        this.completedFlows += 1;
    }
});

export const BotState = mongoose.model<IBotState>('BotState', botStateSchema);
export default BotState;
