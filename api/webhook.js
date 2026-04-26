const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {

  const sig = req.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {

      const session = event.data.object;

      const amount = session.amount_total / 100;
      const giftId = session.metadata.giftId;
      const name = session.metadata.name;
      const message = session.metadata.message;

      await fetch("https://rcihspcsadskezucjpdp.supabase.co/rest/v1/contributions", {
        method: "POST",
        headers: {
          "apikey": process.env.SUPABASE_ANON_KEY,
          "Authorization": "Bearer " + process.env.SUPABASE_ANON_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([{
          gift_id: giftId,
          contributor_name: name,
          amount: amount,
          message: message
        }])
      });

    }

    res.status(200).send("ok");

  } catch (err) {
    res.status(400).send(Webhook Error: ${err.message});
  }
};
