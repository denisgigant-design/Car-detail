# Greg's Details — QA and provenance

- Static HTML/CSS/JavaScript website. No framework or publishing.
- Media uses the user's original cinematic footage as the source; original master remains outside `site/` untouched.
- The four supporting stills were already generated in the earlier production package and are illustrative concepts, **not** real photographs of completed customer work. Their use on the website still needs the owner's visual sign-off.
- Supporting image files are high-quality WebP derivatives, not new AI generations.
- Navigation targets and local asset paths checked; JavaScript syntax checked with Node; ffprobe checked video metadata.
- Browser screenshot testing was attempted with Chromium and Playwright but the execution environment blocked local HTTP, file, and intercepted browser navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`. Therefore responsive screenshots, actual seek smoothness, and iPhone Safari behavior remain unverified.
- Check on an actual phone after hosting: scroll up/down through hero, rotate screen, reduced-motion setting, and video poster handoff. No deployment has been performed.
