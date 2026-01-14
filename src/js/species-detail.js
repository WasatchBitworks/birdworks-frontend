// Species Detail Page - Photo Viewer + Audio Fetching
// Vanilla JavaScript implementation (no external dependencies)

(function() {
  'use strict';

  // ============================================================================
  // Shared Variables (from template)
  // ============================================================================

  const speciesSlug = window.speciesSlug;
  const speciesName = window.speciesName;
  const apiBase = window.apiBase || 'https://cms.wasatchbitworks.com/api/birds';

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
  // Presence Grid (GitHub-style activity calendar)
  // ============================================================================

  const presenceLoading = document.getElementById('presenceLoading');
  const presenceGrid = document.getElementById('presenceGrid');
  const presenceEmpty = document.getElementById('presenceEmpty');

  // Fetch presence data on page load
  if (speciesSlug && presenceGrid) {
    fetchPresenceData();
  }

  function fetchPresenceData() {
    const url = `${apiBase}/wasatch-bitworks/species/${speciesSlug}/presence?days=365`;

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        renderPresenceGrid(data.dates || []);
      })
      .catch(error => {
        console.error('Error fetching presence data:', error);
        showPresenceError();
      });
  }

  function renderPresenceGrid(dates) {
    // Hide loading
    if (presenceLoading) {
      presenceLoading.style.display = 'none';
    }

    // Show empty state if no dates
    if (!dates || dates.length === 0) {
      if (presenceEmpty) {
        presenceEmpty.classList.remove('hidden');
      }
      return;
    }

    // Convert dates array to Set for O(1) lookup
    const dateSet = new Set(dates);

    // Build 365-day grid (rolling last 12 months)
    // Grid: 7 rows (Mon-Sun) × 53 columns (weeks)
    // Most recent week on the right
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the Monday of the current week
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0
    const currentWeekMonday = new Date(today);
    currentWeekMonday.setDate(today.getDate() + mondayOffset);

    // Go back 52 weeks (plus current partial week = 53 columns max)
    const startDate = new Date(currentWeekMonday);
    startDate.setDate(startDate.getDate() - (52 * 7));

    // Create grid container
    const gridHtml = document.createElement('div');
    gridHtml.className = 'flex gap-1';

    // Day labels (Mon, Wed, Fri) - left side
    const dayLabels = document.createElement('div');
    dayLabels.className = 'flex flex-col gap-1 mr-2 text-xs text-gray-400';
    dayLabels.innerHTML = `
      <div class="h-3 leading-3">Mon</div>
      <div class="h-3 leading-3"></div>
      <div class="h-3 leading-3">Wed</div>
      <div class="h-3 leading-3"></div>
      <div class="h-3 leading-3">Fri</div>
      <div class="h-3 leading-3"></div>
      <div class="h-3 leading-3">Sun</div>
    `;
    gridHtml.appendChild(dayLabels);

    // Weeks container (reversed so newest data is on left)
    const weeksContainer = document.createElement('div');
    weeksContainer.className = 'flex gap-1 flex-row-reverse';

    // Generate 53 weeks of columns
    let currentDate = new Date(startDate);
    let weekCount = 0;
    const maxWeeks = 53;

    while (weekCount < maxWeeks && currentDate <= today) {
      const weekColumn = document.createElement('div');
      weekColumn.className = 'flex flex-col gap-1';

      // 7 days per column (Mon=0 to Sun=6)
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const cellDate = new Date(currentDate);
        cellDate.setDate(currentDate.getDate() + dayIdx);

        const cell = document.createElement('div');
        cell.className = 'w-3 h-3 rounded-sm';

        // Check if this is today
        const isToday = cellDate.toDateString() === today.toDateString();

        // Check if this is the monitoring began date (Dec 22, 2025)
        // Use local timezone constructor to avoid UTC offset issues
        const monitoringBeganDate = new Date(2025, 11, 22); // Month is 0-indexed, so 11 = December
        monitoringBeganDate.setHours(0, 0, 0, 0);
        const isMonitoringBegan = cellDate.toDateString() === monitoringBeganDate.toDateString();

        // Check if this date is in the future or before start
        if (cellDate > today) {
          cell.className += ' bg-gray-50';
        } else {
          // Format date for lookup (YYYY-MM-DD)
          const dateStr = formatDateISO(cellDate);
          const hasDetection = dateSet.has(dateStr);

          if (hasDetection) {
            cell.className += ' bg-green-400 hover:bg-green-500';
          } else {
            cell.className += ' bg-gray-100 hover:bg-gray-200';
          }

          // Highlight today with darker border
          if (isToday) {
            cell.className += ' ring-2 ring-gray-700';
          }

          // Highlight monitoring began date with blue border
          if (isMonitoringBegan) {
            cell.className += ' ring-2 ring-blue-500';
          }

          // Add tooltip
          if (isMonitoringBegan) {
            cell.title = 'Dec 22, 2025 - Monitoring Began';
          } else {
            cell.title = formatDateTooltip(cellDate, hasDetection);
          }
        }

        weekColumn.appendChild(cell);
      }

      weeksContainer.appendChild(weekColumn);

      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
      weekCount++;
    }

    gridHtml.appendChild(weeksContainer);

    // Month labels (below grid) - positioned at each month boundary
    const monthBar = document.createElement('div');
    monthBar.className = 'relative mt-1 text-xs text-gray-400';
    monthBar.style.marginLeft = '28px'; // Align with grid (day labels width)
    monthBar.style.height = '16px';

    // Calculate total weeks to determine grid width (for reversed positioning)
    const totalWeeks = weekCount;
    const totalWidth = totalWeeks * 16; // 16px = cell width (12px) + gap (4px)

    // Calculate month positions
    let labelDate = new Date(startDate);
    let lastMonth = -1;

    while (labelDate <= today) {
      const month = labelDate.getMonth();
      if (month !== lastMonth) {
        const weeksSinceStart = Math.floor((labelDate - startDate) / (7 * 24 * 60 * 60 * 1000));

        // Create month label
        const monthLabel = document.createElement('span');
        monthLabel.textContent = labelDate.toLocaleDateString('en-US', { month: 'short' });
        monthLabel.className = 'absolute text-xs text-gray-400';
        // Since grid is reversed (flex-row-reverse), position from right instead of left
        monthLabel.style.right = `${totalWidth - (weeksSinceStart * 16)}px`;
        monthBar.appendChild(monthLabel);

        lastMonth = month;
      }
      labelDate.setDate(labelDate.getDate() + 7);
    }

    // Legend
    const legend = document.createElement('div');
    legend.className = 'flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-500';
    legend.innerHTML = `
      <div class="w-3 h-3 rounded-sm bg-green-400"></div>
      <span>Detected</span>
      <span class="ml-3 text-gray-400">•</span>
      <div class="w-3 h-3 rounded-sm bg-gray-100 ring-2 ring-gray-700 ml-3"></div>
      <span>Today</span>
      <span class="ml-3 text-gray-400">•</span>
      <div class="w-3 h-3 rounded-sm bg-gray-100 ring-2 ring-blue-500 ml-3"></div>
      <span>Monitoring Began</span>
      <span class="ml-3 text-gray-400">•</span>
      <span class="ml-2">${dates.length} days in last year</span>
    `;

    // Assemble the grid
    presenceGrid.innerHTML = '';
    presenceGrid.appendChild(gridHtml);
    presenceGrid.appendChild(monthBar);
    presenceGrid.appendChild(legend);
    presenceGrid.classList.remove('hidden');
  }

  function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateTooltip(date, hasDetection) {
    const formatted = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return hasDetection ? `${formatted} - Detected` : `${formatted} - No detections`;
  }

  function showPresenceError() {
    if (presenceLoading) {
      presenceLoading.innerHTML = `
        <div class="text-center py-4">
          <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-sm text-gray-500">Unable to load activity data</p>
        </div>
      `;
    }
  }

  // ============================================================================
  // Audio Fetching & Rendering
  // ============================================================================

  const audioListContainer = document.getElementById('audioList');
  const audioLoadingEl = document.getElementById('audioLoading');
  const audioEmptyEl = document.getElementById('audioEmpty');

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
