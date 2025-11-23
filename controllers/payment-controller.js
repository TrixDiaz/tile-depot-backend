import {paymongoConfig, getPaymongoAuthHeader} from "../config/paymongo.js";
import {db} from "../drizzle/index.js";
import {sales, products} from "../drizzle/schema/schema.js";
import {eq} from "drizzle-orm";

// Create a PayMongo payment intent for GCash or Maya
export const createPaymentIntent = async (req, res) => {
  try {
    const {amount, paymentMethods, description, metadata} = req.body;

    // Validate required fields
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    // Validate minimum amount (2000 centavos = 20 PHP)
    const amountInCentavos = Math.round(amount * 100);
    if (amountInCentavos < 2000) {
      return res.status(400).json({
        success: false,
        message: "Minimum amount is 20.00 PHP",
      });
    }

    // Default payment methods if not provided
    const allowedPaymentMethods = paymentMethods || [
      "gcash",
      "paymaya",
      "grab_pay",
      "card",
      "dob",
      "billease",
      "qrph",
    ];

    // Build payment method options
    const paymentMethodOptions = {
      card: {
        request_three_d_secure: "any",
      },
    };

    // Create payment intent
    const response = await fetch(`${paymongoConfig.baseUrl}/payment_intents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getPaymongoAuthHeader(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amountInCentavos,
            payment_method_allowed: allowedPaymentMethods,
            payment_method_options: paymentMethodOptions,
            currency: "PHP",
            capture_type: "automatic",
            description: description || "Tile Depot Transaction",
            statement_descriptor: "TILE DEPOT",
            metadata: metadata || {},
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo error:", data);
      return res.status(response.status).json({
        success: false,
        message: "Failed to create payment intent",
        error: data.errors || data,
      });
    }

    res.json({
      success: true,
      data: data.data,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment intent",
      error: error.message,
    });
  }
};

// Create a PayMongo payment method
export const createPaymentMethod = async (req, res) => {
  try {
    const {type, details} = req.body;

    // Validate required fields
    if (!type || !details) {
      return res.status(400).json({
        success: false,
        message: "Payment type and details are required",
      });
    }

    const response = await fetch(`${paymongoConfig.baseUrl}/payment_methods`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getPaymongoAuthHeader(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type, // 'gcash' or 'paymaya'
            ...details,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo error:", data);
      return res.status(response.status).json({
        success: false,
        message: "Failed to create payment method",
        error: data.errors || data,
      });
    }

    res.json({
      success: true,
      data: data.data,
    });
  } catch (error) {
    console.error("Error creating payment method:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment method",
      error: error.message,
    });
  }
};

// Attach payment method to payment intent
export const attachPaymentIntent = async (req, res) => {
  try {
    const {paymentIntentId, paymentMethodId, clientKey} = req.body;

    if (!paymentIntentId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: "Payment intent ID and payment method ID are required",
      });
    }

    const response = await fetch(
      `${paymongoConfig.baseUrl}/payment_intents/${paymentIntentId}/attach`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getPaymongoAuthHeader(),
        },
        body: JSON.stringify({
          data: {
            attributes: {
              payment_method: paymentMethodId,
              client_key: clientKey,
              return_url: "http://localhost:5173/payment/callback", // This should be configured
            },
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo error:", data);
      return res.status(response.status).json({
        success: false,
        message: "Failed to attach payment method",
        error: data.errors || data,
      });
    }

    res.json({
      success: true,
      data: data.data,
    });
  } catch (error) {
    console.error("Error attaching payment method:", error);
    res.status(500).json({
      success: false,
      message: "Failed to attach payment method",
      error: error.message,
    });
  }
};

// Create a PayMongo source (for GCash/Maya redirect)
export const createPaymentSource = async (req, res) => {
  try {
    const {amount, type, redirect} = req.body;

    // Validate required fields
    if (!amount || !type) {
      return res.status(400).json({
        success: false,
        message: "Amount and payment type are required",
      });
    }

    // PayMongo accepts amount in centavos (multiply by 100)
    const amountInCentavos = Math.round(amount * 100);

    const response = await fetch(`${paymongoConfig.baseUrl}/sources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getPaymongoAuthHeader(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amountInCentavos,
            redirect: redirect || {
              success: "http://localhost:5173/payment/success",
              failed: "http://localhost:5173/payment/failed",
            },
            type, // 'gcash' or 'paymaya'
            currency: "PHP",
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo error:", data);
      return res.status(response.status).json({
        success: false,
        message: "Failed to create payment source",
        error: data.errors || data,
      });
    }

    res.json({
      success: true,
      data: data.data,
    });
  } catch (error) {
    console.error("Error creating payment source:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment source",
      error: error.message,
    });
  }
};

