import type { Plugin } from 'chart.js';
import { Chart } from 'chart.js'

interface VerticalLinePlugin extends Plugin<'line'> {
  mouseX: number | null;
  _draw(chart: Chart<'line'>, x: number): void;
}

/**
 * Factory that creates a Chart.js plugin drawing a vertical cursor line.
 *
 * The plugin tracks pointer and touch events on the canvas and redraws a
 * 1 px semi-transparent line at the current horizontal position after every
 * chart render cycle (`afterDraw` hook).
 *
 * One plugin instance per chart is required (the instance holds mutable state).
 *
 * @returns A Chart.js {@link Plugin} object ready to pass in the `plugins` array.
 *
 * @example
 * ```ts
 * const vlPlugin = createVerticalLinePlugin()
 * new Chart(canvas, { ..., plugins: [vlPlugin] })
 * // Later, move the line programmatically:
 * vlPlugin.mouseX = chart.scales['x']!.getPixelForValue(index)
 * chart.update('none')
 * ```
 */
function createVerticalLinePlugin() {

  const verticalLinePlugin: VerticalLinePlugin = {

    id: 'verticalLinePlugin',

    /** Current horizontal pixel position of the cursor line; null hides the line. */
    mouseX: null,

    _draw(chart, x: number) {
      const ctx = chart.ctx;
      const topY = chart.chartArea.top;
      const bottomY = chart.chartArea.bottom;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.stroke();
      ctx.restore();
    },

    afterInit: (chart) => {
      const canvas = chart.canvas

      // pointermove does not work reliably on iOS — use mouse/touch events directly
      canvas.addEventListener('mouseenter', (event) => {
        chart.render(); // clear any stale line from a previous hover
        const rect = canvas.getBoundingClientRect();
        verticalLinePlugin.mouseX = event.clientX - rect.left;
      });

      canvas.addEventListener('touchstart', (event) => {
        chart.render();
        const rect = canvas.getBoundingClientRect();
        if (event.touches.length === 0) return;
        if (event.touches.length > 1) return; // single-touch only
        const client = event.touches[0]!;
        verticalLinePlugin.mouseX = client.clientX - rect.left;
      });

      canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        verticalLinePlugin.mouseX = event.clientX - rect.left;
      });

      canvas.addEventListener('touchmove', (event) => {
        const rect = canvas.getBoundingClientRect();
        if (event.touches.length === 0) return;
        if (event.touches.length > 1) return;
        const client = event.touches[0]!;
        verticalLinePlugin.mouseX = client.clientX - rect.left;
      });

      // mouseleave / touchend: intentionally not clearing mouseX so the line
      // stays at its last position after the pointer leaves.
      canvas.addEventListener('mouseleave', () => { /* noop */ });
      canvas.addEventListener('touchend', () => { /* noop */ });
    },

    afterDraw: (chart) => {
      const x = verticalLinePlugin.mouseX
      if (
        x === null ||
        x < chart.chartArea.left ||   // pointer left of the plot area
        x > chart.chartArea.right     // pointer right of the plot area
      ) return;
      verticalLinePlugin._draw(chart, x)
    }
  };
  return verticalLinePlugin
}

export { createVerticalLinePlugin }
export type { VerticalLinePlugin }
