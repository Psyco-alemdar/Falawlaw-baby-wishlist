const Stripe = require("stripe");

module.exports = async function handler(req, res) {
  try {
    // Vérifier méthode
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Vérifier clé Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "STRIPE_SECRET_KEY manquante" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Lire body correctement
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const amount = Number(body.amount);
    const giftName = body.giftName || "Falwlaw Baby Gift";
    const giftId = body.giftId;
    const contributorName = body.contributorName || "Anonyme";
    const message = body.message || "";

    // Vérifications
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Montant invalide" });
    }

    if (!giftId) {
      return res.status(400).json({ error: "giftId manquant" });
    }

    // Création session Stripe
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
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }
      ],

      // 🔥 IMPORTANT (pour webhook)
      metadata: {
        giftId: String(giftId),
        name: String(contributorName),
        message: String(message)
      },

      success_url: "https://falawlaw-baby-wishlist.vercel.app/success.html",
      cancel_url: "https://falawlaw-baby-wishlist.vercel.app/cancel.html"
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
