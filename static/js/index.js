(() => {
  const tasks = {
    berry: { title: 'Berry picking', description: 'Grasp and transfer a berry without crushing it.', baseline: '0.0%', ours: '73.3%', failure: 'Failure mode: excessive grip crushes the berry.', goal: 'Goal: a stable grasp that leaves the berry intact.' },
    can: { title: 'Empty-can grasping', description: 'Lift and transfer a thin-walled can without denting it.', baseline: '46.7%', ours: '86.7%', failure: 'Failure mode: excessive force dents the can.', goal: 'Goal: enough grip to transfer the can without damage.' },
    reorientation: { title: 'In-hand reorientation', description: 'Pivot a metal plate upright while maintaining contact with the table.', baseline: '6.7%', ours: '46.7%', failure: 'Failure mode: the plate does not reorient upright.', goal: 'Goal: maintain contact as the plate pivots upright.' },
    plug: { title: 'Plug insertion', description: 'Keep a secure grip on the plug while inserting it into the socket.', baseline: '26.7%', ours: '73.3%', failure: 'Failure mode: the plug slips within the gripper.', goal: 'Goal: sufficient grip to fully insert the plug.' }
  };
  const videos = [document.querySelector('#baseline-video'), document.querySelector('#ours-video')];
  const status = document.querySelector('#playback-status');
  let requestId = 0;
  let currentTask = 'plug';
  const setText = (id, value) => { document.getElementById(id).textContent = value; };
  function pause() {
    requestId += 1;
    videos.forEach(video => video.pause());
  }
  function selectTask(task) {
    if (task === currentTask) return;
    pause();
    currentTask = task;
    const data = tasks[task];
    document.querySelectorAll('[data-task]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.task === task)));
    setText('task-title', data.title);
    setText('task-description', data.description);
    setText('baseline-rate', `${data.baseline} success`);
    setText('ours-rate', `${data.ours} success`);
    setText('baseline-behavior', data.failure);
    setText('ours-behavior', data.goal);
    videos.forEach((video, index) => {
      const method = index === 0 ? 'baseline' : 'ours';
      const src = `static/videos/web/${task}-${method}.mp4`;
      video.poster = `static/images/tasks/${task}-${method}.jpg`;
      video.querySelector('source').src = src;
      document.getElementById(`${method}-download`).href = src;
      video.load();
    });
    status.textContent = `${data.title} selected. Press Play both to watch.`;
  }
  async function playBoth(restart = false) {
    const id = ++requestId;
    status.textContent = 'Loading videos…';
    if (restart) videos.forEach(video => { video.currentTime = 0; });
    const outcomes = await Promise.allSettled(videos.map(video => video.play()));
    if (id !== requestId) return;
    if (outcomes.some(outcome => outcome.status === 'rejected')) {
      videos.forEach(video => video.pause());
      status.textContent = 'Playback could not start. Try each player’s controls or download the videos using the arrows below them.';
    } else {
      status.textContent = 'Both videos are playing. Playback durations may differ.';
    }
  }
  document.querySelectorAll('[data-task]').forEach(button => button.addEventListener('click', () => selectTask(button.dataset.task)));
  document.getElementById('play-both').addEventListener('click', () => playBoth());
  document.getElementById('pause-both').addEventListener('click', () => { pause(); status.textContent = 'Both videos paused.'; });
  document.getElementById('replay-both').addEventListener('click', () => playBoth(true));
  videos.forEach(video => {
    const showError = () => { status.textContent = 'A video could not load. Download it using the arrow below its player.'; };
    video.addEventListener('error', showError);
    video.querySelector('source').addEventListener('error', showError);
    video.addEventListener('ended', () => {
      if (videos.every(item => item.ended)) status.textContent = 'Both videos have finished. Press Replay to watch again.';
    });
  });
  const copy = document.querySelector('.copy-button');
  copy.addEventListener('click', async () => {
    const target = document.querySelector(copy.dataset.copyTarget);
    try {
      await navigator.clipboard.writeText(target.textContent.trim());
      copy.textContent = 'Copied';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(target);
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(range);
      copy.textContent = 'Selected — copy with your keyboard';
    }
    window.setTimeout(() => { copy.textContent = 'Copy BibTeX'; }, 2000);
  });
})();
