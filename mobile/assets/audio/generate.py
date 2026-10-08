"""Original T29 sound pack; Python standard library only, deterministic PCM WAV."""

import argparse
import hashlib
import json
import math
import random
import struct
import wave
from pathlib import Path

RATE = 44100
DIRECTORY = Path(__file__).resolve().parent
# Name, milliseconds, allowed milliseconds, synthesis recipe, note frequencies.
CLIPS = (
    ("ui-tap", 90, (60, 100), "wood", (640,)),
    ("paper-select", 140, (80, 160), "paper", ()),
    ("card-lock", 130, (80, 160), "wood", (460,)),
    ("paper-slide", 200, (120, 250), "paper", ()),
    ("confirm", 260, (180, 300), "pluck", (587.33, 783.99)),
    ("tick", 60, (40, 80), "bamboo", (1240,)),
    ("card-flip", 260, (180, 300), "flip", ()),
    ("round-win", 380, (250, 450), "pluck", (523.25, 659.25, 783.99)),
    ("round-loss", 300, (200, 350), "pluck", (392, 293.66)),
    ("round-draw", 220, (150, 250), "pluck", (440,)),
    ("match-win", 900, (700, 1000), "pluck", (523.25, 587.33, 659.25, 783.99, 1046.5)),
    ("match-loss", 520, (350, 600), "pluck", (392, 329.63, 261.63)),
    ("connection-lost", 220, (150, 250), "pluck", (349.23, 329.63)),
)


def synthesize(name, milliseconds, recipe, notes):
    count = round(RATE * milliseconds / 1000)
    duration = count / RATE
    rng = random.Random(name)
    samples = []
    low = 0.0
    previous = 0.0
    for index in range(count):
        time = index / RATE
        noise = rng.uniform(-1, 1)
        low += 0.12 * (noise - low)
        air = (noise - previous) * 0.4 + low * 0.6
        previous = noise
        if recipe in ("paper", "flip"):
            # Soft friction; flip has two close swishes, paper is a single sweep.
            progress = time / duration
            envelope = math.sin(math.pi * progress) ** 1.6
            flutter = 0.72 + 0.28 * math.sin(2 * math.pi * 39 * time) ** 2
            if recipe == "flip":
                envelope *= 0.55 + 0.45 * math.sin(2 * math.pi * progress) ** 2
            value = air * envelope * flutter
        elif recipe in ("wood", "bamboo"):
            frequency = notes[0]
            decay = math.exp(-time / (duration * 0.20))
            value = decay * (
                math.sin(2 * math.pi * frequency * time)
                + 0.30 * math.sin(2 * math.pi * frequency * 2.31 * time)
                + 0.10 * air
            )
        else:
            value = 0.0
            spacing = duration * 0.58 / max(1, len(notes) - 1)
            for note_index, frequency in enumerate(notes):
                age = time - note_index * spacing
                if age < 0:
                    continue
                attack = min(1.0, age / 0.003)
                decay = math.exp(-age / (duration * 0.19))
                value += attack * decay * (
                    math.sin(2 * math.pi * frequency * age)
                    + 0.24 * math.sin(2 * math.pi * frequency * 2 * age)
                    + 0.07 * math.sin(2 * math.pi * frequency * 3 * age)
                )
        # Quiet endpoints avoid clicks when the runtime stops/restarts a cue.
        edge = min(1.0, time / 0.003, (duration - time - 1 / RATE) / 0.008)
        samples.append(value * max(0.0, edge))
    mean = sum(samples) / count
    samples = [sample - mean for sample in samples]
    peak = max(abs(sample) for sample in samples)
    rms = math.sqrt(sum(sample * sample for sample in samples) / count)
    # Similar energy for each cue; cap transients at -7 dBFS.
    gain = min(10 ** (-22 / 20) / rms, 10 ** (-7 / 20) / peak)
    pcm = [round(sample * gain * 32767) for sample in samples]
    pcm[0] = pcm[-1] = 0
    return struct.pack(f"<{count}h", *pcm)


def inspect_pack():
    expected = {f"{clip[0]}.wav" for clip in CLIPS}
    assert {path.name for path in DIRECTORY.glob("*.wav")} == expected
    result = []
    for name, milliseconds, bounds, recipe, notes in CLIPS:
        path = DIRECTORY / f"{name}.wav"
        with wave.open(str(path), "rb") as clip:
            assert (clip.getnchannels(), clip.getsampwidth(), clip.getframerate()) == (1, 2, RATE)
            assert clip.getcomptype() == "NONE"
            frames = clip.readframes(clip.getnframes())
            samples = struct.unpack(f"<{len(frames) // 2}h", frames)
        duration = len(samples) / RATE * 1000
        peak = max(abs(sample) for sample in samples) / 32768
        rms = math.sqrt(sum(sample * sample for sample in samples) / len(samples)) / 32768
        assert bounds[0] <= duration <= bounds[1], name
        assert abs(duration - milliseconds) < 0.03, name
        assert 0 < peak <= 10 ** (-6.9 / 20), name
        assert samples[0] == samples[-1] == 0, name
        assert abs(sum(samples) / len(samples)) < 2, name
        # Check output matches the documented deterministic recipe.
        assert frames == synthesize(name, milliseconds, recipe, notes)
        result.append({
            "cue": name, "duration_ms": round(duration, 2), "bytes": path.stat().st_size,
            "peak_dbfs": round(20 * math.log10(peak), 2),
            "rms_dbfs": round(20 * math.log10(rms), 2),
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        })
    total = sum(clip["bytes"] for clip in result)
    assert total <= 2_000_000
    return {"format": "mono PCM s16le, 44100 Hz WAV", "total_bytes": total, "clips": result}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate existing clips without writing")
    options = parser.parse_args()
    if not options.check:
        for name, milliseconds, _, recipe, notes in CLIPS:
            with wave.open(str(DIRECTORY / f"{name}.wav"), "wb") as clip:
                clip.setnchannels(1)
                clip.setsampwidth(2)
                clip.setframerate(RATE)
                clip.writeframes(synthesize(name, milliseconds, recipe, notes))
    print(json.dumps(inspect_pack(), indent=2))
