"""Align the paper's force samples with the supplied wrist-camera recording.

Requires ffmpeg, ffprobe, and Python packages joblib and numpy.
Run from any directory; data.pkl and wrist_image.mp4 are preserved unchanged.
"""

import json
import math
from fractions import Fraction
from pathlib import Path
import subprocess

import joblib

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "static/data/force-trajectory.json"
VIDEO = ROOT / "static/videos/web/wrist-image.mp4"
POSTER = ROOT / "static/images/tasks/wrist-image.jpg"


def main():
    recording = joblib.load(ROOT / "data.pkl")
    timestamps = recording["timestamps"]
    data = json.loads(DATA.read_text())
    samples = data["samples"]
    if len(timestamps) != len(recording["observations"]) or len(samples) > len(timestamps):
        raise ValueError("The recording must contain one observation per timestamp.")
    if any(not math.isfinite(t) for t in timestamps) or any(
        b <= a for a, b in zip(timestamps, timestamps[1:])
    ):
        raise ValueError("Recording timestamps must be finite and increasing.")

    # Match the complete sequence of relative timestamps, including its jitter.
    matches = []
    for start in range(len(timestamps) - len(samples) + 1):
        error = max(abs(timestamps[start + i] - timestamps[start] - sample["time"])
                    for i, sample in enumerate(samples))
        if error < 1e-6:
            matches.append((start, error))
    if len(matches) != 1:
        raise ValueError("Expected one exact timestamp match for the plotted sequence.")
    start, error = matches[0]
    end = start + len(samples)
    metadata = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
        "-show_entries", "stream=nb_read_frames,r_frame_rate,avg_frame_rate", "-of", "json",
        str(ROOT / "wrist_image.mp4"),
    ]))["streams"][0]
    fps = float(Fraction(metadata["r_frame_rate"]))
    if int(metadata["nb_read_frames"]) != len(timestamps) or (
        Fraction(metadata["r_frame_rate"]) != Fraction(metadata["avg_frame_rate"])
    ):
        raise ValueError("Expected a constant-rate video with one frame per observation.")

    VIDEO.parent.mkdir(parents=True, exist_ok=True)
    POSTER.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(ROOT / "wrist_image.mp4"),
        "-map", "0:v:0", "-vf", f"trim=start_frame={start}:end_frame={end},setpts=PTS-STARTPTS",
        "-an", "-r", str(fps), "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(VIDEO),
    ], check=True)
    exported = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
        "-show_entries", "stream=nb_read_frames", "-of", "json", str(VIDEO),
    ]))["streams"][0]
    if int(exported["nb_read_frames"]) != len(samples):
        raise ValueError("The exported clip must retain every matched frame.")
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(VIDEO),
        "-frames:v", "1", "-q:v", "3", str(POSTER),
    ], check=True)
    data["video"] = {
        "source": "wrist_image.mp4",
        "timestamps": "data.pkl",
        "src": str(VIDEO.relative_to(ROOT)),
        "firstSourceFrame": start,
        "lastSourceFrame": end - 1,
        "framesPerSecond": fps,
        "timestampMatchMaxErrorSeconds": error,
    }
    for i, sample in enumerate(samples):
        sample["videoTime"] = i / fps
    DATA.write_text(json.dumps(data, indent=2) + "\n")
    print(f"Aligned {len(samples)} samples to source frames {start}–{end - 1} at {fps:g} fps.")


if __name__ == "__main__":
    main()
