import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
    // Participants
    participants: mongoose.Types.ObjectId[];
    participantPhones: string[];

    // Context
    listing?: mongoose.Types.ObjectId;
    order?: mongoose.Types.ObjectId;
    type: 'buyer_seller' | 'seller_broker' | 'admin_support' | 'bot_assistant';

    // Conversation Details
    lastMessage?: {
        content: string;
        sender: mongoose.Types.ObjectId;
        timestamp: Date;
        type: 'text' | 'image' | 'document' | 'system';
    };

    // Status
    status: 'active' | 'archived' | 'blocked';
    isReadBy: mongoose.Types.ObjectId[];

    // Metadata
    createdBy: mongoose.Types.ObjectId;

    // Schema Version
    schemaVersion: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt: Date;

    // Methods
    markAsRead(userId: mongoose.Types.ObjectId): Promise<void>;
    updateLastMessage(message: {
        content: string;
        sender: mongoose.Types.ObjectId;
        type?: 'text' | 'image' | 'document' | 'system';
    }): Promise<void>;
}

const conversationSchema = new Schema<IConversation>(
    {
        // Participants
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
        ],
        participantPhones: [
            {
                type: String,
                required: true,
            },
        ],

        // Context
        listing: {
            type: Schema.Types.ObjectId,
            ref: 'Listing',
        },
        order: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
        },
        type: {
            type: String,
            enum: ['buyer_seller', 'seller_broker', 'admin_support', 'bot_assistant'],
            required: true,
            index: true,
        },

        // Conversation Details
        lastMessage: {
            content: String,
            sender: { type: Schema.Types.ObjectId, ref: 'User' },
            timestamp: Date,
            type: { type: String, enum: ['text', 'image', 'document', 'system'] },
        },

        // Status
        status: {
            type: String,
            enum: ['active', 'archived', 'blocked'],
            default: 'active',
            index: true,
        },
        isReadBy: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],

        // Metadata
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Schema Version
        schemaVersion: {
            type: Number,
            default: 1,
        },

        // Timestamps
        lastActivityAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for efficient queries
conversationSchema.index({ participants: 1, status: 1 });
conversationSchema.index({ listing: 1, type: 1 });
conversationSchema.index({ participantPhones: 1 });
conversationSchema.index({ lastActivityAt: -1 });

// Virtual for unread count
conversationSchema.virtual('unreadCount').get(function () {
    return this.participants.filter(
        (participant) => !this.isReadBy.some((id) => id.equals(participant))
    ).length;
});

// Methods
conversationSchema.methods.markAsRead = async function (
    userId: mongoose.Types.ObjectId
): Promise<void> {
    if (!this.isReadBy.some((id: mongoose.Types.ObjectId) => id.equals(userId))) {
        this.isReadBy.push(userId);
        await this.save();
    }
};

conversationSchema.methods.updateLastMessage = async function (message: {
    content: string;
    sender: mongoose.Types.ObjectId;
    type?: 'text' | 'image' | 'document' | 'system';
}): Promise<void> {
    this.lastMessage = {
        content: message.content,
        sender: message.sender,
        timestamp: new Date(),
        type: message.type || 'text',
    };
    this.lastActivityAt = new Date();
    await this.save();
};

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
export default Conversation;
