document.addEventListener("DOMContentLoaded", () => { // wait page load
  const data = JSON.parse(localStorage.getItem("zeena_selected_booking")); // get booking
  if (!data) return; // stop if no data

  // ---------- Fill UI ----------
  document.getElementById("c_name").textContent = data.name || "—"; // name
  document.getElementById("c_phone").textContent = data.phone || "—"; // phone
  document.getElementById("c_date").textContent = data.fullDate || data.date || "—"; // date
  document.getElementById("c_time").textContent = data.time || "—"; // time
  document.getElementById("c_location").textContent = data.location || "—"; // location
  document.getElementById("c_serviceLocation").textContent = data.serviceLocation || "—"; // service type
  document.getElementById("c_payment").textContent = data.payment || "—"; // payment

  // ---------- Download ICS ----------
  const btn = document.getElementById("downloadIcsBtn"); // download button
  btn?.addEventListener("click", () => {
    const ics = buildICS(data); // build file content
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" }); // create file
    const url = URL.createObjectURL(blob); // create temp url

    const a = document.createElement("a");
    a.href = url;
    a.download = `zeena-${(data.name || "booking").toLowerCase().replace(/\s+/g, "-")}.ics`; // file name
    document.body.appendChild(a);
    a.click(); // trigger download
    a.remove();

    URL.revokeObjectURL(url); // clear memory
  });
});


// ---------- Build ICS ----------
function buildICS(data){

  // ⚠️ no timezone (demo only)
  const title = `Zeena Henna Appointment - ${data.name || "Client"}`; // event title
  const desc = `Payment: ${data.payment || ""}\\nService: ${data.serviceLocation || ""}`; // description
  const loc = data.location || ""; // location

  // placeholder time
  const dtstamp = new Date().toISOString().replace(/[-:]/g,"").split(".")[0] + "Z"; // timestamp

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zeena//Booking//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@zeena`, // unique id
    `DTSTAMP:${dtstamp}`, // created time
    `SUMMARY:${escapeICS(title)}`, // title
    `DESCRIPTION:${escapeICS(desc)}`, // description
    `LOCATION:${escapeICS(loc)}`, // location
    "DURATION:PT1H", // duration
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}


// ---------- Escape ICS ----------
function escapeICS(str){ // fix special chars
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}