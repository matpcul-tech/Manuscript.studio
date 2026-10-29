# Manuscript Studio store prep

Audit of the Capacitor 8 shell for App Store and Google Play. This file is the checklist. It does not submit the apps.

Bundle id: `com.sovereignshield.manuscriptstudio`
App name: Manuscript Studio
Shell: remote WebView at `https://manuscript-studio-os.vercel.app` (`capacitor.config.ts`, `cleartext: false`)

`npm run cap:sync`, `npm run cap:ios`, and `npm run cap:android` are already in `package.json`. They call the Capacitor 8 CLI (`@capacitor/cli`).

## Done in the repo

- Capacitor config matches the existing shell: app id, app name, SplashScreen, StatusBar, HTTPS `server.url`.
- `android/` and `ios/` native projects exist. Android `minSdkVersion` 24, `targetSdkVersion` 36, `versionCode` 1, `versionName` 1.0. iOS deployment target 15.0, marketing version 1.0, build 1, iPhone and iPad (`TARGETED_DEVICE_FAMILY` 1,2).
- Icons and splash screens were the Capacitor template art. `brand/` has no image files (only `brand/commercial-video-content.md`). Replaced the art with the in-app mark from `public/icons`: gradient `#4f6df5` to `#3a52d4`, white Playfair Display M.
  - Android mipmaps: `ic_launcher`, `ic_launcher_round`, adaptive foreground. Adaptive background color `#4F6DF5`.
  - iOS `AppIcon` 1024x1024, no transparency, square (Apple applies the mask).
  - Splash PNGs kept their existing pixel sizes and use the same blue field.
  - Upload copies: `store/app-store-icon-1024.png`, `store/play-icon-512.png`, `store/play-feature-graphic-1024x500.png`.
  - These are generated from the product mark. Swap in a designer export later if you want a different drawing. The feature graphic is a stand-in. Replace it with a real product image before production.
- Android `colors.xml` was missing while `styles.xml` referenced `colorPrimary`. Added brand colors so the resource link can succeed.
- Unused Capacitor robot / teal grid vectors under `res/drawable` and `res/drawable-v24` were replaced so they cannot be wired back in by mistake. The adaptive icon uses the mipmap PNGs.
- HTTPS only: `cleartext: false` was already set. Android now sets `usesCleartextTraffic="false"` and `res/xml/network_security_config.xml`. iOS `NSAppTransportSecurity` / `NSAllowsArbitraryLoads` is false (ATS stays on).
- iOS `ITSAppUsesNonExemptEncryption` is false. The app uses HTTPS only. No custom crypto showed up in app code (`crypto.randomUUID` in the EPUB builder is not an encryption feature).
- iOS `PrivacyInfo.xcprivacy` is in the app target. Tracking is off. Collected types match the product: email, user id, manuscript and voice-sample content, subscription state, and Vercel Web Analytics page views.
- Android backup is off so WebView session cookies are not copied into cloud backup.
- Release signing is ready to turn on. Copy `android/keystore.properties.example` to `android/keystore.properties` (gitignored). `*.jks` and `*.keystore` are gitignored. Without that file, `bundleRelease` still builds an unsigned release.
- Local iOS scheme changed from `Manuscript Studio` (a space is not a valid URL scheme) to `manuscriptstudio`. With `server.url` set, the WebView origin is still the HTTPS site. This is not a public deep link.

## Permissions

Camera, microphone, and photo library are not used.

The only file input is in the project editor. It accepts `.txt`, `.md`, `.docx`, and `.pdf` for voice-sample and manuscript import. That is a document picker, not the camera and not the photo library. Voice training is a text upload.

Android requests `INTERNET` only. iOS has no `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, or photo-library purpose strings. Do not add them unless a real feature starts using that hardware. Unused purpose strings become review questions.

## Deep links

Not configured, on purpose. No domain was invented here.

Domains that already appear in the repo and were reachable during this audit:

- `https://manuscript-studio-os.vercel.app` (Capacitor `server.url`)
- `https://manuscript-studio-os.com` (README and `brand/commercial-video-content.md`)

Both `/.well-known/apple-app-site-association` URLs returned 404. Both `/.well-known/assetlinks.json` URLs returned 404. `Info.plist` has no associated-domains entitlement and no `CFBundleURLTypes`. `AndroidManifest.xml` has the launcher intent only. `strings.xml` defines `custom_url_scheme` as `com.sovereignshield.manuscriptstudio`, and nothing registers it.

Add universal links and app links only after all of these exist:

- An Apple Team ID
- The Play app signing certificate SHA-256
- Hosted association files on a domain you control
- A decision about which host is canonical (`vercel.app` vs `manuscript-studio-os.com`)

## Store build mode (reader app)

Done. The native shell appends `ManuscriptStudioApp` to the WebView user agent (`appendUserAgent` in `capacitor.config.ts`). The site treats that request as a store build (`lib/storeBuildShared.ts`, `lib/storeBuild.ts`, `middleware.ts`):

- `/` (landing page with pricing) and `/billing` redirect to `/app`.
- `/api/stripe/checkout` and `/api/stripe/portal` return 403. The webhook is untouched.
- Billing nav becomes Account. Every Upgrade link and the Upgrade gate buttons render as plain text with no price and no link.
- Sign-in is unchanged, so a plan bought on the web applies in the app.
- `STORE_BUILD=1` (server) or `NEXT_PUBLIC_STORE_BUILD=1` (client) forces store mode for local testing.

