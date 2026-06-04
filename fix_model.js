import { NodeIO } from '@gltf-transform/core';
import { center } from '@gltf-transform/functions';
import fs from 'fs';

async function fixModel() {
  console.log("Reading model...");
  const io = new NodeIO();
  const document = await io.read('public/models/scene (29).glb');
  
  console.log("Centering and resetting origin to bottom...");
  // Center on X and Z, and place the lowest Y point exactly at 0
  await document.transform(center({pivot: 'below'}));
  
  console.log("Writing fixed model...");
  await io.write('public/models/scene_fixed.glb', document);
  console.log("Done! Model saved as scene_fixed.glb");
}

fixModel().catch(console.error);
