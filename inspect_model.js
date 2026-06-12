import { NodeIO } from '@gltf-transform/core';

async function inspectFullTree() {
  const io = new NodeIO();
  const document = await io.read('public/models/scene_fixed.glb');
  const scene = document.getRoot().getDefaultScene() || document.getRoot().listScenes()[0];

  function printNode(node, depth) {
    const indent = '  '.repeat(depth);
    const t = node.getTranslation();
    const s = node.getScale();
    const r = node.getRotation();
    const hasMesh = node.getMesh() ? ' [HAS MESH]' : '';
    
    const hasNonIdentityScale = s[0] !== 1 || s[1] !== 1 || s[2] !== 1;
    const hasTranslation = t[0] !== 0 || t[1] !== 0 || t[2] !== 0;
    const hasRotation = r[0] !== 0 || r[1] !== 0 || r[2] !== 0 || r[3] !== 1;
    
    let transformInfo = '';
    if (hasTranslation) transformInfo += ` T:[${t.map(v => v.toFixed(3)).join(',')}]`;
    if (hasNonIdentityScale) transformInfo += ` S:[${s.map(v => v.toFixed(3)).join(',')}]`;
    if (hasRotation) transformInfo += ` R:[${r.map(v => v.toFixed(3)).join(',')}]`;
    
    console.log(`${indent}├─ "${node.getName()}"${hasMesh}${transformInfo}`);
    
    for (const child of node.listChildren()) {
      printNode(child, depth + 1);
    }
  }

  console.log('=== Full Scene Graph ===');
  for (const node of scene.listChildren()) {
    printNode(node, 0);
  }
}

inspectFullTree().catch(console.error);
