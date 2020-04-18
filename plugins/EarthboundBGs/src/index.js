/*:
 *
 * @plugindesc Switches backgrounds out with sexy earthbound backgrounds
 * @author thelechking
 * @help
 * This plugin is based on https://github.com/gjtorikian/Earthbound-Battle-Backgrounds-JS
 * All credit for the actual background generation goes to gjtorikian and the others who worked
 * on that project.
 * 
 * If 'Use layers from Variables' is true,
 * the contents of the chosen variables will be used to generate the background
 * If false, a random background will be chosen instead
 * If its true but the variable contains -1, then it will use a random layer anyway
 * Each layer can be a number between 0 and 326
 * 0 Will be a black screen
 * 
 * Aspect Ratios -
 * 0 = Full 8:7
 * 16 = Wide Letterbox 4:3
 * 48 = Medium Letterbox 2:1
 * 64 Narrow Letterbox 8:3
 *
 * @param Use layers from Variables
 * @desc
 * true - Uses games variables to decide on layers for backgrounds
 * @type boolean
 * @default false
 *
 * @param Layer 1 Variable
 * @desc The variable to use for layer 1
 * @type variable
 * @default 10
 * 
 * @param Layer 2 Variable
 * @desc The variable to use for layer 2
 * @type variable
 * @default 11
 * 
 * @param Use Variable for Frameskip
 * @desc True - Uses game variable for frameskip value
 * False - Uses the hardcoded value below
 * @type boolean
 * @default false
 * 
 * @param Frameskip Variable
 * @desc Which variable to use for frameskip
 * @type variable
 * @default 12
 * 
 * @param Frameskip Value
 * @desc If not using variable, what value to use for frameskip
 * Higher values speed up the animation
 * @default 1
 * @type number
 * 
 * @param Use Variable for Aspect
 * @desc True - Uses game variable for Aspect value
 * False - Uses the hardcoded value below
 * @type boolean
 * @default false
 * 
 * @param Aspect Variable
 * @desc Which variable to use for Aspect Ratio
 * @type variable
 * @default 13
 * 
 * @param Aspect Value
 * @desc If not using variable, what value to use for Aspect Ratio
 * @default 1
 * @type number
 * 
 * @param Opacity
 * @desc The value to use for opacity (0 - 1)
 * @default 1
 * @type number
 */

import Rom from "./rom/rom";
import data from "../data/truncated_backgrounds.dat";
import Engine from "./engine";
import BackgroundLayer from "./rom/background_layer";
import { parseAspectRatioParam, parseFrameskipParam, parseLayerParam } from "./utils";

