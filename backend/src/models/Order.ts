import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
    // Basic Information
    orderId: string;
    listing: mongoose.Types.ObjectId;
    buyer: mongoose.Types.ObjectId;
    seller: mongoose.Types.ObjectId;

    // Transaction Details
    listingPrice: number;
    finalPrice: number;
    commissionRate: number;
    commissionAmount: number;
    netAmount: number;

    // Payment Status
    paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'disputed';
    paymentMethod: 'razorpay' | 'bank_transfer' | 'cash' | 'upi';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;

    // Escrow Status
    escrowStatus: 'created' | 'funds_held' | 'funds_released' | 'funds_refunded';
    escrowReleaseConditions: {
        buyerConfirmation: boolean;
        sellerConfirmation: boolean;
        adminConfirmation: boolean;
        autoReleaseDate?: Date;
    };

    // Delivery & Inspection
    deliveryMethod: 'pickup' | 'seller_delivery' | 'platform_delivery';
    deliveryAddress?: string;
    deliveryStatus: 'pending' | 'scheduled' | 'in_transit' | 'delivered' | 'failed';
    inspectionStatus: 'pending' | 'scheduled' | 'completed' | 'failed';
    inspectionNotes?: string;

    // Negotiation
    originalPrice: number;
    negotiatedPrice?: number;
    offerHistory: Array<{
        amount: number;
        offeredBy: 'buyer' | 'seller';
        status: 'pending' | 'accepted' | 'rejected' | 'countered';
        timestamp: Date;
        notes?: string;
    }>;

    // Communication
    chatThread: mongoose.Types.ObjectId;

    // Dispute Resolution
    hasDispute: boolean;
    disputeDetails?: {
        raisedBy: mongoose.Types.ObjectId;
        reason: string;
        description: string;
        status: 'raised' | 'under_review' | 'resolved' | 'escalated';
        resolution?: string;
        resolvedBy?: mongoose.Types.ObjectId;
        resolvedAt?: Date;
    };

    // Reviews & Ratings
    buyerReview?: {
        rating: number;
        comment: string;
        timestamp: Date;
    };
    sellerReview?: {
        rating: number;
        comment: string;
        timestamp: Date;
    };

    // Schema Version
    schemaVersion: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    paymentDate?: Date;
    deliveryDate?: Date;
    completionDate?: Date;

    // Methods
    calculateCommission(): Promise<void>;
    updateEscrowStatus(status: string): Promise<void>;
    addOffer(offer: {
        amount: number;
        offeredBy: 'buyer' | 'seller';
        notes?: string;
    }): Promise<void>;
}

