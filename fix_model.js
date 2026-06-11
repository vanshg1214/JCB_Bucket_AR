import { NodeIO } from '@gltf-transform/core';

async function fixModelClean() {
  const io = new NodeIO();
  // Read the ORIGINAL file (not the broken fixed one)
  const document = await io.read('public/models/Bucket.glb');
  const scene = document.getRoot().getDefaultScene() || document.getRoot().listScenes()[0];
  
  const rootNode = scene.listChildren()[0];
  const rootScale = rootNode.getScale();
  const rootTranslation = rootNode.getTranslation();
  
  console.log(`Root: "${rootNode.getName()}"`);
  console.log(`  Scale: [${rootScale.join(', ')}]`);
  console.log(`  Translation: [${rootTranslation.map(v => v.toFixed(4)).join(', ')}]`);

  // Compute world-space bounding box properly, respecting the full transform chain
  let minY = Infinity, maxY = -Infinity;

  function computeWorldBounds(node, parentTx, parentTy, parentTz, parentSx, parentSy, parentSz) {
    const t = node.getTranslation();
    const s = node.getScale();
    
    // World position = parent_translation + parent_scale * local_translation
    const worldTx = parentTx + parentSx * t[0];
    const worldTy = parentTy + parentSy * t[1];
    const worldTz = parentTz + parentSz * t[2];
    
    // World scale = parent_scale * local_scale
    const worldSx = parentSx * s[0];
    const worldSy = parentSy * s[1];
    const worldSz = parentSz * s[2];
    
    const mesh = node.getMesh();
    if (mesh) {
      for (const prim of mesh.listPrimitives()) {
        const posAccessor = prim.getAttribute('POSITION');
        if (posAccessor) {
          const posArray = posAccessor.getArray();
          for (let i = 0; i < posArray.length; i += 3) {
            const wy = worldTy + worldSy * posArray[i + 1];
            if (wy < minY) minY = wy;
            if (wy > maxY) maxY = wy;
          }
        }
      }
    }
    
    for (const child of node.listChildren()) {
      computeWorldBounds(child, worldTx, worldTy, worldTz, worldSx, worldSy, worldSz);
    }
  }

  computeWorldBounds(rootNode, 0, 0, 0, 1, 1, 1);

  console.log(`\nWorld-space Y range: ${minY.toFixed(4)} to ${maxY.toFixed(4)}`);
  console.log(`Height: ${(maxY - minY).toFixed(4)} m`);
  console.log(`Bottom (minY): ${minY.toFixed(4)} m`);

  // To move the bottom to Y=0, we need to adjust the ROOT node translation.
  // Since the root has scale 50, and world_y = root_ty + 50 * local_vertex_y,
  // we just need to set root_ty so that minY becomes 0.
  // new_root_ty = root_ty - minY  (shifting everything up by |minY|)
  const newRootTy = rootTranslation[1] - minY;
  
  console.log(`\nOld root translation Y: ${rootTranslation[1].toFixed(4)}`);
  console.log(`New root translation Y: ${newRootTy.toFixed(4)}`);

  rootNode.setTranslation([rootTranslation[0], newRootTy, rootTranslation[2]]);

  // Verify
  minY = Infinity; maxY = -Infinity;
  computeWorldBounds(rootNode, 0, 0, 0, 1, 1, 1);
  console.log(`\nVerification - Y range: ${minY.toFixed(4)} to ${maxY.toFixed(4)} (height: ${(maxY - minY).toFixed(4)} m)`);
  console.log(`Bottom should be ~0: ${minY.toFixed(4)}`);

  // ---- ENHANCE METALLIC FEEL ----
  const materials = document.getRoot().listMaterials();
  console.log('\n--- Enhancing Materials for Metallic Feel ---');
  materials.forEach((mat, i) => {
    let r = mat.getRoughnessFactor();
    let m = mat.getMetallicFactor();
    
    // Reduce roughness by 75% to make the metal much shinier and crisper (highly metallic feel)
    let newR = r * 0.25;
    if (newR < 0.15) newR = 0.15; // cap to avoid mirror reflection
    
    // Boost metallic on the yellow paint (Material 4: 08_-_Default) and others
    let newM = m;
    if (m > 0.3 && m < 1.0) {
      newM = Math.min(1.0, m + 0.3);
    }
    
    mat.setRoughnessFactor(newR);
    mat.setMetallicFactor(newM);
    console.log(`"${mat.getName()}" -> Roughness: ${r.toFixed(2)} to ${newR.toFixed(2)} | Metallic: ${m.toFixed(2)} to ${newM.toFixed(2)}`);
  });

  await io.write('public/models/scene_fixed.glb', document);
  console.log('\nDone! Saved with corrected origin and enhanced metallic materials.');
}

fixModelClean().catch(console.error);
