"""
Python Data Visualization — Interactive Studio Example
Text-based charts using Unicode block characters.
No ANSI colors — works in any plain-text console.
"""

import math
import random

random.seed(42)

# ── Unicode block characters for sub-character precision ─────────────
BAR_CHARS = " ▏▎▍▌▋▊▉█"
SPARK_CHARS = "▁▂▃▄▅▆▇█"


def horizontal_bar_chart(title: str, data: list[tuple[str, float]]) -> None:
    """Render a horizontal bar chart with sub-character-width precision."""
    print(f"\n{'=' * 56}")
    print(f"  {title}")
    print(f"{'=' * 56}")

    max_val = max(v for _, v in data)
    max_label = max(len(label) for label, _ in data)
    bar_width = 35

    for label, value in data:
        # Calculate bar length with sub-character precision
        ratio = value / max_val
        full_blocks = int(ratio * bar_width)
        remainder = (ratio * bar_width) - full_blocks
        partial_idx = int(remainder * (len(BAR_CHARS) - 1))
        partial = BAR_CHARS[partial_idx] if full_blocks < bar_width else ""

        bar = "█" * full_blocks + partial
        print(f"  {label:>{max_label}}  {bar} {value:.1f}%")

    print()


def sparkline(label: str, values: list[float]) -> str:
    """Generate a sparkline string from a list of values."""
    if not values:
        return ""
    lo, hi = min(values), max(values)
    spread = hi - lo if hi != lo else 1
    chars = []
    for v in values:
        idx = int((v - lo) / spread * (len(SPARK_CHARS) - 1))
        chars.append(SPARK_CHARS[idx])
    line = "".join(chars)
    return f"  {label:>12}  {line}  (min:{lo:.0f} max:{hi:.0f})"


def sparklines_panel() -> None:
    """Display multiple sparkline metrics."""
    print(f"\n{'=' * 56}")
    print("  30-Day Sparklines")
    print(f"{'=' * 56}")

    # Simulated 30-day data
    visits = [200 + random.gauss(0, 40) + i * 3 for i in range(30)]
    signups = [max(5, 20 + random.gauss(0, 8) + math.sin(i / 3) * 10) for i in range(30)]
    errors = [max(0, 5 + random.gauss(0, 3) - i * 0.1) for i in range(30)]

    print(sparkline("Visits", visits))
    print(sparkline("Signups", signups))
    print(sparkline("Errors", errors))
    print()


def scatter_plot(title: str, width: int = 50, height: int = 18) -> None:
    """Render a text-based scatter plot of sin(x) with noise."""
    print(f"\n{'=' * 56}")
    print(f"  {title}")
    print(f"{'=' * 56}")

    # Generate data: sin(x) + Gaussian noise
    n_points = 40
    xs = [i * 2 * math.pi / n_points for i in range(n_points)]
    ys = [math.sin(x) + random.gauss(0, 0.15) for x in xs]

    x_min, x_max = min(xs), max(xs)
    y_min, y_max = min(ys) - 0.1, max(ys) + 0.1

    # Build grid
    grid = [[" " for _ in range(width)] for _ in range(height)]

    # Plot points
    for x, y in zip(xs, ys):
        col = int((x - x_min) / (x_max - x_min) * (width - 1))
        row = int((1 - (y - y_min) / (y_max - y_min)) * (height - 1))
        row = max(0, min(height - 1, row))
        col = max(0, min(width - 1, col))
        grid[row][col] = "●"

    # Draw Y axis with labels
    for r in range(height):
        y_val = y_max - r * (y_max - y_min) / (height - 1)
        if r == 0 or r == height - 1 or r == height // 2:
            label = f"{y_val:>6.2f}"
        else:
            label = "      "
        line = "".join(grid[r])
        print(f"  {label} |{line}|")

    # X axis
    print(f"         {'─' * width}")
    x_label_0 = f"{x_min:.1f}"
    x_label_mid = f"{(x_min + x_max) / 2:.1f}"
    x_label_end = f"{x_max:.1f}"
    spacing = width - len(x_label_0) - len(x_label_mid) - len(x_label_end)
    left_pad = spacing // 2
    right_pad = spacing - left_pad
    print(f"         {x_label_0}{' ' * left_pad}{x_label_mid}{' ' * right_pad}{x_label_end}")
    print(f"         {'sin(x) + noise':^{width}}")
    print()


def histogram(title: str, n: int = 500, bins: int = 20, height: int = 12) -> None:
    """Render a vertical histogram of normally distributed data."""
    print(f"\n{'=' * 56}")
    print(f"  {title}")
    print(f"{'=' * 56}")

    # Generate normal distribution
    data = [random.gauss(0, 1) for _ in range(n)]

    # Compute bins
    lo, hi = min(data), max(data)
    bin_width = (hi - lo) / bins
    counts = [0] * bins
    for v in data:
        idx = min(int((v - lo) / bin_width), bins - 1)
        counts[idx] += 1

    max_count = max(counts)

    # Render vertical bars
    for row in range(height, 0, -1):
        threshold = row / height * max_count
        line = ""
        for c in counts:
            if c >= threshold:
                line += "██"
            else:
                line += "  "
        # Y-axis label
        if row == height or row == 1 or row == height // 2:
            label = f"{int(threshold):>3}"
        else:
            label = "   "
        print(f"  {label} |{line}|")

    # X axis
    print(f"      +{'──' * bins}+")
    print(f"       {lo:>5.1f}{' ' * (bins * 2 - 12)}{hi:>5.1f}")

    # Summary statistics
    mean = sum(data) / n
    variance = sum((x - mean) ** 2 for x in data) / n
    std = math.sqrt(variance)
    print(f"\n  n={n}  mean={mean:.3f}  std={std:.3f}  min={lo:.2f}  max={hi:.2f}")
    print()


def main() -> None:
    print()
    print("  ╔══════════════════════════════════════════════════╗")
    print("  ║        Python Data Visualization Demo           ║")
    print("  ║        Unicode Charts — No ANSI Colors          ║")
    print("  ╚══════════════════════════════════════════════════╝")

    # 1. Horizontal bar chart
    languages = [
        ("Python", 28.1),
        ("JavaScript", 17.4),
        ("Java", 15.8),
        ("C/C++", 12.6),
        ("C#", 7.3),
        ("TypeScript", 6.9),
        ("Go", 4.5),
        ("Rust", 3.2),
        ("Swift", 2.4),
        ("Kotlin", 1.8),
    ]
    horizontal_bar_chart("Programming Language Popularity (%)", languages)

    # 2. Sparklines
    sparklines_panel()

    # 3. Scatter plot
    scatter_plot("Scatter Plot: sin(x) + Gaussian Noise")

    # 4. Histogram
    histogram("Histogram: Normal Distribution (n=500)")

    print("=" * 56)
    print("  All charts rendered with Unicode — no ANSI colors!")
    print("=" * 56)


if __name__ == "__main__":
    main()
