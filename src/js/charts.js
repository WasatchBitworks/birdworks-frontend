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
    // Initialize daily detections chart
    const dailyContainer = document.querySelector('[data-chart="daily"]');
    if (dailyContainer) {
      const dailyData = extractDailyData(dailyContainer);
      if (dailyData.length > 0) {
        renderDailyChart(dailyContainer, dailyData);
      }
    }

    // Initialize species chart
    const speciesContainer = document.querySelector('[data-chart="species"]');
    if (speciesContainer) {
      const speciesData = extractSpeciesData(speciesContainer);
      if (speciesData.length > 0) {
        renderSpeciesChart(speciesContainer, speciesData);
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

})();
