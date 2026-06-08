import { NodeIO } from '@gltf-transform/core';

async function inspectMaterials() {
  const io = new NodeIO();
  const document = await io.read('public/models/scene_fixed.glb');
  
  console.log('--- Material Properties ---');
  const materials = document.getRoot().listMaterials();
  materials.forEach((mat, i) => {
    console.log(`Material ${i}: "${mat.getName()}"`);
    console.log(`  Metallic Factor: ${mat.getMetallicFactor()}`);
    console.log(`  Roughness Factor: ${mat.getRoughnessFactor()}`);
    console.log(`  Base Color Factor: ${mat.getBaseColorFactor()}`);
  });
}

inspectMaterials().catch(console.error);
