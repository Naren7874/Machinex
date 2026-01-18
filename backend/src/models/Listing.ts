import mongoose, { Document, Schema } from 'mongoose';

export interface IListing extends Document {
    // Basic Information
    title: string;
    description: string;
    price: number;
    location: string;
    machineType: string;

    // Machine Details
    brand?: string;
    modelName?: string;
    year?: number;
    hoursUsed?: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_repair';
    fuelType?: 'diesel' | 'petrol' | 'electric' | 'cng' | 'other';

    // Seller Information
    seller: mongoose.Types.ObjectId;
    sellerPhone: string;
    sellerName?: string;

    // Images
    images: Array<{
        url: string;
        cloudinaryId: string;
        isFeatured: boolean;
        order: number;
        aiAnalysis?: {
            labels: string[];
            confidence: number;
            category?: string;
        };
    }>;
    thumbnail?: string;

    // Status & Moderation
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'sold' | 'expired' | 'archived';
    adminNotes?: string;
    rejectionReason?: string;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    expiresAt: Date;

    // AI Generated Content
    aiGenerated: boolean;
    aiAnalysis?: {
        machineTypeConfidence: number;
        conditionScore: number;
        priceSuggestion: number;
        priceDeviation: number;
        fraudRisk: number;
        similarListings: mongoose.Types.ObjectId[];
        generatedTitle?: string;
        generatedDescription?: string;
        tags: string[];
    };

    // Stats
    views: number;
    inquiries: number;
    whatsappClicks: number;
    saves: number;

    // Features
    isFeatured: boolean;
    isUrgent: boolean;
    isNegotiable: boolean;

    // Technical
    category: string;
    subcategory?: string;
    specifications?: Record<string, unknown>;

    // Schema Version
    schemaVersion: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    soldAt?: Date;

    // Methods
    incrementView(): Promise<void>;
    incrementInquiry(): Promise<void>;
    incrementWhatsAppClicks(): Promise<void>;
}

const listingSchema = new Schema<IListing>(
    {
        // Basic Information
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        location: {
            type: String,
            required: true,
            trim: true,
        },
        machineType: {
            type: String,
            required: true,
            enum: [
                'tractor',
                'excavator',
                'bulldozer',
                'crane',
                'loader',
                'generator',
                'compressor',
                'pump',
                'forklift',
                'harvester',
                'truck',
                'trailer',
                'concrete_mixer',
                'asphalt_paver',
                'road_roller',
                'other',
            ],
        },

        // Machine Details
        brand: {
            type: String,
            trim: true,
        },
        modelName: {
            type: String,
            trim: true,
        },
        year: {
            type: Number,
            min: 1900,
            max: new Date().getFullYear() + 1,
        },
        hoursUsed: {
            type: Number,
            min: 0,
        },
        condition: {
            type: String,
            enum: ['excellent', 'good', 'fair', 'poor', 'needs_repair'],
            required: true,
        },
        fuelType: {
            type: String,
            enum: ['diesel', 'petrol', 'electric', 'cng', 'other'],
        },

        // Seller Information
        seller: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        sellerPhone: {
            type: String,
            required: true,
        },
        sellerName: {
            type: String,
            trim: true,
        },

        // Images
        images: [
            {
                url: { type: String, required: true },
                cloudinaryId: { type: String, required: true },
                isFeatured: { type: Boolean, default: false },
                order: { type: Number, default: 0 },
                aiAnalysis: {
                    labels: [String],
                    confidence: Number,
                    category: String,
                },
            },
        ],
        thumbnail: {
            type: String,
        },

        // Status & Moderation
        status: {
            type: String,
            enum: ['draft', 'pending', 'approved', 'rejected', 'sold', 'expired', 'archived'],
            default: 'pending',
            index: true,
        },
        adminNotes: {
            type: String,
        },
        rejectionReason: {
            type: String,
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        approvedAt: {
            type: Date,
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            index: true,
        },

        // AI Generated Content
        aiGenerated: {
            type: Boolean,
            default: false,
        },
        aiAnalysis: {
            machineTypeConfidence: { type: Number, min: 0, max: 1 },
            conditionScore: { type: Number, min: 0, max: 1 },
            priceSuggestion: Number,
            priceDeviation: Number,
            fraudRisk: { type: Number, min: 0, max: 1 },
            similarListings: [{ type: Schema.Types.ObjectId, ref: 'Listing' }],
            generatedTitle: String,
            generatedDescription: String,
            tags: [String],
        },

        // Stats
        views: {
            type: Number,
            default: 0,
        },
        inquiries: {
            type: Number,
            default: 0,
        },
        whatsappClicks: {
            type: Number,
            default: 0,
        },
        saves: {
            type: Number,
            default: 0,
        },

        // Features
        isFeatured: {
            type: Boolean,
            default: false,
            index: true,
        },
        isUrgent: {
            type: Boolean,
            default: false,
        },
        isNegotiable: {
            type: Boolean,
            default: true,
        },

        // Technical
        category: {
            type: String,
            required: true,
            enum: ['agriculture', 'construction', 'industrial', 'transport', 'power', 'other'],
        },
        subcategory: {
            type: String,
        },
        specifications: {
            type: Schema.Types.Mixed,
        },

        // Schema Version
        schemaVersion: {
            type: Number,
            default: 1,
        },

        // Timestamps
        soldAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for performance
listingSchema.index({ status: 1, expiresAt: 1 });
listingSchema.index({ machineType: 1, category: 1 });
listingSchema.index({ location: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ seller: 1, status: 1 });
listingSchema.index({ createdAt: -1 });
listingSchema.index({ isFeatured: -1, createdAt: -1 });
listingSchema.index({ 'aiAnalysis.fraudRisk': -1 });

// Compound indexes for common queries
listingSchema.index({ status: 1, location: 1, machineType: 1, price: 1 });
listingSchema.index({ status: 1, category: 1, createdAt: -1 });

// Text index for search
listingSchema.index({ title: 'text', description: 'text', brand: 'text' });

// Virtuals
listingSchema.virtual('isActive').get(function () {
    return this.status === 'approved' && this.expiresAt > new Date();
});

listingSchema.virtual('isExpired').get(function () {
    return this.expiresAt < new Date();
});

listingSchema.virtual('daysLeft').get(function () {
    const now = new Date();
    const diff = this.expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Methods
listingSchema.methods.incrementView = async function (): Promise<void> {
    this.views += 1;
    await this.save();
};

listingSchema.methods.incrementInquiry = async function (): Promise<void> {
    this.inquiries += 1;
    await this.save();
};

listingSchema.methods.incrementWhatsAppClicks = async function (): Promise<void> {
    this.whatsappClicks += 1;
    await this.save();
};

// Pre-save middleware
listingSchema.pre('save', function () {
    // Auto-set thumbnail if not set
    if (!this.thumbnail && this.images.length > 0) {
        const featuredImage = this.images.find((img) => img.isFeatured) || this.images[0];
        this.thumbnail = featuredImage.url;
    }

    // Auto-calculate price deviation if AI analysis exists
    if (this.aiAnalysis?.priceSuggestion && this.price) {
        const deviation =
            ((this.price - this.aiAnalysis.priceSuggestion) / this.aiAnalysis.priceSuggestion) * 100;
        this.aiAnalysis.priceDeviation = deviation;
    }
});

export const Listing = mongoose.model<IListing>('Listing', listingSchema);
export default Listing;
