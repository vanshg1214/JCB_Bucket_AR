import { NodeIO } from '@gltf-transform/core';

async function inspectAndFix() {
  const io = new NodeIO();
  const document = await io.read('public/models/scene (29).glb');
  const scene = document.getRoot().getDefaultScene() || document.getRoot().listScenes()[0];
  
  // Find the global bounding box by traversing all meshes
  let minY = Infinity;
  let maxY = -Infinity;
  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  function getWorldTranslation(node) {
    // Walk up the parent chain to accumulate translations
    let tx = 0, ty = 0, tz = 0;
    let current = node;
    while (current) {
      const t = current.getTranslation();
      tx += t[0];
      ty += t[1];
      tz += t[2];
      current = current.getParentNode ? current.getParentNode() : null;
    }
    return [tx, ty, tz];
  }

  function traverseNode(node) {
    const mesh = node.getMesh();
    if (mesh) {
      const worldT = getWorldTranslation(node);
      for (const prim of mesh.listPrimitives()) {
        const posAccessor = prim.getAttribute('POSITION');
        if (posAccessor) {
          const posArray = posAccessor.getArray();
          for (let i = 0; i < posArray.length; i += 3) {
            const wy = posArray[i + 1] + worldT[1];
            const wx = posArray[i] + worldT[0];
            const wz = posArray[i + 2] + worldT[2];
            if (wy < minY) minY = wy;
            if (wy > maxY) maxY = wy;
            if (wx < minX) minX = wx;
            if (wx > maxX) maxX = wx;
            if (wz < minZ) minZ = wz;
            if (wz > maxZ) maxZ = wz;
          }
        }
      }
    }
    for (const child of node.listChildren()) {
      traverseNode(child);
    }
  }

  for (const node of scene.listChildren()) {
    traverseNode(node);
  }

  console.log('=== Model Bounding Box ===');
  console.log(`X: ${minX.toFixed(4)} to ${maxX.toFixed(4)} (width: ${(maxX - minX).toFixed(4)})`);
  console.log(`Y: ${minY.toFixed(4)} to ${maxY.toFixed(4)} (height: ${(maxY - minY).toFixed(4)})`);
  console.log(`Z: ${minZ.toFixed(4)} to ${maxZ.toFixed(4)} (depth: ${(maxZ - minZ).toFixed(4)})`);
  console.log(`\nThe bottom of the model (minY) is at: ${minY.toFixed(4)}`);
  console.log(`Need to shift Y by: ${(-minY).toFixed(4)} to place tires on floor`);

  // Now shift all root-level nodes so minY becomes 0
  const offsetY = -minY;
  // Also center on X and Z
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  
  console.log(`\nApplying offset: X=${(-centerX).toFixed(4)}, Y=${offsetY.toFixed(4)}, Z=${(-centerZ).toFixed(4)}`);

  for (const node of scene.listChildren()) {
    const t = node.getTranslation();
    node.setTranslation([
      t[0] - centerX,
      t[1] + offsetY,
      t[2] - centerZ
    ]);
  }

  // Verify
  let newMinY = Infinity;
  for (const node of scene.listChildren()) {
    const mesh = node.getMesh();
    if (mesh) {
      const worldT = getWorldTranslation(node);
      for (const prim of mesh.listPrimitives()) {
        const posAccessor = prim.getAttribute('POSITION');
        if (posAccessor) {
          const posArray = posAccessor.getArray();
          for (let i = 0; i < posArray.length; i += 3) {
            const wy = posArray[i + 1] + worldT[1];
            if (wy < newMinY) newMinY = wy;
          }
        }
      }
    }
    for (const child of node.listChildren()) {
      traverseNode(child);
    }
  }
  console.log(`\nVerification - New minY: ${newMinY.toFixed(4)} (should be ~0)`);

  await io.write('public/models/scene_fixed.glb', document);
  console.log('\nDone! Saved to scene_fixed.glb');
}

inspectAndFix().catch(console.error);
