// Update API_URL after deploying to Render
const SONGS_URL = 'https://raw.githubusercontent.com/vickyonearth/freetune/main/songs.json';
const API_URL   = 'https://freetune-api.onrender.com';

// ── State ──────────────────────────────────────
let allSongs    = [];
let filtered    = [];
let currentIdx  = -1;
let isPlaying   = false;

// ── Elements ───────────────────────────────────
const audio         = document.getElementById('audioPlayer');
const songList      = document.getElementById('songList');
const emptyState    = document.getElementById('emptyState');
const songCount     = document.getElementById('songCount');
const searchInput   = document.getElementById('searchInput');
const nowTitle      = document.getElementById('nowTitle');
const nowArtist     = document.getElementById('nowArtist');
const albumArt      = document.getElementById('albumArt');
const progressFill  = document.getElementById('progressFill');
const progressThumb = document.getElementById('progressThumb');
const progressTrack = document.getElementById('progressTrack');
const timeCurrent   = document.getElementById('timeCurrent');
const timeTotal     = document.getElementById('timeTotal');
const btnPlay       = document.getElementById('btnPlay');
const btnPrev       = document.getElementById('btnPrev');
const btnNext       = document.getElementById('btnNext');
const iconPlay      = document.getElementById('iconPlay');
const iconPause     = document.getElementById('iconPause');
const volumeRange   = document.getElementById('volumeRange');
const volumeFill    = document.getElementById('volumeFill');

// Upload modal
const openUpload    = document.getElementById('openUpload');
const closeUpload   = document.getElementById('closeUpload');
const modalBackdrop = document.getElementById('modalBackdrop');
const uploadTitle   = document.getElementById('uploadTitle');
const uploadArtist  = document.getElementById('uploadArtist');
const uploadFile    = document.getElementById('uploadFile');
const fileDrop      = document.getElementById('fileDrop');
const fileDropText  = document.getElementById('fileDropText');
const uploadApiKey  = document.getElementById('uploadApiKey');
const uploadSubmit  = document.getElementById('uploadSubmit');
const uploadFeedback= document.getElementById('uploadFeedback');
const submitLabel   = document.getElementById('submitLabel');
const submitSpinner = document.getElementById('submitSpinner');

// ── Init ───────────────────────────────────────
(async function init() {
  audio.volume = 0.8;
  restoreApiKey();
  await loadSongs();
  setupListeners();
})();

// ── Load songs ─────────────────────────────────
async function loadSongs() {
  try {
    const res = await fetch(`${SONGS_URL}?t=${Date.now()}`);
    allSongs = await res.json();
  } catch {
    allSongs = [];
  }
  filtered = [...allSongs];
  renderList(filtered);
}

// ── Render song list ───────────────────────────
function renderList(songs) {
  songCount.textContent = `${allSongs.length} song${allSongs.length !== 1 ? 's' : ''}`;

  const items = songList.querySelectorAll('.song-item');
  items.forEach(el => el.remove());

  if (songs.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  songs.forEach(song => {
    const globalIdx = allSongs.findIndex(s => s.id === song.id);
    const item = document.createElement('div');
    item.className = 'song-item';
    item.dataset.id = song.id;

    if (globalIdx === currentIdx) {
      item.classList.add('active');
      if (isPlaying) item.classList.add('playing');
    }

    item.innerHTML = `
      <div class="song-thumb">
        <span>♪</span>
        <div class="song-bars"><span></span><span></span><span></span></div>
      </div>
      <div class="song-item-info">
        <div class="song-item-title">${escape(song.title)}</div>
        <div class="song-item-artist">${escape(song.artist)}</div>
      </div>`;

    item.addEventListener('click', () => playSong(globalIdx));
    songList.appendChild(item);
  });
}

function escape(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Playback ───────────────────────────────────
function playSong(idx) {
  if (idx < 0 || idx >= allSongs.length) return;
  currentIdx = idx;
  const song = allSongs[idx];

  audio.src = song.url;
  audio.play();
  isPlaying = true;

  nowTitle.textContent  = song.title;
  nowArtist.textContent = song.artist;
  albumArt.classList.add('playing');

  updatePlayIcon();
  renderList(filtered);
}

function togglePlay() {
  if (currentIdx === -1) return;
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    albumArt.classList.remove('playing');
  } else {
    audio.play();
    isPlaying = true;
    albumArt.classList.add('playing');
  }
  updatePlayIcon();
  renderList(filtered);
}

function playPrev() {
  if (currentIdx > 0) playSong(currentIdx - 1);
}

function playNext() {
  if (currentIdx < allSongs.length - 1) playSong(currentIdx + 1);
}

function updatePlayIcon() {
  iconPlay.style.display  = isPlaying ? 'none' : 'block';
  iconPause.style.display = isPlaying ? 'block' : 'none';
}

// ── Progress bar ───────────────────────────────
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = `${pct}%`;
  progressThumb.style.left = `${pct}%`;
  timeCurrent.textContent = fmt(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  timeTotal.textContent = fmt(audio.duration);
});

