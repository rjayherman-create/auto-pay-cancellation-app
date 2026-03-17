import { getUncachableStripeClient } from "./stripeClient.js";
import { stripeStorage } from "./stripeStorage.js";

export class StripeService {
  async createCustomer(email: string, userId: number) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      metadata: { userId: String(userId) },
    });
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getOrCreateCustomer(userId: number, email: string) {
    const user = await stripeStorage.getUserById(userId);
    if (!user) throw new Error("User not found");

    if (user.stripeCustomerId) return user.stripeCustomerId;

    const customer = await this.createCustomer(email, userId);
    await stripeStorage.updateUserStripeInfo(userId, {
      stripeCustomerId: customer.id,
    });
    return customer.id;
  }
}

export const stripeService = new StripeService();