(function() {

  var parameters = PluginManager.parameters('EarthboundBG');
  console.log(parameters);
  var var1 = 0;
  var var2 = 0;
  var useVars = parameters["Use layers from Variables"] === "true";
  var varAR = parameters["Aspect Variable"];
  var valAR = parameters["Aspect Value"];
  var varFrameskip = parameters["Frameskip Variable"];
  var valFrameskip = parameters["Frameskip Value"];
  var opacity = parameters["Opacity"];
  var useVarsAR = parameters["Use Variable for Aspect"] === "true";
  var useVarsFrameskip = parameters["Use Variable for Frameskip"] === "true";
  if (useVars) {
    var1 = parameters["Layer 1 Variable"];
    var2 = parameters["Layer 2 Variable"];
  }
  
  function getVariableOrRandom(variableId) {
    
    if (useVars) {
      const val = parseInt($gameVariables.value(variableId));
      if (val >= 0) {
        return val;
      }
    }
    return Math.floor(Math.random() * 327);
  }
  function getLayers() {
    return [
      getVariableOrRandom(var1),
      getVariableOrRandom(var2)
    ]
  }
  function getAspectRatio() {
    if (useVarsAR) {
      return $gameVariables.value(varAR);
    }
    return valAR;
  }
  function getFrameskip() {
    if (useVarsFrameskip){
      return $gameVariables.value(varFrameskip);
    }
    return valFrameskip;
  }
  function getOpacity() {
    return opacity;
  }
  
  const backgroundData = new Uint8Array(
    Array.from(data).map(x => x.charCodeAt(0))
  );
  const ROM = new Rom(backgroundData);

  function setupEngine(params) {
    let bgCanvas;
    bgCanvas = document.createElement("canvas");
    bgCanvas.setAttribute("width", 816);
    bgCanvas.setAttribute("height", 624);
    let layer1Val = parseLayerParam(params.layer1, { firstLayer: true }, bgCanvas);
    let layer2Val = parseLayerParam(params.layer2, { firstLayer: false }, bgCanvas);
    let frameskip = parseFrameskipParam(params.frameskip, bgCanvas);
    let aspectRatio = parseAspectRatioParam(params.aspectRatio, bgCanvas);

    let fps = 30;
    let alpha = parseFloat(0.5);

    if (layer2Val === 0) {
      alpha = parseFloat(1.0);
    }

    // Create two layers
    let backgroundLayer = BackgroundLayer;
    
    const layer1 = new backgroundLayer(layer1Val, ROM);
    const layer2 = new backgroundLayer(layer2Val, ROM);

    // Create animation engine
    let engine = new Engine(
      [layer1, layer2],
      {
        fps: fps,
        aspectRatio: aspectRatio,
        frameSkip: frameskip,
        alpha: [alpha, alpha],
      },
      bgCanvas
    );
    return engine;
  }

  const _Spriteset_Battle_updateBattleback = Spriteset_Battle.prototype.updateBattleback;
  Spriteset_Battle.prototype.updateBattleback = function() {
    _Spriteset_Battle_updateBattleback.call(this);
    if (this._earthboundtexture) {
      this._earthboundengine.drawFrame(0, 0, 816, 624);
      this._earthboundtexture.baseTexture.update();
    }
  };

  const _Spriteset_Battle_createBattleback = Spriteset_Battle.prototype.createBattleback;
  Spriteset_Battle.prototype.createBattleback = function() {
    _Spriteset_Battle_createBattleback.call(this);
    Spriteset_Battle.prototype.setupEarthboundBattleback.call(this);
  }

  Spriteset_Battle.prototype.setupEarthboundBattleback = function() {
    const [layer1, layer2] = getLayers();
    const aspect = getAspectRatio();
    const frameskip = getFrameskip();
    const alpha = getOpacity();
    this._earthboundengine = setupEngine({
      layer1,
      layer2,
      aspectRatio: aspect,
      frameskip: frameskip
    })
    this._earthboundtexture = PIXI.Texture.fromCanvas(this._earthboundengine.canvas);
    var margin = 32;
    var width = Graphics.width + margin * 2;
    var height = Graphics.height + margin * 2;
    this._earthboundsprite = new PIXI.Sprite(this._earthboundtexture);
    this._earthboundsprite.alpha = alpha;
    // var t = setTimeout(() => {}, 100)
    this._earthboundsprite.width = width;
    this._earthboundsprite.height = height;
    var x = -this._battleField.x - margin;
    var y = -this._battleField.y - margin;
    this._battleField.addChild(this._earthboundsprite);
  }

  Spriteset_Battle.prototype.refreshEarthboundBattleback = function() {
    const [layer1, layer2] = getLayers();
    const aspect = getAspectRatio();
    const frameskip = getFrameskip();
    this._earthboundengine = setupEngine({
      layer1,
      layer2,
      aspectRatio: aspect,
      frameskip: frameskip
    })
    this._earthboundtexture = PIXI.Texture.fromCanvas(this._earthboundengine.canvas);
    var margin = 32;
    var width = Graphics.width + margin * 2;
    var height = Graphics.height + margin * 2;
    this._earthboundsprite.texture = this._earthboundtexture;

  }

  Game_Picture.prototype.loadEarthboundBG = function([layer1, layer2], aspect, frameskip) {
    this.removeEarthboundBG();
    this._earthboundengine = setupEngine({
      layer1,
      layer2,
      aspectRatio: aspect,
      frameskip: frameskip
    });
    this._earthboundtexture = PIXI.Texture.fromCanvas(this._earthboundengine.canvas);
    this._earthboundsprite = new PIXI.Sprite(this._earthboundtexture);
    this._earthboundsprite.width = SceneManager._screenWidth;
    this._earthboundsprite.height = SceneManager._screenHeight;
    Game_Picture.prototype.updateEarthboundBG.call(this);
    // Add the picture as a child
    // Should we be adding this on init of the map/battle as well?
    // Unsure if it gets refreshed
    SceneManager._scene._spriteset._pictureContainer.addChild(this._earthboundsprite);
  };

  Game_Picture.prototype.removeEarthboundBG = function() {
    if (this._earthboundsprite) {
      SceneManager._scene._spriteset._pictureContainer.removeChild(this._earthboundsprite);
    }
    this._earthboundsprite = null;
    this._earthboundtexture = null;
    this._earthboundengine = null;
  }

  Game_Picture.prototype.updateEarthboundBG = function() {
    this._earthboundsprite.x = Math.floor(this.x());
    this._earthboundsprite.y = Math.floor(this.y());
    if (this.origin() === 0) {
      this._earthboundsprite.anchor.x = 0;
      this._earthboundsprite.anchor.y = 0;
    } else {
      this._earthboundsprite.anchor.x = 0.5;
      this._earthboundsprite.anchor.y = 0.5;
    }
    this._earthboundsprite.width = (this.scaleX() / 100) * SceneManager._screenWidth;
    this._earthboundsprite.height = (this.scaleY() / 100) * SceneManager._screenHeight;
    this._earthboundsprite.opacity = this.opacity();
    this._earthboundsprite.blendMode = this.blendMode();
    this._earthboundsprite.rotation = this.angle() * Math.PI / 180;
    this._earthboundengine.drawFrame(0, 0, SceneManager._screenWidth, SceneManager._screenHeight);
    this._earthboundtexture.baseTexture.update();
  }

  const _Game_Picture_update = Game_Picture.prototype.update;
  Game_Picture.prototype.update = function() {
    _Game_Picture_update.call(this);
    if (this._earthboundsprite) {
      this.updateEarthboundBG();
    }
  };
  
  // Plugin command - Refresh
  const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === "EarthboundBG" && args[0] === "refresh") {
      BattleManager._spriteset.refreshEarthboundBattleback()
    } else if (command === "EarthboundBG" && args[0] === "setPic") {
      const pictureId = args[1];
      const layer1 = args[2];
      const layer2 = args[3];
      const aspect = args[4];
      const frameskip = args[5];
      const picture = $gameScreen._pictures[pictureId];
      picture.loadEarthboundBG([layer1, layer2], aspect, frameskip);
    } else if (command === "EarthboundBG" && args[0] === "clearPic") {
      const pictureId = args[1];
      const picture = $gameScreen._pictures[pictureId];
      picture.removeEarthboundBG();
    }
  };

})()
