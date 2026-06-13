import './style.css';
import '@google/model-viewer';

const modelViewer = document.querySelector('model-viewer');
const hotspots = document.querySelectorAll('.Hotspot');

let defaultTarget = '0m 0.5m 0m';

// Capture actual model center once it loads to use as reset target
modelViewer.addEventListener('load', () => {
  try {
    const target = modelViewer.getCameraTarget();
    defaultTarget = `${target.x}m ${target.y}m ${target.z}m`;
    console.log('Model loaded successfully. Initial camera target: ', defaultTarget);
  } catch (e) {
    console.error('Error reading camera target on load:', e);
  }
});

// Dim other hotspots and target camera on click
hotspots.forEach(hotspot => {
  hotspot.addEventListener('click', (event) => {
    const isCloseClick = event.target.classList.contains('HotspotClose');
    
    if (isCloseClick) {
      event.stopPropagation();
      deactivateAllHotspots();
      return;
    }
    
    // Ignore clicks inside the active annotation card itself (except close buttons)
    if (hotspot.classList.contains('active') && event.target.closest('.HotspotAnnotation')) {
      return;
    }
    
    // Toggle active state
    if (hotspot.classList.contains('active')) {
      deactivateAllHotspots();
    } else {
      activateHotspot(hotspot);
    }
  });
});

// Dismiss hotspot on clicking empty space on the model-viewer
modelViewer.addEventListener('click', (event) => {
  if (!event.target.closest('.Hotspot')) {
    deactivateAllHotspots();
  }
});

function activateHotspot(hotspot) {
  // Clear other active hotspots
  hotspots.forEach(h => {
    if (h !== hotspot) {
      h.classList.remove('active');
      h.classList.remove('flipped');
      h.style.setProperty('--shift-x', '0px');
    }
  });
  
  // Set active classes
  hotspot.classList.add('active');
  modelViewer.classList.add('has-active-hotspot');
  
  // Stop auto-rotation to keep the info card text perfectly stable
  modelViewer.autoRotate = false;
  
  // Smoothly transition camera target to focus attention on this part
  const position = hotspot.getAttribute('data-position');
  if (position) {
    modelViewer.cameraTarget = position;
  }
  
  // Position the card so it doesn't clip
  requestAnimationFrame(() => {
    setTimeout(() => positionAnnotation(hotspot), 60);
  });
}

/**
 * Measures the annotation card against the model-viewer bounds and
 * applies horizontal shift + vertical flip as needed.
 */
function positionAnnotation(hotspot) {
  const annotation = hotspot.querySelector('.HotspotAnnotation');
  if (!annotation) return;
  
  // Reset transforms to measure cleanly
  hotspot.style.setProperty('--shift-x', '0px');
  hotspot.classList.remove('flipped');
  
  const viewerRect = modelViewer.getBoundingClientRect();
  
  // Force a reflow so we measure the un-flipped position
  void annotation.offsetHeight;
  let annRect = annotation.getBoundingClientRect();
  
  // --- Vertical: flip below if the card goes above the viewer ---
  if (annRect.top < viewerRect.top + 5) {
    hotspot.classList.add('flipped');
    // re-measure after flipping
    void annotation.offsetHeight;
    annRect = annotation.getBoundingClientRect();
  }
  
  // --- Horizontal: shift left/right if it overflows the sides ---
  let shiftX = 0;
  
  if (annRect.right > viewerRect.right - 8) {
    shiftX = viewerRect.right - 8 - annRect.right;
  } else if (annRect.left < viewerRect.left + 8) {
    shiftX = viewerRect.left + 8 - annRect.left;
  }
  
  if (shiftX !== 0) {
    hotspot.style.setProperty('--shift-x', `${shiftX}px`);
  }
}

function deactivateAllHotspots() {
  hotspots.forEach(h => {
    h.classList.remove('active');
    h.classList.remove('flipped');
    h.style.setProperty('--shift-x', '0px');
  });
  modelViewer.classList.remove('has-active-hotspot');
  
  // Resume auto-rotation when no hotspots are active
  modelViewer.autoRotate = true;
  
  // Reset camera target to default model center
  modelViewer.cameraTarget = defaultTarget;
}

// Scale hotspots based on camera distance (orbit radius)
// and re-position the active annotation to prevent clipping during rotation.
modelViewer.addEventListener('camera-change', () => {
  try {
    const orbit = modelViewer.getCameraOrbit();
    const radius = orbit.radius;
    
    // Keep hotspot visual scale stable and readable relative to zoom depth.
    const scale = Math.max(0.55, Math.min(1.3, 1.2 / radius));
    
    hotspots.forEach(hotspot => {
      hotspot.style.setProperty('--camera-scale', scale);
    });
    
    // Re-position the active annotation so it doesn't clip when the user orbits
    const activeHotspot = document.querySelector('.Hotspot.active');
    if (activeHotspot) {
      positionAnnotation(activeHotspot);
    }
  } catch (e) {
    // Graceful fallback if getCameraOrbit is not ready
  }
});

// Log AR Session events
modelViewer.addEventListener('ar-status', (event) => {
  if (event.detail.status === 'session-started') {
    console.log('AR Session started! Model scale is fixed and placement is floor.');
  } else if (event.detail.status === 'not-presenting') {
    console.log('AR Session ended.');
  }
});
