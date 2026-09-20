# VisualForce website direction

Implemented in `index.html`: paper details, method figure, embedded force-search explainer, task picker with paired playback, measured results, and manuscript citation. The standalone prototype remains available at `force-demo.html`.

## Hardware attribution

The Fin Ray gripper is an existing design, not a hardware contribution of this work. Describe the work as using a Fin Ray gripper; the contribution is visual force estimation and force-guided policy action selection.

## Main story

**Use the gripper's visible deformation to learn force-aware action selection.**

The supplied paper is titled *Robot Learning with Visual Predicted Force*. Retain VisualForce as a short project name, but use the paper title, authors, and affiliations from the PDF rather than the current placeholder title. The current references to depth and language should be removed: the method uses wrist RGB, side RGB, and proprioception.

Suggested one-sentence introduction:

> Learn force from a compliant gripper's visible deformation, then use predicted force to choose robot actions—without dedicated force or tactile sensors at deployment.

Reference force sensors are used for calibration. The visual estimator labels demonstrations; the policy jointly generates actions and forces at deployment. It is not an online visual-force feedback controller and does not query the visual estimator to score candidate actions.

## What to borrow

- [B-spline Policy](https://b-spline-policy.github.io/): a concise introduction, a concrete motivating comparison, a manipulable explanation of the central idea, and grouped experiment playback. Apply this to force-based candidate selection rather than trajectory speed.
- [PointWorld](https://point-world.github.io/): an explicit input/output explanation, selectable recorded examples, and a clear relationship between observations and predictions. Apply this to task selection and, when recorded data is available, wrist imagery, force predictions, and the chosen action.

The current presentation follows the references' minimal academic style: white background, sans-serif typography, centered paper title and authors, PointWorld’s dark red accent (`#8c1515`) for titles, links, and resource buttons, a wide teaser, and the abstract near the top. Sections use thin rules rather than tinted bands or cards. Results use a compact paper-style table. The interactive plot uses blue for policy candidates, green for the selected candidate, and gray for the baseline. Text colors use darker versions of the figure colors for legibility.

## Proposed page sequence

1. **Compact project header.** VisualForce, the actual paper title, verified author/affiliation list, and the paper link. Add other resources when available.
2. **Immediate visual evidence.** A strong real rollout and the one-sentence explanation. Berry or can handling foregrounds why force matters; the charging clip can serve as an additional teaser. Avoid a tall decorative hero that pushes robot footage below the fold.
3. **Why force matters.** Too little grip can allow slipping; excessive grip can damage fragile objects. Explain that reorientation and insertion require appropriate friction too. The objective is matching a task target, not always minimizing force.
4. **Method in three stages.** Calibrate visual force estimation → label demonstrations and train the joint policy → sample 32 action–force pairs and select the nearest target force. Figure 2 supplies the visual basis. Separate training and deployment explicitly.
5. **Interactive force search.** The standalone `force-demo.html` prototype implements the selection rule using illustrative values. A target slider moves a vertical marker, highlights the nearest candidate, and updates the selected action ID and force error. Drawing a baseline sample illustrates selection without consulting force. This is an explanation, not model inference.
6. **Task explorer.** Berry / Can / Reorientation / Plug buttons select paired videos, a brief task goal, the observed failure mode, and the reported success rates. Include play-both, pause-both, and replay controls. Do not describe differently accelerated videos as synchronized physical-time comparisons. Preserve captions without individual speed labels and the existing playback note. Both clips in the original video pair were visually checked and show plate reorientation.
7. **Quantitative evidence.** Show the four success-rate comparisons, then visual force estimation versus motor current. Keep the abstract and more detailed method material available below the primary story.
8. **Scope and citation.** Mention task-specific demonstration targets, axial-force estimation, and absence of online force-feedback correction. Use verified citation metadata; the PDF does not establish an arXiv ID or publication venue.

## Results to use

Source: supplied `static/papers/paper.pdf`, Figures 4–5 and Sections IV–V.

| Task | Single sample | Force search |
| --- | ---: | ---: |
| Empty-can grasping | 46.7% | 86.7% |
| Berry picking | 0.0% | 73.3% |
| In-hand reorientation | 6.7% | 46.7% |
| Plug insertion | 26.7% | 73.3% |

Each method uses the same policy checkpoint; 15 trials per task. Force search uses 32 samples. Avoid implying a larger evaluation or a guaranteed outcome from a particular slider value.

Visual-force estimation: mean episode MAE **0.91 N**, versus **4.20 N** for the motor-current baseline. Evaluation uses three held-out episodes, 442 frames, with equal episode weighting. Keep these metrics separate from policy success rates.

Figure 8 reports a held-out can observation with 32 predictions spanning 4.45–6.36 N and a selected force of 4.45 N. It does not provide the complete candidate list, action trajectories, or an explicit numeric target. Do not recreate those missing data as measured values.

## Recorded-data demo: next inputs

For one or more observations, export:

- Wrist and side RGB frames, plus the segmented/Sobel gripper view if available.
- The actual 32 action–force candidates, with stable IDs and force units.
- The original task target and selected candidate ID.
- Action trajectories and robot/camera coordinate conventions if spatial visualization is desired.
- Timestamp-aligned measured/reference and predicted force series for a force-estimation viewer.

A JSON bundle can support a browser-only recorded example viewer. The current MP4s and paper support a video explorer and algorithm explainer; arbitrary-image force prediction would additionally require model weights, preprocessing, and an inference runtime or backend.

## Media preparation

The nine HEVC source recordings are preserved. The page uses H.264/AAC copies with fast-start metadata and poster frames, generated by `scripts/prepare-media.py`. Browser video copies total approximately 16.3 MB. Only the selected task pair loads; playback is user-controlled, and reduced-motion preferences disable smooth scrolling. The berry baseline is approximately 23 seconds, so do not advertise all clips as ten-second examples.

## Paper source repository

The sibling `visual_force_paper` repository is the authoring source. Its `arxiv.pdf` is byte-identical to the website's `static/papers/paper.pdf`; the corresponding text is in `arxiv.tex`. Original figures are in `figures/`. The source also includes `figures/force_distribution.csv` with recorded force candidates, the target, and selection flags, as well as force trajectory and parity data. These are available for a future recorded-data viewer; the current explainer still uses explicitly illustrative samples.
