// Species Detail Page - Photo Viewer + Audio Fetching
// Vanilla JavaScript implementation (no external dependencies)

(function() {
  'use strict';

  // ============================================================================
  // Photo Viewer
  // ============================================================================

  let currentPhotoIndex = 0;
  const thumbnailButtons = document.querySelectorAll('.thumbnail-btn');
  const mainPhoto = document.getElementById('mainPhoto');
  const photoCaption = document.getElementById('photoCaption');

  if (thumbnailButtons.length > 0 && mainPhoto) {
    // Initialize photo viewer
    thumbnailButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        showPhoto(index);
      });
    });

    // Keyboard navigation (arrow keys)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        showPreviousPhoto();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        showNextPhoto();
      }
    });

    function showPhoto(index) {
      if (index < 0 || index >= thumbnailButtons.length) return;

      currentPhotoIndex = index;
      const btn = thumbnailButtons[index];
      const largeUrl = btn.dataset.largeUrl;
      const caption = btn.dataset.caption;

      // Update main photo
      mainPhoto.src = largeUrl;

      // Update caption
      if (photoCaption) {
        if (caption && caption.trim()) {
          photoCaption.textContent = caption;
          photoCaption.parentElement.classList.remove('hidden');
        } else {
          photoCaption.parentElement.classList.add('hidden');
        }
      }

      // Update thumbnail highlighting
      thumbnailButtons.forEach((b, i) => {
        if (i === index) {
          b.classList.add('ring-2', 'ring-leaf-green');
        } else {
          b.classList.remove('ring-2', 'ring-leaf-green');
        }
      });
    }

    function showNextPhoto() {
      const nextIndex = (currentPhotoIndex + 1) % thumbnailButtons.length;
      showPhoto(nextIndex);
    }

    function showPreviousPhoto() {
      const prevIndex = (currentPhotoIndex - 1 + thumbnailButtons.length) % thumbnailButtons.length;
      showPhoto(prevIndex);
    }
  }

  // ============================================================================
  // Audio Fetching & Rendering
  // ============================================================================

  const audioListContainer = document.getElementById('audioList');
  const audioLoadingEl = document.getElementById('audioLoading');
  const audioEmptyEl = document.getElementById('audioEmpty');

  // Get species info from window (set in template)
  const speciesSlug = window.speciesSlug;
  const speciesName = window.speciesName;
  const apiBase = window.apiBase || 'https://cms.wasatchbitworks.com/api/birds';

  // Fetch preserved detections on page load
  if (speciesSlug && audioListContainer) {
    fetchPreservedAudio();
  }

  function fetchPreservedAudio() {
    const url = `${apiBase}/wasatch-bitworks/detections/species/${speciesSlug}?preserved=true&limit=25`;

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        renderAudioList(data.detections);
      })
      .catch(error => {
        console.error('Error fetching preserved audio:', error);
        showAudioError();
      });
  }

  function renderAudioList(detections) {
    // Hide loading indicator
    if (audioLoadingEl) {
      audioLoadingEl.style.display = 'none';
    }

    // Show empty state if no recordings
    if (!detections || detections.length === 0) {
      if (audioEmptyEl) {
        audioEmptyEl.classList.remove('hidden');
      }
      return;
    }

    // Clear container and render audio items
    audioListContainer.innerHTML = '';

    detections.forEach((detection, index) => {
      const audioItem = createAudioItem(detection, index + 1);
      audioListContainer.appendChild(audioItem);
    });
  }

  function createAudioItem(detection, number) {
    const div = document.createElement('div');
    div.className = 'bg-white rounded-lg shadow-md p-4 flex items-center justify-between gap-4';

    // Left side: Number + metadata
    const leftDiv = document.createElement('div');
    leftDiv.className = 'flex items-center gap-4 flex-1';

    const numberSpan = document.createElement('span');
    numberSpan.className = 'text-lg font-bold text-gray-400';
    numberSpan.textContent = `#${number}`;

    const metadataDiv = document.createElement('div');
    metadataDiv.className = 'flex-1';

    const dateTime = formatMountainTime(detection.detected_at);
    const confidencePercent = Math.round(detection.confidence * 100);

    metadataDiv.innerHTML = `
      <div class="text-sm font-medium text-gray-900">${dateTime}</div>
      <div class="text-xs text-gray-600">
        <span class="font-semibold text-green-700">${confidencePercent}% confidence</span>
        ${detection.preserve_reason ? ` • ${formatPreserveReason(detection.preserve_reason)}` : ''}
      </div>
    `;

    leftDiv.appendChild(numberSpan);
    leftDiv.appendChild(metadataDiv);

    // Right side: Play button
    const playButton = document.createElement('button');
    playButton.className = 'audio-play-btn px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition inline-flex items-center gap-2';
    playButton.dataset.audioUrl = detection.audio_url;
    playButton.dataset.detectionId = detection.id;
    playButton.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>Play</span>
    `;

    // Add click handler (audio playback will be added in Phase 5)
    playButton.addEventListener('click', () => {
      handleAudioPlay(playButton);
    });

    div.appendChild(leftDiv);
    div.appendChild(playButton);

    return div;
  }

  function formatMountainTime(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        timeZone: 'America/Denver',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  }

  function formatPreserveReason(reason) {
    const reasons = {
      'high_confidence': 'High Confidence',
      'building_collection': 'Building Collection',
      'manual': 'Manually Preserved',
      'first_of_species': 'First of Species'
    };
    return reasons[reason] || reason;
  }

  function showAudioError() {
    if (audioLoadingEl) {
      audioLoadingEl.innerHTML = `
        <div class="bg-red-50 rounded-lg p-8 text-center">
          <svg class="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-red-700 font-medium">Error loading recordings</p>
          <p class="text-red-600 text-sm mt-1">Please try refreshing the page</p>
        </div>
      `;
    }
  }

  // ============================================================================
  // Audio Playback (Placeholder - will be extracted to shared module in Phase 5)
  // ============================================================================

  let currentlyPlayingAudio = null;

  function handleAudioPlay(button) {
    const audioUrl = button.dataset.audioUrl;
    const detectionId = button.dataset.detectionId;

    // If this button's audio is already playing, pause it
    if (button._audio && !button._audio.paused) {
      button._audio.pause();
      return;
    }

    // Pause any other playing audio
    if (currentlyPlayingAudio && currentlyPlayingAudio !== button._audio) {
      currentlyPlayingAudio.pause();
    }

    // If audio element doesn't exist, create and load it
    if (!button._audio) {
      setButtonLoading(button);

      // Fetch pre-signed S3 URL (prepend apiBase for absolute URL)
      const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : `https://cms.wasatchbitworks.com${audioUrl}`;
      fetch(fullAudioUrl)
        .then(response => response.json())
        .then(data => {
          if (!data.url) {
            throw new Error('No audio URL returned');
          }

          // Create audio element
          const audio = new Audio(data.url);
          button._audio = audio;

          // Set up event listeners
          audio.addEventListener('loadeddata', () => {
            setButtonReady(button);
            audio.play();
          });

          audio.addEventListener('play', () => {
            currentlyPlayingAudio = audio;
            setButtonPlaying(button);
          });

          audio.addEventListener('pause', () => {
            setButtonReady(button);
          });

          audio.addEventListener('ended', () => {
            setButtonReady(button);
            currentlyPlayingAudio = null;
          });

          audio.addEventListener('error', () => {
            setButtonError(button);
          });
        })
        .catch(error => {
          console.error('Error loading audio:', error);
          setButtonError(button);
        });
    } else {
      // Audio already loaded, just play it
      button._audio.play();
    }
  }

  function setButtonLoading(button) {
    button.disabled = true;
    button.innerHTML = `
      <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Loading...</span>
    `;
  }

  function setButtonReady(button) {
    button.disabled = false;
    button.className = 'audio-play-btn px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition inline-flex items-center gap-2';
    button.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>Play</span>
    `;
  }

  function setButtonPlaying(button) {
    button.disabled = false;
    button.className = 'audio-play-btn px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition inline-flex items-center gap-2';
    button.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>Pause</span>
    `;
  }

  function setButtonError(button) {
    button.disabled = true;
    button.className = 'audio-play-btn px-4 py-2 bg-red-500 text-white rounded-lg cursor-not-allowed inline-flex items-center gap-2';
    button.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
      <span>Unavailable</span>
    `;
  }

})();
