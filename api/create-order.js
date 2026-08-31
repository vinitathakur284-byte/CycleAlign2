// api/create-order.js
// Creates a unique Razorpay order for each waitlist signup.
// Called by the browser BEFORE the payment popup opens.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Razorpay keys not configured' });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 49900, // ₹499.00 in paise
        currency: 'INR',
        receipt: `cyclealign_${Date.now()}`,
        notes: {
          product: 'CycleALIGN Early Access Waitlist'
        }
      })
    });

    const order = await orderResponse.json();

    if (!orderResponse.ok) {
      return res.status(400).json({ error: order.error?.description || 'Order creation failed' });
    }

    // Send back only what the browser needs — never the secret
    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId
    });

  } catch (err) {
    return res.status(500).json({ error: 'Server error creating order' });
  }
}