const orderSchema = new Schema<IOrder>(
    {
        // Basic Information
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        listing: {
            type: Schema.Types.ObjectId,
            ref: 'Listing',
            required: true,
            index: true,
        },
        buyer: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        seller: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        // Transaction Details
        listingPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        finalPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        commissionRate: {
            type: Number,
            default: 5,
            min: 0,
            max: 15,
        },
        commissionAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        netAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Payment Status
        paymentStatus: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'disputed'],
            default: 'pending',
            index: true,
        },
        paymentMethod: {
            type: String,
            enum: ['razorpay', 'bank_transfer', 'cash', 'upi'],
            default: 'razorpay',
        },
        razorpayOrderId: {
            type: String,
        },
        razorpayPaymentId: {
            type: String,
        },
        razorpaySignature: {
            type: String,
        },

        // Escrow Status
        escrowStatus: {
            type: String,
            enum: ['created', 'funds_held', 'funds_released', 'funds_refunded'],
            default: 'created',
        },
        escrowReleaseConditions: {
            buyerConfirmation: { type: Boolean, default: false },
            sellerConfirmation: { type: Boolean, default: false },
            adminConfirmation: { type: Boolean, default: false },
            autoReleaseDate: { type: Date },
        },

        // Delivery & Inspection
        deliveryMethod: {
            type: String,
            enum: ['pickup', 'seller_delivery', 'platform_delivery'],
            default: 'pickup',
        },
        deliveryAddress: {
            type: String,
        },
        deliveryStatus: {
            type: String,
            enum: ['pending', 'scheduled', 'in_transit', 'delivered', 'failed'],
            default: 'pending',
        },
        inspectionStatus: {
            type: String,
            enum: ['pending', 'scheduled', 'completed', 'failed'],
            default: 'pending',
        },
        inspectionNotes: {
            type: String,
        },

        // Negotiation
        originalPrice: {
            type: Number,
            required: true,
        },
        negotiatedPrice: {
            type: Number,
        },
        offerHistory: [
            {
                amount: { type: Number, required: true },
                offeredBy: { type: String, enum: ['buyer', 'seller'], required: true },
                status: {
                    type: String,
                    enum: ['pending', 'accepted', 'rejected', 'countered'],
                    default: 'pending',
                },
                timestamp: { type: Date, default: Date.now },
                notes: String,
            },
        ],

        // Communication
        chatThread: {
            type: Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
        },

        // Dispute Resolution
        hasDispute: {
            type: Boolean,
            default: false,
        },
        disputeDetails: {
            raisedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            reason: String,
            description: String,
            status: {
                type: String,
                enum: ['raised', 'under_review', 'resolved', 'escalated'],
                default: 'raised',
            },
            resolution: String,
            resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            resolvedAt: Date,
        },

        // Reviews & Ratings
        buyerReview: {
            rating: { type: Number, min: 1, max: 5 },
            comment: String,
            timestamp: Date,
        },
        sellerReview: {
            rating: { type: Number, min: 1, max: 5 },
            comment: String,
            timestamp: Date,
        },

        // Schema Version
        schemaVersion: {
            type: Number,
            default: 1,
        },

        // Timestamps
        paymentDate: {
            type: Date,
        },
        deliveryDate: {
            type: Date,
        },
        completionDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes
orderSchema.index({ buyer: 1, paymentStatus: 1 });
orderSchema.index({ seller: 1, paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ razorpayOrderId: 1 });

// Virtuals
orderSchema.virtual('isCompleted').get(function () {
    return this.paymentStatus === 'completed' && this.deliveryStatus === 'delivered';
});

orderSchema.virtual('escrowFundsReleased').get(function () {
    return this.escrowStatus === 'funds_released';
});

orderSchema.virtual('canReleaseFunds').get(function () {
    const conditions = this.escrowReleaseConditions;
    const now = new Date();

    return (
        conditions.buyerConfirmation &&
        conditions.sellerConfirmation &&
        (conditions.adminConfirmation ||
            (conditions.autoReleaseDate && conditions.autoReleaseDate <= now))
    );
});

// Methods
orderSchema.methods.calculateCommission = async function (): Promise<void> {
    this.commissionAmount = (this.finalPrice * this.commissionRate) / 100;
    this.netAmount = this.finalPrice - this.commissionAmount;
    await this.save();
};

orderSchema.methods.updateEscrowStatus = async function (status: string): Promise<void> {
    this.escrowStatus = status;
    await this.save();
};

orderSchema.methods.addOffer = async function (offer: {
    amount: number;
    offeredBy: 'buyer' | 'seller';
    notes?: string;
}): Promise<void> {
    this.offerHistory.push({
        amount: offer.amount,
        offeredBy: offer.offeredBy,
        status: 'pending',
        timestamp: new Date(),
        notes: offer.notes,
    });
    await this.save();
};

// Pre-validate middleware - generate orderId before validation
orderSchema.pre('validate', function () {
    if (!this.orderId) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, '0');
        this.orderId = `ORD-${new Date().getFullYear()}-${timestamp}${random}`;
    }
});

// Pre-save middleware
orderSchema.pre('save', function () {
    // Calculate commission on price change
    if (this.isModified('finalPrice') || this.isModified('commissionRate')) {
        this.commissionAmount = (this.finalPrice * this.commissionRate) / 100;
        this.netAmount = this.finalPrice - this.commissionAmount;
    }

    // Set auto-release date if not set (7 days after payment)
    if (this.paymentDate && !this.escrowReleaseConditions.autoReleaseDate) {
        const autoRelease = new Date(this.paymentDate);
        autoRelease.setDate(autoRelease.getDate() + 7);
        this.escrowReleaseConditions.autoReleaseDate = autoRelease;
    }
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);
export default Order;
