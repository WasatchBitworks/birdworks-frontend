/**
 * BirdWorks Live Refresh - Progressive Enhancement
 * Adds client-side refresh capability to /live page
 */

(function() {
  'use strict';

  // Configuration
  const REFRESH_INTERVAL = 60000; // 60 seconds
  const API_SLUG = 'wasatch-bitworks';
  const ITEMS_PER_PAGE = 20;

  // Get API base from data attribute
  const apiBase = document.documentElement.dataset.apiBase || 'https://cms.wasatchbitworks.com/api/birds';
  const apiUrl = `${apiBase}/${API_SLUG}/latest?date=today`;  // All detections for today (Mountain Time)

  // State
  let autoRefreshTimer = null;
  let isRefreshing = false;
  let currentPage = 1;
  let allDetections = [];
  let currentlyPlayingAudio = null;

  // DOM elements
  const refreshBtn = document.getElementById('refreshBtn');
  const refreshBtnText = document.getElementById('refreshBtnText');
  const autoRefreshToggle = document.getElementById('autoRefreshToggle');
  const statusText = document.getElementById('statusText');
  const lastUpdatedTime = document.getElementById('lastUpdatedTime');
  const detectionsTableBody = document.getElementById('detectionsTableBody');

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    if (!refreshBtn || !detectionsTableBody) {
      console.warn('Live refresh: Required elements not found');
      return;
    }

    // Set up event listeners
    refreshBtn.addEventListener('click', handleRefreshClick);
    autoRefreshToggle.addEventListener('change', handleAutoRefreshToggle);

    // Set up pagination event listeners
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
    }

    // Load initial detections from build-time data
    const tableRows = detectionsTableBody.querySelectorAll('tr[data-detection]');
    if (tableRows.length > 0) {
      // Extract detection data from build-time rendered rows
      allDetections = Array.from(tableRows).map(row => {
        try {
          return JSON.parse(row.dataset.detection);
        } catch (e) {
          return null;
        }
      }).filter(d => d !== null);

      // Check if any detections have audio
      const hasAudio = allDetections.some(d => d.audio_url);

      console.log(`Live refresh: Loaded ${allDetections.length} detections, hasAudio: ${hasAudio}`);

      // Re-render if pagination needed OR if audio column should be added
      if (allDetections.length > ITEMS_PER_PAGE || hasAudio) {
        console.log('Live refresh: Re-rendering table with pagination/audio');
        updateDetectionsTable();
      }
    }

    // Load auto-refresh preference from localStorage
    const autoRefreshEnabled = localStorage.getItem('birdworks_auto_refresh') === 'true';
    if (autoRefreshEnabled) {
      autoRefreshToggle.checked = true;
      startAutoRefresh();
    }

    console.log('Live refresh initialized');
  }

  /**
   * Handle manual refresh button click
   */
  async function handleRefreshClick() {
    if (isRefreshing) return;
    await refreshDetections();
  }

  /**
   * Handle auto-refresh toggle
   */
  function handleAutoRefreshToggle(e) {
    const enabled = e.target.checked;
    localStorage.setItem('birdworks_auto_refresh', enabled);

    if (enabled) {
      startAutoRefresh();
      setStatus('Auto-refresh enabled', 'text-green-600');
    } else {
      stopAutoRefresh();
      setStatus('Auto-refresh disabled', 'text-gray-600');
    }
  }

  /**
   * Start auto-refresh timer
   */
  function startAutoRefresh() {
    stopAutoRefresh(); // Clear any existing timer
    autoRefreshTimer = setInterval(() => {
      refreshDetections();
    }, REFRESH_INTERVAL);
  }

  /**
   * Stop auto-refresh timer
   */
  function stopAutoRefresh() {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
      autoRefreshTimer = null;
    }
  }

  /**
   * Fetch and update detections
   */
  async function refreshDetections() {
    if (isRefreshing) return;

    isRefreshing = true;
    setStatus('Refreshing...', 'text-blue-600');
    refreshBtn.disabled = true;
    refreshBtnText.textContent = 'Refreshing...';

    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const detections = data.detections || [];

      // Store all detections and reset to page 1
      allDetections = detections;
      currentPage = 1;

      // Update table with paginated detections
      updateDetectionsTable();

      // Update stats
      updateStats(detections);

      // Update timestamp (formatted to Mountain Time)
      const now = new Date().toISOString();
      lastUpdatedTime.textContent = formatMountainTime(now) + ' MT';

      // Success status
      setStatus('Updated successfully', 'text-green-600');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatus('Ready', 'text-gray-600');
      }, 3000);

    } catch (error) {
      console.error('Refresh failed:', error);
      setStatus(`Error: ${error.message}`, 'text-red-600');
    } finally {
      isRefreshing = false;
      refreshBtn.disabled = false;
      refreshBtnText.textContent = 'Refresh Now';
    }
  }

  /**
   * Get paginated detections for current page
   */
  function getPaginatedDetections() {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allDetections.slice(startIndex, endIndex);
  }

  /**
   * Calculate total pages
   */
  function getTotalPages() {
    return Math.ceil(allDetections.length / ITEMS_PER_PAGE);
  }

  /**
   * Go to specific page
   */
  function goToPage(page) {
    const totalPages = getTotalPages();
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    updateDetectionsTable();
    updatePaginationControls();
  }

  /**
   * Update pagination controls display
   */
  function updatePaginationControls() {
    const totalPages = getTotalPages();
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, allDetections.length);

    // Update pagination info text
    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
      if (allDetections.length === 0) {
        paginationInfo.textContent = 'No detections';
      } else {
        paginationInfo.textContent = `Showing ${startIndex}-${endIndex} of ${allDetections.length}`;
      }
    }

    // Update page number display
    const pageNumber = document.getElementById('pageNumber');
    if (pageNumber) {
      pageNumber.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    }

    // Update button states
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (prevBtn) {
      prevBtn.disabled = currentPage === 1;
    }

    if (nextBtn) {
      nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
    }
  }

  /**
   * Update detections table with new data
   */
  function updateDetectionsTable() {
    if (!detectionsTableBody) return;

    // Get paginated detections
    const detections = getPaginatedDetections();
    const hasAudio = allDetections.some(d => d.audio_url);

    console.log(`updateDetectionsTable: ${detections.length} detections on page, hasAudio: ${hasAudio}`);

    // Update table header with/without audio column
    const tableHeader = document.querySelector('#detectionsTableContainer thead tr');
    if (tableHeader) {
      const audioHeader = tableHeader.querySelector('.audio-header');
      console.log(`Table header found, audioHeader exists: ${!!audioHeader}`);

      if (hasAudio && !audioHeader) {
        // Add audio header if not present
        const th = document.createElement('th');
        th.className = 'audio-header px-6 py-4 text-left text-sm font-semibold text-gray-700';
        th.textContent = 'Audio';
        tableHeader.appendChild(th);
        console.log('Audio header added to table');
      } else if (!hasAudio && audioHeader) {
        // Remove audio header if no audio available
        audioHeader.remove();
        console.log('Audio header removed from table');
      }
    } else {
      console.warn('Table header not found!');
    }

    // Clear existing rows
    detectionsTableBody.innerHTML = '';

    if (allDetections.length === 0) {
      // Show empty state in table
      const emptyRow = document.createElement('tr');
      const colspan = hasAudio ? 4 : 3;
      emptyRow.innerHTML = `
        <td colspan="${colspan}" class="px-6 py-12 text-center text-gray-500">
          <div class="flex flex-col items-center gap-3">
            <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            <p>No detections found</p>
          </div>
        </td>
      `;
      detectionsTableBody.appendChild(emptyRow);
      updatePaginationControls();
      return;
    }

    // Add detection rows for current page
    detections.forEach(detection => {
      const row = createDetectionRow(detection, hasAudio);
      detectionsTableBody.appendChild(row);
    });

    // Update pagination controls
    updatePaginationControls();
  }

  /**
   * Create a table row for a detection
   */
  function createDetectionRow(detection, hasAudioColumn) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50 transition';

    const confidence = detection.confidence || 0;
    const confidencePct = Math.round(confidence * 100);

    let confidenceClass = 'bg-gray-100 text-gray-800';
    let confidenceIcon = '';

    if (confidence >= 0.9) {
      confidenceClass = 'bg-green-100 text-green-800';
      confidenceIcon = '<span class="text-xs text-green-600" title="High confidence">✓</span>';
    } else if (confidence >= 0.7) {
      confidenceClass = 'bg-yellow-100 text-yellow-800';
    }

    // Audio column HTML
    let audioHtml = '';
    if (hasAudioColumn) {
      if (detection.audio_url) {
        const preservedBadge = detection.preserved ?
          '<span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Preserved</span>' : '';
        audioHtml = `
          <td class="px-6 py-4">
            <div class="flex flex-col gap-1">
              <button
                class="audio-play-btn inline-flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition"
                data-audio-url="${escapeHtml(detection.audio_url)}"
                data-detection-id="${detection.id}"
                aria-label="Play audio for ${escapeHtml(detection.common_name)}">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                </svg>
                <span>Play</span>
              </button>
              ${preservedBadge}
            </div>
          </td>
        `;
      } else {
        audioHtml = '<td class="px-6 py-4"></td>';
      }
    }

    row.innerHTML = `
      <td class="px-6 py-4">
        <div class="font-semibold text-gray-900">${escapeHtml(detection.common_name || 'Unknown')}</div>
        <div class="text-sm text-gray-500 italic">${escapeHtml(detection.scientific_name || '')}</div>
      </td>
      <td class="px-6 py-4">
        <div class="flex items-center gap-2">
          <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${confidenceClass}">
            ${confidencePct}%
          </span>
          ${confidenceIcon}
        </div>
      </td>
      <td class="px-6 py-4 text-gray-600">
        <div class="text-sm">${formatMountainTime(detection.detected_at)}</div>
      </td>
      ${audioHtml}
    `;

    // Add event listener for audio play button
    if (detection.audio_url) {
      const playBtn = row.querySelector('.audio-play-btn');
      if (playBtn) {
        playBtn.addEventListener('click', () => handleAudioPlayClick(playBtn, detection));
      }
    }

    return row;
  }

  /**
   * Handle audio play button click
   */
  async function handleAudioPlayClick(button, detection) {
    const audioUrl = detection.audio_url;
    if (!audioUrl) return;

    // If this button already has audio loaded, just toggle play/pause
    if (button._audio) {
      if (button._audio.paused) {
        button._audio.play();
      } else {
        button._audio.pause();
      }
      return;
    }

    // Pause currently playing audio from other buttons
    if (currentlyPlayingAudio && !currentlyPlayingAudio.paused) {
      currentlyPlayingAudio.pause();
    }

    // Show loading state
    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
      <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Loading...</span>
    `;

    try {
      // Fetch pre-signed S3 URL from audio endpoint
      // audio_url is already a full path like "/api/birds/wasatch-bitworks/audio/123"
      const apiOrigin = new URL(apiBase).origin; // Get just https://cms.wasatchbitworks.com
      const fullUrl = `${apiOrigin}${audioUrl}`;
      console.log(`Fetching audio from: ${fullUrl}`);
      const response = await fetch(fullUrl);

      if (!response.ok) {
        throw new Error('Audio not available');
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error('Audio URL not found');
      }

      // Create and play audio element
      const audio = new Audio(data.url);
      button._audio = audio; // Store reference on button
      currentlyPlayingAudio = audio;

      audio.addEventListener('loadeddata', () => {
        button.innerHTML = `
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"/>
          </svg>
          <span>Pause</span>
        `;
        button.disabled = false;
      });

      audio.addEventListener('play', () => {
        // Pause other playing audio
        if (currentlyPlayingAudio && currentlyPlayingAudio !== audio) {
          currentlyPlayingAudio.pause();
        }
        currentlyPlayingAudio = audio;

        button.innerHTML = `
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"/>
          </svg>
          <span>Pause</span>
        `;
      });

      audio.addEventListener('pause', () => {
        button.innerHTML = originalHTML;
      });

      audio.addEventListener('ended', () => {
        button.innerHTML = originalHTML;
        if (currentlyPlayingAudio === audio) {
          currentlyPlayingAudio = null;
        }
      });

      audio.addEventListener('error', () => {
        throw new Error('Failed to load audio');
      });

      audio.play();

    } catch (error) {
      console.error('Audio playback failed:', error);
      button.innerHTML = `
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <span class="text-xs">Unavailable</span>
      `;
      button.disabled = true;
      button.className = button.className.replace('bg-green-600 hover:bg-green-700', 'bg-gray-400 cursor-not-allowed');
    }
  }

  /**
   * Update stats cards (if they exist)
   */
  function updateStats(detections) {
    // Note: Stats cards show build-time data
    // We could update them dynamically, but for now we'll leave them static
    // since they represent broader stats, not just the latest 20 detections
  }

  /**
   * Set status message
   */
  function setStatus(message, className) {
    if (statusText) {
      statusText.textContent = message;
      statusText.className = className;
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Format UTC timestamp to Mountain Time
   */
  function formatMountainTime(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        timeZone: "America/Denver",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  }

})();
