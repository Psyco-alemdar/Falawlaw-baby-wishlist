const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, giftName } = req.body;

    if (!amount || !giftName) {
      return res.status(400).json({ error: "Amount or giftName missing" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: giftName
            },
            unit_amount: Math.round(Number(amount) * 100)
          },
          quantity: 1
        }
      ],
      success_url: "https://falawlaw-baby-wishlist.vercel.app/success.html",
      cancel_url: "https://falawlaw-baby-wishlist.vercel.app/cancel.html"
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
