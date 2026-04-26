const Stripe = require("stripe");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "STRIPE_SECRET_KEY is missing in Vercel" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const amount = Number(body.amount);
    const giftName = body.giftName || "Falwlaw Baby Gift";

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  mode: "payment",
  line_items: [{
    price_data: {
      currency: "eur",
      product_data: { name: giftName },
      unit_amount: Math.round(amount * 100)
    },
    quantity: 1
  }],
  metadata: {
    giftId: giftId,
    name: contributorName,
    message: message
  },
  success_url: "https://falawlaw-baby-wishlist.vercel.app/success.html",
  cancel_url: "https://falawlaw-baby-wishlist.vercel.app/cancel.html"
});

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
