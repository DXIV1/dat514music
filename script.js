let songs = [];
let currentSongIndex = 0;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 0;

let isDraggingVolume = false;
let isDraggingProgress = false;

const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const repeatBtn = document.getElementById('repeatBtn');
const shuffleBtn = document.getElementById('shuffleBtn');

const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const trackName = document.getElementById('trackName');
const trackArtist = document.getElementById('trackArtist');
const playlist = document.getElementById('playlist');
const vinyl = document.getElementById('vinyl');
const volumeSlider = document.getElementById('volumeSlider');
const volumeLevel = document.getElementById('volumeLevel');
const volumePercentage = document.getElementById('volumePercentage');
const muteBtn = document.getElementById('muteBtn');
const volumeIcon = document.getElementById('volumeIcon');
const trackCount = document.getElementById('trackCount');

async function loadSongs() {
    try {
        const response = await fetch('songs.json');
        if (!response.ok) throw new Error('Không tải được songs.json');

        songs = await response.json();

        if (songs.length === 0) {
            playlist.innerHTML = '<div class="error">Không có bài hát nào trong songs.json</div>';
            return;
        }

        trackCount.textContent = `${songs.length} tracks`;
        renderPlaylist();
        loadSong(0);

    } catch (error) {
        playlist.innerHTML = `<div class="error">Lỗi tải danh sách nhạc<br><small>${error.message}</small></div>`;
        console.error('Error loading songs:', error);
    }
}

function renderPlaylist() {
    playlist.innerHTML = songs.map((song, index) => `
        <div class="playlist-item" data-index="${index}">
            <div class="playlist-number">${(index + 1).toString().padStart(2, '0')}</div>
            <div class="playlist-info">
                <div class="playlist-title">${song.name}</div>
                <div class="playlist-meta" style="font-size: 13px; color: rgba(255, 255, 255, 0.4); margin-top: 4px;">${timeAgo(song.date)}</div>
            </div>
            <div class="playlist-actions">
                <button class="download-btn" data-index="${index}">
                    <svg viewBox="0 0 24 24">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    Download
                </button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.playlist-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.download-btn')) {
                const index = parseInt(item.dataset.index);
                playSong(index);
            }
        });
    });

    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            downloadSong(index);
        });
    });
}

function downloadSong(index) {
    const song = songs[index];
    if (confirm(`Bạn có muốn download track "${song.name}.mp3" không?`)) {
        const a = document.createElement('a');
        a.href = song.url;
        a.download = `${song.name}.mp3`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

function loadSong(index) {
    currentSongIndex = index;
    const song = songs[index];
    
    audio.src = song.url;
    
    trackName.textContent = song.name;
    trackArtist.textContent = `Track ${index + 1} of ${songs.length}`;
    
    updateActivePlaylistItem();
}

function updateActivePlaylistItem() {
    document.querySelectorAll('.playlist-item').forEach((item, index) => {
        item.classList.toggle('active', index === currentSongIndex);
    });
    
    const activeItem = document.querySelector('.playlist-item.active');
    if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function togglePlay() {
    if (isPlaying) {
        audio.pause();
        updatePlayButton(false);
    } else {
        audio.play().catch(err => {
            console.error('Error playing audio:', err);
        });
        updatePlayButton(true);
    }
    isPlaying = !isPlaying;
}

function updatePlayButton(playing) {
    if (playing) {
        playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
        vinyl.classList.add('playing');
    } else {
        playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
        vinyl.classList.remove('playing');
    }
}

function playSong(index) {
    loadSong(index);
    audio.play().catch(err => {
        console.error('Error playing audio:', err);
    });
    isPlaying = true;
    updatePlayButton(true);
}

function prevSong() {
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
    } else {
        if (isShuffle) {
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * songs.length);
            } while (newIndex === currentSongIndex && songs.length > 1);
            currentSongIndex = newIndex;
        } else {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        }
        playSong(currentSongIndex);
    }
}

function nextSong() {
    if (isShuffle) {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * songs.length);
        } while (newIndex === currentSongIndex && songs.length > 1);
        currentSongIndex = newIndex;
    } else {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
    }
    playSong(currentSongIndex);
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    updateShuffleButton();
}

function updateShuffleButton() {
    shuffleBtn.classList.toggle('active', isShuffle);
    shuffleBtn.title = isShuffle ? 'Shuffle On' : 'Shuffle Off';
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    updateRepeatButton();
}

function updateRepeatButton() {
    repeatBtn.classList.toggle('active', repeatMode !== 0);
    repeatBtn.classList.toggle('one', repeatMode === 2);
    repeatBtn.title = repeatMode === 0 ? 'Repeat Off' : repeatMode === 1 ? 'Repeat All' : 'Repeat One';
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        return interval === 1 ? "1 year ago" : interval + " years ago";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return interval === 1 ? "1 month ago" : interval + " months ago";
    }
    interval = Math.floor(seconds / 604800);
    if (interval >= 1) {
        return interval === 1 ? "1 week ago" : interval + " weeks ago";
    }
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return interval === 1 ? "1 day ago" : interval + " days ago";
    }
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return interval === 1 ? "1 hour ago" : interval + " hours ago";
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return interval === 1 ? "1 minute ago" : interval + " minutes ago";
    }
    return Math.floor(seconds) <= 1 ? "1 second ago" : Math.floor(seconds) + " seconds ago";
}

function updateProgress() {
    if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progress.style.width = `${percent}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        durationEl.textContent = formatTime(audio.duration);
    }
}

