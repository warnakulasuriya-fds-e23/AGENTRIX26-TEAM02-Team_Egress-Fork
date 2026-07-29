"""LLM pricing table for cost estimation.

Published list prices, USD per 1M tokens, as of when these were entered — not
pulled from a live pricing API. Treat admin-dashboard cost figures as an
estimate, not a bill: actual invoices may differ (volume discounts, currency,
free-tier credits) and this table needs manual updates when providers reprice.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ModelPrice:
    input_per_million: float
    output_per_million: float


# Keyed by the exact model string passed to the provider SDK.
PRICING: dict[str, ModelPrice] = {
    "gpt-4o-mini": ModelPrice(input_per_million=0.15, output_per_million=0.60),
    "gpt-4o": ModelPrice(input_per_million=2.50, output_per_million=10.00),
    "gemini-2.5-flash": ModelPrice(input_per_million=0.30, output_per_million=2.50),
    "gemini-2.5-pro": ModelPrice(input_per_million=1.25, output_per_million=10.00),
}

DEFAULT_PRICE = ModelPrice(input_per_million=0.0, output_per_million=0.0)


def estimate_cost(model: str | None, prompt_tokens: int, completion_tokens: int) -> float:
    price = PRICING.get(model or "", DEFAULT_PRICE)
    return (prompt_tokens / 1_000_000) * price.input_per_million + (
        completion_tokens / 1_000_000
    ) * price.output_per_million
