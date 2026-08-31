// api/verify-payment.js
// Verifies that a payment actually happened, using Razorpay's signature check.
// Called by the browser AFTER the payment popup closes.
// This is the step that makes it impossible to fake a "success" screen.

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: 'Missing payment details' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      return res.status(200).json({ verified: true, paymentId: razorpay_payment_id });
    } else {
      return res.status(400).json({ verified: false, error: 'Signature mismatch — payment not verified' });
    }

  } catch (err) {
    return res.status(500).json({ verified: false, error: 'Server error verifying payment' });
  }
}
