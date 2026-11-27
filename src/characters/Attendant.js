import * as THREE from 'three';

const makeMaterial = (color, roughness = 0.72, metalness = 0.08) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

export class Attendant {
  constructor(scene, { patrolPoints = [], onCaught = () => {} } = {}) {
    this.scene = scene;
    this.onCaught = onCaught;
    this.patrolPoints = patrolPoints.map((point) => new THREE.Vector3(point.x, 0, point.z));
    this.patrolIndex = 0;
    this.state = 'patrol';
    this.stateTimer = 0;
    this.lastSeen = new THREE.Vector3();
    this.searchCenter = new THREE.Vector3();
    this.searchStep = 0;
    this.caught = false;
    this.playerVisible = false;
    this.elapsed = 0;

    this.group = new THREE.Group();
    this.group.name = 'Original play-centre attendant';

    const shell = makeMaterial(0x66716f, 0.48, 0.26);
    const dark = makeMaterial(0x20282a, 0.56, 0.18);
    const warm = makeMaterial(0xc69d5f, 0.62, 0.1);
    const lens = new THREE.MeshStandardMaterial({
      color: 0xf2b45d,
      emissive: 0xd46c24,
      emissiveIntensity: 1.2,
      roughness: 0.3
    });

    this.body = new THREE.Group();
    this.body.position.y = 0.94;
    this.group.add(this.body);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.84, 1.12, 0.52), shell);
    torso.position.y = 0.08;
    this.body.add(torso);

    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.36, 0.08), warm);
    chestPlate.position.set(0, 0.16, 0.3);
    this.body.add(chestPlate);

    this.headPivot = new THREE.Group();
    this.headPivot.position.set(0, 0.78, 0);
    this.body.add(this.headPivot);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.37, 20, 14), dark);
    head.scale.set(1.25, 0.82, 0.75);
    this.headPivot.add(head);

    const face = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.13, 0.12), warm);
    face.position.set(0, -0.02, 0.265);
    this.headPivot.add(face);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), lens);
    eye.position.set(0.1, 0, 0.35);
    this.headPivot.add(eye);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.42, 8), shell);
    antenna.position.set(-0.12, 0.43, -0.03);
    this.headPivot.add(antenna);

    this.arms = [];
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.51, 0.4, 0);
      this.body.add(pivot);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.72, 0.22), shell);
      arm.position.y = -0.3;
      pivot.add(arm);

      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.15, 0.28), dark);
      hand.position.set(0, -0.68, 0.03);
      pivot.add(hand);
      this.arms.push(pivot);
    }

    this.legs = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.56, 0.28), dark);
      leg.position.set(side * 0.2, 0.27, 0);
      this.group.add(leg);
      this.legs.push(leg);
    }

    for (const side of [-1, 1]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.12, 14), dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 0.49, 0.22, -0.08);
      this.group.add(wheel);
    }

    this.group.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    this.scene.add(this.group);

    if (this.patrolPoints.length > 0) {
      this.group.position.set(this.patrolPoints[0].x, 0, this.patrolPoints[0].z);
    }
    this.raycaster = new THREE.Raycaster();
  }

  canSeePlayer(playerPosition) {
    const toPlayer = new THREE.Vector3(
      playerPosition.x - this.group.position.x,
      0,
      playerPosition.z - this.group.position.z
    );
    const distance = toPlayer.length();
    if (distance > 11 || distance < 0.001) return false;

    const forward = new THREE.Vector3(
      Math.sin(this.group.rotation.y),
      0,
      Math.cos(this.group.rotation.y)
    );
    if (forward.dot(toPlayer.normalize()) < 0.25) return false;

    const origin = this.group.position.clone().add(new THREE.Vector3(0, 1.85, 0));
    const target = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
    const ray = target.clone().sub(origin);
    this.raycaster.set(origin, ray.normalize());
    this.raycaster.far = distance;
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    return !hits.some((hit) => {
      let parent = hit.object;
      while (parent) {
        if (parent === this.group) return false;
        parent = parent.parent;
      }
      return true;
    });
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
    const distance = this.group.position.distanceTo(new THREE.Vector3(position.x, 0, position.z));
    if (distance > radius || this.state === 'investigate') return;

    this.searchCenter.set(position.x, 0, position.z);
    this.state = 'investigate';
    this.stateTimer = 6;
  }

  update(delta, playerPosition, hidden = false) {
    if (this.caught || !playerPosition) return;
    const dt = Math.min(delta, 0.05);
    this.elapsed += dt;
    this.stateTimer = Math.max(0, this.stateTimer - dt);

    const visible = !hidden && this.canSeePlayer(playerPosition);
    this.playerVisible = visible;
    if (visible) {
      this.lastSeen.set(playerPosition.x, 0, playerPosition.z);
      this.searchCenter.copy(this.lastSeen);
      this.state = 'investigate';
      this.stateTimer = 6;
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
      if (this.patrolPoints.length < 2) return;
      const target = this.patrolPoints[this.patrolIndex];
      if (this.moveToward(target, dt, 1.0)) {
        this.patrolIndex = (this.patrolIndex + 1) % this.patrolPoints.length;
      }
    } else if (this.state === 'investigate') {
      if (this.moveToward(this.searchCenter, dt, 1.8) || this.stateTimer === 0) {
        this.state = 'search';
        this.stateTimer = 4.5;
        this.searchStep = 0;
      }
    } else if (this.state === 'search') {
      if (this.stateTimer === 0) {
        this.state = 'patrol';
        return;
      }
      const angle = this.elapsed * 1.4 + this.searchStep * 2.1;
      const target = this.searchCenter.clone().add(new THREE.Vector3(Math.cos(angle) * 1.1, 0, Math.sin(angle) * 1.1));
      if (this.moveToward(target, dt, 1.15)) this.searchStep += 1;
    }

    const moving = this.state !== 'patrol' || this.patrolPoints.length > 1;
    this.body.position.y = 0.94 + (moving ? Math.sin(this.elapsed * 6) * 0.045 : 0);
    this.headPivot.rotation.z = Math.sin(this.elapsed * 1.8) * 0.035;
    this.arms[0].rotation.x = Math.sin(this.elapsed * 5) * 0.12;
    this.arms[1].rotation.x = -Math.sin(this.elapsed * 5) * 0.12;
    this.legs[0].rotation.x = Math.sin(this.elapsed * 5) * 0.18;
    this.legs[1].rotation.x = -Math.sin(this.elapsed * 5) * 0.18;
  }

  moveToward(target, delta, speed) {
    const direction = new THREE.Vector3(target.x - this.group.position.x, 0, target.z - this.group.position.z);
    const distance = direction.length();
    if (distance < 0.32) return true;

    direction.normalize();
    this.group.position.addScaledVector(direction, Math.min(distance, speed * delta));
    this.group.rotation.y = Math.atan2(direction.x, direction.z);
    return distance < 0.55;
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
    this.lastSeen.set(position.x, 0, position.z);
    if (this.patrolPoints.length > 0) {
      this.group.position.copy(this.patrolPoints[0]);
    } else {
      this.group.position.set(position.x + 6, 0, position.z - 2);
    }
  }
}
