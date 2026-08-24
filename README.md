<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c886b07f-e174-43b3-be03-d7ec7842b9bd

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`













Your actual product is now clear

The architecture should revolve around this:

                 LANDTERRA
                     |
        ┌────────────┴────────────┐
        |                         |
    FIND LAND                 SELL LAND
        |                         |
 Browse/Search                Login/Signup
 Filter                         |
        |                    Phone OTP
 Property Details                |
        |                    Listing Form
 Save / Contact                  |
        |                    Asking Price
     Inquiry                     |
                             Negotiable
                                 |
                         Google Maps Link
                                 |
                          Images/Documents
                                 |
                         Optional Survey ID
                                 |
                     ₹10 × sq. yards / 30 days
                                 |
                              Razorpay
                                 |
                         Payment Verification
                                 |
                    ┌────────────┴────────────┐
                    |                         |
               Verification              Subscription
                    |                         |
                  Admin                    Active
                    |                         |
             Verified/Rejected          30 days
                                              |
                                  ┌───────────┴───────────┐
                                  |                       |
                                Renew                   Expire
                                  |                       |
                              New 30 days            Draft/Expired
                                                          |
                                                        Renew

And separately:

yourdomain.com
        |
   CUSTOMER SITE
        |
   Browse / Find / Sell
        |
   Customer Profile


yourdomain.com/admin
        |
   ADMIN ONLY
        |
 Dashboard
 Users
 Properties
 Verification
 Payments
 Subscriptions
 Reports
 Audit Logs
 Settings