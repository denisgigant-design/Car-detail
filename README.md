# COOL IDEA — scroll-controlled car wash

A responsive, cinematic website demo that transforms a dirty car into a freshly detailed car as visitors scroll.

## How to run it

Open `index.html` in Chrome, Safari, or Firefox. No Node, build step, API key, database or hosting subscription is needed. Scroll through the opening sequence; the car moves through **dirty → foam → rinse → clean**. Use the draggable before/after comparison near the bottom.

## Publish to GitHub Pages

1. On https://github.com/new, create a **public** repository named `cool-idea`. (The display name can be "Cool Idea"; GitHub repository slugs use dashes.)
2. Upload the **contents of this folder**—`index.html`, `style.css`, `script.js`, and the `assets` folder—directly into the repository root. Do **not** upload the zip itself instead of its contents.
3. Commit the files to the `main` branch.
4. Open your GitHub repository → **Settings** → **Pages** → **Build and deployment** → **Deploy from a branch**, select `main` and `/ (root)`, and Save.
5. Your eventual page address will normally be `https://YOUR_USERNAME.github.io/cool-idea/`. Confirm the actual live URL in GitHub Pages after publication.

## How the effect works

The first section is 500 viewport-heights long on desktop (440 on mobile). Its full-screen scene uses `position: sticky`; a JavaScript requestAnimationFrame loop measures where the user is within that section. On desktop it seeks a locally included 7.8-second silent MP4. On small screens and unsupported browsers it blends four images; this avoids frame-seeking stutter on mobile. Text, mist effects, step indicators and the progress bar are also synchronized with scroll.

The `assets/wash-sequence.mp4` is an original animated sequence assembled from generated images. **It is not documentary live-action footage**. The four stages were generated together to reduce image drift between phases. They are indicative concept imagery; small changes in the car between stages may be visible. The demo does not claim that a real client's car was washed.

## Free *live-action* footage sources to replace the generated sequence

- Pexels: https://www.pexels.com/video/a-person-car-washing-6872065/ (14-second clip of foam and brush)
- Pexels: https://www.pexels.com/video/man-doing-a-car-wash-4849141/ (8-second outdoor car wash)
- Pexels licensing: https://www.pexels.com/legal-pages/license/
- Pixabay: https://pixabay.com/videos/car-wash-washing-water-drops-wet-5644/

Pexels and Pixabay state that their content is free to use, subject to their respective licence restrictions. Verify the specific file and its current licence before downloading or redistributing it. These sources are **not embedded or re-hosted** in this package. Most stock clips show washing but will not match the dirty/clean hero car exactly. For a perfect morph you need the same camera position and car across all keyframes.

To replace the MP4, put your own video at `assets/wash-sequence.mp4` (H.264 video, no audio, with `+faststart`); desktop scrolling will scrub through it. The generated image fallback can be replaced with the same car's 4 extracted video frames if you want the transitions to match.

## Files

- `index.html` — accessible page structure
- `style.css` — responsive layout, color, typography and motion
- `script.js` — scroll synchronization and before/after slider
- `assets/{dirty,foam,rinse,clean}.webp` — optimized stills used by the live page
- `assets/{dirty,foam,rinse,clean}.jpg` — source images used for the MP4
- `assets/wash-sequence.mp4` — local scroll-scrubbable video

Built as a standalone concept and not an operational car wash/booking service. All text is placeholder promotional copy for the demo.
