# T29 sound pack

13 original, locally bundled short cues for RPS Cards. Created by deterministic
Python synthesis in `generate.py`: seeded filtered noise for paper friction,
damped resonances for wood/bamboo and warm sine harmonics for plucked notes.
No third-party recording, sample, voice, song or remote asset is used. These
assets were created for this repository; no external attribution is required.

Every clip is mono, 44,100 Hz, signed 16-bit little-endian PCM in WAV. Total audio
size is **325,148 bytes** (under the 2 MB budget). Each file has approximately
-22 dBFS RMS, a peak below -7 dBFS, no clipping or DC offset, and short endpoint
fades. Cue IDs map directly to filenames; lock/flip never depend on card kind.

| File / cue ID | Duration | Sound / use |
|---|---:|---|
| `ui-tap.wav` | 90 ms | Small wood tap; accepted control press |
| `paper-select.wav` | 140 ms | Soft paper friction; local card selection |
| `card-lock.wav` | 130 ms | Lower wood knock; authority-accepted lock/replacement |
| `paper-slide.wav` | 200 ms | Paper sweep; navigation, collection, fresh Draft |
| `confirm.wav` | 260 ms | Two ascending plucks; welcome/room/ready/reconnected |
| `tick.wav` | 60 ms | Rounded bamboo tap; future prepare/countdown beats |
| `card-flip.wav` | 260 ms | Double paper swish; shared visible-face boundary |
| `round-win.wav` | 380 ms | Three ascending plucks; seat-correct round WIN |
| `round-loss.wav` | 300 ms | Two descending plucks; gentle round LOSS |
| `round-draw.wav` | 220 ms | Single neutral pluck; round DRAW |
| `match-win.wav` | 900 ms | Five ascending plucks; fresh match victory |
| `match-loss.wav` | 520 ms | Three descending plucks; fresh match loss |
| `connection-lost.wav` | 220 ms | Two nearby descending notes; connection loss edge |

Regenerate or verify from the repository root with Python 3 standard library:

```sh
rtk proxy python3 mobile/assets/audio/generate.py
rtk proxy python3 mobile/assets/audio/generate.py --check
```

The check reads all 13 files, verifies format/duration/size/peak/DC/endpoints and
compares PCM against the deterministic recipe. It prints per-file metadata and
SHA-256. Metadata passing is not an audible/native acceptance result. Listen on
the Android release speaker and headphones before closing T29-A; runtime
interruption, mute and timing acceptance belong to the integration/native tests.

## Expo configuration and sources

`npx expo install expo-audio` selected `expo-audio` **57.0.5** for installed Expo
57.0.14. Use the installed type declarations as the API contract together with
the [official SDK 57 Audio docs](https://docs.expo.dev/versions/v57.0.0/sdk/audio/).
Bundled files can be passed through static `require('./ui-tap.wav')`.

The [config plugin properties](https://docs.expo.dev/versions/v57.0.0/sdk/audio/#configurable-properties)
default to recording permission/background playback, so `mobile/app.json`
explicitly disables `microphonePermission`, `recordAudioAndroid`,
`enableBackgroundPlayback` and `enableBackgroundRecording`. No runtime recording
permission, lock-screen controls or background service is needed for game cues.

The [Android supported media formats](https://developer.android.com/media/platform/supported-formats#audio-support)
list 16-bit PCM/WAVE. Format support is only a platform baseline; installed
release playback still needs real-device evidence.
