import mongoose, { Document, Schema } from 'mongoose';

export interface IMembership extends Document {
  gymId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  planType: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  externalPaymentId?: string; // Stripe subscription ID
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: 'Gym',
      required: [true, 'Gym ID is required']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending'],
      default: 'active'
    },
    planType: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', 'custom'],
      default: 'monthly'
    },
    externalPaymentId: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes
MembershipSchema.index({ gymId: 1 });
MembershipSchema.index({ userId: 1 });
MembershipSchema.index({ status: 1 });
MembershipSchema.index({ startDate: 1, endDate: 1 });

export const Membership = mongoose.model<IMembership>('Membership', MembershipSchema);