// Get payment intent status
export const getPaymentIntentStatus = async (req, res) => {
  try {
    const {id} = req.params;

    const response = await fetch(
      `${paymongoConfig.baseUrl}/payment_intents/${id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: getPaymongoAuthHeader(),
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo error:", data);
      return res.status(response.status).json({
        success: false,
        message: "Failed to get payment intent",
        error: data.errors || data,
      });
    }

    res.json({
      success: true,
      data: data.data,
    });
  } catch (error) {
    console.error("Error getting payment intent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payment intent",
      error: error.message,
    });
  }
};

// Get payment source status
export const getPaymentSourceStatus = async (req, res) => {
  try {
    const {id} = req.params;

    const response = await fetch(`${paymongoConfig.baseUrl}/sources/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: getPaymongoAuthHeader(),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo error:", data);
      return res.status(response.status).json({
        success: false,
        message: "Failed to get payment source",
        error: data.errors || data,
      });
    }

    res.json({
      success: true,
      data: data.data,
    });
  } catch (error) {
    console.error("Error getting payment source:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payment source",
      error: error.message,
    });
  }
};

// Create a PayMongo Checkout Session (recommended for GCash/Maya)
export const createCheckoutSession = async (req, res) => {
  try {
    const {
      amount,
      description,
      lineItems,
      paymentMethodTypes,
      customerInfo,
      orderId,
    } = req.body;

    // Validate required fields
    if (!lineItems || !paymentMethodTypes) {
      return res.status(400).json({
        success: false,
        message: "Line items and payment method types are required",
      });
    }

    // Format line items for PayMongo and calculate total
    const formattedLineItems = lineItems.map((item) => {
      const itemAmount = Math.round(item.amount * 100); // Convert to centavos

      // PayMongo requires positive amounts
      if (itemAmount <= 0) {
        throw new Error(`Item "${item.name}" has invalid amount`);
      }

      // Convert relative image paths to absolute URLs
      // PayMongo requires full URLs, not relative paths
      // NOTE: PayMongo cannot access localhost URLs, so we skip images in development
      let formattedImages = [];
      if (item.images && item.images.length > 0) {
        formattedImages = item.images
          .map((img) => {
            // If already a full URL, use it as is
            if (img.startsWith("http://") || img.startsWith("https://")) {
              return img;
            }
            // Otherwise, construct full URL
            const baseUrl = process.env.BACKEND_URL || "http://localhost:5000";
            // Remove leading slash if present to avoid double slashes
            const cleanPath = img.startsWith("/") ? img.substring(1) : img;
            return `${baseUrl}/${cleanPath}`;
          })
          .filter((url) => {
            // Validate that it's a proper URL
            try {
              new URL(url);
              // Skip localhost URLs - PayMongo can't access them
              // Only include publicly accessible URLs
              if (url.includes("localhost") || url.includes("127.0.0.1")) {
                console.log(
                  `Skipping localhost image (PayMongo cannot access): ${url}`
                );
                return false;
              }
              return true;
            } catch {
              console.warn(`Invalid image URL skipped: ${url}`);
              return false;
            }
          });
      }

      return {
        name: item.name,
        quantity: item.quantity,
        amount: itemAmount,
        currency: "PHP",
        description: item.description || "",
        // Only include images if we have valid URLs, otherwise omit the field
        ...(formattedImages.length > 0 && {images: formattedImages}),
      };
    });

    // Calculate total amount from line items
    const totalAmount = formattedLineItems.reduce(
      (sum, item) => sum + item.amount * item.quantity,
      0
    );

    // Validate minimum total amount (2000 centavos = 20 PHP)
    if (totalAmount < 2000) {
      return res.status(400).json({
        success: false,
        message: "Total amount must be at least 20.00 PHP",
      });
    }

    // Build checkout session attributes
    const checkoutAttributes = {
      send_email_receipt: true,
      show_description: true,
      show_line_items: true,
      line_items: formattedLineItems,
      payment_method_types: paymentMethodTypes, // e.g., ['gcash', 'paymaya', 'grab_pay']
      description: description || "Tile Depot Order",
      statement_descriptor: "TILE DEPOT", // Shows on customer statements for GCash
      success_url: `http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${
        orderId || ""
      }`,
      cancel_url: `http://localhost:5173/payment/fail?session_id={CHECKOUT_SESSION_ID}&order_id=${
        orderId || ""
      }`,
    };

    // Add customer and billing info if provided (pre-fill customer data)
    if (customerInfo && customerInfo.name && customerInfo.email) {
      checkoutAttributes.billing = {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone || "",
      };
    }

    // Log the request for debugging
    console.log("Creating checkout session with:");
    console.log("Total amount (centavos):", totalAmount);
    console.log("Line items:", formattedLineItems.length);
    console.log("Payment methods:", paymentMethodTypes);
    console.log(
      "Full request:",
      JSON.stringify(
        {
          data: {attributes: checkoutAttributes},
        },
        null,
        2
      )
    );

    const response = await fetch(
      `${paymongoConfig.baseUrl}/checkout_sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getPaymongoAuthHeader(),
        },
        body: JSON.stringify({
          data: {
            attributes: checkoutAttributes,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo checkout session error:");
      console.error("Status:", response.status);
      console.error("Response:", JSON.stringify(data, null, 2));
      console.error(
        "Request payload:",
        JSON.stringify(
          {
            data: {attributes: checkoutAttributes},
          },
          null,
          2
        )
      );

      return res.status(response.status).json({
        success: false,
        message: "Failed to create checkout session",
        error: data.errors || data,
        details: data,
      });
    }

    res.json({
      success: true,
      data: data.data,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
      error: error.message,
    });
  }
};

// Get checkout session status
export const getCheckoutSessionStatus = async (req, res) => {
  try {
    const {id} = req.params;

    const response = await fetch(
      `${paymongoConfig.baseUrl}/checkout_sessions/${id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: getPaymongoAuthHeader(),
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo error:", data);
      return res.status(response.status).json({
        success: false,
        message: "Failed to get checkout session",
        error: data.errors || data,
      });
    }

    res.json({
      success: true,
      data: data.data,
    });
  } catch (error) {
    console.error("Error getting checkout session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get checkout session",
      error: error.message,
    });
  }
};

// Webhook handler for PayMongo events
export const handlePaymongoWebhook = async (req, res) => {
  try {
    const event = req.body;

    console.log("PayMongo webhook received:", event.data?.attributes?.type);

    // Handle different event types
    switch (event.data?.attributes?.type) {
      case "payment.paid":
        // Payment was successful
        console.log("Payment successful:", event.data);
        // Update order status in database if needed
        break;

      case "payment.failed":
        // Payment failed
        console.log("Payment failed:", event.data);
        break;

      case "source.chargeable":
        // Source is ready to be charged (for GCash/Maya)
        console.log("Source chargeable:", event.data);
        break;

      case "checkout_session.payment.paid":
        // Checkout session payment successful
        console.log("Checkout session payment successful:", event.data);
        break;

      default:
        console.log("Unhandled webhook event:", event.data?.attributes?.type);
    }

    // Always return 200 to acknowledge receipt
    res.json({success: true});
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).json({
      success: false,
      message: "Failed to handle webhook",
      error: error.message,
    });
  }
};
