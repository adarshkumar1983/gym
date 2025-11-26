import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentRecord extends Document {
  membershipId: mongoose.Types.ObjectId;
  provider: 'stripe' | 'razorpay' | 'manual';
  providerId?: string; // Stripe payment intent ID, etc.
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  invoiceUrl?: string;
  receiptUrl?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentRecordSchema = new Schema<IPaymentRecord>(
  {
    membershipId: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
      required: [true, 'Membership ID is required']
    },
    provider: {
      type: String,
      enum: ['stripe', 'razorpay', 'manual'],
      default: 'stripe'
    },
    providerId: {
      type: String
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      required: [true, 'Status is required'],
      default: 'pending'
    },
    invoiceUrl: {
      type: String
    },
    receiptUrl: {
      type: String
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Indexes
PaymentRecordSchema.index({ membershipId: 1 });
PaymentRecordSchema.index({ providerId: 1 });
PaymentRecordSchema.index({ status: 1 });
PaymentRecordSchema.index({ createdAt: -1 });

export const PaymentRecord = mongoose.model<IPaymentRecord>('PaymentRecord', PaymentRecordSchema);

