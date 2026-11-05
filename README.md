# Insert

The static landing page for [Insert](https://github.com/KenWuqianghao/Insert), a native clipboard tray for macOS.

Production: https://insert-app.vercel.app

## Local Preview

```sh
npx serve -l 4173 .
```

Open `http://localhost:4173`. Use a server that supports byte ranges. Without byte ranges, the browser cannot seek in the demo video.

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
