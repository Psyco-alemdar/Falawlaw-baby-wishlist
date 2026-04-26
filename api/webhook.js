const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Signature error:", err.message);
    return res.status(400).send(Webhook Error: ${err.message});
  }

  try {
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

    return res.status(200).send("ok");

  } catch (error) {
    console.error("❌ Webhook crash:", error);
    return res.status(500).send("Server error");
  }
}

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (chunk) => {
      chunks.push(chunk);
    });
    readable.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readable.on("error", reject);
  });
}
