# Indian Railway PNR Validator & DFA Visualizer
Pure HTML/CSS/JS. No build step.

## Run
Double-click `index.html`.

## Deploy (free)
- Netlify: drag this folder onto https://app.netlify.com/drop
- GitHub Pages: push files to a repo -> Settings -> Pages -> deploy from main / root
- Vercel: `vercel` in this folder, or import the repo

## DFA rule
Accepts exactly 10 digits with a non-zero first digit. States q0..q10 (q10 final) + dead state qd.
