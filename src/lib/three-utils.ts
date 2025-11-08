import * as THREE from 'three';

// Converts latitude and longitude to 3D coordinates on a sphere
export function latLonToVector3(lat: number, lon: number, radius: number, height = 0): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -((radius + height) * Math.sin(phi) * Math.cos(theta));
  const z = ((radius + height) * Math.sin(phi) * Math.sin(theta));
  const y = ((radius + height) * Math.cos(phi));

  return new THREE.Vector3(x, y, z);
}
