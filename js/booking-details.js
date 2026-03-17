console.log("booking-details.js loaded ✅"); // file loaded

document.addEventListener("DOMContentLoaded", () => { // wait page load
  const avail = localStorage.getItem("zeena_selected_availability");
  if (!avail) {
    window.location.href = "./select-availability.html"; // go back if no slot
    return;
  }

  const form = document.getElementById("bookingForm"); // form
  const nextBtn = document.getElementById("nextBtn"); // next button

  const fullName = document.getElementById("fullName"); // name input
  const whatsApp = document.getElementById("whatsApp"); // phone input
  const whatsAppError = document.getElementById("whatsAppError"); // error text
  const area = document.getElementById("area"); // area input
  const serviceLocation = document.getElementById("serviceLocation"); // hidden input
  const paymentMethodHidden = document.getElementById("paymentMethodHidden"); // hidden input
  const notes = document.getElementById("notes"); // notes input

  const STORAGE_KEY = "zeena_booking_details"; // storage key

  function setChoice(group, value, clickedBtn) { // handle button choice
    document
      .querySelectorAll(`.bd-choice[data-choice-group="${group}"]`)
      .forEach((btn) => {
        btn.setAttribute("aria-pressed", "false");
        btn.classList.remove("is-selected"); // reset all
      });

    clickedBtn.setAttribute("aria-pressed", "true");
    clickedBtn.classList.add("is-selected"); // select clicked

    if (group === "serviceLocation") serviceLocation.value = value; // save location
    if (group === "paymentMethod") paymentMethodHidden.value = value; // save payment

    validate(); // recheck form
  }

  function getWhatsAppError(value) { // validate phone
  const trimmed = value.trim();

  if (!trimmed) return ""; // no error if empty

  if (!/^[+\d\s]+$/.test(trimmed)) {
    return "Please enter a valid WhatsApp number using numbers only."; // invalid chars
  }

  const digits = trimmed.replace(/\D/g, "");

  if (digits.length < 7) {
    return "WhatsApp number looks too short."; // too short
  }

  if (digits.length > 15) {
    return "WhatsApp number looks too long."; // too long
  }

  return ""; // ok
}

  function validate() { // check all fields
    const nameOk = fullName.value.trim().length > 0;
    const areaOk = area.value.trim().length > 0;
    const serviceOk = serviceLocation.value.trim().length > 0;
    const paymentOk = paymentMethodHidden.value.trim().length > 0;

    const waError = getWhatsAppError(whatsApp.value);
    whatsAppError.textContent = waError; // show error

    const ok =
      nameOk &&
      areaOk &&
      serviceOk &&
      paymentOk &&
      !waError;

    nextBtn.disabled = !ok; // enable/disable btn
    nextBtn.classList.toggle("is-active", ok);

    return ok;
  }

  document.querySelectorAll(".bd-choice").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      const group = btn.getAttribute("data-choice-group"); // group name
      const value = btn.getAttribute("data-value"); // value
      if (!group || !value) return;

      setChoice(group, value, btn); // set choice
    });
  });

  [fullName, whatsApp, area, notes].forEach((el) => {
    el.addEventListener("input", validate); // live validation
  });

  nextBtn.addEventListener("click", () => {
    if (!validate()) return; // stop if invalid

    const details = {
      fullName: fullName.value.trim(),
      whatsApp: whatsApp.value.trim(),
      area: area.value.trim(),
      serviceLocation: serviceLocation.value,
      paymentMethod: paymentMethodHidden.value,
      notes: notes.value.trim(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(details)); // save data
    window.location.href = "./choose-design.html"; // go next
  });

  const saved = localStorage.getItem(STORAGE_KEY); // get saved data
  if (saved) {
    try {
      const d = JSON.parse(saved);

      fullName.value = d.fullName || "";
      whatsApp.value = d.whatsApp || "";
      area.value = d.area || "";
      notes.value = d.notes || "";

      if (d.serviceLocation) {
        const b = document.querySelector(
          `.bd-choice[data-choice-group="serviceLocation"][data-value="${CSS.escape(d.serviceLocation)}"]`
        );
        if (b) setChoice("serviceLocation", d.serviceLocation, b); // restore selection
        else serviceLocation.value = d.serviceLocation;
      }

      if (d.paymentMethod) {
        const b = document.querySelector(
          `.bd-choice[data-choice-group="paymentMethod"][data-value="${CSS.escape(d.paymentMethod)}"]`
        );
        if (b) setChoice("paymentMethod", d.paymentMethod, b); // restore selection
        else paymentMethodHidden.value = d.paymentMethod;
      }
    } catch (err) {
      console.warn("Could not parse saved booking details:", err); // error parsing
    }
  }

  form?.addEventListener("submit", (e) => e.preventDefault()); // stop default submit

  validate(); // initial check
});