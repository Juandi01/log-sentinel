import statistics

def detect_anomalies(errors_per_minute: dict[str, int], z_threshold: float = 2.5) -> list[dict]:
    if len(errors_per_minute) < 3:
        return []

    counts = list(errors_per_minute.values())
    mean = statistics.mean(counts)
    stdev = statistics.stdev(counts)

    if stdev == 0:
        return []

    spikes = []
    for minute, count in sorted(errors_per_minute.items()):
        z_score = (count - mean) / stdev
        if z_score >= z_threshold and count >= 5:
            spikes.append({
                "minute": minute,
                "error_count": count,
                "z_score": round(z_score, 2),
                "baseline_mean": round(mean, 2),
            })
    return spikes