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
    console.log(`  Base Color Texture: ${mat.getBaseColorTexture() ? mat.getBaseColorTexture().getName() : 'none'}`);
    console.log(`  Metallic Roughness Texture: ${mat.getMetallicRoughnessTexture() ? mat.getMetallicRoughnessTexture().getName() : 'none'}`);
    console.log(`  Normal Texture: ${mat.getNormalTexture() ? mat.getNormalTexture().getName() : 'none'}`);
    console.log(`  Occlusion Texture: ${mat.getOcclusionTexture() ? mat.getOcclusionTexture().getName() : 'none'}`);
  });
}

inspectMaterials().catch(console.error);
