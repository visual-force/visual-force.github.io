from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
pairs = [
 ('berry-baseline','berry/baseline.mp4'), ('berry-ours','berry/ours.mp4'),
 ('can-baseline','can/baseline.mp4'), ('can-ours','can/ours.mp4'),
 ('reorientation-baseline','reorientation/baseline.mp4'), ('reorientation-ours','reorientation/ours.mp4'),
 ('plug-baseline','plug/baseline.mp4'), ('plug-ours','plug/ours.mp4'),
 ('teaser','teaser/visual_force_teaser.mp4')]
for name, source in pairs:
    src = (ROOT / 'static/videos') / source
    out = (ROOT / 'static/videos/web') / (name + '.mp4')
    poster = (ROOT / 'static/images/tasks') / (name + '.jpg')
    out.parent.mkdir(parents=True, exist_ok=True)
    poster.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-ss','149' if name == 'teaser' else '0.5','-i',str(src),'-frames:v','1','-vf','scale=960:-2','-q:v','3',str(poster)],check=True)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(src),'-map','0:v:0','-map','0:a?','-vf','scale=1280:-2','-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-movflags','+faststart',str(out)],check=True)
    print(f'{name}: {out.stat().st_size / 1e6:.1f} MB',flush=True)
