import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
    // References
    order: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;

    // Payment Details
    paymentId: string;
    amount: number;
    currency: string;
    description?: string;

    // Razorpay Details
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;

    // Status
    status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'partially_refunded';
    captureMethod: 'automatic' | 'manual';

    // Refund Information
    refunds: Array<{
        refundId: string;
        amount: number;
        reason?: string;
        status: 'pending' | 'processed' | 'failed';
        timestamp: Date;
        notes?: string;
    }>;

    // Customer Details
    customer: {
        name?: string;
        email?: string;
        phone: string;
    };

    // Metadata
    metadata?: Record<string, unknown>;
    notes?: string;

    // Schema Version
    schemaVersion: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    capturedAt?: Date;
    refundedAt?: Date;

    // Methods
    capturePayment(): Promise<void>;
    addRefund(refundData: {
        refundId: string;
        amount: number;
        reason?: string;
        notes?: string;
    }): Promise<void>;
}

const paymentSchema = new Schema<IPayment>(
    {
        // References
        order: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            index: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        // Payment Details
        paymentId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        description: {
            type: String,
        },

        // Razorpay Details
        razorpayOrderId: {
            type: String,
            required: true,
            index: true,
        },
        razorpayPaymentId: {
            type: String,
        },
        razorpaySignature: {
            type: String,
        },

        // Status
        status: {
            type: String,
            enum: ['created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'],
            default: 'created',
            index: true,
        },
        captureMethod: {
            type: String,
            enum: ['automatic', 'manual'],
            default: 'automatic',
        },

        // Refund Information
        refunds: [
            {
                refundId: { type: String, required: true },
                amount: { type: Number, required: true, min: 0 },
                reason: String,
                status: {
                    type: String,
                    enum: ['pending', 'processed', 'failed'],
                    default: 'pending',
                },
                timestamp: { type: Date, default: Date.now },
                notes: String,
            },
        ],

        // Customer Details
        customer: {
            name: String,
            email: String,
            phone: { type: String, required: true },
        },

        // Metadata
        metadata: {
            type: Schema.Types.Mixed,
        },
        notes: {
            type: String,
        },

        // Schema Version
        schemaVersion: {
            type: Number,
            default: 1,
        },

        // Timestamps
        capturedAt: {
            type: Date,
        },
        refundedAt: {
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
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ user: 1, status: 1 });

// Virtuals
paymentSchema.virtual('totalRefunded').get(function () {
    return this.refunds
        .filter((refund) => refund.status === 'processed')
        .reduce((total, refund) => total + refund.amount, 0);
});

paymentSchema.virtual('isFullyRefunded').get(function () {
    const totalRefunded = this.refunds
        .filter((refund) => refund.status === 'processed')
        .reduce((total, refund) => total + refund.amount, 0);
    return totalRefunded >= this.amount;
});

paymentSchema.virtual('isPartiallyRefunded').get(function () {
    const totalRefunded = this.refunds
        .filter((refund) => refund.status === 'processed')
        .reduce((total, refund) => total + refund.amount, 0);
    return totalRefunded > 0 && totalRefunded < this.amount;
});

// Methods
paymentSchema.methods.capturePayment = async function (): Promise<void> {
    this.status = 'captured';
    this.capturedAt = new Date();
    await this.save();
};

paymentSchema.methods.addRefund = async function (refundData: {
    refundId: string;
    amount: number;
    reason?: string;
    notes?: string;
}): Promise<void> {
    this.refunds.push({
        refundId: refundData.refundId,
        amount: refundData.amount,
        reason: refundData.reason,
        status: 'pending',
        timestamp: new Date(),
        notes: refundData.notes,
    });

    // Update status based on refund amount
    const totalRefunded =
        this.refunds
            .filter((r: { status: string; amount: number }) => r.status === 'processed')
            .reduce((sum: number, r: { amount: number }) => sum + r.amount, 0) + refundData.amount;

    if (totalRefunded >= this.amount) {
        this.status = 'refunded';
        this.refundedAt = new Date();
    } else if (totalRefunded > 0) {
        this.status = 'partially_refunded';
    }

    await this.save();
};

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;
