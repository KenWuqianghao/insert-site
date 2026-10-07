# Insert

The static landing page for [Insert](https://github.com/KenWuqianghao/Insert), a native clipboard tray for macOS.

Production: https://insert-app.vercel.app

## Local Preview

```sh
npx serve -l 4173 .
```

Open `http://localhost:4173`. Use a server that supports byte ranges. Without byte ranges, the browser cannot seek in the demo video.

## Assets

The screenshots and the demo video come from `docs/assets` in the Insert repository. Run `make marketing-assets` there to make them again. Then copy `insert-demo.mp4` into `assets/` and convert the PNG files to WebP:

```sh
cwebp -q 82 -resize 1920 0 insert-tray.png -o assets/insert-tray.webp
cwebp -q 82 -resize 1920 0 insert-preview.png -o assets/insert-preview.webp
cwebp -q 90 insert-settings.png -o assets/insert-settings.webp
```

The step list next to the video uses the `data-at` times in `index.html`. If the video changes, update these times.

## Deploy

```sh
vercel --prod
```
