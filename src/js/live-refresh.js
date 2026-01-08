/**
 * BirdWorks Live Refresh - Progressive Enhancement
 * Adds client-side refresh capability to /live page
 */

(function() {
  'use strict';

  // Configuration
  const REFRESH_INTERVAL = 60000; // 60 seconds
  const API_SLUG = 'wasatch-bitworks';

  // Get API base from data attribute
  const apiBase = document.documentElement.dataset.apiBase || 'https://cms.wasatchbitworks.com/api/birds';
  const apiUrl = `${apiBase}/${API_SLUG}/latest?date=today`;  // All detections for today (Mountain Time)

  // State
  let autoRefreshTimer = null;
  let isRefreshing = false;

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

      // Update table
      updateDetectionsTable(detections);

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
   * Update detections table with new data
   */
  function updateDetectionsTable(detections) {
    if (!detectionsTableBody) return;

    // Clear existing rows
    detectionsTableBody.innerHTML = '';

    if (detections.length === 0) {
      // Show empty state in table
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `
        <td colspan="3" class="px-6 py-12 text-center text-gray-500">
          <div class="flex flex-col items-center gap-3">
            <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            <p>No detections found</p>
          </div>
        </td>
      `;
      detectionsTableBody.appendChild(emptyRow);
      return;
    }

    // Add detection rows
    detections.forEach(detection => {
      const row = createDetectionRow(detection);
      detectionsTableBody.appendChild(row);
    });
  }

  /**
   * Create a table row for a detection
   */
  function createDetectionRow(detection) {
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
    `;

    return row;
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
