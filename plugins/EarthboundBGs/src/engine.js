export const SNES_WIDTH = 256
export const SNES_HEIGHT = 224
export default class Engine {
  constructor (layers = [], opts, canvas) {
    this.layers = layers
    this.fps = opts.fps
    this.aspectRatio = opts.aspectRatio
    this.frameSkip = opts.frameSkip
    this.alpha = opts.alpha
    this.canvas = canvas
    this.tick = 0,
    this.fpsInterval = 1000 / opts.fps
    this.context = this.canvas.getContext('2d')
    if (this.layers[0].entry && !this.layers[1].entry) {
      this.alpha[0] = 1
      this.alpha[1] = 0
    }
    if (!this.layers[0].entry && this.layers[1].entry) {
      this.alpha[0] = 0
      this.alpha[1] = 1
    }
    this.then = Date.now();
    this.canvas.width = SNES_WIDTH
    this.canvas.height = SNES_HEIGHT
    this.img = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)
    this.bitmap = undefined;
  }

  drawFrame() {
    const now = Date.now()
    const elapsed = now - this.then
    if (elapsed > this.fpsInterval) {
      this.then = now - (elapsed % this.fpsInterval)
      for (let i = 0; i < this.layers.length; ++i) {
        this.bitmap = this.layers[i].overlayFrame(this.img.data, this.aspectRatio, this.tick, this.alpha[i], i === 0)
      }
      this.tick += this.frameSkip
      this.img.data.set(this.bitmap)
      this.context.putImageData(this.img, 0, 0)
    }
  }
}