Privacy policy: `/privacy`. Support: `/support`. Account deletion: `/account` (in app, signed in) and the public `/delete-account` page for the Play deletion URL. Deletion cancels any Stripe subscription, then deletes the auth user; data rows cascade.

The reader app approach means Play Billing and StoreKit are not required as long as the app never offers or links to a purchase. Steps 2 and 3 below are optional if you choose to sell in-app later.

## Billing

Pro ($19/month) and Studio ($39/month) are Stripe subscriptions on the web. Checkout is `app/billing/page.tsx` and `app/page.tsx` posting to `/api/stripe/checkout`, which redirects to a Stripe hosted page. The billing portal posts to `/api/stripe/portal`. Plan limits read the Supabase `subscriptions` row.

Apple requires in-app purchase for digital unlocks sold inside the iOS app. Google requires Play Billing for the same kind of unlock inside a Play app. Opening external Stripe checkout from the iOS app is likely to fail App Review. A link out to the website checkout, or the Stripe customer portal, has the same problem. Web subscribers can still sign in and use a plan that was bought on the website. The app must not send people to Stripe to buy or manage that plan.

This PR does not add StoreKit, Play Billing, or RevenueCat.

Phased approach:

1. Internal only. TestFlight internal testing, and the Play internal testing track. Use the WebView shell to check login, writing, and export. Do not send this build to App Review, external TestFlight, or a production Play release. Stripe buttons are still on the live site, and this shell loads that site.
2. Before any external or review build, hide web checkout and the Stripe portal inside the native shell. Sell Pro and Studio with StoreKit on iOS and Play Billing on Android (RevenueCat is a reasonable wrapper for both). Write the entitlement back to the same Supabase `subscriptions.plan` value so `lib/checkGenerationLimit.ts` keeps working. Keep Stripe for the website.
3. Create the subscription products in App Store Connect and Play Console, add Restore Purchases, and point in-app subscription management at the store. Then submit.

## Review risks to handle before submission

- The binary is a remote WebView. A web deploy changes what reviewers see, with no store review. Apple sometimes rejects shells that are only a website (guideline 4.2). The studio is a full editor, which is a stronger case, but you should be ready to explain that. If `manuscript-studio-os.vercel.app` is down, the app has no bundled offline UI.
- Google sign-in uses Supabase OAuth inside the page (`app/login/page.tsx`). Google often blocks OAuth in embedded WebViews (`disallowed_useragent`). Email and password sign-in is the path to test in the shell. Move Google sign-in to the system browser before you depend on it in a store build.
- Account creation exists (email signup on `/login`). No in-app account deletion was found. Apple and Google both require a way to delete an account from inside the app when the app lets people create one. Add that on the website before review. The shell will pick it up because it loads the site.
- There is no privacy or support page in `app/`. `https://manuscript-studio-os.vercel.app/privacy` returned 404 during this audit. Both stores require a public privacy policy URL. App Store Connect also requires a support URL.

## Data to declare

Match App Store nutrition labels and the Play Data safety form to this list. Confirm it again on submission day.

| Data | Where it shows up | Linked to the user | Tracking |
| --- | --- | --- | --- |
| Email | Supabase auth, signup and sign-in | Yes | No |
| User id | Supabase account | Yes | No |
| Manuscripts, voice samples, project JSON | Supabase project storage | Yes | No |
| Subscription plan and period | Supabase `subscriptions`, Stripe on the web | Yes | No |
| Page views | `@vercel/analytics` in `app/layout.tsx` | No | No |

Generation requests go to Anthropic through `/api/engine`. The README states manuscripts are not used to train models. Say that in the privacy policy only if it is still true for your Anthropic account settings.

Do not declare camera, microphone, photos, or location.

## Human steps

1. Enroll in the Apple Developer Program. Register the bundle id `com.sovereignshield.manuscriptstudio`.
2. Register a Google Play Console developer account (one-time $25 fee). Create the app with the same application id.
3. Publish a privacy policy URL and a support URL over HTTPS. Paste them into both consoles.
4. Add account deletion on the site, then confirm it is reachable after sign-in inside the shell.
5. In Xcode (`npm run cap:ios`), set the Team, archive, and upload with Xcode or Transporter. Use an Xcode version App Store Connect currently accepts. Confirm the required iOS SDK on submission day. Capture iPhone and iPad screenshots, because the target includes both. Drop iPad from `TARGETED_DEVICE_FAMILY` first if you do not want an iPad app.
6. Create an upload keystore and do not commit it:

   ```bash
   keytool -genkeypair -v -keystore android/release.keystore -alias manuscriptstudio -keyalg RSA -keysize 2048 -validity 10000
   cp android/keystore.properties.example android/keystore.properties
   ```

   Fill the passwords, build a signed AAB (`./gradlew bundleRelease` from `android/`, or Android Studio), enroll in Play App Signing, and upload the AAB. Confirm Play's required target API on submission day. This project already targets API 36.
7. Upload `store/play-icon-512.png` (replace if you commission a final icon), at least two phone screenshots, and a 1024x500 feature graphic. The file in `store/` is a stand-in.
8. Complete age rating, AI-content questions (the app generates prose), export compliance (already answered in Info.plist as exempt), nutrition labels, and the Data safety form.
9. Follow the billing phases above. Internal TestFlight and Play internal testing first. StoreKit and Play Billing before App Review or production.
10. Bump Android `versionCode` and iOS `CURRENT_PROJECT_VERSION` together on every upload. Marketing version is 1.0 on both until you choose otherwise.
