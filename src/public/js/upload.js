document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const uploadForm = document.getElementById("uploadForm");

  const progressWrapper = document.getElementById("progressWrapper");
  const progressBar = document.getElementById("progressBar");
  const speedText = document.getElementById("speedText");
  const timeText = document.getElementById("timeText");
  const cancelBtn = document.getElementById("cancelBtn");

  let xhr = null;

  // ======================
  // Drag & Drop
  // ======================
  dropZone.addEventListener("click", () => fileInput.click());

  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("drag-active");
    dropZone.innerHTML = "<strong>Release to upload</strong>";
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-active");
  });

  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("drag-active");

    const file = e.dataTransfer.files[0];
    if (!file) return;

    fileInput.files = e.dataTransfer.files;
    updateFileUI(file);
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    updateFileUI(file);
  });

  function updateFileUI(file) {
    const titleInput = document.querySelector('input[name="title"]');
    if (titleInput && !titleInput.value) {
      titleInput.value = file.name.replace(/\.[^/.]+$/, "");
    }

    dropZone.innerHTML = `
      <strong>${file.name}</strong><br>
      <small class="text-muted">
        ${(file.size / (1024 * 1024)).toFixed(2)} MB
      </small>
    `;
  }

  // ======================
  // Upload + Progress
  // ======================
  uploadForm.addEventListener("submit", e => {
    e.preventDefault();
    if (!fileInput.files.length) return alert("Please select a file");

    const formData = new FormData(uploadForm);
    const startTime = Date.now();

    progressWrapper.classList.remove("d-none");
    progressBar.style.width = "0%";
    progressBar.innerText = "0%";

    xhr = new XMLHttpRequest();
    xhr.open("POST", uploadForm.action, true);

    xhr.upload.onprogress = e => {
      if (!e.lengthComputable) return;

      const percent = Math.round((e.loaded / e.total) * 100);
      progressBar.style.width = percent + "%";
      progressBar.innerText = percent + "%";

      const elapsed = (Date.now() - startTime) / 1000;
      const speed = e.loaded / elapsed;

      speedText.innerText =
        "Speed: " +
        (speed > 1024 * 1024
          ? (speed / (1024 * 1024)).toFixed(2) + " MB/s"
          : (speed / 1024).toFixed(1) + " KB/s");

      const remaining = (e.total - e.loaded) / speed;
      timeText.innerText =
        "Remaining: " +
        (remaining > 60
          ? Math.ceil(remaining / 60) + " min"
          : Math.ceil(remaining) + " sec");
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        progressBar.classList.remove("progress-bar-animated");
        progressBar.classList.add("bg-success");
        progressBar.innerText = "Upload Complete";
        speedText.innerText = "";
        timeText.innerText = "Done";

        setTimeout(() => {
          window.location.href = "/admin/files";
        }, 800);
      } else {
        alert("Upload failed");
      }
    };

    xhr.onerror = () => alert("Upload error");

    xhr.send(formData);
  });

  // ======================
  // Cancel Upload
  // ======================
  cancelBtn.addEventListener("click", () => {
    if (xhr) {
      xhr.abort();
      progressBar.classList.remove("progress-bar-animated");
      progressBar.classList.add("bg-danger");
      progressBar.innerText = "Upload Cancelled";
      speedText.innerText = "";
      timeText.innerText = "";
    }
  });
});

