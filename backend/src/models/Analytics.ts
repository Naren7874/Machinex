import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalytics extends Document {
    // Date
    date: Date;

    // User Metrics
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    returningUsers: number;

    // Listing Metrics
    totalListings: number;
    newListings: number;
    approvedListings: number;
    soldListings: number;
    averageListingPrice: number;

    // Transaction Metrics
    totalOrders: number;
    completedOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    commissionEarned: number;

    // WhatsApp Metrics
    whatsappMessages: number;
    whatsappConversations: number;
    whatsappImages: number;
    whatsappResponseTime: number;

    // Performance Metrics
    conversionRate: number;
    userRetentionRate: number;

    // Category Breakdown
    categoryStats: Record<
        string,
        {
            listings: number;
            sales: number;
            revenue: number;
            averagePrice: number;
        }
    >;

    // Location Breakdown
    locationStats: Record<
        string,
        {
            users: number;
            listings: number;
            sales: number;
        }
    >;

    // Platform Stats
    platform: {
        website: {
            sessions: number;
            pageViews: number;
            bounceRate: number;
        };
        whatsapp: {
            sessions: number;
            messages: number;
            responseRate: number;
        };
    };

    // Schema Version
    schemaVersion: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

const analyticsSchema = new Schema<IAnalytics>(
    {
        // Date
        date: {
            type: Date,
            required: true,
            unique: true,
            index: true,
        },

        // User Metrics
        totalUsers: {
            type: Number,
            default: 0,
        },
        newUsers: {
            type: Number,
            default: 0,
        },
        activeUsers: {
            type: Number,
            default: 0,
        },
        returningUsers: {
            type: Number,
            default: 0,
        },

        // Listing Metrics
        totalListings: {
            type: Number,
            default: 0,
        },
        newListings: {
            type: Number,
            default: 0,
        },
        approvedListings: {
            type: Number,
            default: 0,
        },
        soldListings: {
            type: Number,
            default: 0,
        },
        averageListingPrice: {
            type: Number,
            default: 0,
        },

        // Transaction Metrics
        totalOrders: {
            type: Number,
            default: 0,
        },
        completedOrders: {
            type: Number,
            default: 0,
        },
        totalRevenue: {
            type: Number,
            default: 0,
        },
        averageOrderValue: {
            type: Number,
            default: 0,
        },
        commissionEarned: {
            type: Number,
            default: 0,
        },

        // WhatsApp Metrics
        whatsappMessages: {
            type: Number,
            default: 0,
        },
        whatsappConversations: {
            type: Number,
            default: 0,
        },
        whatsappImages: {
            type: Number,
            default: 0,
        },
        whatsappResponseTime: {
            type: Number,
            default: 0,
        },

        // Performance Metrics
        conversionRate: {
            type: Number,
            default: 0,
        },
        userRetentionRate: {
            type: Number,
            default: 0,
        },

        // Category Breakdown
        categoryStats: {
            type: Schema.Types.Mixed,
            default: {},
        },

        // Location Breakdown
        locationStats: {
            type: Schema.Types.Mixed,
            default: {},
        },

        // Platform Stats
        platform: {
            website: {
                sessions: { type: Number, default: 0 },
                pageViews: { type: Number, default: 0 },
                bounceRate: { type: Number, default: 0 },
            },
            whatsapp: {
                sessions: { type: Number, default: 0 },
                messages: { type: Number, default: 0 },
                responseRate: { type: Number, default: 0 },
            },
        },

        // Schema Version
        schemaVersion: {
            type: Number,
            default: 1,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
analyticsSchema.index({ date: 1 }, { unique: true });
analyticsSchema.index({ createdAt: -1 });

// Pre-save middleware
analyticsSchema.pre('save', function () {
    // Calculate derived metrics
    if (this.totalListings > 0 && this.soldListings > 0) {
        this.conversionRate = (this.soldListings / this.totalListings) * 100;
    }

    if (this.totalUsers > 0 && this.returningUsers > 0) {
        this.userRetentionRate = (this.returningUsers / this.totalUsers) * 100;
    }
});

export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema);
export default Analytics;
