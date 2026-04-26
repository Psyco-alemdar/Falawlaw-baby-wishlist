import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { amount, giftName } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: giftName,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: "https://falwlaw-baby-wishlist.vercel.app/success.html",
      cancel_url: "https://falwlaw-baby-wishlist.vercel.app/cancel.html",
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
