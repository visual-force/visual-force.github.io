# VisualForce

Project page for **Robot Learning with Visual Predicted Force**. The page opens with the complete narrated overview, followed by four task video comparisons, the interactive squeezing illustration, and a recorded-force explorer. Design inspiration: [B-spline Policy](https://b-spline-policy.github.io/) and [PointWorld](https://point-world.github.io/).

## Local preview

The research code is available at [visual-force/visual-force](https://github.com/visual-force/visual-force). Clone it with `git clone git@github.com:visual-force/visual-force.git`.

```bash
npx serve . -l 8000
```

Open <http://localhost:8000>. The site is static HTML/CSS/JavaScript; no build step is required. Use a server with HTTP Range support so the synchronized video can seek; Python’s basic `http.server` does not support video range requests.

## Content and interactions

- `index.html`: title, authors, teaser, four video comparisons with success rates, squeezing illustration, recorded force explorer, and manuscript citation.
- `static/js/index.js`: paired playback controls and viewport playback. Task descriptions and success rates live in `index.html`.
- `static/css/index.css`: shared academic styles for both pages. `force-demo.css` contains standalone page layout only.
- `gripper-demo.html`, `static/js/gripper-demo.js`, and `static/css/gripper-demo.css`: gripper bending illustration, also embedded between the teaser and task comparisons on the main page. The force slider and presets bend green outline fingers with four diagonal ribs, interpolating the exact vector shapes from slides 13–15 of `visualforce_teaser_video.pptx` (slides 16–17 reverse the sequence). The object position and size also match the slides. Loads and geometry are illustrative, not calibrated.
- `deformation-demo.html`: recorded measured/predicted force explorer using `static/data/force-trajectory.json`, also embedded after the homepage experiments. The wrist-camera video plays alongside the plot; playback, native video seeking, replay, and the time slider update the same sample and plot cursor. All three traces (reference, visual estimate, and motor-current baseline) retain the paper’s `force_trajectory.csv` values. Playback starts on request and pauses when the explorer leaves the viewport or the page is hidden.
- `static/js/force-demo.js`: the selection-rule explainer for the standalone `force-demo.html` prototype. Loads the 32 recorded Figure 8 candidates from `static/data/force-candidates.json`, exported from the paper’s `figures/force_distribution.csv`. The saved target is 3.04 N and the selected prediction is 4.45 N. Changing the target reselects from this fixed set; it does not simulate a rollout.

All four comparisons are visible without a task picker. Each pair starts muted on its first viewport entry and pauses when it leaves the viewport or the page is hidden. Reduced-motion preferences disable automatic playback. Each pair has Play both, Pause, and Replay controls; native video controls and download links also work without JavaScript. Videos use `preload="none"`. A note explains that playback durations do not represent task completion times.

## Assets

- `static/papers/paper.pdf`: supplied manuscript, the source for paper content and results.
- `static/images/paper/method.svg`: Figure 2 exported from the original `visual_force_paper/figures/method.pdf`, preserving vector text and diagrams. The adjacent PDF is the full-size source linked from the image.
- `static/images/tasks/`: video poster frames.
- `static/videos/teaser/visual_force_teaser.mp4`: final complete overview source; preserved unchanged locally and excluded from Git because of its size. Restore this source before regenerating teaser assets on another checkout. Its browser copy is `static/videos/web/teaser.mp4`, with a closing-montage poster. The overview plays on request with sound and native controls, without looping.
- `static/videos/web/`: browser copies with fast-start metadata. Task and overview videos use H.264/AAC at 1280×720; the silent wrist-camera clip retains its original 640×480 resolution.
- `static/videos/berry/`, `can/`, `plug/`, `teaser/`: preserved source recordings.
- `static/videos/reorientation/`: preserved source recordings for plate reorientation.
- `wrist_image.mp4` and local-only `data.pkl`: supplied wrist-camera recording and matching observation timestamps. `data.pkl` is excluded from Git; the site uses the exported JSON and video. The 188 video frames correspond to 188 observations. The paper’s 129 plotted samples match observation indices 58–186 by their relative timestamps (maximum discrepancy below 5 nanoseconds). `static/videos/web/wrist-image.mp4` contains exactly those frames at the original 10 fps; `static/images/tasks/wrist-image.jpg` is its first frame. Each force sample’s `videoTime` identifies its frame in the trimmed clip, while `time` preserves the original acquisition timing. No force values or video speeds are changed.

Regenerate browser videos and posters after replacing source recordings (requires `ffmpeg`):

```bash
python3 scripts/prepare-media.py
```

This rewrites generated browser assets while preserving source recordings and their encoded playback speeds. Source files are mapped at the top of the script. The webpage applies no additional speed changes.

Regenerate the synchronized wrist-camera clip, poster, and frame mapping separately (requires a local copy of `data.pkl` in the repository root, `ffmpeg`, `ffprobe`, and Python packages `joblib` and `numpy`):

```bash
python3 scripts/prepare-force-recording.py
```

The script matches the full sequence of force timestamps against `data.pkl` and checks that the source video has one frame per observation before exporting the matching segment. It preserves both source files and all three force traces.

The citation uses the arXiv BibTeX entry for [arXiv:2610.04741](https://arxiv.org/abs/2610.04741).
