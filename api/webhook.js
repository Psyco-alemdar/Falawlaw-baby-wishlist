module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const event = req.body;

    if (event.type !== "checkout.session.completed") {
      return res.status(200).json({ received: true });
    }

    const session = event.data.object;

    const amount = session.amount_total / 100;
    const giftId = session.metadata.giftId;
    const name = session.metadata.name || "Anonyme";
    const message = session.metadata.message || "";

    const SUPABASE_URL = "https://rcihspcsadskezucjpdp.supabase.co";
    const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_KEY) {
      return res.status(500).json({ error: "SUPABASE_ANON_KEY missing" });
    }

    // 1. Enregistrer contribution
    const insertResponse = await fetch(SUPABASE_URL + "/rest/v1/contributions", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([
        {
          gift_id: Number(giftId),
          contributor_name: name,
          amount: amount,
          message: message
        }
      ])
    });

    if (!insertResponse.ok) {
      const text = await insertResponse.text();
      return res.status(500).json({ error: "Insert contribution failed", details: text });
    }

    // 2. Lire cadeau actuel
    const giftResponse = await fetch(SUPABASE_URL + "/rest/v1/gifts?id=eq." + giftId + "&select=*", {
      method: "GET",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY
      }
    });

    const gifts = await giftResponse.json();
    const gift = gifts[0];

    if (!gift) {
      return res.status(500).json({ error: "Gift not found" });
    }

    const oldFunded = Number(gift.funded_amount || 0);
    const target = Number(gift.target_amount || 0);
    const newFunded = oldFunded + amount;

    // 3. Mettre à jour cadeau
    const updateResponse = await fetch(SUPABASE_URL + "/rest/v1/gifts?id=eq." + giftId, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        funded_amount: newFunded,
        is_funded: newFunded >= target
      })
    });

    if (!updateResponse.ok) {
      const text = await updateResponse.text();
      return res.status(500).json({ error: "Update gift failed", details: text });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
