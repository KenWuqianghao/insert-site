# Insert

The website for Insert, a native clipboard tray for macOS. The site is static, with one Vercel function that makes license keys.

Production: https://insert-app.vercel.app

## Local Preview

```sh
npx serve -l 4173 .
```

Open `http://localhost:4173`. Use a server that supports byte ranges. Without byte ranges, the browser cannot seek in the demo video.

## Purchases

1. The app and the site send buyers to `/buy`. `vercel.json` redirects `/buy` to the Stripe Payment Link. To change the link, edit the `destination` of the `/buy` redirect.
2. After payment, the Payment Link sends the buyer to `/thanks?session_id={CHECKOUT_SESSION_ID}`.
3. `thanks.html` calls `GET /api/license?session_id=cs_...`. The function reads the Checkout Session from Stripe and returns `{ "key", "email" }`.
4. The thanks page shows the key, a Copy button, and an "Activate Insert" button that opens `insert://activate?key=<key>`.

The function gives a key only when the session has `payment_status` `paid` and comes from the Payment Link in `STRIPE_PAYMENT_LINK_ID`. The same session always gives the same key. The function stores nothing.

| Status | Meaning |
|---|---|
| 200 | `{ "key": "INSERT1-...", "email": "..." }` |
| 400 | The `session_id` is missing or is not a Checkout Session id. |
| 404 | The session does not exist, is not paid, or comes from a different Payment Link. |
| 500 | An environment variable is missing or `LICENSE_SIGNING_KEY` is not a valid key. |
| 502 | Stripe returned an error other than 404. |

### Environment variables

Set these in the Vercel project for Production and Preview:

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | A Stripe restricted key with Read access to Checkout Sessions. |
| `STRIPE_PAYMENT_LINK_ID` | The id of the Payment Link, for example `plink_...`. |
| `LICENSE_SIGNING_KEY` | The Ed25519 private key as standard base64 of the PKCS8 DER. A copy is in the login Keychain: `security find-generic-password -s "Insert license signing key" -a insert -w`. |

You must not commit the signing key or print it in a log.

### Test the function locally

The function needs no packages. Call it from Node with a stub for `fetch`:

```sh
STRIPE_SECRET_KEY=rk_test_x STRIPE_PAYMENT_LINK_ID=plink_x \
LICENSE_SIGNING_KEY="$(security find-generic-password -s "Insert license signing key" -a insert -w)" \
node --input-type=module -e '
globalThis.fetch = async () => Response.json({ id: "cs_test_abc", payment_status: "paid", payment_link: "plink_x", created: 1793923200, customer_details: { email: "a@example.com" } });
const { default: api } = await import("./api/license.js");
const res = await api.fetch(new Request("http://localhost/api/license?session_id=cs_test_abc"));
console.log(res.status, await res.json());
'
```

To test with Stripe test mode, run `vercel dev` with the test-mode values of the three variables. Then buy through a test-mode Payment Link and open the thanks page that Stripe redirects to.

## Updates

`appcast.xml` is the Sparkle feed of the app: `https://insert-app.vercel.app/appcast.xml`. The release script in the Insert repository adds an item for each release. `vercel.json` serves the file as `application/rss+xml`.

## Assets

The screenshots and the demo video come from `docs/assets` in the Insert repository. Run `make marketing-assets` there to make them again. Then copy `insert-demo.mp4` into `assets/`, and copy `insert-tray.png`, `insert-preview.png`, and `insert-settings.png` into the root of this repository. Convert them, then delete the PNG copies:

```sh
cwebp -q 82 -resize 1920 0 insert-tray.png -o assets/insert-tray.webp
cwebp -q 82 -resize 1920 0 insert-preview.png -o assets/insert-preview.webp
cwebp -q 90 insert-settings.png -o assets/insert-settings.webp
magick insert-tray.png -resize 1200x -gravity south -crop 1200x630+0+0 +repage -quality 85 assets/insert-og.jpg
ffmpeg -i assets/insert-demo.mp4 -frames:v 1 -f image2 -c:v png - | cwebp -q 82 -o assets/insert-demo-poster.webp -- -
```

The step buttons under the video use the `data-at` times in `index.html`. The recorder writes the times of the steps to `build/marketing/insert-demo-chapters.json` in the Insert repository. If the video changes, copy these times into `data-at`.

## Deploy

```sh
vercel --prod
```
