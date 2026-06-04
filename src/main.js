import './style.css';
import '@google/model-viewer';

// We can add any custom UI interactions here if necessary, 
// such as listening to AR session events.
const modelViewer = document.querySelector('model-viewer');

modelViewer.addEventListener('ar-status', (event) => {
  if (event.detail.status === 'session-started') {
    console.log('AR Session started! Model scale is fixed and placement is floor.');
  } else if (event.detail.status === 'not-presenting') {
    console.log('AR Session ended.');
  }
});
