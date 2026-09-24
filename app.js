// State Management
let currentFile = null;
let currentVideoUrl = null;
let generatedGifs = [];

// DOM Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('video-file-input');
const btnBrowse = document.getElementById('btn-browse');
const videoPreviewWrapper = document.getElementById('video-preview-wrapper');
const sourceVideo = document.getElementById('source-video');
const metaName = document.getElementById('meta-name');
const metaDuration = document.getElementById('meta-duration');
const metaResolution = document.getElementById('meta-resolution');
const metaGifCount = document.getElementById('meta-gif-count');

const segmentDurationInput = document.getElementById('segment-duration');
const fpsSelect = document.getElementById('fps-select');
const scaleWidthSelect = document.getElementById('scale-width');
const maxDurationInput = document.getElementById('max-duration');

const btnStart = document.getElementById('btn-start');
const progressArea = document.getElementById('progress-area');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressStatus = document.getElementById('progress-status');
const progressPercent = document.getElementById('progress-percent');

const resultsSection = document.getElementById('results-section');
const resultCount = document.getElementById('result-count');
const gifGrid = document.getElementById('gif-grid');
const btnDownloadAll = document.getElementById('btn-download-all');

// ==========================================
// 1. File Selection & Drag-and-Drop
// ==========================================

// Prevent file input click event from bubbling up to dropzone
fileInput.addEventListener('click', (e) => {
  e.stopPropagation();
});

// Browse button
if (btnBrowse) {
  btnBrowse.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });
}

// Click on dropzone area
dropzone.addEventListener('click', (e) => {
  if (e.target !== fileInput && e.target !== btnBrowse && !btnBrowse.contains(e.target)) {
    fileInput.click();
  }
});

// Drag & Drop events
['dragenter', 'dragover'].forEach(eventName => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach(eventName => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('dragover');
  });
});

dropzone.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;
  if (files && files.length > 0) {
    handleFile(files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

function handleFile(file) {
  if (!file) return;

  currentFile = file;
  if (currentVideoUrl) {
    URL.revokeObjectURL(currentVideoUrl);
  }
  currentVideoUrl = URL.createObjectURL(file);
  sourceVideo.src = currentVideoUrl;

  // Immediately display metadata section
  videoPreviewWrapper.style.display = 'grid';
  metaName.textContent = file.name;
  metaDuration.textContent = 'Loading...';
  metaResolution.textContent = 'Loading...';

  // Activate start button
  btnStart.disabled = false;
  btnStart.style.opacity = '1';
  btnStart.style.cursor = 'pointer';

  const onReady = () => {
    const dur = sourceVideo.duration;
    if (!dur || isNaN(dur) || dur <= 0) return;

    metaDuration.textContent = `${dur.toFixed(1)}s`;
    metaResolution.textContent = `${sourceVideo.videoWidth || 0} × ${sourceVideo.videoHeight || 0}px`;

    // Automatically set Video Duration to the exact duration of the uploaded video
    const autoDur = Math.round(dur * 10) / 10;
    maxDurationInput.value = autoDur;
    maxDurationInput.max = autoDur;

    updateExpectedCount();
  };

  sourceVideo.onloadedmetadata = onReady;
  sourceVideo.ondurationchange = onReady;
  sourceVideo.onloadeddata = onReady;
  sourceVideo.oncanplay = onReady;
  sourceVideo.load();

  updateExpectedCount();
}

function updateExpectedCount() {
  const segDuration = parseFloat(segmentDurationInput.value) || 2;
  const maxDur = parseFloat(maxDurationInput.value);
  const videoDur = sourceVideo.duration || 0;
  const actualDur = (maxDur > 0)
    ? (videoDur > 0 ? Math.min(videoDur, maxDur) : maxDur)
    : (videoDur || 10);
  const count = Math.ceil(actualDur / segDuration);
  metaGifCount.textContent = `${count} GIFs (${segDuration}s each)`;
}

[segmentDurationInput, maxDurationInput].forEach(el => {
  el.addEventListener('input', updateExpectedCount);
});

// ==========================================
// 2. Video Seeking & Frame Extraction
// ==========================================

function seekVideo(video, time) {
  return new Promise((resolve) => {
    const targetTime = Math.max(0, Math.min(time, (video.duration || 10) - 0.05));
    
    if (Math.abs(video.currentTime - targetTime) < 0.02) {
      return resolve();
    }

    let isResolved = false;
    let timer = null;

    const onSeeked = () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timer);
        video.removeEventListener('seeked', onSeeked);
        resolve();
      }
    };

    video.addEventListener('seeked', onSeeked, { once: true });
    video.currentTime = targetTime;

    timer = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        video.removeEventListener('seeked', onSeeked);
        resolve();
      }
    }, 350);
  });
}

