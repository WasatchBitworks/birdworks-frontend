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
      mainPhoto.alt = speciesName;

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
  // Photo Lightbox
  // ============================================================================

  const photoViewer = document.getElementById('photoViewer');
  const photoLightbox = document.getElementById('photoLightbox');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxCurrent = document.getElementById('lightboxCurrent');

  // Get photo data from window.speciesPhotos (passed from template)
  const lightboxPhotos = window.speciesPhotos || [];

  let lightboxIndex = 0;

  if (photoViewer && photoLightbox) {
    // Open lightbox when main photo is clicked
    photoViewer.addEventListener('click', () => {
      lightboxIndex = currentPhotoIndex;
      showLightboxPhoto(lightboxIndex);
      photoLightbox.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });

    // Close lightbox
    const closeLightbox = () => {
      photoLightbox.classList.add('hidden');
      document.body.style.overflow = '';
    };

    lightboxClose.addEventListener('click', closeLightbox);

    // Close on backdrop click
    photoLightbox.addEventListener('click', (e) => {
      if (e.target === photoLightbox) {
        closeLightbox();
      }
    });

    // Navigation in lightbox
    if (lightboxPrev) {
      lightboxPrev.addEventListener('click', () => {
        lightboxIndex = (lightboxIndex - 1 + lightboxPhotos.length) % lightboxPhotos.length;
        showLightboxPhoto(lightboxIndex);
      });
    }

    if (lightboxNext) {
      lightboxNext.addEventListener('click', () => {
        lightboxIndex = (lightboxIndex + 1) % lightboxPhotos.length;
        showLightboxPhoto(lightboxIndex);
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (photoLightbox.classList.contains('hidden')) return;

      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (lightboxPrev) {
          lightboxIndex = (lightboxIndex - 1 + lightboxPhotos.length) % lightboxPhotos.length;
          showLightboxPhoto(lightboxIndex);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (lightboxNext) {
          lightboxIndex = (lightboxIndex + 1) % lightboxPhotos.length;
          showLightboxPhoto(lightboxIndex);
        }
      }
    });
  }

  function showLightboxPhoto(index) {
    if (index < 0 || index >= lightboxPhotos.length) return;

    lightboxImage.src = lightboxPhotos[index].url;
    lightboxImage.alt = speciesName;
    lightboxCurrent.textContent = index + 1;
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

        // Check if this is the monitoring began date (Dec 23, 2025)
        // Use local timezone constructor to avoid UTC offset issues
        const monitoringBeganDate = new Date(2025, 11, 23); // Month is 0-indexed, so 11 = December
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
            cell.className += ' ring-2 ring-orange-500';
          }

          // Add tooltip
          if (isMonitoringBegan) {
            cell.title = 'Dec 23, 2025 - Monitoring Began';
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
      <div class="w-3 h-3 rounded-sm bg-gray-100 ring-2 ring-orange-500 ml-3"></div>
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
  // Hourly Activity Patterns Chart
  // ============================================================================

  const hourlyPatternsChart = document.getElementById('hourlyPatternsChart');
  const hourlyPatternsLoading = document.getElementById('hourlyPatternsLoading');
  const hourlyPatternsEmpty = document.getElementById('hourlyPatternsEmpty');
  const hourlyPatternsContent = document.getElementById('hourlyPatternsContent');
  const hourlyPatternsLegend = document.getElementById('hourlyPatternsLegend');

  // Fetch species-specific detections for hourly patterns
  if (speciesSlug && hourlyPatternsChart) {
    fetchHourlyPatterns();
  }

  function fetchHourlyPatterns() {
    // Fetch last 30 days of ALL detections, then filter for this species
    // (same approach as explore page)
    const url = `${apiBase}/wasatch-bitworks/detections/recent?days=30`;

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Filter for this species only
        const speciesDetections = (data.detections || []).filter(detection => {
          const detectionSlug = slugify(detection.common_name);
          return detectionSlug === speciesSlug;
        });

        if (speciesDetections.length > 0) {
          renderHourlyPatternsChart(speciesDetections);
        } else {
          showHourlyPatternsEmpty();
        }
      })
      .catch(error => {
        console.error('Error fetching hourly patterns:', error);
        showHourlyPatternsError();
      });
  }

  function renderHourlyPatternsChart(detections) {
    // Hide loading
    if (hourlyPatternsLoading) {
      hourlyPatternsLoading.style.display = 'none';
    }

    // Aggregate detections by day and hour (same logic as charts.js)
    const hourlyByDay = {};
    const days = [];

    detections.forEach(detection => {
      try {
        const date = new Date(detection.detected_at);
        const mtDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Denver' }));
        const hour = mtDate.getHours();
        const dayKey = mtDate.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!hourlyByDay[dayKey]) {
          hourlyByDay[dayKey] = new Array(24).fill(0);
          days.push(dayKey);
        }
        hourlyByDay[dayKey][hour]++;
      } catch (e) {
        console.error('Error parsing date:', detection.detected_at, e);
      }
    });

    // Need at least 2 days of data to show patterns
    if (days.length < 2) {
      showHourlyPatternsEmpty();
      return;
    }

    // Sort days chronologically
    days.sort();

    // Calculate total detections per day and identify top/bottom 10%
    const dayTotals = {};
    days.forEach(dayKey => {
      dayTotals[dayKey] = hourlyByDay[dayKey].reduce((a, b) => a + b, 0);
    });

    const sortedByActivity = [...days].sort((a, b) => dayTotals[b] - dayTotals[a]);
    const topTenPercent = Math.max(1, Math.ceil(days.length * 0.1));
    const topDays = new Set(sortedByActivity.slice(0, topTenPercent));
    const bottomDays = new Set(sortedByActivity.slice(-topTenPercent));

    // Calculate rolling average
    const rollingAverage = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourValues = days.map(dayKey => hourlyByDay[dayKey][hour]);
      const mean = hourValues.reduce((a, b) => a + b, 0) / hourValues.length;
      rollingAverage.push(mean || 0);
    }

    // Calculate average for top 10%
    const topAverage = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourValues = Array.from(topDays).map(dayKey => hourlyByDay[dayKey][hour]);
      const mean = hourValues.reduce((a, b) => a + b, 0) / hourValues.length;
      topAverage.push(mean || 0);
    }

    // Calculate average for bottom 10%
    const bottomAverage = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourValues = Array.from(bottomDays).map(dayKey => hourlyByDay[dayKey][hour]);
      const mean = hourValues.reduce((a, b) => a + b, 0) / hourValues.length;
      bottomAverage.push(mean || 0);
    }

    // Create SVG chart
    const width = 1200;
    const height = 450;
    const padding = { top: 30, right: 60, bottom: 80, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(
      ...days.map(d => Math.max(...hourlyByDay[d])),
      ...rollingAverage,
      ...topAverage,
      ...bottomAverage
    );
    const yScale = maxValue > 0 ? chartHeight / maxValue : 1;
    const xStep = chartWidth / 23;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'w-full h-auto');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Daily hourly activity patterns chart');

    // Draw axes
    const yAxis = createSVGLine(padding.left, padding.top, padding.left, height - padding.bottom, '#e5e7eb');
    svg.appendChild(yAxis);
    const xAxis = createSVGLine(padding.left, height - padding.bottom, width - padding.right, height - padding.bottom, '#e5e7eb');
    svg.appendChild(xAxis);

    // Draw daily lines (thin, gray)
    days.forEach(dayKey => {
      const dayData = hourlyByDay[dayKey];
      let pathData = `M ${padding.left} ${height - padding.bottom - (dayData[0] * yScale)}`;

      for (let hour = 1; hour < 24; hour++) {
        const x = padding.left + (hour * xStep);
        const y = height - padding.bottom - (dayData[hour] * yScale);
        pathData += ` L ${x} ${y}`;
      }

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', '#9ca3af');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0.5');
      svg.appendChild(path);
    });

    // Draw top 10% average line (orange)
    drawSVGLine(svg, topAverage, '#f59e0b', '2', '0.85', padding, xStep, yScale, height);

    // Draw bottom 10% average line (teal)
    drawSVGLine(svg, bottomAverage, '#0891b2', '2', '0.85', padding, xStep, yScale, height);

    // Draw rolling average line (green, bold)
    drawSVGLine(svg, rollingAverage, '#4A7C2C', '3.5', '1', padding, xStep, yScale, height);

    // Draw data points on rolling average
    for (let hour = 0; hour < 24; hour++) {
      const x = padding.left + (hour * xStep);
      const y = height - padding.bottom - (rollingAverage[hour] * yScale);

      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', x);
      dot.setAttribute('cy', y);
      dot.setAttribute('r', '3');
      dot.setAttribute('fill', '#4A7C2C');
      svg.appendChild(dot);
    }

    // X-axis labels (every 3 hours)
    for (let i = 0; i < 24; i += 3) {
      const x = padding.left + (i * xStep);
      const label = createSVGText(x, height - padding.bottom + 20, formatChartHour(i), '11px', '#6b7280', 'middle');
      svg.appendChild(label);
    }

    // Y-axis labels
    const yMid = maxValue / 2;
    const yMidLabel = createSVGText(padding.left - 10, height - padding.bottom - (yMid * yScale), Math.round(yMid).toString(), '11px', '#6b7280', 'end');
    yMidLabel.setAttribute('dominant-baseline', 'middle');
    svg.appendChild(yMidLabel);

    const yMaxLabel = createSVGText(padding.left - 10, padding.top, Math.round(maxValue).toString(), '11px', '#6b7280', 'end');
    yMaxLabel.setAttribute('dominant-baseline', 'middle');
    svg.appendChild(yMaxLabel);

    // Y-axis title
    const yAxisTitle = createSVGText(15, height / 2, 'Detections per hour', '12px', '#9ca3af', 'middle');
    yAxisTitle.setAttribute('dominant-baseline', 'middle');
    yAxisTitle.setAttribute('transform', `rotate(-90 15 ${height / 2})`);
    svg.appendChild(yAxisTitle);

    // Render chart
    hourlyPatternsContent.innerHTML = '';
    hourlyPatternsContent.appendChild(svg);
    hourlyPatternsContent.classList.remove('hidden');
    hourlyPatternsLegend.classList.remove('hidden');
  }

  function drawSVGLine(svg, dataPoints, color, strokeWidth, opacity, padding, xStep, yScale, height) {
    let pathData = `M ${padding.left} ${height - padding.bottom - (dataPoints[0] * yScale)}`;
    for (let hour = 1; hour < 24; hour++) {
      const x = padding.left + (hour * xStep);
      const y = height - padding.bottom - (dataPoints[hour] * yScale);
      pathData += ` L ${x} ${y}`;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', strokeWidth);
    path.setAttribute('fill', 'none');
    path.setAttribute('opacity', opacity);
    svg.appendChild(path);
  }

  function createSVGLine(x1, y1, x2, y2, stroke) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', '1');
    return line;
  }

  function createSVGText(x, y, content, fontSize, fill, anchor) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('font-size', fontSize);
    text.setAttribute('fill', fill);
    text.setAttribute('text-anchor', anchor);
    text.setAttribute('font-family', 'Inter, sans-serif');
    text.textContent = content;
    return text;
  }

  function formatChartHour(hour) {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  }

  function showHourlyPatternsEmpty() {
    if (hourlyPatternsLoading) {
      hourlyPatternsLoading.style.display = 'none';
    }
    if (hourlyPatternsEmpty) {
      hourlyPatternsEmpty.classList.remove('hidden');
    }
  }

  function showHourlyPatternsError() {
    if (hourlyPatternsLoading) {
      hourlyPatternsLoading.innerHTML = `
        <div class="text-center py-8">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-gray-600">Unable to load activity patterns</p>
        </div>
      `;
    }
  }

  // ============================================================================
  // Audio Fetching & Rendering
  // ============================================================================

  // Today's Detections Section
  const todayListContainer = document.getElementById('todayList');
  const todayLoadingEl = document.getElementById('todayLoading');
  const todayEmptyEl = document.getElementById('todayEmpty');

  // Best Preserved Section
  const audioListContainer = document.getElementById('audioList');
  const audioLoadingEl = document.getElementById('audioLoading');
  const audioEmptyEl = document.getElementById('audioEmpty');

  // Fetch both on page load
  if (speciesSlug) {
    if (todayListContainer) fetchTodayDetections();
    if (audioListContainer) fetchPreservedAudio();
  }

  function fetchTodayDetections() {
    // Fetch ALL of today's detections and filter for this species
    const url = `${apiBase}/wasatch-bitworks/latest?date=today`;

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Filter for this species only
        const speciesDetections = (data.detections || []).filter(detection => {
          const detectionSlug = slugify(detection.common_name);
          return detectionSlug === speciesSlug;
        });

        // Sort by confidence (highest first) and take top 5
        speciesDetections.sort((a, b) => b.confidence - a.confidence);
        const top5 = speciesDetections.slice(0, 5);

        renderTodayList(top5);
      })
      .catch(error => {
        console.error('Error fetching today\'s detections:', error);
        showTodayError();
      });
  }

  // Slugify function to match Eleventy's slugify filter
  function slugify(text) {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(/[^\w\-]+/g, '')       // Remove non-word characters (except hyphens)
      .replace(/\-\-+/g, '-')         // Replace multiple hyphens with single hyphen
      .replace(/^-+/, '')             // Trim hyphens from start
      .replace(/-+$/, '');            // Trim hyphens from end
  }

  function fetchPreservedAudio() {
    const url = `${apiBase}/wasatch-bitworks/detections/species/${speciesSlug}?preserved=true&limit=10`;

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

  function renderTodayList(detections) {
    // Hide loading indicator
    if (todayLoadingEl) {
      todayLoadingEl.style.display = 'none';
    }

    // Show empty state if no detections
    if (!detections || detections.length === 0) {
      if (todayEmptyEl) {
        todayEmptyEl.classList.remove('hidden');
      }
      return;
    }

    // Clear container and render audio items
    todayListContainer.innerHTML = '';

    detections.forEach((detection, index) => {
      const audioItem = createAudioItem(detection, index + 1);
      todayListContainer.appendChild(audioItem);
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

  function showTodayError() {
    if (todayLoadingEl) {
      todayLoadingEl.innerHTML = `
        <div class="bg-red-50 rounded-lg p-8 text-center">
          <svg class="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-red-700 font-medium">Error loading today's detections</p>
          <p class="text-red-600 text-sm mt-1">Please try refreshing the page</p>
        </div>
      `;
    }
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
