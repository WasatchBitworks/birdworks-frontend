/**
 * BirdWorks Live Refresh - Progressive Enhancement
 * Adds client-side refresh capability to /live page
 */

(function() {
  'use strict';

  // Configuration
  const REFRESH_INTERVAL = 300000; // 5 minutes (matches BirdNET-Pi sync frequency)
  const API_SLUG = 'wasatch-bitworks';
  const ITEMS_PER_PAGE = 20;

  // Get API base from data attribute
  const apiBase = document.documentElement.dataset.apiBase || 'https://cms.wasatchbitworks.com/api/birds';
  const apiUrl = `${apiBase}/${API_SLUG}/latest?date=today&limit=200`;  // Most recent 200 detections for today
  const hourlyApiUrl = `${apiBase}/${API_SLUG}/hourly?date=today`;  // Hourly aggregated data for the entire day

  // State
  let autoRefreshTimer = null;
  let isRefreshing = false;
  let currentPage = 1;
  let allDetections = [];
  let hourlyData = null;  // NEW: hourly aggregated data from API
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

    // Load initial hourly data from chart's data attribute
    const dailySummaryChart = document.getElementById('dailySummaryChart');
    if (dailySummaryChart) {
      const hourlyJson = dailySummaryChart.getAttribute('data-hourly');
      if (hourlyJson) {
        try {
          hourlyData = JSON.parse(hourlyJson);
        } catch (e) {
          console.error('Error parsing hourly JSON:', e);
          hourlyData = [];
        }
      }
    }

    // Load initial detections from table rows
    const tableRows = detectionsTableBody.querySelectorAll('tr[data-detection]');
    if (tableRows.length > 0) {
      allDetections = Array.from(tableRows).map(row => {
        try {
          return JSON.parse(row.dataset.detection);
        } catch (e) {
          return null;
        }
      }).filter(d => d !== null);
    }

    // Check if any detections have audio
    const hasAudio = allDetections.some(d => d.audio_url);

    // Re-render if pagination needed OR if audio column should be added
    if (allDetections.length > ITEMS_PER_PAGE || hasAudio) {
      updateDetectionsTable();
    }

    // Update stats with initial data
    updateStatsTotals();

    // Render daily summary chart with hourly data from API
    if (hourlyData && hourlyData.length > 0) {
      updateDailySummaryChartWithHourlyData();
    }

    // Load auto-refresh preference from localStorage
    const autoRefreshEnabled = localStorage.getItem('birdworks_auto_refresh') === 'true';
    if (autoRefreshEnabled) {
      autoRefreshToggle.checked = true;
      startAutoRefresh();
    }
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
   * Fetch and update detections + hourly chart data
   */
  async function refreshDetections() {
    if (isRefreshing) return;

    isRefreshing = true;
    setStatus('Refreshing...', 'text-blue-600');
    refreshBtn.disabled = true;
    refreshBtnText.textContent = 'Refreshing...';

    try {
      // Fetch both detections and hourly data in parallel
      const [detectionsResponse, hourlyResponse] = await Promise.all([
        fetch(apiUrl, { headers: { 'Accept': 'application/json' } }),
        fetch(hourlyApiUrl, { headers: { 'Accept': 'application/json' } })
      ]);

      if (!detectionsResponse.ok) {
        throw new Error(`Detections API: HTTP ${detectionsResponse.status}`);
      }

      if (!hourlyResponse.ok) {
        throw new Error(`Hourly API: HTTP ${hourlyResponse.status}`);
      }

      const detectionsData = await detectionsResponse.json();
      const hourlyApiData = await hourlyResponse.json();

      const detections = detectionsData.detections || [];

      // Store all detections and reset to page 1
      allDetections = detections;
      hourlyData = hourlyApiData.hours || [];  // NEW: store hourly data
      currentPage = 1;

      // Update table with paginated detections
      updateDetectionsTable();

      // Update stats
      updateStats(detections);

      // Update Daily Detections Summary chart with hourly data
      updateDailySummaryChartWithHourlyData();

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

    // Update table header with/without audio column
    const tableHeader = document.querySelector('#detectionsTableContainer thead tr');
    if (tableHeader) {
      const audioHeader = tableHeader.querySelector('.audio-header');

      if (hasAudio && !audioHeader) {
        // Add audio header if not present
        const th = document.createElement('th');
        th.className = 'audio-header px-6 py-4 text-left text-sm font-semibold text-gray-700';
        th.textContent = 'Audio';
        tableHeader.appendChild(th);
      } else if (!hasAudio && audioHeader) {
        // Remove audio header if no audio available
        audioHeader.remove();
      }
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
   * Update stats cards based on all detections for the day
   */
  function updateStatsTotals() {
    // Update detection count
    const detectionsEl = document.getElementById('statDetections');
    if (detectionsEl) {
      detectionsEl.textContent = allDetections.length;
    }

    // Update unique species count
    const speciesEl = document.getElementById('statSpecies');
    if (speciesEl) {
      const uniqueSpecies = new Set(allDetections.map(d => d.common_name));
      speciesEl.textContent = uniqueSpecies.size;
    }

    // Update high confidence count
    const confidenceEl = document.getElementById('statConfidence');
    if (confidenceEl) {
      const highConfidence = allDetections.filter(d => d.confidence >= 0.9).length;
      confidenceEl.textContent = highConfidence;
    }
  }

  /**
   * Update daily summary chart with hourly data from API
   * Converts hourly API response to species-by-hour format
   */
  function updateDailySummaryChartWithHourlyData() {
    const chartContainer = document.getElementById('dailySummaryChart');
    if (!chartContainer || !hourlyData || hourlyData.length === 0) return;

    // Convert hourly API data to species aggregation format
    // API returns: { hour, total, species: [{ common_name, count }, ...] }
    // We need: { species: [{ name, total, hourly: [0...24] }, ...], maxHourly }

    const speciesMap = new Map();

    hourlyData.forEach(hourRecord => {
      const hour = hourRecord.hour;
      (hourRecord.species || []).forEach(speciesRecord => {
        const speciesName = speciesRecord.common_name;
        const count = speciesRecord.count;

        if (!speciesMap.has(speciesName)) {
          speciesMap.set(speciesName, {
            name: speciesName,
            total: 0,
            hourly: new Array(24).fill(0)
          });
        }

        const speciesData = speciesMap.get(speciesName);
        speciesData.total += count;
        speciesData.hourly[hour] = count;
      });
    });

    // Convert to array and sort by total (descending)
    const speciesArray = Array.from(speciesMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 15); // Top 15 species

    // Find max hourly count for color scaling
    let maxHourly = 0;
    speciesArray.forEach(species => {
      const max = Math.max(...species.hourly);
      if (max > maxHourly) maxHourly = max;
    });

    const summaryData = {
      species: speciesArray,
      maxHourly: maxHourly
    };

    if (summaryData.species.length > 0) {
      const dateStr = new Date().toISOString().split('T')[0]; // Today's date
      const now = new Date().toISOString();
      renderDailySummary(chartContainer, summaryData, dateStr, now);
    }
  }

  /**
   * Update daily summary chart with live data (legacy, uses client-side aggregation)
   * Kept for backwards compatibility if hourly data is not available
   */
  function updateDailySummaryChart() {
    const chartContainer = document.getElementById('dailySummaryChart');
    if (!chartContainer) return;

    // Aggregate species by hour from detections
    const summaryData = aggregateSpeciesByHour(allDetections);
    if (summaryData.species.length > 0) {
      const dateStr = new Date().toISOString().split('T')[0]; // Today's date
      const now = new Date().toISOString();
      renderDailySummary(chartContainer, summaryData, dateStr, now);
    }
  }

  /**
   * Aggregate detections by species and hour
   */
  function aggregateSpeciesByHour(detections) {
    const speciesMap = new Map();

    detections.forEach(detection => {
      const species = detection.common_name;
      if (!speciesMap.has(species)) {
        speciesMap.set(species, {
          name: species,
          total: 0,
          hourly: new Array(24).fill(0)
        });
      }

      const speciesData = speciesMap.get(species);
      speciesData.total++;

      // Extract hour from timestamp
      try {
        const date = new Date(detection.detected_at);
        const hour = date.getHours();
        speciesData.hourly[hour]++;
      } catch (e) {
        // Skip if timestamp parsing fails
      }
    });

    // Convert to array and sort by total (descending)
    const speciesArray = Array.from(speciesMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 15); // Top 15 species

    // Find max hourly count for color scaling
    let maxHourly = 0;
    speciesArray.forEach(species => {
      const max = Math.max(...species.hourly);
      if (max > maxHourly) maxHourly = max;
    });

    return {
      species: speciesArray,
      maxHourly: maxHourly
    };
  }

  /**
   * Render daily summary chart (similar to charts.js but inline for live refresh)
   */
  function renderDailySummary(container, data, dateStr, updatedStr) {
    const numSpecies = data.species.length;
    const headerHeight = 60;
    const rowHeight = 32;
    const barChartWidth = 220;
    const cellSize = 28;
    const heatmapWidth = 24 * cellSize;
    const padding = { top: headerHeight + 10, right: 20, bottom: 20, left: 180 };

    const width = padding.left + barChartWidth + 40 + heatmapWidth + padding.right;
    const chartHeight = numSpecies * rowHeight;
    const height = padding.top + chartHeight + padding.bottom;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'w-full h-auto');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Daily detections summary with species ranking and hourly heatmap');

    // Helper: create text element
    const createText = (x, y, text, fontSize, color, anchor) => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      el.setAttribute('x', x);
      el.setAttribute('y', y);
      el.setAttribute('font-size', fontSize);
      el.setAttribute('fill', color);
      el.setAttribute('text-anchor', anchor);
      el.textContent = text;
      return el;
    };

    // Helper: create rect element
    const createRect = (x, y, width, height, color) => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      el.setAttribute('x', x);
      el.setAttribute('y', y);
      el.setAttribute('width', width);
      el.setAttribute('height', height);
      el.setAttribute('fill', color);
      return el;
    };

    // Helper: create line element
    const createLine = (x1, y1, x2, y2, color) => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      el.setAttribute('x1', x1);
      el.setAttribute('y1', y1);
      el.setAttribute('x2', x2);
      el.setAttribute('y2', y2);
      el.setAttribute('stroke', color);
      return el;
    };

    // Helper: get heatmap color
    const getHeatmapColor = (intensity) => {
      if (intensity === 0) return '#f9fafb';
      const colorStops = [
        { threshold: 0.0, color: { r: 220, g: 252, b: 231 } },
        { threshold: 0.25, color: { r: 134, g: 239, b: 172 } },
        { threshold: 0.5, color: { r: 34, g: 197, b: 94 } },
        { threshold: 0.65, color: { r: 16, g: 185, b: 129 } },
        { threshold: 0.75, color: { r: 139, g: 92, b: 246 } },
        { threshold: 0.85, color: { r: 220, g: 38, b: 127 } },
        { threshold: 1.0, color: { r: 239, g: 68, b: 68 } }
      ];

      let lowerStop = colorStops[0];
      let upperStop = colorStops[1];

      for (let i = 0; i < colorStops.length - 1; i++) {
        if (intensity >= colorStops[i].threshold && intensity <= colorStops[i + 1].threshold) {
          lowerStop = colorStops[i];
          upperStop = colorStops[i + 1];
          break;
        }
      }

      const range = upperStop.threshold - lowerStop.threshold;
      const normalizedIntensity = (intensity - lowerStop.threshold) / range;

      const r = Math.round(lowerStop.color.r + (upperStop.color.r - lowerStop.color.r) * normalizedIntensity);
      const g = Math.round(lowerStop.color.g + (upperStop.color.g - lowerStop.color.g) * normalizedIntensity);
      const b = Math.round(lowerStop.color.b + (upperStop.color.b - lowerStop.color.b) * normalizedIntensity);

      return `rgb(${r}, ${g}, ${b})`;
    };

    // Metadata
    const metaY = 45;
    const lastUpdated = createText(padding.left, metaY, `Last updated: ${formatMountainTime(updatedStr)} MT`, '12px', '#6b7280', 'start');
    svg.appendChild(lastUpdated);

    // Section divider line
    const divider = createLine(padding.left, headerHeight, width - padding.right, headerHeight, '#e5e7eb');
    divider.setAttribute('stroke-width', '2');
    svg.appendChild(divider);

    // Calculate max total for bar scaling
    const maxTotal = Math.max(...data.species.map(s => s.total));

    // For each species, render bar + heatmap row
    data.species.forEach((species, i) => {
      const y = padding.top + (i * rowHeight);

      // Species name (left aligned)
      const nameLabel = species.name.length > 22 ? species.name.substring(0, 20) + '...' : species.name;
      const nameText = createText(padding.left - 10, y + rowHeight / 2, nameLabel, '12px', '#374151', 'end');
      nameText.setAttribute('dominant-baseline', 'middle');
      svg.appendChild(nameText);

      // Bar chart
      const barWidth = maxTotal > 0 ? (species.total / maxTotal) * barChartWidth : 0;
      const barX = padding.left;
      const barY = y + 4;
      const barH = rowHeight - 8;

      const bar = createRect(barX, barY, barWidth, barH, '#4A7C2C');
      bar.setAttribute('rx', '3');
      svg.appendChild(bar);

      // Total count label on bar
      if (species.total > 0) {
        const countText = createText(barX + barWidth + 5, y + rowHeight / 2, species.total.toString(), '11px', '#374151', 'start');
        countText.setAttribute('dominant-baseline', 'middle');
        countText.setAttribute('font-weight', 'bold');
        svg.appendChild(countText);
      }

      // Heatmap cells (24 hours)
      const heatmapStartX = padding.left + barChartWidth + 40;
      species.hourly.forEach((count, hour) => {
        const cellX = heatmapStartX + (hour * cellSize);
        const cellY = y + 2;
        const cellH = rowHeight - 4;

        if (count > 0) {
          const intensity = count / data.maxHourly;
          const color = getHeatmapColor(intensity);
          const cell = createRect(cellX, cellY, cellSize - 2, cellH, color);
          cell.setAttribute('rx', '2');
          svg.appendChild(cell);

          if (cellSize >= 24) {
            const textColor = intensity > 0.5 ? '#ffffff' : '#374151';
            const countText = createText(cellX + cellSize / 2 - 1, cellY + cellH / 2, count.toString(), '9px', textColor, 'middle');
            countText.setAttribute('dominant-baseline', 'middle');
            countText.setAttribute('font-weight', 'bold');
            svg.appendChild(countText);
          }
        } else {
          const cell = createRect(cellX, cellY, cellSize - 2, cellH, '#f9fafb');
          cell.setAttribute('rx', '2');
          cell.setAttribute('stroke', '#e5e7eb');
          cell.setAttribute('stroke-width', '1');
          svg.appendChild(cell);
        }
      });
    });

    // Hour labels (bottom)
    const hourLabelsY = padding.top + chartHeight + 18;
    const heatmapStartX = padding.left + barChartWidth + 40;
    for (let hour = 0; hour < 24; hour += 3) {
      const hourX = heatmapStartX + (hour * cellSize) + cellSize / 2 - 1;
      const hourLabel = createText(hourX, hourLabelsY, hour.toString(), '10px', '#6b7280', 'middle');
      svg.appendChild(hourLabel);
    }

    // "Hour (MT)" label
    const hourAxisLabel = createText(heatmapStartX + heatmapWidth / 2, hourLabelsY + 15, 'Hour of Day (MT)', '11px', '#6b7280', 'middle');
    hourAxisLabel.setAttribute('font-style', 'italic');
    svg.appendChild(hourAxisLabel);

    container.innerHTML = '';
    container.appendChild(svg);
  }

  /**
   * Update stats cards (called after refresh with new daily detections)
   */
  function updateStats(detections) {
    // allDetections is already updated by refreshDetections()
    // Just update the UI to reflect the new totals
    updateStatsTotals();
    updateDailySummaryChart();
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
