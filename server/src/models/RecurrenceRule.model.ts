import mongoose, { Document, Schema } from 'mongoose';

export interface IRecurrenceRule extends Document {
  userId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  recurrenceType: 'daily' | 'weekly' | 'monthly';
  interval: number; // Every N days/weeks/months
  startDate: Date;
  endDate?: Date;
  daysOfWeek?: number[]; // For weekly: [1,3,5] = Mon, Wed, Fri (0=Sunday, 6=Saturday)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecurrenceRuleSchema = new Schema<IRecurrenceRule>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkoutTemplate',
      required: [true, 'Template ID is required']
    },
    recurrenceType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: [true, 'Recurrence type is required']
    },
    interval: {
      type: Number,
      default: 1,
      min: 1
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date
    },
    daysOfWeek: {
      type: [Number],
      validate: {
        validator: function(v: number[]) {
          return v.every(day => day >= 0 && day <= 6);
        },
        message: 'Days of week must be between 0 (Sunday) and 6 (Saturday)'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
RecurrenceRuleSchema.index({ userId: 1 });
RecurrenceRuleSchema.index({ templateId: 1 });
RecurrenceRuleSchema.index({ isActive: 1 });
RecurrenceRuleSchema.index({ startDate: 1, endDate: 1 });

export const RecurrenceRule = mongoose.model<IRecurrenceRule>('RecurrenceRule', RecurrenceRuleSchema);

