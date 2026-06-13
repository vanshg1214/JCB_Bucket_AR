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
  
  // Ensure the annotation doesn't overflow the model-viewer bounds
  setTimeout(() => {
    const annotation = hotspot.querySelector('.HotspotAnnotation');
    if (!annotation) return;
    
    // Reset shift to measure properly
    hotspot.style.setProperty('--shift-x', '0px');
    
    const viewerRect = modelViewer.getBoundingClientRect();
    const annRect = annotation.getBoundingClientRect();
    
    let shiftX = 0;
    
    // Check right overflow
    if (annRect.right > viewerRect.right - 10) {
      shiftX = viewerRect.right - 10 - annRect.right; // negative shift
    } 
    // Check left overflow
    else if (annRect.left < viewerRect.left + 10) {
      shiftX = viewerRect.left + 10 - annRect.left; // positive shift
    }
    
    if (shiftX !== 0) {
      hotspot.style.setProperty('--shift-x', `${shiftX}px`);
    }
  }, 50); // wait for scale and display transitions to start
}

function deactivateAllHotspots() {
  hotspots.forEach(h => h.classList.remove('active'));
  modelViewer.classList.remove('has-active-hotspot');
  
  // Resume auto-rotation when no hotspots are active
  modelViewer.autoRotate = true;
  
  // Reset camera target to default model center
  modelViewer.cameraTarget = defaultTarget;
}

// Scale hotspots based on camera distance (orbit radius)
modelViewer.addEventListener('camera-change', () => {
  try {
    const orbit = modelViewer.getCameraOrbit();
    const radius = orbit.radius;
    
    // Keep hotspot visual scale stable and readable relative to zoom depth.
    // scale increases slightly as camera zooms in, and decreases as camera zooms out.
    const scale = Math.max(0.55, Math.min(1.3, 1.2 / radius));
    
    hotspots.forEach(hotspot => {
      hotspot.style.setProperty('--camera-scale', scale);
    });
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
