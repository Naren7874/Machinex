import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    conversation: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    senderPhone: string;

    // Content
    content: string;
    type: 'text' | 'image' | 'document' | 'system' | 'location' | 'contact';
    mediaUrl?: string;
    mediaSize?: number;
    mediaType?: string;
    thumbnailUrl?: string;

    // WhatsApp Specific
    whatsappMessageId?: string;
    whatsappStatus: 'sent' | 'delivered' | 'read' | 'failed';

    // Context
    context?: {
        action?: string;
        data?: Record<string, unknown>;
        replyTo?: mongoose.Types.ObjectId;
    };

    // Status
    isRead: boolean;
    readBy: mongoose.Types.ObjectId[];
    readAt?: Date;
    deliveredAt?: Date;

    // Metadata
    metadata?: Record<string, unknown>;

    // Schema Version
    schemaVersion: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;

    // Methods
    markAsDelivered(): Promise<void>;
    markAsRead(userId: mongoose.Types.ObjectId): Promise<void>;
}

const messageSchema = new Schema<IMessage>(
    {
        conversation: {
            type: Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
            index: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        senderPhone: {
            type: String,
            required: true,
        },

        // Content
        content: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['text', 'image', 'document', 'system', 'location', 'contact'],
            default: 'text',
            index: true,
        },
        mediaUrl: {
            type: String,
        },
        mediaSize: {
            type: Number,
        },
        mediaType: {
            type: String,
        },
        thumbnailUrl: {
            type: String,
        },

        // WhatsApp Specific
        whatsappMessageId: {
            type: String,
        },
        whatsappStatus: {
            type: String,
            enum: ['sent', 'delivered', 'read', 'failed'],
            default: 'sent',
        },

        // Context
        context: {
            action: String,
            data: Schema.Types.Mixed,
            replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
        },

        // Status
        isRead: {
            type: Boolean,
            default: false,
        },
        readBy: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        readAt: {
            type: Date,
        },
        deliveredAt: {
            type: Date,
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

// Indexes for performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ type: 1, createdAt: -1 });
messageSchema.index({ whatsappMessageId: 1 });

// Methods
messageSchema.methods.markAsDelivered = async function (): Promise<void> {
    this.whatsappStatus = 'delivered';
    this.deliveredAt = new Date();
    await this.save();
};

messageSchema.methods.markAsRead = async function (
    userId: mongoose.Types.ObjectId
): Promise<void> {
    if (!this.readBy.some((id: mongoose.Types.ObjectId) => id.equals(userId))) {
        this.readBy.push(userId);
        this.isRead = this.readBy.length > 0;
        this.whatsappStatus = 'read';
        this.readAt = new Date();
        await this.save();
    }
};

export const Message = mongoose.model<IMessage>('Message', messageSchema);
export default Message;
