function asInt16(value) {
    return new Int16Array([value])[0]
}
const { PI: π, sin, round, floor } = Math
const R = 0
const G = 1
const B = 2
const A = 3
function mod(n, m) {
    return ((n % m) + m) % m
}

const HORIZONTAL = 1
const HORIZONTAL_INTERLACED = 2
const VERTICAL = 3

class DistortionEffect {
    constructor(
        type, // Horz, Horiz-inter, vert
        frequency,
        amplitude,
        compression,
        frequencyAcceleration,
        amplitudeAcceleration,
        compressionAcceleration,
        speed
    ) {
        this.type = type,
            this.frequency = frequency,
            this.amplitude = amplitude,
            this.compression = compression,
            this.frequencyAcceleration = frequencyAcceleration,
            this.amplitudeAcceleration = amplitudeAcceleration,
            this.compressionAcceleration = compressionAcceleration,
            this.speed = speed
    }
}

class Distorter {
    constructor(bitmap) {
        this.bitmap = bitmap;
        this.C1 = 1 / 512
        this.C2 = 8 * π / (1024 * 256)
        this.C3 = π / 60
    }
    setOffsetConstants(ticks, effect) {
        const {
            amplitude,
            amplitudeAcceleration,
            compression,
            compressionAcceleration,
            frequency,
            frequencyAcceleration,
            speed
        } = effect
        /* Compute "current" values of amplitude, frequency and compression */
        const t2 = ticks * 2
        this.amplitude = this.C1 * (amplitude + amplitudeAcceleration * t2)
        this.frequency = this.C2 * (frequency + (frequencyAcceleration * t2))
        this.compression = 1 + (compression + (compressionAcceleration * t2)) / 256
        this.speed = this.C3 * speed * ticks
        this.S = y => round(this.amplitude * sin(this.frequency * y + this.speed))
    }
    getAppliedOffset(y, distortionEffect) {
        const s = this.S(y)
        switch (distortionEffect) {
            default:
            case HORIZONTAL:
                return s
            case HORIZONTAL_INTERLACED:
                return y % 2 === 0 ? -s : s
            case VERTICAL:
                /* Compute L */
                return mod(floor(s + y * this.compression), 256)
        }
    }
    computeFrame(destinationBitmap, sourceBitmap, letterbox, ticks, alpha, erase, effect) {
        const { type: distortionEffect } = effect
        const newBitmap = destinationBitmap
        const oldBitmap = sourceBitmap
        /* TODO: Hardcoing is bad */
        const dstStride = 1024
        const srcStride = 1024
        /*
          Given the list of 4 distortions and the tick count, decide which
          effect to use:
          Basically, we have 4 effects, each possibly with a duration.
          Evaluation order is: 1, 2, 3, 0
          If the first effect is null, control transitions to the second effect.
          If the first and second effects are null, no effect occurs.
          If any other effect is null, the sequence is truncated.
          If a non-null effect has a zero duration, it will not be switched
          away from.
          Essentially, this configuration sets up a precise and repeating
          sequence of between 0 and 4 different distortion effects. Once we
          compute the sequence, computing the particular frame of which distortion
          to use becomes easy; simply mod the tick count by the total duration
          of the effects that are used in the sequence, then check the remainder
          against the cumulative durations of each effect.
          I guess the trick is to be sure that my description above is correct.
          Heh.
        */
        let x, y, bPos, sPos, dx
        this.setOffsetConstants(ticks, effect)
        for (y = 0; y < SNES_HEIGHT; ++y) {
            const offset = this.getAppliedOffset(y, distortionEffect)
            const L = distortionEffect === VERTICAL ? offset : y
            for (x = 0; x < SNES_WIDTH; ++x) {
                bPos = x * 4 + y * dstStride
                if (y < letterbox || y > SNES_HEIGHT - letterbox) {
                    newBitmap[bPos + R] = 0
                    newBitmap[bPos + G] = 0
                    newBitmap[bPos + B] = 0
                    newBitmap[bPos + A] = 255
                    continue
                }
                dx = x
                if (distortionEffect === HORIZONTAL || distortionEffect === HORIZONTAL_INTERLACED) {
                    dx = mod(x + offset, SNES_WIDTH)
                }
                sPos = dx * 4 + L * srcStride
                /* Either copy or add to the destination bitmap */
                if (erase) {
                    newBitmap[bPos + R] = alpha * oldBitmap[sPos + R]
                    newBitmap[bPos + G] = alpha * oldBitmap[sPos + G]
                    newBitmap[bPos + B] = alpha * oldBitmap[sPos + B]
                    newBitmap[bPos + A] = 255
                } else {
                    newBitmap[bPos + R] += alpha * oldBitmap[sPos + R]
                    newBitmap[bPos + G] += alpha * oldBitmap[sPos + G]
                    newBitmap[bPos + B] += alpha * oldBitmap[sPos + B]
                    newBitmap[bPos + A] = 255
                }
            }
        }
        return newBitmap
    }
}
window.Distorter = Distorter;
window.DistortionEffect = DistortionEffect;