# VisualForce

Project page for **Robot Learning with Visual Predicted Force**. The page presents the paper's method, an interactive force-selection explainer, four task comparisons, and reported results. Design inspiration: [B-spline Policy](https://b-spline-policy.github.io/) and [PointWorld](https://point-world.github.io/).

## Local preview

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>. The site is static HTML/CSS/JavaScript; no build step is required.

## Content and interactions

- `index.html`: paper title, authors, abstract, method, force-search explainer, experiments, measured results, and manuscript citation.
- `static/js/index.js`: task data and paired playback controls. Update task descriptions and success rates here and in the initial HTML/results table together.
- `static/css/index.css`: shared academic styles for both pages. `force-demo.css` contains standalone page layout only.
- `gripper-demo.html`, `static/js/gripper-demo.js`, and `static/css/gripper-demo.css`: gripper bending illustration, also embedded before force search on the main page. The force slider and presets bend schematic Fin Ray fingers with diagonal ribs, dark contact pads, and white mounting brackets based on paper Figures 2–3. Loads and geometry are illustrative, not calibrated.
- `deformation-demo.html`: recorded measured/predicted force explorer using `static/data/force-trajectory.json`, also embedded below the homepage force-estimation accuracy metrics. The displayed sequence is distinguished from the three-episode aggregate MAE. All three traces (reference, visual estimate, and motor-current baseline) match the paper’s `force_trajectory.csv`. Synchronized wrist-camera frames are not yet available in this repository.
- `static/js/force-demo.js`: the selection-rule explainer, shared with the standalone `force-demo.html` prototype. Loads the 32 recorded Figure 8 candidates from `static/data/force-candidates.json`, exported from the paper’s `figures/force_distribution.csv`. The saved target is 3.04 N and the selected prediction is 4.45 N. Changing the target reselects from this fixed set; it does not simulate a rollout.

The experiment picker loads only the selected pair of videos. Videos start on user request. Changing tasks pauses the previous pair. Individual playback speeds are omitted from captions; a note explains that playback durations do not represent task completion times.

## Assets

- `static/papers/paper.pdf`: supplied manuscript, the source for paper content and results.
- `static/images/paper/method.svg`: Figure 2 exported from the original `visual_force_paper/figures/method.pdf`, preserving vector text and diagrams. The adjacent PDF is the full-size source linked from the image.
- `static/images/tasks/`: video poster frames.
- `static/videos/web/`: H.264/AAC, 1280×720 browser copies with fast-start metadata.
- `static/videos/berry/`, `can/`, `plug/`, `teaser/`: preserved source recordings.
- `static/videos/original/`: preserved original pair showing plate reorientation.

Regenerate browser videos and posters after replacing source recordings (requires `ffmpeg`):

```bash
python3 scripts/prepare-media.py
```

This rewrites generated browser assets while preserving source recordings and their encoded playback speeds. Source files are mapped at the top of the script. The webpage applies no additional speed changes.

Citation uses a manuscript entry because no publication venue or arXiv identifier is established by the supplied PDF.