function seek(e) {
    const rect = progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = percent * audio.duration;
}

function updateVolumeDisplay(volume) {
    volumeLevel.style.width = `${volume * 100}%`;
    volumePercentage.textContent = `${Math.round(volume * 100)}%`;
    
    if (volume === 0) {
        volumeIcon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
    } else if (volume < 0.5) {
        volumeIcon.innerHTML = '<path d="M7 9v6h4l5 5V4l-5 5H7z"/>';
    } else {
        volumeIcon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>';
    }
}

function setVolume(e) {
    const rect = volumeSlider.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.volume = percent;
    updateVolumeDisplay(percent);
}

function toggleMute() {
    if (audio.volume > 0) {
        audio.dataset.prevVolume = audio.volume;
        audio.volume = 0;
        updateVolumeDisplay(0);
    } else {
        const prevVolume = parseFloat(audio.dataset.prevVolume) || 0.7;
        audio.volume = prevVolume;
        updateVolumeDisplay(prevVolume);
    }
}

function handleSongEnd() {
    if (repeatMode === 2) {
        audio.currentTime = 0;
        audio.play();
        return;
    }

    if (repeatMode === 1 || currentSongIndex < songs.length - 1 || isShuffle) {
        nextSong();
        return;
    }

    isPlaying = false;
    updatePlayButton(false);
}

function setupEventListeners() {
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);
    repeatBtn.addEventListener('click', toggleRepeat);
    shuffleBtn.addEventListener('click', toggleShuffle);
    
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleSongEnd);
    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
    });
    
    audio.addEventListener('play', () => {
        isPlaying = true;
        updatePlayButton(true);
    });
    
    audio.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayButton(false);
    });
    
    progressBar.addEventListener('mousedown', (e) => {
        isDraggingProgress = true;
        seek(e);
    });
    
    volumeSlider.addEventListener('mousedown', (e) => {
        isDraggingVolume = true;
        setVolume(e);
    });
    
    muteBtn.addEventListener('click', toggleMute);
    
    document.addEventListener('mousemove', (e) => {
        if (isDraggingProgress) seek(e);
        if (isDraggingVolume) setVolume(e);
    });
    
    document.addEventListener('mouseup', () => {
        isDraggingProgress = false;
        isDraggingVolume = false;
    });
    
    document.addEventListener('keydown', (e) => {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                togglePlay();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                audio.currentTime = Math.max(0, audio.currentTime - 5);
                break;
            case 'ArrowRight':
                e.preventDefault();
                audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
                break;
            case 'ArrowUp':
                e.preventDefault();
                audio.volume = Math.min(1, audio.volume + 0.1);
                updateVolumeDisplay(audio.volume);
                break;
            case 'ArrowDown':
                e.preventDefault();
                audio.volume = Math.max(0, audio.volume - 0.1);
                updateVolumeDisplay(audio.volume);
                break;
        }
    });
}

async function init() {
    await loadSongs();
    setupEventListeners(); 
    audio.volume = 0.7;
    updateVolumeDisplay(0.7);
    updateRepeatButton();
    updateShuffleButton();
    document.getElementById('copyrightYear').textContent = new Date().getFullYear();
}

init();