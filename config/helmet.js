import helmet from "helmet";

// Basic security settings for your app
const helmetOptions = {
  // Prevents clickjacking attacks (stops your site being put in frames)
  frameguard: {action: "deny"},

  // Prevents MIME type sniffing attacks
  noSniff: true,

  // Prevents XSS attacks in older browsers
  xssFilter: true,

  // Controls what resources your page can load
  contentSecurityPolicy: {
    directives: {
      // Where scripts can come from
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],

      // Where stylesheets can come from
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],

      // Where fonts can come from
      fontSrc: ["'self'", "https://fonts.gstatic.com"],

      // Where images can come from
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "http:",
        "blob:",
        "http://localhost:*",
        "http://127.0.0.1:*",
      ],

      // Default policy for everything else
      defaultSrc: ["'self'"],
    },
  },

  // Force HTTPS in production (comment out for development)
  // hsts: {
  //     maxAge: 31536000, // 1 year
  //     includeSubDomains: true
  // },
};

// Export the helmet configuration
export default helmet(helmetOptions);

/*
WHAT HELMET DOES:
- Protects against common web attacks
- Sets security headers automatically
- Prevents malicious code injection
- Stops your site from being embedded in frames

HOW TO USE:
1. In your Express app (use BEFORE other middleware):
   import helmetConfig from './this-file.js';
   app.use(helmetConfig);

COMMON ISSUES:
- If your CSS doesn't load: add the domain to styleSrc
- If images don't show: add the domain to imgSrc
- If scripts don't work: add the domain to scriptSrc

EXAMPLE - Adding a new CDN:
scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"]
*/
