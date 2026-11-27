export class Game {
  constructor(scene,camera,renderer,player,world=null,hud=null) {
    this.scene=scene;this.camera=camera;this.renderer=renderer;this.player=player;
    this.world=world;this.hud=hud;this.isRunning=false;this.lastFrameTime=0;this.frameIntervalMs=1000/60;
  }
  start(){if(this.isRunning)return;this.isRunning=true;this.lastFrameTime=0;requestAnimationFrame(this.animate);}
  stop(){this.isRunning=false;}
  animate=(timestamp)=>{
    if(!this.isRunning)return;
    requestAnimationFrame(this.animate);
    if(!this.lastFrameTime)this.lastFrameTime=timestamp;
    const elapsed=timestamp-this.lastFrameTime;
    if(elapsed<this.frameIntervalMs)return;
    this.lastFrameTime=timestamp-(elapsed%this.frameIntervalMs);
    const dt=Math.min(elapsed/1000,0.05);this.player.update(dt);
    if(this.world&&typeof this.world.update==='function')this.world.update(dt,this.player,this.hud);
    this.renderer.render(this.scene,this.camera);
  };
}
