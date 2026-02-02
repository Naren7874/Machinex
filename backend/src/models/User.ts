import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    phone: string;
    name?: string;
    email?: string;
    location?: string;
    role: 'user' | 'broker' | 'admin';
    isVerified: boolean;
    verificationCode?: string;
    verificationCodeExpires?: Date;

    // WhatsApp specific
    whatsappId?: string;
    whatsappName?: string;
    whatsappProfilePic?: string;

    // Broker specific
    brokerDetails?: {
        companyName?: string;
        licenseNumber?: string;
        taxId?: string;
        commissionRate?: number;
        isVerifiedBroker: boolean;
    };

    // Stats
    listingsCount: number;
    ordersCount: number;
    rating: number;
    totalSpent: number;
    totalEarned: number;

    // Preferences
    preferredCategories?: string[];
    notificationSettings: {
        whatsapp: boolean;
        sms: boolean;
        email: boolean;
        newListings: boolean;
        priceDrops: boolean;
        orderUpdates: boolean;
    };

    // Security
    lastLogin?: Date;
    loginAttempts: number;
    accountLockedUntil?: Date;
    twoFactorEnabled: boolean;

    // Schema Version
    schemaVersion: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;

    // Methods
    compareVerificationCode(code: string): Promise<boolean>;
    lockAccount(): Promise<void>;
    unlockAccount(): Promise<void>;
}

const userSchema = new Schema<IUser>(
    {
        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
            index: true,
        },
        name: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        location: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            enum: ['user', 'broker', 'admin'],
            default: 'user',
            required: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationCode: {
            type: String,
        },
        verificationCodeExpires: {
            type: Date,
        },

        // WhatsApp fields
        whatsappId: {
            type: String,
        },
        whatsappName: {
            type: String,
        },
        whatsappProfilePic: {
            type: String,
        },

        // Broker details
        brokerDetails: {
            companyName: String,
            licenseNumber: String,
            taxId: String,
            commissionRate: {
                type: Number,
                default: 5,
                min: 1,
                max: 15,
            },
            isVerifiedBroker: {
                type: Boolean,
                default: false,
            },
        },

        // Statistics
        listingsCount: {
            type: Number,
            default: 0,
        },
        ordersCount: {
            type: Number,
            default: 0,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalSpent: {
            type: Number,
            default: 0,
        },
        totalEarned: {
            type: Number,
            default: 0,
        },

        // Preferences
        preferredCategories: [
            {
                type: String,
                enum: [
                    'tractor',
                    'excavator',
                    'generator',
                    'compressor',
                    'pump',
                    'crane',
                    'harvester',
                    'truck',
                    'other',
                ],
            },
        ],

        notificationSettings: {
            whatsapp: { type: Boolean, default: true },
            sms: { type: Boolean, default: true },
            email: { type: Boolean, default: false },
            newListings: { type: Boolean, default: true },
            priceDrops: { type: Boolean, default: true },
            orderUpdates: { type: Boolean, default: true },
        },

        // Security
        lastLogin: {
            type: Date,
        },
        loginAttempts: {
            type: Number,
            default: 0,
        },
        accountLockedUntil: {
            type: Date,
        },
        twoFactorEnabled: {
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
userSchema.index({ phone: 1, role: 1 });
userSchema.index({ role: 1, 'brokerDetails.isVerifiedBroker': 1 });
userSchema.index({ location: 1 });
userSchema.index({ createdAt: -1 });

// Virtuals
userSchema.virtual('isBroker').get(function () {
    return this.role === 'broker';
});

userSchema.virtual('isAdmin').get(function () {
    return this.role === 'admin';
});

userSchema.virtual('accountLocked').get(function () {
    return this.accountLockedUntil && this.accountLockedUntil > new Date();
});

// Methods
userSchema.methods.compareVerificationCode = async function (
    code: string
): Promise<boolean> {
    return await bcrypt.compare(code, this.verificationCode || '');
};

userSchema.methods.lockAccount = async function (): Promise<void> {
    this.loginAttempts = 0;
    this.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await this.save();
};

userSchema.methods.unlockAccount = async function (): Promise<void> {
    this.loginAttempts = 0;
    this.accountLockedUntil = undefined;
    await this.save();
};

// Pre-save middleware
userSchema.pre('save', async function () {
    if (this.isModified('verificationCode') && this.verificationCode) {
        this.verificationCode = await bcrypt.hash(this.verificationCode, 10);
    }
});

export const User = mongoose.model<IUser>('User', userSchema);
export default User;
