import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  payee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  conf: {
    type: String,
    ref: 'Conference',
  },

  ident: String,

  total: Number,
  desc: String,
  detail: String,

  status: {
    type: String,
    enum: ['waiting', 'paid', 'closed'],
  },

  discounts: [
    { amount: Number, desc: String, until: Date, },
  ],

  creation: Date,
  confirmation: Date,
});

const Payment = mongoose.model('Payment', schema);

export default Payment;
