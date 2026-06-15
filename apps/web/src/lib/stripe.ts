import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

// null si Stripe n'est pas configure : le checkout bascule alors en mode direct.
export const stripe = key ? new Stripe(key) : null;
