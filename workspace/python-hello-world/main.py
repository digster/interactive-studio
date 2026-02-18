"""
Python Hello World — Interactive Studio Example
Demonstrates core Python features: type hints, f-strings,
comprehensions, datetime, and formatted output.
"""

import sys
import math
from datetime import datetime


def get_greeting(name: str) -> str:
    """Return a time-aware greeting."""
    hour = datetime.now().hour
    if hour < 12:
        period = "morning"
    elif hour < 17:
        period = "afternoon"
    else:
        period = "evening"
    return f"Good {period}, {name}!"


def fibonacci(n: int) -> list[int]:
    """Generate the first n Fibonacci numbers."""
    if n <= 0:
        return []
    if n == 1:
        return [0]
    seq = [0, 1]
    for _ in range(2, n):
        seq.append(seq[-1] + seq[-2])
    return seq


def golden_ratio_comparison(fib_seq: list[int]) -> None:
    """Compare consecutive Fibonacci ratios to the golden ratio."""
    phi = (1 + math.sqrt(5)) / 2
    print(f"\n  Golden Ratio (phi): {phi:.10f}")
    print(f"  {'n':>3}  {'Fib(n)':>8}  {'Ratio':>14}  {'Error':>12}")
    print(f"  {'---':>3}  {'------':>8}  {'-----':>14}  {'-----':>12}")
    for i in range(2, len(fib_seq)):
        if fib_seq[i - 1] == 0:
            continue
        ratio = fib_seq[i] / fib_seq[i - 1]
        error = abs(ratio - phi)
        print(f"  {i:>3}  {fib_seq[i]:>8}  {ratio:>14.10f}  {error:>12.10f}")


def multiplication_table(size: int) -> None:
    """Print a formatted multiplication table."""
    print(f"\n  Multiplication Table ({size}x{size})")
    header = "     " + "".join(f"{i:>4}" for i in range(1, size + 1))
    print(header)
    print("    " + "-" * (size * 4 + 1))
    for row in range(1, size + 1):
        cells = "".join(f"{row * col:>4}" for col in range(1, size + 1))
        print(f"  {row:>2} |{cells}")


def main() -> None:
    print("=" * 50)
    print("  Python Hello World")
    print(f"  Python {sys.version.split()[0]}")
    print("=" * 50)

    # Time-aware greeting
    greeting = get_greeting("Developer")
    print(f"\n  {greeting}")

    # Fibonacci sequence
    n = 15
    fib = fibonacci(n)
    print(f"\n  First {n} Fibonacci numbers:")
    print(f"  {fib}")

    # Golden ratio convergence
    golden_ratio_comparison(fib)

    # List comprehension — squares
    squares = {x: x**2 for x in range(1, 11)}
    print("\n  Squares (dict comprehension):")
    for num, sq in squares.items():
        bar = "*" * (sq // 5 + 1)
        print(f"  {num:>3}^2 = {sq:>4}  {bar}")

    # Filter even numbers
    numbers = list(range(1, 21))
    evens = [x for x in numbers if x % 2 == 0]
    print(f"\n  Even numbers from 1-20: {evens}")

    # Multiplication table
    multiplication_table(8)

    print("\n" + "=" * 50)
    print("  Done! Explore and modify this file to learn more.")
    print("=" * 50)


if __name__ == "__main__":
    main()