/**
 * Accurately extracts video frames between startTime and (startTime + duration)
 */
async function extractSegmentFrames(video, startTime, duration, fps, width, height, onProgress) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  video.pause();

  const numFrames = Math.max(2, Math.round(duration * fps));
  const frameInterval = duration / numFrames;
  const frameImages = [];

  for (let f = 0; f < numFrames; f++) {
    const frameTime = startTime + (f * frameInterval);
    await seekVideo(video, frameTime);

    // Draw the exact frame at frameTime onto canvas
    ctx.drawImage(video, 0, 0, width, height);

    // Export as JPEG at 85% quality for fast and smooth encoding
    frameImages.push(canvas.toDataURL('image/jpeg', 0.85));

    if (typeof onProgress === 'function') {
      onProgress((f + 1) / numFrames);
    }
  }

  return frameImages;
}

/**
 * Creates GIF from frame images using gifshot
 */
function renderGifFromFrames(frameImages, fps, width, height) {
  return new Promise((resolve, reject) => {
    gifshot.createGIF({
      images: frameImages,
      interval: 1 / fps,
      gifWidth: width,
      gifHeight: height,
      sampleInterval: 10,
      numWorkers: 2
    }, (obj) => {
      if (!obj.error) {
        resolve(obj.image);
      } else {
        reject(new Error(obj.errorMsg || 'Failed to generate GIF'));
      }
    });
  });
}

function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// ==========================================
// 3. Automated Segment Processing
// ==========================================

