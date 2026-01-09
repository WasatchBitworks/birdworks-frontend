/**
 * BirdWorks Charts - Progressive Enhancement
 * Replaces server-rendered fallback lists with SVG bar charts
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCharts);
  } else {
    initCharts();
  }

  function initCharts() {
    // Initialize daily detections chart (homepage)
    const dailyContainer = document.querySelector('[data-chart="daily"]');
    if (dailyContainer) {
      const dailyData = extractDailyData(dailyContainer);
      if (dailyData.length > 0) {
        renderDailyChart(dailyContainer, dailyData);
      }
    }

    // Initialize species chart (homepage)
    const speciesContainer = document.querySelector('[data-chart="species"]');
    if (speciesContainer) {
      const speciesData = extractSpeciesData(speciesContainer);
      if (speciesData.length > 0) {
        renderSpeciesChart(speciesContainer, speciesData);
      }
    }

    // Initialize extended timeline (explore page)
    const timelineContainer = document.querySelector('[data-chart="timeline-extended"]');
    if (timelineContainer) {
      const timelineData = extractTableData(timelineContainer);
      if (timelineData.length > 0) {
        renderExtendedTimeline(timelineContainer, timelineData);
      }
    }

    // Initialize daily summary chart (explore page)
    const summaryContainer = document.querySelector('[data-chart="daily-summary"]');
    if (summaryContainer) {
      const detectionsJson = summaryContainer.getAttribute('data-detections');
      const dateStr = summaryContainer.getAttribute('data-date');
      const updatedStr = summaryContainer.getAttribute('data-updated');
      if (detectionsJson) {
        try {
          const detections = JSON.parse(detectionsJson);
          const summaryData = aggregateSpeciesByHour(detections);
          if (summaryData.species.length > 0) {
            renderDailySummary(summaryContainer, summaryData, dateStr, updatedStr);
          }
        } catch (e) {
          console.error('Failed to parse detections for summary:', e);
        }
      }
    }

    // Initialize hourly activity chart (explore page)
    const hourlyContainer = document.querySelector('[data-chart="hourly-activity"]');
    if (hourlyContainer) {
      const detectionsJson = hourlyContainer.getAttribute('data-detections');
      if (detectionsJson) {
        try {
          const detections = JSON.parse(detectionsJson);
          const hourlyData = aggregateByHour(detections);
          if (hourlyData.length > 0) {
            renderHourlyActivity(hourlyContainer, hourlyData);
          }
        } catch (e) {
          console.error('Failed to parse detections:', e);
        }
      }
    }

    // Initialize day of week chart (explore page)
    const dayOfWeekContainer = document.querySelector('[data-chart="day-of-week"]');
    if (dayOfWeekContainer) {
      const dailyJson = dayOfWeekContainer.getAttribute('data-daily');
      if (dailyJson) {
        try {
          const dailyData = JSON.parse(dailyJson);
          if (dailyData.length > 0) {
            // Convert to format expected by aggregateByDayOfWeek
            const dailyFormatted = dailyData.map(d => ({
              label: d.date,
              value: d.count
            }));
            const weekData = aggregateByDayOfWeek(dailyFormatted);
            if (weekData.length > 0) {
              renderDayOfWeek(dayOfWeekContainer, weekData);
            }
          }
        } catch (e) {
          console.error('Failed to parse daily data for day-of-week:', e);
        }
      }
    }

    // Initialize species comparison (explore page)
    const comparisonContainer = document.querySelector('[data-chart="species-comparison"]');
    if (comparisonContainer) {
      const comparisonData = extractTableData(comparisonContainer);
      if (comparisonData.length > 0) {
        renderSpeciesComparison(comparisonContainer, comparisonData);
      }
    }
  }

  /**
   * Extract daily detection data from server-rendered HTML
   */
  function extractDailyData(container) {
    const rows = container.querySelectorAll('.flex.justify-between');
    const data = [];

    rows.forEach(row => {
      const spans = row.querySelectorAll('span');
      if (spans.length === 2) {
        const date = spans[0].textContent.trim();
        const count = parseInt(spans[1].textContent.trim(), 10);
        if (!isNaN(count)) {
          data.push({ date, count });
        }
      }
    });

    return data;
  }

  /**
   * Extract species data from server-rendered HTML
   */
  function extractSpeciesData(container) {
    const rows = container.querySelectorAll('.flex.justify-between');
    const data = [];

    rows.forEach(row => {
      const nameDiv = row.querySelector('.text-sm.font-medium');
      const countSpan = row.querySelector('.font-semibold.text-gray-900');

      if (nameDiv && countSpan) {
        const name = nameDiv.textContent.trim();
        const count = parseInt(countSpan.textContent.trim(), 10);
        if (!isNaN(count)) {
          data.push({ name, count });
        }
      }
    });

    return data;
  }

  /**
   * Render daily detections chart (vertical bars)
   */
  function renderDailyChart(container, data) {
    const width = 600;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 60, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxCount = Math.max(...data.map(d => d.count));
    const barWidth = chartWidth / data.length;

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'w-full h-auto');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Daily detections bar chart');

    // Y-axis line
    const yAxis = createLine(padding.left, padding.top, padding.left, height - padding.bottom, '#e5e7eb');
    svg.appendChild(yAxis);

    // X-axis line
    const xAxis = createLine(padding.left, height - padding.bottom, width - padding.right, height - padding.bottom, '#e5e7eb');
    svg.appendChild(xAxis);

    // Draw bars
    data.forEach((d, i) => {
      const barHeight = maxCount > 0 ? (d.count / maxCount) * chartHeight : 0;
      const x = padding.left + (i * barWidth) + (barWidth * 0.1);
      const y = height - padding.bottom - barHeight;
      const barWidthActual = barWidth * 0.8;

      // Bar
      const bar = createRect(x, y, barWidthActual, barHeight, '#4A7C2C');
      bar.setAttribute('rx', '2');
      svg.appendChild(bar);

      // Count label on top of bar
      if (d.count > 0) {
        const label = createText(x + barWidthActual / 2, y - 5, d.count.toString(), '12px', '#374151', 'middle');
        svg.appendChild(label);
      }

      // Date label (abbreviated)
      const dateLabel = formatDateShort(d.date);
      const dateText = createText(
        x + barWidthActual / 2,
        height - padding.bottom + 15,
        dateLabel,
        '10px',
        '#6b7280',
        'middle'
      );
      dateText.setAttribute('transform', `rotate(-45 ${x + barWidthActual / 2} ${height - padding.bottom + 15})`);
      svg.appendChild(dateText);
    });

    // Replace content with chart
    container.innerHTML = '';
    container.appendChild(svg);
  }

  /**
   * Render top species chart (horizontal bars)
   */
  function renderSpeciesChart(container, data) {
    const width = 600;
    const height = Math.max(300, data.length * 30);
    const padding = { top: 10, right: 60, bottom: 10, left: 150 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxCount = Math.max(...data.map(d => d.count));
    const barHeight = (chartHeight / data.length) * 0.8;
    const barSpacing = chartHeight / data.length;

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'w-full h-auto');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Top species bar chart');

    // Draw bars
    data.forEach((d, i) => {
      const barWidth = maxCount > 0 ? (d.count / maxCount) * chartWidth : 0;
      const x = padding.left;
      const y = padding.top + (i * barSpacing) + ((barSpacing - barHeight) / 2);

      // Bar
      const bar = createRect(x, y, barWidth, barHeight, '#7BB3E8');
      bar.setAttribute('rx', '2');
      svg.appendChild(bar);

      // Species name label (left side)
      const nameLabel = createText(padding.left - 10, y + barHeight / 2, d.name, '12px', '#374151', 'end');
      nameLabel.setAttribute('dominant-baseline', 'middle');
      svg.appendChild(nameLabel);

      // Count label (right of bar)
      const countLabel = createText(x + barWidth + 5, y + barHeight / 2, d.count.toString(), '12px', '#374151', 'start');
      countLabel.setAttribute('dominant-baseline', 'middle');
      svg.appendChild(countLabel);
    });

    // Replace content with chart
    container.innerHTML = '';
    container.appendChild(svg);
  }

  /**
   * Helper: Create SVG line element
   */
  function createLine(x1, y1, x2, y2, stroke) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', '1');
    return line;
  }

  /**
   * Helper: Create SVG rect element
   */
  function createRect(x, y, width, height, fill) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', fill);
    return rect;
  }

  /**
   * Helper: Create SVG text element
   */
  function createText(x, y, content, fontSize, fill, anchor) {
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

  /**
   * Helper: Format date to short format (MM/DD)
   */
  function formatDateShort(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`;
    }
    return dateStr;
  }

  /**
   * Helper: Extract table data (for generic tables)
   */
  function extractTableData(container) {
    if (!container) return [];
    const rows = container.querySelectorAll('tbody tr');
    const data = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        const label = cells[0].textContent.trim();
        const value = parseInt(cells[1].textContent.trim(), 10);
        if (!isNaN(value)) {
          data.push({ label, value });
        }
      }
    });

    return data;
  }

  /**
   * Aggregate detections by hour (0-23)
   */
  function aggregateByHour(detections) {
    const hourCounts = new Array(24).fill(0);

    detections.forEach(detection => {
      try {
        const date = new Date(detection.detected_at);
        // Convert to Mountain Time
        const mtDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Denver' }));
        const hour = mtDate.getHours();
        hourCounts[hour]++;
      } catch (e) {
        console.error('Error parsing date:', detection.detected_at, e);
      }
    });

    return hourCounts.map((count, hour) => ({
      hour: hour,
      label: formatHour(hour),
      count: count
    }));
  }

  /**
   * Aggregate detections by species and hour
   * Returns: { species: [{name, total, hourly: [24 counts]}], maxHourly }
   */
  function aggregateSpeciesByHour(detections) {
    const speciesMap = new Map();

    // First pass: aggregate by species and hour
    detections.forEach(detection => {
      try {
        const name = detection.common_name;
        const date = new Date(detection.detected_at);
        const mtDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Denver' }));
        const hour = mtDate.getHours();

        if (!speciesMap.has(name)) {
          speciesMap.set(name, {
            name: name,
            total: 0,
            hourly: new Array(24).fill(0)
          });
        }

        const species = speciesMap.get(name);
        species.total++;
        species.hourly[hour]++;
      } catch (e) {
        console.error('Error parsing detection:', detection, e);
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
   * Aggregate daily data by day of week
   */
  function aggregateByDayOfWeek(dailyData) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = new Array(7).fill(0);
    const dayOccurrences = new Array(7).fill(0);

    dailyData.forEach(item => {
      try {
        const date = new Date(item.label + 'T00:00:00');
        const dayOfWeek = date.getDay();
        dayCounts[dayOfWeek] += item.value;
        dayOccurrences[dayOfWeek]++;
      } catch (e) {
        console.error('Error parsing date:', item.label, e);
      }
    });

    return dayNames.map((name, index) => ({
      day: name,
      count: dayOccurrences[index] > 0 ? Math.round(dayCounts[index] / dayOccurrences[index]) : 0
    }));
  }

  /**
   * Format hour (0-23) to 12-hour format
   */
  function formatHour(hour) {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  }

  /**
   * Get heatmap color based on intensity (0.0 to 1.0)
   * Creates gradient: light green → dark green → purple → red
   */
  function getHeatmapColor(intensity) {
    if (intensity === 0) return '#f9fafb'; // Empty/white

    // Define color stops: light green → dark green → purple → red
    const colorStops = [
      { threshold: 0.0, color: { r: 220, g: 252, b: 231 } },  // Very light green
      { threshold: 0.25, color: { r: 134, g: 239, b: 172 } }, // Light green
      { threshold: 0.5, color: { r: 34, g: 197, b: 94 } },    // Medium green
      { threshold: 0.65, color: { r: 16, g: 185, b: 129 } },  // Dark green/teal
      { threshold: 0.75, color: { r: 139, g: 92, b: 246 } },  // Purple
      { threshold: 0.85, color: { r: 220, g: 38, b: 127 } },  // Magenta
      { threshold: 1.0, color: { r: 239, g: 68, b: 68 } }     // Red
    ];

    // Find the two color stops to interpolate between
    let lowerStop = colorStops[0];
    let upperStop = colorStops[1];

    for (let i = 0; i < colorStops.length - 1; i++) {
      if (intensity >= colorStops[i].threshold && intensity <= colorStops[i + 1].threshold) {
        lowerStop = colorStops[i];
        upperStop = colorStops[i + 1];
        break;
      }
    }

    // Interpolate between the two colors
    const range = upperStop.threshold - lowerStop.threshold;
    const normalizedIntensity = (intensity - lowerStop.threshold) / range;

    const r = Math.round(lowerStop.color.r + (upperStop.color.r - lowerStop.color.r) * normalizedIntensity);
    const g = Math.round(lowerStop.color.g + (upperStop.color.g - lowerStop.color.g) * normalizedIntensity);
    const b = Math.round(lowerStop.color.b + (upperStop.color.b - lowerStop.color.b) * normalizedIntensity);

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Render extended timeline chart (all available data)
   */
  function renderExtendedTimeline(container, data) {
    const width = 800;
    const height = 400;
    const padding = { top: 20, right: 20, bottom: 80, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxCount = Math.max(...data.map(d => d.value));
    const barWidth = chartWidth / data.length;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'w-full h-auto');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Extended timeline chart');

    // Y-axis line
    const yAxis = createLine(padding.left, padding.top, padding.left, height - padding.bottom, '#e5e7eb');
    svg.appendChild(yAxis);

    // X-axis line
    const xAxis = createLine(padding.left, height - padding.bottom, width - padding.right, height - padding.bottom, '#e5e7eb');
    svg.appendChild(xAxis);

    // Draw bars (only show every 3rd date label to avoid crowding)
    data.forEach((d, i) => {
      const barHeight = maxCount > 0 ? (d.value / maxCount) * chartHeight : 0;
      const x = padding.left + (i * barWidth) + (barWidth * 0.1);
      const y = height - padding.bottom - barHeight;
      const barWidthActual = barWidth * 0.8;

      // Bar
      const bar = createRect(x, y, barWidthActual, barHeight, '#4A7C2C');
      bar.setAttribute('rx', '2');
      svg.appendChild(bar);

      // Count label on top of bar (only if space permits)
      if (d.value > 0 && barWidth > 15) {
        const label = createText(x + barWidthActual / 2, y - 5, d.value.toString(), '10px', '#374151', 'middle');
        svg.appendChild(label);
      }

      // Date label (show every 3rd to avoid crowding)
      if (i % 3 === 0 || i === data.length - 1) {
        const dateLabel = formatDateShort(d.label);
        const dateText = createText(
          x + barWidthActual / 2,
          height - padding.bottom + 15,
          dateLabel,
          '10px',
          '#6b7280',
          'middle'
        );
        dateText.setAttribute('transform', `rotate(-45 ${x + barWidthActual / 2} ${height - padding.bottom + 15})`);
        svg.appendChild(dateText);
      }
    });

    container.innerHTML = '';
    container.appendChild(svg);
  }

  /**
   * Render hourly activity chart (horizontal bars)
   */
  function renderHourlyActivity(container, data) {
    const width = 600;
    const height = 600;
    const padding = { top: 10, right: 60, bottom: 10, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxCount = Math.max(...data.map(d => d.count));
    const barHeight = (chartHeight / data.length) * 0.8;
    const barSpacing = chartHeight / data.length;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'w-full h-auto');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Hourly activity chart');

    // Draw bars
    data.forEach((d, i) => {
      const barWidth = maxCount > 0 ? (d.count / maxCount) * chartWidth : 0;
      const x = padding.left;
      const y = padding.top + (i * barSpacing) + ((barSpacing - barHeight) / 2);

      // Bar
      const bar = createRect(x, y, barWidth, barHeight, '#F4A261');
      bar.setAttribute('rx', '2');
      svg.appendChild(bar);

      // Hour label (left side)
      const hourLabel = createText(padding.left - 10, y + barHeight / 2, d.label, '10px', '#374151', 'end');
      hourLabel.setAttribute('dominant-baseline', 'middle');
      svg.appendChild(hourLabel);

      // Count label (right of bar)
      if (d.count > 0) {
        const countLabel = createText(x + barWidth + 5, y + barHeight / 2, d.count.toString(), '10px', '#374151', 'start');
        countLabel.setAttribute('dominant-baseline', 'middle');
        svg.appendChild(countLabel);
      }
    });

    container.innerHTML = '';
    container.appendChild(svg);
  }

  /**
   * Render day of week chart (vertical bars)
   */
  function renderDayOfWeek(container, data) {
    const width = 600;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 60, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxCount = Math.max(...data.map(d => d.count));
    const barWidth = chartWidth / data.length;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'w-full h-auto');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Day of week patterns chart');

    // Y-axis line
    const yAxis = createLine(padding.left, padding.top, padding.left, height - padding.bottom, '#e5e7eb');
    svg.appendChild(yAxis);

    // X-axis line
    const xAxis = createLine(padding.left, height - padding.bottom, width - padding.right, height - padding.bottom, '#e5e7eb');
    svg.appendChild(xAxis);

    // Draw bars
    data.forEach((d, i) => {
      const barHeight = maxCount > 0 ? (d.count / maxCount) * chartHeight : 0;
      const x = padding.left + (i * barWidth) + (barWidth * 0.1);
      const y = height - padding.bottom - barHeight;
      const barWidthActual = barWidth * 0.8;

      // Bar
      const bar = createRect(x, y, barWidthActual, barHeight, '#7BB3E8');
      bar.setAttribute('rx', '2');
      svg.appendChild(bar);

      // Count label on top of bar
      if (d.count > 0) {
        const label = createText(x + barWidthActual / 2, y - 5, d.count.toString(), '11px', '#374151', 'middle');
        svg.appendChild(label);
      }

      // Day label (abbreviated)
      const dayLabel = d.day.substring(0, 3);
      const dayText = createText(
        x + barWidthActual / 2,
        height - padding.bottom + 20,
        dayLabel,
        '11px',
        '#6b7280',
        'middle'
      );
      svg.appendChild(dayText);
    });

    container.innerHTML = '';
    container.appendChild(svg);
  }

  /**
   * Render species comparison chart (horizontal bars for top 15)
   */
  function renderSpeciesComparison(container, data) {
    const width = 700;
    const height = Math.max(400, data.length * 28);
    const padding = { top: 10, right: 60, bottom: 10, left: 180 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxCount = Math.max(...data.map(d => d.value));
    const barHeight = (chartHeight / data.length) * 0.85;
    const barSpacing = chartHeight / data.length;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'w-full h-auto');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Species comparison chart');

    // Draw bars
    data.forEach((d, i) => {
      const barWidth = maxCount > 0 ? (d.value / maxCount) * chartWidth : 0;
      const x = padding.left;
      const y = padding.top + (i * barSpacing) + ((barSpacing - barHeight) / 2);

      // Bar
      const bar = createRect(x, y, barWidth, barHeight, '#7BB3E8');
      bar.setAttribute('rx', '2');
      svg.appendChild(bar);

      // Species name label (left side) - truncate if too long
      const nameLabel = d.label.length > 20 ? d.label.substring(0, 18) + '...' : d.label;
      const label = createText(padding.left - 10, y + barHeight / 2, nameLabel, '11px', '#374151', 'end');
      label.setAttribute('dominant-baseline', 'middle');
      svg.appendChild(label);

      // Count label (right of bar)
      const countLabel = createText(x + barWidth + 5, y + barHeight / 2, d.value.toString(), '11px', '#374151', 'start');
      countLabel.setAttribute('dominant-baseline', 'middle');
      svg.appendChild(countLabel);
    });

    container.innerHTML = '';
    container.appendChild(svg);
  }

  /**
   * Render Daily Detections Summary (combined bar chart + heatmap)
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

    // Header section
    const headerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Title
    const title = createText(padding.left, 25, 'Daily Detections Summary', '18px', '#1f2937', 'start');
    title.setAttribute('font-weight', 'bold');
    headerGroup.appendChild(title);

    // Metadata
    const metaY = 45;
    const speciesCount = createText(padding.left, metaY, `${numSpecies} species detected`, '12px', '#6b7280', 'start');
    headerGroup.appendChild(speciesCount);

    // Format updated time
    let updatedTime = '';
    if (updatedStr) {
      try {
        const date = new Date(updatedStr);
        updatedTime = date.toLocaleString('en-US', {
          timeZone: 'America/Denver',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } catch (e) {
        updatedTime = 'just now';
      }
    }
    const lastUpdated = createText(padding.left + 150, metaY, `Last updated: ${updatedTime} MT`, '12px', '#6b7280', 'start');
    headerGroup.appendChild(lastUpdated);

    svg.appendChild(headerGroup);

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
          // Get heatmap color based on count intensity
          const intensity = count / data.maxHourly;
          const color = getHeatmapColor(intensity);
          const cell = createRect(cellX, cellY, cellSize - 2, cellH, color);
          cell.setAttribute('rx', '2');
          svg.appendChild(cell);

          // Add count text - white for darker colors, dark for lighter colors
          if (cellSize >= 24) {
            const textColor = intensity > 0.5 ? '#ffffff' : '#374151';
            const countText = createText(cellX + cellSize / 2 - 1, cellY + cellH / 2, count.toString(), '9px', textColor, 'middle');
            countText.setAttribute('dominant-baseline', 'middle');
            countText.setAttribute('font-weight', 'bold');
            svg.appendChild(countText);
          }
        } else {
          // Empty cell with light border
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
    for (let hour = 0; hour < 24; hour += 3) { // Show every 3 hours to avoid crowding
      const hourX = heatmapStartX + (hour * cellSize) + cellSize / 2 - 1;
      const hourLabel = createText(hourX, hourLabelsY, hour.toString(), '10px', '#6b7280', 'middle');
      svg.appendChild(hourLabel);
    }

    // "Hour (MT)" label
    const hourAxisLabel = createText(heatmapStartX + heatmapWidth / 2, hourLabelsY + 15, 'Hour of Day (MT)', '11px', '#6b7280', 'middle');
    hourAxisLabel.setAttribute('font-style', 'italic');
    svg.appendChild(hourAxisLabel);

    // Add color legend
    const legendY = 35;
    const legendX = width - 350;
    const legendWidth = 200;
    const legendHeight = 12;
    const gradientId = 'heatmap-gradient';

    // Create gradient definition
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', gradientId);
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('x2', '100%');

    // Add color stops to gradient
    const stops = [
      { offset: '0%', color: 'rgb(220, 252, 231)' },
      { offset: '25%', color: 'rgb(134, 239, 172)' },
      { offset: '50%', color: 'rgb(34, 197, 94)' },
      { offset: '65%', color: 'rgb(16, 185, 129)' },
      { offset: '75%', color: 'rgb(139, 92, 246)' },
      { offset: '85%', color: 'rgb(220, 38, 127)' },
      { offset: '100%', color: 'rgb(239, 68, 68)' }
    ];

    stops.forEach(stop => {
      const stopEl = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stopEl.setAttribute('offset', stop.offset);
      stopEl.setAttribute('stop-color', stop.color);
      gradient.appendChild(stopEl);
    });

    defs.appendChild(gradient);
    svg.appendChild(defs);

    // Draw legend bar
    const legendBar = createRect(legendX, legendY, legendWidth, legendHeight, `url(#${gradientId})`);
    legendBar.setAttribute('rx', '2');
    legendBar.setAttribute('stroke', '#d1d5db');
    legendBar.setAttribute('stroke-width', '1');
    svg.appendChild(legendBar);

    // Legend labels
    const legendLabelY = legendY - 3;
    const legendLabel = createText(legendX, legendLabelY, 'Detections:', '10px', '#6b7280', 'start');
    svg.appendChild(legendLabel);

    const lowLabel = createText(legendX, legendY + legendHeight + 12, 'Low', '9px', '#6b7280', 'start');
    svg.appendChild(lowLabel);

    const highLabel = createText(legendX + legendWidth, legendY + legendHeight + 12, 'High', '9px', '#6b7280', 'end');
    svg.appendChild(highLabel);

    container.innerHTML = '';
    container.appendChild(svg);
  }

})();
