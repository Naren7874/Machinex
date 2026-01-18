import mongoose, { Document, Schema } from 'mongoose';

export interface IGallery extends Document {
    // Identification
    galleryId: string;
    title: string;
    description?: string;

    // Ownership
    createdBy: mongoose.Types.ObjectId;
    listing?: mongoose.Types.ObjectId;

    // Images
    images: Array<{
        url: string;
        cloudinaryId: string;
        filename: string;
        size: number;
        width?: number;
        height?: number;
        format: string;
        uploadedAt: Date;
        isPublic: boolean;
        metadata?: Record<string, unknown>;
        aiAnalysis?: {
            labels: string[];
            confidence: number;
            category?: string;
        };
    }>;

    // Organization
    categories: string[];
    tags: string[];

    // Access Control
    isPublic: boolean;
    accessCode?: string;
    allowedViewers: mongoose.Types.ObjectId[];

    // Stats
    viewCount: number;
    downloadCount: number;
    shareCount: number;

    // Expiration
    expiresAt?: Date;
    isPermanent: boolean;

    // Schema Version
    schemaVersion: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;

    // Methods
    addImage(imageData: {
        url: string;
        cloudinaryId: string;
        filename: string;
        size: number;
        width?: number;
        height?: number;
        format: string;
        isPublic?: boolean;
        metadata?: Record<string, unknown>;
        aiAnalysis?: { labels: string[]; confidence: number; category?: string };
    }): Promise<void>;
    incrementView(): Promise<void>;
    incrementDownload(): Promise<void>;
    getPublicUrl(): string;
}

const gallerySchema = new Schema<IGallery>(
    {
        // Identification
        galleryId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },

        // Ownership
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        listing: {
            type: Schema.Types.ObjectId,
            ref: 'Listing',
        },

        // Images
        images: [
            {
                url: { type: String, required: true },
                cloudinaryId: { type: String, required: true },
                filename: { type: String, required: true },
                size: { type: Number, required: true },
                width: Number,
                height: Number,
                format: { type: String, required: true },
                uploadedAt: { type: Date, default: Date.now },
                isPublic: { type: Boolean, default: true },
                metadata: Schema.Types.Mixed,
                aiAnalysis: {
                    labels: [String],
                    confidence: Number,
                    category: String,
                },
            },
        ],

        // Organization
        categories: [
            {
                type: String,
                enum: ['exterior', 'interior', 'engine', 'documents', 'damage', 'working', 'other'],
            },
        ],
        tags: [String],

        // Access Control
        isPublic: {
            type: Boolean,
            default: true,
            index: true,
        },
        accessCode: {
            type: String,
        },
        allowedViewers: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],

        // Stats
        viewCount: {
            type: Number,
            default: 0,
        },
        downloadCount: {
            type: Number,
            default: 0,
        },
        shareCount: {
            type: Number,
            default: 0,
        },

        // Expiration
        expiresAt: {
            type: Date,
            index: true,
        },
        isPermanent: {
            type: Boolean,
            default: false,
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
gallerySchema.index({ galleryId: 1 });
gallerySchema.index({ createdBy: 1, isPublic: 1 });
gallerySchema.index({ listing: 1 });
gallerySchema.index({ tags: 1 });
gallerySchema.index({ expiresAt: 1 });

// Virtuals
gallerySchema.virtual('totalImages').get(function () {
    return this.images.length;
});

gallerySchema.virtual('totalSize').get(function () {
    return this.images.reduce((total, image) => total + image.size, 0);
});

gallerySchema.virtual('isExpired').get(function () {
    return this.expiresAt && new Date() > this.expiresAt;
});

gallerySchema.virtual('thumbnail').get(function () {
    if (this.images.length > 0) {
        return this.images[0].url;
    }
    return null;
});

// Methods
gallerySchema.methods.addImage = async function (imageData: {
    url: string;
    cloudinaryId: string;
    filename: string;
    size: number;
    width?: number;
    height?: number;
    format: string;
    isPublic?: boolean;
    metadata?: Record<string, unknown>;
    aiAnalysis?: { labels: string[]; confidence: number; category?: string };
}): Promise<void> {
    this.images.push({
        url: imageData.url,
        cloudinaryId: imageData.cloudinaryId,
        filename: imageData.filename,
        size: imageData.size,
        width: imageData.width,
        height: imageData.height,
        format: imageData.format,
        uploadedAt: new Date(),
        isPublic: imageData.isPublic ?? true,
        metadata: imageData.metadata,
        aiAnalysis: imageData.aiAnalysis,
    });
    await this.save();
};

gallerySchema.methods.incrementView = async function (): Promise<void> {
    this.viewCount += 1;
    await this.save();
};

gallerySchema.methods.incrementDownload = async function (): Promise<void> {
    this.downloadCount += 1;
    await this.save();
};

gallerySchema.methods.getPublicUrl = function (): string {
    return `/gallery/${this.galleryId}`;
};

// Pre-save middleware
gallerySchema.pre('save', function () {
    // Generate gallery ID if not exists
    if (!this.galleryId) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        this.galleryId = `gal-${timestamp}-${random}`;
    }

    // Set expiration if not permanent (default: 30 days)
    if (!this.isPermanent && !this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
});

export const Gallery = mongoose.model<IGallery>('Gallery', gallerySchema);
export default Gallery;
