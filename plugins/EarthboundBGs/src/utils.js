export function parseLayerParam(number, options, canvas) {
    var defaultLayer = options.firstLayer ? 270 : 269;
    var num = Number(number);
    if (isNaN(num)) num = defaultLayer;
    else if (num < 0 || num > 326) num = defaultLayer;

    options.firstLayer
      ? (canvas.dataset.layerOne = num)
      : (canvas.dataset.layerTwo = num);
    return num;
  }

export function parseFrameskipParam(number, canvas) {
    var num = Number(number);
    if (isNaN(num)) return (num = 1);
    else if (num < 1 || num > 10) return (num = 1);

    // canvas.dataset.frameskip = num;
    return num;
  }

export function parseAspectRatioParam(number, canvas) {
    var num = Number(number);
    if (isNaN(num)) return (num = 0);
    else if (num != 0 && num != 16 && num != 48 && num != 64) return (num = 0);

    // canvas.dataset.aspectRatio = num;
    return num;
  }