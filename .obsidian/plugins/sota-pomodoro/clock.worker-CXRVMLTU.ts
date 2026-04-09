let running: boolean = false
let start: number | undefined
let startTime: number | undefined
let interval: number
let prev: number | undefined
let lowFps: boolean = false

const tick = (t: number): void => {
    if (running) {
        if (start === undefined) {
            start = t
            prev = t
            requestAnimationFrame(tick)
        } else {
            interval += t - prev!
            if (lowFps) {
                if (interval >= 1000) {
                    self.postMessage(interval)
                    interval = 0
                }
            } else {
                self.postMessage(t - prev!)
            }
            requestAnimationFrame(tick)

            prev = t
        }
    }
}

self.onmessage = async ({ data }) => {
    if (data.start) {
        lowFps = data.lowFps
        if (!running) {
            running = true
            interval = 0
            startTime = new Date().getTime()
            requestAnimationFrame(tick)
        }
    } else {
        running = false
        start = undefined
        startTime = undefined
        prev = undefined
    }
}