btnStart.addEventListener('click', async () => {
  if (!currentFile || !currentVideoUrl) {
    alert('Please choose or drop a video file before starting!');
    return;
  }

  const segDuration = parseFloat(segmentDurationInput.value) || 2;
  const fps = parseInt(fpsSelect.value, 10) || 12;
  const targetWidth = parseInt(scaleWidthSelect.value, 10) || 480;
  const maxDur = parseFloat(maxDurationInput.value) || (sourceVideo.duration || 10);
  const actualDuration = sourceVideo.duration ? Math.min(sourceVideo.duration, maxDur) : maxDur;

  // Preserve native aspect ratio
  const vWidth = sourceVideo.videoWidth || 640;
  const vHeight = sourceVideo.videoHeight || 360;
  const targetHeight = Math.round(targetWidth * (vHeight / vWidth));

  const totalSegments = Math.ceil(actualDuration / segDuration);

  // Update UI state
  btnStart.disabled = true;
  btnStart.style.opacity = '0.6';
  progressArea.style.display = 'block';
  resultsSection.style.display = 'block';
  gifGrid.innerHTML = '';
  generatedGifs = [];
  resultCount.textContent = '0';

  updateProgress(0, 'Preparing video segmentation...');

  for (let i = 0; i < totalSegments; i++) {
    const startTime = i * segDuration;
    const dur = Math.min(segDuration, actualDuration - startTime);

    if (dur <= 0.1) continue;

    const startLabel = startTime.toFixed(1);
    const endLabel = (startTime + dur).toFixed(1);
    const segmentLabel = `${startLabel}s - ${endLabel}s`;

    // 1. Extract frames for [startTime, startTime + dur]
    const frames = await extractSegmentFrames(
      sourceVideo,
      startTime,
      dur,
      fps,
      targetWidth,
      targetHeight,
      (capturePercent) => {
        const overall = ((i + (capturePercent * 0.7)) / totalSegments) * 100;
        updateProgress(
          overall,
          `Segment ${i + 1}/${totalSegments} (${segmentLabel}): Extracting frames ${Math.round(capturePercent * 100)}%...`
        );
      }
    );

    // 2. Encode frames into animated GIF
    updateProgress(
      ((i + 0.8) / totalSegments) * 100,
      `Segment ${i + 1}/${totalSegments} (${segmentLabel}): Encoding GIF...`
    );

    try {
      const gifDataUrl = await renderGifFromFrames(frames, fps, targetWidth, targetHeight);
      const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
      const fileName = `${baseName}_gif_${i + 1}_(${Math.round(startTime)}s-${Math.round(startTime + dur)}s).gif`;
      const blob = dataURLtoBlob(gifDataUrl);

      const gifObj = {
        index: i + 1,
        fileName: fileName,
        dataUrl: gifDataUrl,
        blob: blob,
        timeRange: segmentLabel,
        sizeKb: (blob.size / 1024).toFixed(1)
      };

      generatedGifs.push(gifObj);
      renderGifCard(gifObj);
      resultCount.textContent = generatedGifs.length;
    } catch (err) {
      console.error(`Error generating GIF for segment ${segmentLabel}:`, err);
    }
  }

  updateProgress(100, `Completed! Successfully generated ${generatedGifs.length} contiguous GIFs.`);
  btnStart.disabled = false;
  btnStart.style.opacity = '1';
});

function updateProgress(percent, statusText) {
  const p = Math.min(100, Math.max(0, percent));
  progressBarFill.style.width = `${p}%`;
  progressPercent.textContent = `${Math.round(p)}%`;
  progressStatus.textContent = statusText;
}

// ==========================================
// 4. Render & Download GIFs
// ==========================================

function renderGifCard(gif) {
  const card = document.createElement('div');
  card.className = 'gif-card';

  card.innerHTML = `
    <div class="gif-preview-box">
      <img src="${gif.dataUrl}" alt="${gif.fileName}" loading="lazy">
    </div>
    <div class="gif-info">
      <div class="gif-title">#${gif.index} • ${gif.timeRange}</div>
      <div class="gif-time">Size: ${gif.sizeKb} KB</div>
      <button type="button" class="btn-download-single">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download GIF (.gif)
      </button>
    </div>
  `;

  const btnDownload = card.querySelector('.btn-download-single');
  btnDownload.addEventListener('click', (e) => {
    e.stopPropagation();
    downloadDataUrl(gif.dataUrl, gif.fileName);
  });

  gifGrid.appendChild(card);
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) {
      a.parentNode.removeChild(a);
    }
  }, 300);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) {
      a.parentNode.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 8000);
}

// Download all as ZIP
btnDownloadAll.addEventListener('click', async (e) => {
  e.stopPropagation();
  if (generatedGifs.length === 0) return;

  btnDownloadAll.disabled = true;
  btnDownloadAll.textContent = 'Packaging ZIP file...';

  try {
    const zip = new JSZip();
    generatedGifs.forEach(gif => {
      zip.file(gif.fileName, gif.blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const baseName = currentFile ? currentFile.name.replace(/\.[^/.]+$/, '') : 'gifs';
    downloadBlob(zipBlob, `${baseName}_all_gifs.zip`);
  } catch (err) {
    alert('Failed to package ZIP file: ' + err.message);
  } finally {
    btnDownloadAll.disabled = false;
    btnDownloadAll.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Download All as ZIP (.zip)
    `;
  }
});
