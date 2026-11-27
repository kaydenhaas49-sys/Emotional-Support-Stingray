import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import robotModelUrl from '../../assets/characters/robot-placeholder/source/Robot.fbx?url';

const makeMaterial = (color, roughness = 0.72, metalness = 0.08) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

export class Attendant {
  constructor(scene, { patrolPoints = [], onCaught = () => {}, collisionBoxes = [] } = {}) {
    this.scene = scene;
    this.onCaught = onCaught;
    this.collisionBoxes = collisionBoxes;
    this.collisionRadius = 0.28;
    this.patrolPoints = patrolPoints.map((point) => new THREE.Vector3(point.x, 0, point.z));
    this.patrolIndex = 0;
    this.state = 'patrol';
    this.stateTimer = 0;
    this.lastSeen = new THREE.Vector3();
    this.searchCenter = new THREE.Vector3();
    this.searchStep = 0;
    this.searchTarget = null;
    this.caught = false;
    this.playerVisible = false;
    this.elapsed = 0;

    this.group = new THREE.Group();
    this.group.name = 'Original play-centre attendant';

    this.visualRoot = new THREE.Group();
    this.group.add(this.visualRoot);
    this.createFallbackRobot();

    this.loader = new FBXLoader();
    this.mixer = null;
    this.actions = {};
    this.activeAction = null;
    this.animationNames = [];
    this.robot = null;
    this.hasRobotAnimations = false;
    this.ready = this.loadRobotModel();

    this.scene.add(this.group);
    if (this.patrolPoints.length > 0) {
      this.group.position.set(this.patrolPoints[0].x, 0, this.patrolPoints[0].z);
    }
  }

