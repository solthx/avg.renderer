import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ChangeDetectorRef,
  AfterContentInit,
  Input
} from "@angular/core";
import { FPSCtrl } from "app/common/fps-ctrl";
// import { SceneAnimation } from "app/common/animations/scene-animation";
import { Effects } from "app/common/effects/effects";
import { GameDef } from "app/common/game-def";

import * as PIXI from "pixi.js";
import * as particles from "pixi-particles";
import * as avg from "avg-engine/engine";
import * as gsap from "gsap";
import * as Parallax from "parallax-js";
import { element } from "protractor";
import { AnimationUtils } from "../../common/animations/animation-utils";
import { DomSanitizer } from "@angular/platform-browser";

class SceneModel {
  public scene: avg.Scene;
  public incommingNewScene: avg.Scene;
  public maskTransitionEffect: string;
  public styles: any;
}

@Component({
  selector: "background-canvas",
  templateUrl: "./background-canvas.component.html",
  styleUrls: ["./background-canvas.component.scss"]
})
export class BackgroundCanvasComponent
  implements OnInit, AfterViewInit, AfterContentInit {
  private readonly _defaultDuration = 1000;
  private readonly ViewportElement = "#avg-viewport";

  public scenes: Array<SceneModel> = new Array<SceneModel>(
    GameDef.MaxBackgroundLayers
  );

  constructor(
    private elementRef: ElementRef,
    private changeDetectorRef: ChangeDetectorRef,
    public sanitizer: DomSanitizer
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    // ParticleEffect.snow();
  }

  ngAfterContentInit() {}

  public reset() {
    this.scenes = [];
    this.scenes = new Array<SceneModel>(GameDef.MaxBackgroundLayers);
  }

  public async removeBackground(index: number): Promise<any> {
    const model = this.scenes[index];
    if (!model || model === undefined) {
      console.log("Remove failed, model is undefined.");
      return;
    }

    const duration = this._defaultDuration || 1000;
    const frontLayerElement = ".layer-" + index;

    return new Promise((resolve, reject) => {
      AnimationUtils.fadeTo(frontLayerElement, duration, 0, () => {
        this.scenes[index] = undefined;
        this.changeDetectorRef.detectChanges();
        resolve();
      });
    });
  }

  public async setBackground(scene: avg.APIScene): Promise<any> {
    const data = scene.data;

    const transform = data.transform;
    const file = data.file.filename;
    const index = scene.index;
    const duration = data.duration || this._defaultDuration;
    const transitionName = data.transition || "crossfade";

    if (!file || file.length === 0) {
      console.warn("Background filename is empty");
    }

    if (index >= GameDef.MaxBackgroundLayers) {
      console.error(
        "Index is greater than MaxBackgroundLayers. Index = " + index
      );
      return;
    }

    let model = this.scenes[index];
    const hadSceneBefore = model !== undefined || model === null;

    if (hadSceneBefore) {
      model.scene = this.scenes[index].scene; // Keep old scene
      model.incommingNewScene = data;
    } else {
      model = new SceneModel();
      model.scene = data;
      model.incommingNewScene = data;
    }

    if (transform.stretch) {
      transform.width = "100%";
      transform.height = "100%";
    }

    const cacheImage = async img => {
      return new Promise((resolve, reject) => {
        const backgroundCached = new Image();
        backgroundCached.src = img;
        backgroundCached.onload = () => {
          resolve();
        };
      });
    };

    // await cacheImage(model.scene.file.filename);
    // await cacheImage(model.incommingNewScene.file.filename);

    const background = "url(" + model.scene.file.filename + ")";
    const incommingBackground =
      "url(" + model.incommingNewScene.file.filename + ")";

    return new Promise((resolve, reject) => {
      this.scenes[index] = model;
      this.changeDetectorRef.detectChanges();

      const backgroundID = "background-layer-" + index;
      const maskID = "mask-layer-" + index;

      const maskElement = document.getElementById(maskID);
      const backgroundElenent = document.getElementById(backgroundID);

      maskElement.style.width = transform.width;
      maskElement.style.height = transform.height;
      maskElement.style.left = transform.x;
      maskElement.style.top = transform.y;
      maskElement.style.background = background;
      maskElement.style.animationDuration = duration / 1000 + "s";

      backgroundElenent.style.width = transform.width;
      backgroundElenent.style.height = transform.height;
      backgroundElenent.style.left = transform.x;
      backgroundElenent.style.top = transform.y;
      backgroundElenent.style.background = incommingBackground;

      const animationTokens = ["scene-mask-transition", transitionName];

      document
        .getElementById(maskID)
        .classList.add(animationTokens[0], animationTokens[1]);

      // wait animation finished
      setTimeout(() => {
        document
          .getElementById(maskID)
          .classList.remove(animationTokens[0], animationTokens[1]);
        maskElement.style.background = incommingBackground;
        model.scene = data;

        resolve();
      }, duration);
    });
  }

  loadParticleEffect() {}

  public blur(index: number, effect: avg.Effect) {
    effect.duration = effect.duration || 500;
    const blur = effect.strength * 1;

    const element = ".layer-" + index;
    gsap.TweenLite.to(element, effect.duration / 1000, {
      onUpdateParams: ["{self}"],
      onUpdate: tween => {
        gsap.TweenMax.set(element, {
          webkitFilter: "blur(" + tween.progress() * effect.strength + "px)"
        });
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  public hueRotate(index: number, effect: avg.Effect) {
    effect.duration = effect.duration || 500;
    const blur = effect.strength * 1;

    const element = ".layer-" + index;
    gsap.TweenLite.to(element, effect.duration / 1000, {
      onUpdateParams: ["{self}"],
      onUpdate: tween => {
        gsap.TweenMax.set(element, {
          webkitFilter:
            "hue-rotate(" + tween.progress() * effect.strength + "deg)"
        });
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  public moveTo(index: number, duration: number, x: number) {
    AnimationUtils.to("MoveTo", ".layer-" + index, duration, {
      x: x
    });
  }

  public transparent(index: number, to: number, duration: number) {
    console.log("transparent " + index);
    AnimationUtils.fadeTo(".layer-" + index, duration, to);
  }

  rain() {
    // const canvas = this.elementRef.nativeElement.querySelector(
    //   "#avg-particle-viewport"
    // );

    Effects.rain();
  }

  snow() {
    Effects.snow();
  }

  sakura() {
    Effects.sakura();
  }

  cloud() {
    Effects.cloud();
  }

  shake() {
    const viewport = this.elementRef.nativeElement.querySelector(
      "#avg-viewport"
    );

    if (viewport) {
      // Effects.shake(viewport);
    }
  }
}
