import mongoose from 'mongoose';

const savedJobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    veteran: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Veteran',
      required: true,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound unique index so a user cannot bookmark the same job twice
savedJobSchema.index({ user: 1, job: 1 }, { unique: true });

export const SavedJob = mongoose.model('SavedJob', savedJobSchema);
