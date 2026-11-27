import * as THREE from 'three';
const MAX_PIXEL_RATIO=1.25;
export class Renderer {
  constructor() {
    this.renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,depth:true,stencil:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,MAX_PIXEL_RATIO));
    this.renderer.setSize(window.innerWidth,window.innerHeight);
    this.renderer.shadowMap.enabled=false;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    document.body.appendChild(this.renderer.domElement);
    window.addEventListener('resize',()=>this.onWindowResize(),{passive:true});
  }
  onWindowResize(){this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,MAX_PIXEL_RATIO));this.renderer.setSize(window.innerWidth,window.innerHeight);}
  getRenderer(){return this.renderer;}
  render(scene,camera){this.renderer.render(scene,camera);}
}