  createFallbackRobot() {
    const shell = makeMaterial(0x82745b, 0.78, 0.18);
    const dark = makeMaterial(0x171c1e, 0.64, 0.22);
    const trim = makeMaterial(0xaaa28e, 0.62, 0.24);
    const lens = new THREE.MeshStandardMaterial({
      color: 0xe4a64c,
      emissive: 0x8c3511,
      emissiveIntensity: 1.1,
      roughness: 0.28
    });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.82, 4, 8), shell);
    torso.position.y = 0.92;
    this.visualRoot.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.62, 0.62), dark);
    head.position.set(0, 1.72, 0.02);
    this.visualRoot.add(head);

    const face = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.08), trim);
    face.position.set(0, 1.68, 0.35);
    this.visualRoot.add(face);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), lens);
    eye.position.set(0.15, 1.72, 0.405);
    this.visualRoot.add(eye);

    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.56, 3, 6), shell);
      arm.position.set(side * 0.48, 0.98, 0);
      arm.rotation.z = side * -0.12;
      this.visualRoot.add(arm);

      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.42, 3, 6), dark);
      leg.position.set(side * 0.19, 0.28, 0);
      this.visualRoot.add(leg);
    }

    this.visualRoot.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = false;
        object.receiveShadow = false;
      }
    });
  }

  async loadRobotModel() {
    try {
      const robot = await this.loader.loadAsync(robotModelUrl);
      robot.name = 'Quaternius animated robot attendant';
      robot.rotation.y = Math.PI;

      let bounds = new THREE.Box3().setFromObject(robot);
      const originalSize = bounds.getSize(new THREE.Vector3());
      if (!Number.isFinite(originalSize.y) || originalSize.y < 0.01) {
        throw new Error('Robot model has no usable height.');
      }

      // Treat the model as a character, not as a raw Blender unit-scale asset.
      robot.scale.setScalar(2.25 / originalSize.y);
      robot.updateMatrixWorld(true);
      bounds = new THREE.Box3().setFromObject(robot);
      const center = bounds.getCenter(new THREE.Vector3());
      robot.position.x -= center.x;
      robot.position.y -= bounds.min.y;
      robot.position.z -= center.z;
      robot.updateMatrixWorld(true);

      robot.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = false;
        object.receiveShadow = false;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (!material) return;
          const materialName = (material.name || '').toLowerCase();
          if (material.color) {
            if (materialName.includes('main')) material.color.setHex(0x8c7047);
            else if (materialName.includes('grey')) material.color.setHex(0x777d79);
            else if (materialName.includes('black')) material.color.setHex(0x171b1c);
          }
          if ('roughness' in material) material.roughness = 0.72;
          if ('metalness' in material) material.metalness = Math.max(material.metalness || 0, 0.16);
          material.needsUpdate = true;
        });
      });

      this.visualRoot.clear();
      this.visualRoot.add(robot);
      this.robot = robot;

      const clips = Array.isArray(robot.animations) ? robot.animations : [];
      this.animationNames = clips.map((clip) => clip.name || 'unnamed');
      if (clips.length > 0) {
        this.mixer = new THREE.AnimationMixer(robot);
        const findClip = (pattern) => clips.find((clip) => pattern.test(clip.name || ''));
        const idle = findClip(/idle|stand|wait/i) || clips[0];
        const walk = findClip(/walk|jog/i) || findClip(/run|sprint/i) || idle;
        const run = findClip(/run|sprint|jog/i) || walk;

        const makeAction = (clip) => {
          if (!clip) return null;
          const action = this.mixer.clipAction(clip);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.clampWhenFinished = false;
          return action;
        };

        this.actions.idle = makeAction(idle);
        this.actions.walk = makeAction(walk);
        this.actions.run = makeAction(run);
        this.hasRobotAnimations = Boolean(this.actions.idle);
        this.setAnimation('idle');
      }

      console.info('[Attendant] Robot model loaded.', {
        height: Number(originalSize.y.toFixed(3)),
        clips: this.animationNames
      });
      return true;
    } catch (error) {
      console.error('[Attendant] Could not load the animated robot model; using the local fallback.', error);
      return false;
    }
  }

  setAnimation(name) {
    const action = this.actions[name] || this.actions.idle;
    if (!action || action === this.activeAction) return;

    action.reset();
    action.enabled = true;
    action.setEffectiveTimeScale(name === 'run' ? 1.12 : 1);
    action.fadeIn(0.22).play();
    if (this.activeAction) this.activeAction.fadeOut(0.22);
    this.activeAction = action;
  }

  isBlocked(x, z) {
    const r = this.collisionRadius;
    return this.collisionBoxes.some((box) =>
      x + r > box.minX &&
      x - r < box.maxX &&
      z + r > box.minZ &&
      z - r < box.maxZ
    );
  }

  canSeePlayer(playerPosition) {
    const ox=this.group.position.x,oz=this.group.position.z;
    const dx=playerPosition.x-ox,dz=playerPosition.z-oz,d2=dx*dx+dz*dz;
    if(d2>121||d2<0.0001)return false;
    const inv=1/Math.sqrt(d2);
    if((Math.sin(this.group.rotation.y)*dx+Math.cos(this.group.rotation.y)*dz)*inv<0.25)return false;
    for(const box of this.collisionBoxes) {
      let tMin=0,tMax=1,hit=true;
      for(const [origin,direction,min,max] of [[ox,dx,box.minX,box.maxX],[oz,dz,box.minZ,box.maxZ]]) {
        if(Math.abs(direction)<1e-8){if(origin<min||origin>max){hit=false;break;}continue;}
        const invD=1/direction;let a=(min-origin)*invD,b=(max-origin)*invD;
        if(a>b)[a,b]=[b,a];
        tMin=Math.max(tMin,a);tMax=Math.min(tMax,b);
        if(tMin>tMax){hit=false;break;}
      }
      if(hit&&tMax>0.06&&tMin<0.94&&tMin<=tMax)return false;
    }
    return true;
  }

  rememberHiddenPosition(position) {
    if (this.caught || !position) return false;
    this.lastSeen.set(position.x, 0, position.z);
    this.searchCenter.copy(this.lastSeen);
    this.playerVisible = false;
    this.state = 'investigate';
    this.stateTimer = 6;
    return true;
  }

  reportNoise(position, radius = 8) {
    if (this.caught) return;
    const dx=position.x-this.group.position.x,dz=position.z-this.group.position.z;
    if(dx*dx+dz*dz>radius*radius||this.state==='investigate')return;

    this.searchCenter.set(position.x, 0, position.z);
    this.state = 'investigate';
    this.stateTimer = 6;
    this.searchTarget = null;
  }

  update(delta, playerPosition, hidden = false) {
    if (this.caught || !playerPosition) return;
    const dt = Math.min(delta, 0.05);
    this.elapsed += dt;
    this.stateTimer = Math.max(0, this.stateTimer - dt);
    const previousPosition = this.group.position.clone();

    const visible = !hidden && this.canSeePlayer(playerPosition);
    this.playerVisible = visible;
    if (visible) {
      this.lastSeen.set(playerPosition.x, 0, playerPosition.z);
      this.searchCenter.copy(this.lastSeen);
      this.state = 'investigate';
      this.stateTimer = 6;
      this.searchTarget = null;
      const distance = this.group.position.distanceTo(this.lastSeen);
      if (distance < 1.2) {
        this.catchPlayer();
        return;
      }
    } else if (hidden && this.state !== 'patrol') {
      const distance = this.group.position.distanceTo(new THREE.Vector3(playerPosition.x, 0, playerPosition.z));
      if (distance < 1.25) {
        this.catchPlayer();
        return;
      }
    }

    if (this.state === 'patrol') {
      if (this.patrolPoints.length >= 2) {
        const target = this.patrolPoints[this.patrolIndex];
        if (this.moveToward(target, dt, 1.0)) {
          this.patrolIndex = (this.patrolIndex + 1) % this.patrolPoints.length;
        }
      }
    } else if (this.state === 'investigate') {
      if (this.moveToward(this.searchCenter, dt, 1.75) || this.stateTimer === 0) {
        this.state = 'search';
        this.stateTimer = 4.5;
        this.searchStep = 0;
        this.searchTarget = null;
      }
    } else if (this.state === 'search') {
      if (this.stateTimer === 0) {
        this.state = 'patrol';
        this.searchTarget = null;
      } else {
        const offsets = [
          [1.1, 0], [0, 1.1], [-1.1, 0], [0, -1.1]
        ];
        if (!this.searchTarget) {
          const [x, z] = offsets[this.searchStep % offsets.length];
          this.searchTarget = this.searchCenter.clone().add(new THREE.Vector3(x, 0, z));
        }
        if (this.moveToward(this.searchTarget, dt, 0.95)) {
          this.searchStep += 1;
          this.searchTarget = null;
        }
      }
    }

    const moved = this.group.position.distanceToSquared(previousPosition) > 0.00001;
    const animation = this.state === 'investigate' && moved
      ? 'run'
      : this.state === 'patrol' && moved
        ? 'walk'
        : 'idle';
    this.setAnimation(animation);

    if (this.mixer) {
      this.mixer.update(dt);
    } else if (this.robot) {
      // Keep the no-clip fallback motion restrained rather than swinging every limb.
      this.visualRoot.position.y = Math.sin(this.elapsed * (moved ? 8 : 1.7)) * (moved ? 0.018 : 0.008);
      this.robot.rotation.z = moved ? Math.sin(this.elapsed * 8) * 0.018 : 0;
    }
  }

  moveToward(target, delta, speed) {
    const direction = new THREE.Vector3(
      target.x - this.group.position.x,
      0,
      target.z - this.group.position.z
    );
    const distance = direction.length();
    if (distance < 0.32) return true;

    direction.normalize();
    const step = Math.min(distance, speed * delta);
    const x = this.group.position.x;
    const z = this.group.position.z;
    const nextX = x + direction.x * step;
    const nextZ = z + direction.z * step;

    if (!this.isBlocked(nextX, nextZ)) {
      this.group.position.set(nextX, 0, nextZ);
    } else {
      let moved = false;
      if (!this.isBlocked(nextX, z)) {
        this.group.position.x = nextX;
        moved = true;
      }
      if (!this.isBlocked(this.group.position.x, nextZ)) {
        this.group.position.z = nextZ;
        moved = true;
      }

      if (!moved) {
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
        const candidates = [
          new THREE.Vector3(x + perpendicular.x * step, 0, z + perpendicular.z * step),
          new THREE.Vector3(x - perpendicular.x * step, 0, z - perpendicular.z * step)
        ];
        candidates.sort((a, b) =>
          a.distanceToSquared(target) - b.distanceToSquared(target)
        );
        const detour = candidates.find((candidate) => !this.isBlocked(candidate.x, candidate.z));
        if (detour) this.group.position.copy(detour);
      }
    }

    const forward = new THREE.Vector3(
      target.x - this.group.position.x,
      0,
      target.z - this.group.position.z
    );
    if (forward.lengthSq() > 0.0001) {
      forward.normalize();
      const targetYaw = Math.atan2(forward.x, forward.z);
      let yawDelta = targetYaw - this.group.rotation.y;
      yawDelta = Math.atan2(Math.sin(yawDelta), Math.cos(yawDelta));
      this.group.rotation.y += THREE.MathUtils.clamp(yawDelta, -delta * 3.8, delta * 3.8);
    }

    return this.group.position.distanceTo(target) < 0.55;
  }

  catchPlayer() {
    if (this.caught) return;
    this.caught = true;
    this.state = 'caught';
    this.onCaught();
  }

  reset(position) {
    this.caught = false;
    this.playerVisible = false;
    this.state = 'patrol';
    this.stateTimer = 0;
    this.patrolIndex = 0;
    this.searchTarget = null;
    this.lastSeen.set(position.x, 0, position.z);
    if (this.patrolPoints.length > 0) {
      this.group.position.copy(this.patrolPoints[0]);
    } else {
      this.group.position.set(position.x + 6, 0, position.z - 2);
    }
    this.setAnimation('idle');
  }
}
