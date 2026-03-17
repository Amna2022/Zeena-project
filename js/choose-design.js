console.log("choose-design.js loaded ✅"); // file loaded

document.addEventListener("DOMContentLoaded", () => { // wait page load
  if (!localStorage.getItem("zeena_selected_availability")) {
    window.location.href = "./select-availability.html"; // go back if no slot
    return;
  }

  if (!localStorage.getItem("zeena_booking_details")) {
    window.location.href = "./booking-details.html"; // go back if no details
    return;
  }

  const designFile = document.getElementById("designFile"); // file input
  const uploadCard = document.getElementById("uploadCard"); // upload box
  const uploadPreview = document.getElementById("uploadPreview"); // preview container
  const previewImg = document.getElementById("previewImg"); // preview image
  const removeUpload = document.getElementById("removeUpload"); // remove btn
  const submitBtn = document.getElementById("submitBtn"); // submit btn
  const previewBtn = document.getElementById("previewBtn"); // preview btn
  const toast = document.getElementById("toastMessage"); // toast msg

  const STORAGE_KEY = "zeena_design_choice"; // storage key

  let selection = null; // selected design
  let previewUrl = null; // temp image url

  function showToast(message) { // show message
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove("hidden");

    setTimeout(() => {
      toast.classList.add("hidden"); // hide after delay
    }, 2500);
  }

  function setSubmitEnabled(enabled) { // enable/disable submit
    submitBtn.disabled = !enabled;
    submitBtn.classList.toggle("is-active", enabled);

    if (previewBtn) {
      previewBtn.classList.toggle("hidden", !enabled); // show preview btn
    }
  }

  function setSubmitLoading(isLoading) { // loading state
    if (!submitBtn) return;

    if (isLoading) {
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.textContent = "Sending..."; // change text
      submitBtn.disabled = true;
      submitBtn.classList.add("is-loading");
    } else {
      submitBtn.textContent = submitBtn.dataset.originalText || "Submit Request";
      submitBtn.classList.remove("is-loading");
      setSubmitEnabled(!!selection);
    }
  }

  function clearGallerySelection() { // reset gallery
    document.querySelectorAll(".cd-tile").forEach((btn) => {
      btn.setAttribute("aria-pressed", "false");
      btn.classList.remove("is-selected");
    });
  }

  function clearUploadPreview() { // clear uploaded image
    if (designFile) designFile.value = "";

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl); // free memory
      previewUrl = null;
    }

    if (previewImg) previewImg.src = "";
    if (uploadPreview) uploadPreview.hidden = true;
  }

  function resetPreviewState() { // reset preview btn
    localStorage.removeItem("zeena_preview_used");
    localStorage.removeItem("zeena_preview_transform");

    if (previewBtn) {
      const label = previewBtn.querySelector(".preview-label");
      const badge = previewBtn.querySelector(".preview-badge");

      if (label) label.textContent = "Preview on your hand";
      if (badge) badge.classList.add("hidden");

      previewBtn.classList.remove("is-used");
    }
  }

  function saveSelectionToStorage() { // save selection
    if (selection) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
      setSubmitEnabled(true);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setSubmitEnabled(false);
    }
  }

  function selectGallery(tile) { // choose gallery design
    clearUploadPreview();
    clearGallerySelection();
    resetPreviewState();

    tile.setAttribute("aria-pressed", "true");
    tile.classList.add("is-selected");

    selection = {
      type: "gallery",
      name: tile.dataset.design || "",
      src: tile.dataset.src || "",
    };

    saveSelectionToStorage();
  }

  function selectUpload(file) { // choose uploaded image
    clearGallerySelection();
    resetPreviewState();

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file); // create temp url

    if (previewImg) previewImg.src = previewUrl;
    if (uploadPreview) uploadPreview.hidden = false;

    selection = {
      type: "upload",
      fileName: file.name,
      src: previewUrl,
    };

    saveSelectionToStorage();
  }

  uploadCard?.addEventListener("click", () => designFile?.click()); // open file picker

  designFile?.addEventListener("change", () => { // when file selected
    const file = designFile.files && designFile.files[0];
    if (!file) return;
    selectUpload(file);
  });

  removeUpload?.addEventListener("click", () => { // remove upload
    clearUploadPreview();
    selection = null;
    resetPreviewState();
    saveSelectionToStorage();
  });

  document.querySelectorAll(".cd-tile").forEach((tile) => {
    tile.addEventListener("click", (e) => {
      e.preventDefault();
      selectGallery(tile); // click gallery
    });
  });

  const saved = localStorage.getItem(STORAGE_KEY); // get saved
  if (saved) {
    try {
      const s = JSON.parse(saved);

      if (s && s.type === "gallery" && s.name) {
        const tile = document.querySelector(
          `.cd-tile[data-design="${CSS.escape(s.name)}"]`
        );

        if (tile) {
          clearUploadPreview();
          clearGallerySelection();

          tile.setAttribute("aria-pressed", "true");
          tile.classList.add("is-selected");

          selection = {
            type: "gallery",
            name: tile.dataset.design || "",
            src: tile.dataset.src || "",
          };

          saveSelectionToStorage();
        } else {
          setSubmitEnabled(false);
        }
      } else if (s && s.type === "upload") {
        selection = s; // restore upload
        setSubmitEnabled(true);
      } else {
        setSubmitEnabled(false);
      }
    } catch {
      setSubmitEnabled(false); // error parsing
    }
  } else {
    setSubmitEnabled(false);
  }

  if (localStorage.getItem("zeena_preview_used") && previewBtn) { // if preview used
    const label = previewBtn.querySelector(".preview-label");
    const badge = previewBtn.querySelector(".preview-badge");

    if (label) label.textContent = "Preview again";
    if (badge) badge.classList.remove("hidden");

    previewBtn.classList.add("is-used");
  }

  previewBtn?.addEventListener("click", () => { // go to preview page
    if (!selection) return;

    localStorage.setItem("zeena_preview_design", JSON.stringify(selection));
    window.location.href = "./preview.html";
  });

  submitBtn?.addEventListener("click", async () => { // submit booking
    if (!selection) return;

    const selected = safeParse("zeena_selected_availability"); // slot data
    const details = safeParse("zeena_booking_details"); // user data
    if (!selected || !details) return;

    const API_BASE = "http://127.0.0.1:5000/api"; // backend url

    const payload = {
      name: details.fullName,
      whatsapp: details.whatsApp,
      address: details.area,
      timeslot_id: selected.timeslotId,
      location_type: details.serviceLocation === "At Home"
        ? "client_home"
        : "artist_place",
      payment_method: details.paymentMethod === "Cash"
        ? "cash"
        : "card_future",
      notes: details.notes || "",
      design_choice: selection.type === "gallery"
        ? selection.name
        : "custom_upload"
    };

    setSubmitLoading(true);

    try {
      const res = await fetch(`${API_BASE}/bookings`, { // send request
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errorMessage = "Something went wrong. Please try again.";

        try {
          const errorData = await res.json();

          if (res.status === 409) {
            errorMessage = "Sorry, this time was just booked by another client. Please choose another available time.";
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          errorMessage = "Something went wrong. Please try again.";
        }

        console.error("Booking failed");
        showToast(errorMessage);
        setSubmitLoading(false);

        if (res.status === 409) {
          setTimeout(() => {
            window.location.href = "./select-availability.html"; // redirect if conflict
          }, 2500);
        }

        return;
      }

      const booking = await res.json(); // success

      const confirmed = {
        clientName: details.fullName,
        clientPhone: details.whatsApp,
        dateText: selected.date,
        timeText: selected.time,
        addressText: details.area,
        locationType: details.serviceLocation,
        paymentText: details.paymentMethod,
        startISO: selected.startDateTime,
        durationMinutes: 120,
        bookingId: booking.booking_id
      };

      localStorage.setItem("bookingConfirmed", JSON.stringify(confirmed)); // save
      window.location.href = "./booking-confirmed.html"; // go next

    } catch (err) {
      console.error("Submit booking error:", err);
      showToast("Something went wrong while sending your booking request. Please try again.");
      setSubmitLoading(false);
    }
  });

  function safeParse(key) { // safe JSON parse
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
});