audio.addEventListener('ended', playNext);

progressTrack.addEventListener('click', e => {
  const rect = progressTrack.getBoundingClientRect();
  const pct  = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
});

function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Volume ─────────────────────────────────────
volumeRange.addEventListener('input', () => {
  audio.volume = volumeRange.value / 100;
  volumeFill.style.width = `${volumeRange.value}%`;
});

// ── Search ─────────────────────────────────────
searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim();
  filtered = q
    ? allSongs.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q))
    : [...allSongs];
  renderList(filtered);
});

// ── Controls ───────────────────────────────────
btnPlay.addEventListener('click', togglePlay);
btnPrev.addEventListener('click', playPrev);
btnNext.addEventListener('click', playNext);

// ── Upload modal ───────────────────────────────
openUpload.addEventListener('click', () => {
  clearFeedback();
  modalBackdrop.classList.add('open');
});

closeUpload.addEventListener('click', closeModal);

modalBackdrop.addEventListener('click', e => {
  if (e.target === modalBackdrop) closeModal();
});

function closeModal() {
  modalBackdrop.classList.remove('open');
}

// File drop zone
fileDrop.addEventListener('click', () => uploadFile.click());

uploadFile.addEventListener('change', () => {
  const f = uploadFile.files[0];
  if (f) {
    fileDropText.textContent = f.name;
    fileDrop.classList.add('has-file');
  }
});

fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.classList.add('dragover'); });
fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('dragover'));
fileDrop.addEventListener('drop', e => {
  e.preventDefault();
  fileDrop.classList.remove('dragover');
  const f = e.dataTransfer.files[0];
  if (f && f.type === 'audio/mpeg') {
    uploadFile.files = e.dataTransfer.files;
    fileDropText.textContent = f.name;
    fileDrop.classList.add('has-file');
  }
});

// Upload submit
uploadSubmit.addEventListener('click', async () => {
  const title  = uploadTitle.value.trim();
  const artist = uploadArtist.value.trim();
  const file   = uploadFile.files[0];
  const apiKey = uploadApiKey.value.trim();

  if (!title || !artist || !file || !apiKey) {
    showFeedback('error', 'All fields are required.');
    return;
  }

  saveApiKey(apiKey);
  setUploading(true);
  clearFeedback();

  try {
    const form = new FormData();
    form.append('title', title);
    form.append('artist', artist);
    form.append('file', file);

    const res = await fetch(`${API_URL}/api/songs`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: form,
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    showFeedback('success', `"${title}" uploaded successfully!`);
    uploadTitle.value  = '';
    uploadArtist.value = '';
    uploadFile.value   = '';
    fileDropText.textContent = 'Drop MP3 here or click to browse';
    fileDrop.classList.remove('has-file');

    await loadSongs();
  } catch (err) {
    showFeedback('error', err.message);
  } finally {
    setUploading(false);
  }
});

function setUploading(loading) {
  uploadSubmit.disabled   = loading;
  submitLabel.style.display   = loading ? 'none'   : 'inline';
  submitSpinner.style.display = loading ? 'inline' : 'none';
}

function showFeedback(type, msg) {
  uploadFeedback.className = `upload-feedback ${type}`;
  uploadFeedback.textContent = msg;
}

function clearFeedback() {
  uploadFeedback.className = 'upload-feedback';
  uploadFeedback.textContent = '';
}

// ── API key persistence ────────────────────────
function saveApiKey(key) {
  localStorage.setItem('freetune_api_key', key);
}

function restoreApiKey() {
  const saved = localStorage.getItem('freetune_api_key');
  if (saved) uploadApiKey.value = saved;
}
